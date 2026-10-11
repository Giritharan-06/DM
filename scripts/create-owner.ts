import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, accounts, userRoles } from '@zyroz/database/schema';
import { z } from 'zod';
async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error('Configure DATABASE_URL in .env before provisioning.');
  const rl = createInterface({ input: stdin, output: stdout });
  const name = await rl.question('Full name: ');
  const email = z
    .email()
    .parse((await rl.question('Email: ')).trim().toLowerCase());
  const role = z
    .enum(['owner', 'sales', 'marketing', 'finance'])
    .parse(
      (await rl.question('Role (owner/sales/marketing/finance): ')).trim(),
    );
  // Passwords are received via protected environment injection; never CLI arguments or logs.
  const password = process.env.PROVISION_PASSWORD;
  if (!password || password.length < 12)
    throw new Error(
      'Set PROVISION_PASSWORD securely to a temporary password of at least 12 characters.',
    );
  rl.close();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const database = drizzle(pool);
  const userId = randomUUID();
  const hash = await hashPassword(password);
  try {
    await database.transaction(async (tx) => {
      await tx
        .insert(users)
        .values({ id: userId, name, email, emailVerified: true });
      await tx.insert(accounts).values({
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: hash,
      });
      await tx.insert(userRoles).values({ userId, role });
    });
    console.log(
      `Account created. Employee ID: ${userId}. Remove PROVISION_PASSWORD from your environment now.`,
    );
  } finally {
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
