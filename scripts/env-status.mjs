import { config } from 'dotenv';
config({ path: '.env', quiet: true });
console.log(
  JSON.stringify({
    databaseConfigured: !!process.env.DATABASE_URL,
    testDatabaseConfigured: !!process.env.TEST_DATABASE_URL,
    separateTestDatabase:
      !!process.env.TEST_DATABASE_URL &&
      process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL,
    authSecretConfigured: (process.env.BETTER_AUTH_SECRET || '').length >= 32,
  }),
);
