import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import {
  users,
  leads,
  clients,
  invoices,
  invoiceCounters,
  payments,
} from '@zyroz/database/schema';
const testUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!testUrl)(
  'PostgreSQL persistence and integrity (isolated test database)',
  () => {
    let pool: Pool;
    let database: ReturnType<typeof drizzle>;
    const userId = crypto.randomUUID();
    const leadId = crypto.randomUUID();
    const clientId = crypto.randomUUID();
    const invoiceId = crypto.randomUUID();
    beforeAll(async () => {
      if (testUrl === process.env.DATABASE_URL)
        throw new Error(
          'TEST_DATABASE_URL must be an isolated database, never the production database.',
        );
      pool = new Pool({ connectionString: testUrl });
      database = drizzle(pool);
      await migrate(database, {
        migrationsFolder: 'packages/database/migrations',
      });
      await database.insert(users).values({
        id: userId,
        name: 'Integration fixture',
        email: `test-${userId}@example.com`,
      });
    });
    afterAll(async () => {
      if (!database) return;
      await database.delete(payments).where(eq(payments.invoiceId, invoiceId));
      await database.delete(invoices).where(eq(invoices.id, invoiceId));
      await database.delete(clients).where(eq(clients.id, clientId));
      await database.delete(leads).where(eq(leads.id, leadId));
      await database.delete(users).where(eq(users.id, userId));
      await pool.end();
    });
    it('enforces retry deduplication and persists stages', async () => {
      const value = {
        id: leadId,
        name: 'Fixture Contact',
        businessName: 'Integration demo only',
        phone: '9876543210',
        email: 'fixture@example.com',
        industry: 'Other',
        service: 'Website Development',
        budget: 'Let’s discuss',
        goal: 'Test persistence',
        dedupeKey: leadId,
      };
      await database.insert(leads).values(value);
      const retry = await database
        .insert(leads)
        .values({ ...value, id: crypto.randomUUID() })
        .onConflictDoNothing()
        .returning();
      expect(retry).toHaveLength(0);
      await database
        .update(leads)
        .set({ stage: 'won' })
        .where(eq(leads.id, leadId));
      const [row] = await database
        .select()
        .from(leads)
        .where(eq(leads.id, leadId));
      expect(row.stage).toBe('won');
    });
    it('enforces one converted client per lead', async () => {
      const value = {
        id: clientId,
        leadId,
        businessName: 'Integration demo only',
        contactPerson: 'Fixture Contact',
        phone: '9876543210',
        email: 'fixture@example.com',
        industry: 'Other',
      };
      await database.insert(clients).values(value);
      const duplicate = await database
        .insert(clients)
        .values({ ...value, id: crypto.randomUUID() })
        .onConflictDoNothing()
        .returning();
      expect(duplicate).toHaveLength(0);
    });
    it('rolls back critical invoice writes on failure', async () => {
      await expect(
        database.transaction(async (tx) => {
          await tx.insert(invoices).values({
            id: invoiceId,
            number: invoiceId,
            clientId,
            date: new Date(),
            dueDate: new Date(),
            total: 10000,
          });
          throw new Error('Rollback requested');
        }),
      ).rejects.toThrow('Rollback requested');
      expect(
        await database
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceId)),
      ).toHaveLength(0);
    });
    it('allocates different sequence numbers concurrently', async () => {
      const year = 9999;
      const allocated = await Promise.all(
        [1, 2].map(() =>
          database.transaction(async (tx) => {
            await tx.execute(
              `INSERT INTO invoice_counters (year,value) VALUES (${year},1) ON CONFLICT (year) DO UPDATE SET value=invoice_counters.value+1`,
            );
            const [row] = await tx
              .select()
              .from(invoiceCounters)
              .where(eq(invoiceCounters.year, year));
            return row.value;
          }),
        ),
      );
      expect(new Set(allocated).size).toBe(2);
      await database
        .delete(invoiceCounters)
        .where(eq(invoiceCounters.year, year));
    });
  },
);
