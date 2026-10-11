import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
config({ path: '.env', quiet: true });
export default defineConfig({
  resolve: {
    alias: {
      'server-only': fileURLToPath(
        new URL('./tests/server-only.ts', import.meta.url),
      ),
      '@': fileURLToPath(new URL('./apps/crm', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    fileParallelism: false,
  },
});
