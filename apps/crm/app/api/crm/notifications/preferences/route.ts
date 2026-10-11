import { NextRequest, NextResponse } from 'next/server';
import { db, notificationPreferences } from '@zyroz/database';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authorize, checkOrigin, ApiError } from '@/lib/server';
export async function GET(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, 'notifications');
    const [row] = await db()
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, actor.id));
    return NextResponse.json(row || { email: false, inApp: true });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, 'notifications');
    checkOrigin(req);
    const value = z
      .object({ email: z.boolean(), inApp: z.boolean() })
      .parse(await req.json());
    await db()
      .insert(notificationPreferences)
      .values({ ...value, userId: actor.id })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: value,
      });
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  return NextResponse.json(
    { error: 'Notification preference operation unavailable.' },
    {
      status:
        error instanceof ApiError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : 503,
    },
  );
}
