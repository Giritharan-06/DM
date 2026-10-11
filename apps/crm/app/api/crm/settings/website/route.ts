import { NextRequest, NextResponse } from 'next/server';
import { db, systemSettings, auditLogs } from '@zyroz/database';
import { eq } from 'drizzle-orm';
import {
  websiteSettingsSchema,
  publicWebsiteSettings,
} from '@zyroz/validation';
import { authorize, checkOrigin, limitMutation, ApiError } from '@/lib/server';
import { z } from 'zod';
export async function GET(req: NextRequest) {
  try {
    await authorize(req.headers, 'settings');
    const [row] = await db()
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'website'));
    return NextResponse.json(publicWebsiteSettings(row?.value));
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, 'settings');
    checkOrigin(req);
    await limitMutation(actor);
    const raw = await req.text();
    if (raw.length > 10000) throw new ApiError(413, 'Request too large.');
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      throw new ApiError(400, 'Invalid JSON.');
    }
    const value = websiteSettingsSchema.parse(input);
    await db().transaction(async (tx) => {
      await tx
        .insert(systemSettings)
        .values({ key: 'website', value })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value, updatedAt: new Date() },
        });
      await tx.insert(auditLogs).values({
        actorId: actor.id,
        action: 'update',
        entity: 'website_settings',
        entityId: 'website',
      });
    });
    return NextResponse.json(value);
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  if (error instanceof z.ZodError)
    return NextResponse.json(
      {
        error: error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(' '),
      },
      { status: 400 },
    );
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  return NextResponse.json(
    { error: 'Website settings are unavailable.' },
    { status: 503 },
  );
}
