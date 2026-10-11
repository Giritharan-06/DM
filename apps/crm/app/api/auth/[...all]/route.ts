import { auth } from '@zyroz/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { Pool } from 'pg';

async function logDatabaseStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 3000,
    statement_timeout: 3000,
  });
  try {
    const result = await pool.query(`
      select to_regclass('public.users') is not null as users,
             to_regclass('public.accounts') is not null as accounts,
             to_regclass('public.sessions') is not null as sessions,
             to_regclass('public.auth_rate_limits') is not null as auth_rate_limits
    `);
    console.error('Auth database probe:', result.rows[0]);
  } catch (error) {
    console.error('Auth database probe failed:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      code:
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : 'UNKNOWN',
    });
  } finally {
    await pool.end();
  }
}

function configurationIssue() {
  if (!process.env.DATABASE_URL) return 'DATABASE_URL_MISSING';
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32)
    return 'BETTER_AUTH_SECRET_MISSING_OR_SHORT';
  try {
    for (const value of [
      process.env.NEXT_PUBLIC_WEBSITE_URL,
      process.env.NEXT_PUBLIC_CRM_URL,
    ]) {
      if (value) new URL(value);
    }
  } catch {
    return 'AUTH_URL_INVALID';
  }
  return null;
}

async function handle(req: Request, method: 'GET' | 'POST') {
  const issue = configurationIssue();
  if (issue) {
    console.error('Auth configuration error:', issue);
    return Response.json(
      { code: issue, message: 'Authentication is not configured.' },
      { status: 503 },
    );
  }
  try {
    const response = await toNextJsHandler(auth())[method](req);
    if (response.status >= 500) {
      let code = 'UNKNOWN';
      try {
        const body = await response.clone().json();
        if (typeof body?.code === 'string') code = body.code;
      } catch {}
      console.error('Auth endpoint failed:', {
        path: new URL(req.url).pathname,
        status: response.status,
        code,
      });
      await logDatabaseStatus();
    }
    return response;
  } catch (error) {
    console.error('Auth handler failed:', {
      path: new URL(req.url).pathname,
      name: error instanceof Error ? error.name : 'UnknownError',
      code:
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : 'UNKNOWN',
    });
    await logDatabaseStatus();
    return Response.json(
      { code: 'AUTH_SERVER_ERROR', message: 'Authentication is temporarily unavailable.' },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return handle(req, 'GET');
}

export async function POST(req: Request) {
  return handle(req, 'POST');
}
