import { NextRequest, NextResponse } from 'next/server';
import { db, users, userRoles } from '@zyroz/database';
import { eq } from 'drizzle-orm';
import { authorize, ApiError } from '@/lib/server';
export async function GET(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, 'dashboard');
    const rows = await db()
      .select({ id: users.id, name: users.name, role: userRoles.role })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId));
    return NextResponse.json(
      {
        rows:
          actor.role === 'owner' ? rows : rows.filter((u) => u.id === actor.id),
        role: actor.role,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Directory unavailable.' },
      { status: error instanceof ApiError ? error.status : 503 },
    );
  }
}
