import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  services,
  leadSources,
  auditLogs,
  systemSettings,
} from '@zyroz/database';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authorize, checkOrigin, limitMutation, ApiError } from '@/lib/server';
export async function GET(req: NextRequest) {
  try {
    await authorize(req.headers, 'settings');
    const [serviceRows, sourceRows, settings] = await Promise.all([
      db().select().from(services),
      db().select().from(leadSources),
      db().select().from(systemSettings),
    ]);
    return NextResponse.json(
      { services: serviceRows, sources: sourceRows, settings },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, 'settings');
    checkOrigin(req);
    await limitMutation(actor);
    const value = z
      .object({
        kind: z.enum(['service', 'source']),
        name: z.string().trim().min(2).max(200),
        description: z.string().max(1000).optional(),
      })
      .parse(await req.json());
    const row = await db().transaction(async (tx) => {
      let row;
      if (value.kind === 'service')
        [row] = await tx
          .insert(services)
          .values({ name: value.name, description: value.description })
          .onConflictDoUpdate({
            target: services.name,
            set: { description: value.description, active: true },
          })
          .returning();
      else
        [row] = await tx
          .insert(leadSources)
          .values({ name: value.name })
          .onConflictDoNothing()
          .returning();
      if (row)
        await tx.insert(auditLogs).values({
          actorId: actor.id,
          action: 'catalog',
          entity: value.kind,
          entityId: row.id,
        });
      return row;
    });
    return NextResponse.json(row || { success: true }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, 'settings');
    checkOrigin(req);
    await limitMutation(actor);
    const value = z
      .object({ id: z.uuid(), active: z.boolean() })
      .parse(await req.json());
    await db().transaction(async (tx) => {
      const [row] = await tx
        .update(services)
        .set({ active: value.active })
        .where(eq(services.id, value.id))
        .returning();
      if (!row) throw new ApiError(404, 'Service not found.');
      await tx.insert(auditLogs).values({
        actorId: actor.id,
        action: value.active ? 'activate' : 'deactivate',
        entity: 'service',
        entityId: value.id,
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : error instanceof z.ZodError
            ? 'Check catalog details.'
            : 'Catalog unavailable.',
    },
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
