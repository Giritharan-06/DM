import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  services,
  leadSources,
  roles,
  permissions,
  rolePermissions,
} from '@zyroz/database/schema';
import { serviceNames } from '@zyroz/validation';
import { canAccess, type Role, type Module } from '@zyroz/auth/permissions';
async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error('Configure DATABASE_URL first.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  const modules: Module[] = [
    'dashboard',
    'leads',
    'pipeline',
    'follow-ups',
    'clients',
    'campaigns',
    'tasks',
    'quotations',
    'invoices',
    'payments',
    'reports',
    'team',
    'notifications',
    'settings',
  ];
  const roleNames: Role[] = [
    'owner',
    'sales',
    'marketing',
    'finance',
    'client',
  ];
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(services)
        .values(
          serviceNames.map((name) => ({
            name,
            description: 'Agency service offering',
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(leadSources)
        .values(
          ['website', 'manual', 'referral', 'social', 'email'].map((name) => ({
            name,
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(roles)
        .values(
          roleNames.map((name) => ({
            name,
            description:
              name === 'client'
                ? 'Future portal role (inactive)'
                : name + ' agency role',
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(permissions)
        .values(
          modules.map((id) => ({
            id,
            description: 'Access ' + id + ' module',
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(rolePermissions)
        .values(
          roleNames.flatMap((role) =>
            modules
              .filter((module) => canAccess(role, module))
              .map((permissionId) => ({ role, permissionId })),
          ),
        )
        .onConflictDoNothing();
    });
    console.log(
      'Service, source and permission catalogs initialized. No customer data was created.',
    );
  } finally {
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
