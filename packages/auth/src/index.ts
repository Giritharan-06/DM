import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import {
  db,
  users,
  sessions,
  accounts,
  verifications,
  authRateLimits,
} from '@zyroz/database';
function createAuth() {
  if (
    !process.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET.length < 32
  )
    throw new Error(
      'Configure a random BETTER_AUTH_SECRET of at least 32 characters.',
    );
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db(), {
      provider: 'pg',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
        rateLimit: authRateLimits,
      },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
    },
    trustedOrigins: [
      process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3001',
    ],
    session: { expiresIn: 604800, updateAge: 86400 },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      ipAddress: {
        ipAddressHeaders: process.env.VERCEL
          ? ['x-vercel-forwarded-for']
          : ['x-forwarded-for'],
      },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: { '/sign-in/email': { window: 60, max: 5 } },
    },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function auth() {
  return (instance ??= createAuth());
}
