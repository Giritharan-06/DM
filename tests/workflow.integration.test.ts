import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { hashPassword } from 'better-auth/crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '@zyroz/database/schema';
import { auth } from '@zyroz/auth';
import { POST as submit } from '../apps/website/app/api/public/leads/route';
import { GET, POST, PATCH } from '../apps/crm/app/api/crm/[...path]/route';
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)(
  'Authenticated website → lead → pipeline → client → task workflow',
  () => {
    let pool: Pool;
    let database: ReturnType<typeof drizzle<typeof schema>>;
    let leadId = '';
    let clientId = '';
    let taskId = '';
    const ownerId = crypto.randomUUID(),
      salesId = crypto.randomUUID(),
      otherId = crypto.randomUUID(),
      marketingId = crypto.randomUUID();
    const password = 'Integration-fixture-only-123!';
    const email = `workflow-${ownerId}@example.com`;
    const cookies: Record<string, string> = {};
    const request = (
      method: string,
      path: string[],
      body?: unknown,
      role = 'owner',
    ) =>
      new NextRequest('http://localhost:3001/api/crm/' + path.join('/'), {
        method,
        headers: {
          origin: 'http://localhost:3001',
          cookie: cookies[role] || '',
          'Content-Type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    beforeAll(async () => {
      if (url === process.env.DATABASE_URL)
        throw new Error('Use a separate test database.');
      vi.stubEnv('DATABASE_URL', url!);
      vi.stubEnv(
        'BETTER_AUTH_SECRET',
        'isolated-integration-secret-32-characters-long',
      );
      vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3001');
      vi.stubEnv('NEXT_PUBLIC_WEBSITE_URL', 'http://localhost:3000');
      vi.stubEnv('NEXT_PUBLIC_CRM_URL', 'http://localhost:3001');
      vi.stubEnv('TURNSTILE_SECRET_KEY', '');
      vi.stubEnv('OWNER_NOTIFICATION_EMAIL', '');
      pool = new Pool({ connectionString: url });
      database = drizzle(pool, { schema });
      await migrate(database, {
        migrationsFolder: 'packages/database/migrations',
      });
      for (const [id, role] of [
        [ownerId, 'owner'],
        [salesId, 'sales'],
        [otherId, 'sales'],
        [marketingId, 'marketing'],
      ] as const) {
        const memberEmail = `${id}@example.com`;
        await database.transaction(async (tx) => {
          await tx.insert(schema.users).values({
            id,
            name: 'Integration fixture ' + role,
            email: memberEmail,
            emailVerified: true,
          });
          await tx.insert(schema.accounts).values({
            id: crypto.randomUUID(),
            userId: id,
            accountId: id,
            providerId: 'credential',
            password: await hashPassword(password),
          });
          await tx.insert(schema.userRoles).values({ userId: id, role });
        });
        const response = await auth().api.signInEmail({
          body: { email: memberEmail, password },
          asResponse: true,
        });
        expect(response.status).toBe(200);
        cookies[id === otherId ? 'other' : role] = response.headers
          .getSetCookie()
          .map((value) => value.split(';')[0])
          .join('; ');
      }
    });
    afterAll(async () => {
      if (!database) return;
      if (taskId) {
        await database
          .delete(schema.taskAssignments)
          .where(eq(schema.taskAssignments.taskId, taskId));
        await database.delete(schema.tasks).where(eq(schema.tasks.id, taskId));
      }
      if (clientId) {
        await database
          .delete(schema.clientContacts)
          .where(eq(schema.clientContacts.clientId, clientId));
        await database
          .delete(schema.clients)
          .where(eq(schema.clients.id, clientId));
      }
      if (leadId) {
        await database
          .delete(schema.leadActivities)
          .where(eq(schema.leadActivities.leadId, leadId));
        await database
          .delete(schema.leadAssignments)
          .where(eq(schema.leadAssignments.leadId, leadId));
        await database
          .delete(schema.leadStageHistory)
          .where(eq(schema.leadStageHistory.leadId, leadId));
        await database
          .delete(schema.notifications)
          .where(eq(schema.notifications.href, '/leads/' + leadId));
        await database.delete(schema.leads).where(eq(schema.leads.id, leadId));
      }
      const ids = [ownerId, salesId, otherId, marketingId];
      await database
        .delete(schema.auditLogs)
        .where(inArray(schema.auditLogs.actorId, ids));
      await database.delete(schema.users).where(inArray(schema.users.id, ids));
      await pool.end();
      vi.unstubAllEnvs();
    });
    it('captures an enquiry once and exposes it to the owner', async () => {
      const input = {
        name: 'Workflow Fixture',
        businessName: 'Integration demo only',
        phone: '9876543210',
        email,
        industry: 'Other',
        service: 'Website Development',
        budget: 'Let’s discuss',
        goal: 'Verify the complete workflow',
        consent: true,
      };
      const create = () =>
        submit(
          new NextRequest('http://localhost:3000/api/public/leads', {
            method: 'POST',
            headers: {
              origin: 'http://localhost:3000',
              'Content-Type': 'application/json',
              'x-forwarded-for': ownerId,
            },
            body: JSON.stringify(input),
          }),
        );
      expect((await create()).status).toBe(202);
      expect((await create()).status).toBe(202);
      const stored = await database
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.email, email));
      expect(stored).toHaveLength(1);
      leadId = stored[0].id;
      const response = await GET(request('GET', ['leads', leadId]), {
        params: Promise.resolve({ path: ['leads', leadId] }),
      });
      expect(response.status).toBe(200);
      expect((await response.json()).lead.id).toBe(leadId);
    });
    it('denies signed-out and restricted financial reads', async () => {
      expect(
        (
          await GET(request('GET', ['leads'], undefined, 'signed-out'), {
            params: Promise.resolve({ path: ['leads'] }),
          })
        ).status,
      ).toBe(401);
      expect(
        (
          await GET(request('GET', ['invoices'], undefined, 'sales'), {
            params: Promise.resolve({ path: ['invoices'] }),
          })
        ).status,
      ).toBe(403);
    });
    it('scopes assigned leads and persists stages', async () => {
      let response = await PATCH(
        request('PATCH', ['leads', leadId], { assignedTo: salesId }),
        { params: Promise.resolve({ path: ['leads', leadId] }) },
      );
      expect(response.status).toBe(200);
      expect(
        (
          await GET(request('GET', ['leads', leadId], undefined, 'other'), {
            params: Promise.resolve({ path: ['leads', leadId] }),
          })
        ).status,
      ).toBe(404);
      response = await PATCH(
        request('PATCH', ['leads', leadId, 'stage'], { stage: 'won' }, 'sales'),
        { params: Promise.resolve({ path: ['leads', leadId, 'stage'] }) },
      );
      expect(response.status).toBe(200);
      const [stored] = await database
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.id, leadId));
      expect(stored.stage).toBe('won');
    });
    it('converts twice without creating duplicate clients', async () => {
      const convert = () =>
        POST(request('POST', ['leads', leadId, 'convert'], {}, 'sales'), {
          params: Promise.resolve({ path: ['leads', leadId, 'convert'] }),
        });
      const first = await convert();
      expect(first.status).toBe(200);
      clientId = (await first.json()).id;
      expect((await convert()).status).toBe(200);
      expect(
        await database
          .select()
          .from(schema.clients)
          .where(eq(schema.clients.leadId, leadId)),
      ).toHaveLength(1);
    });
    it('persists an employee task assignment', async () => {
      const response = await POST(
        request('POST', ['tasks'], {
          title: 'Integration fixture task',
          assignedTo: marketingId,
          clientId,
          priority: 'medium',
          status: 'to_do',
          deadline: new Date(Date.now() + 86400000).toISOString(),
        }),
        { params: Promise.resolve({ path: ['tasks'] }) },
      );
      expect(response.status).toBe(201);
      taskId = (await response.json()).id;
      const [stored] = await database
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, taskId));
      expect(stored.assignedTo).toBe(marketingId);
      const visible = await GET(
        request('GET', ['tasks', taskId], undefined, 'marketing'),
        { params: Promise.resolve({ path: ['tasks', taskId] }) },
      );
      expect(visible.status).toBe(200);
    });
  },
);
