import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      'DATABASE_URL is not configured. Connect Neon and run migrations.',
    );
  if (!database)
    database = drizzle(
      new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }),
      { schema },
    );
  return database;
}
export * from './schema';
