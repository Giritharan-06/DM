import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  clientServices,
  services,
  contracts,
  auditLogs,
} from '@zyroz/database';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authorize, assertClient, checkOrigin, ApiError } from '@/lib/server';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, context: Context) {
  try {
    const actor = await authorize(req.headers, 'clients');
    const { id } = await context.params;
    z.uuid().parse(id);
    await assertClient(actor, id);
    return NextResponse.json({
      rows: await db()
        .select({
          id: clientServices.id,
          name: services.name,
          serviceId: services.id,
        })
        .from(clientServices)
        .innerJoin(services, eq(services.id, clientServices.serviceId))
        .where(eq(clientServices.clientId, id)),
      catalog: await db()
        .select()
        .from(services)
        .where(eq(services.active, true)),
      contracts: await db()
        .select()
        .from(contracts)
        .where(eq(contracts.clientId, id)),
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: NextRequest, context: Context) {
  try {
    const actor = await authorize(req.headers, 'clients');
    if (!['owner', 'finance'].includes(actor.role))
      throw new ApiError(
        403,
        'Service and contract changes require financial access.',
      );
    checkOrigin(req);
    const { id } = await context.params;
    z.uuid().parse(id);
    await assertClient(actor, id);
    const value = z
      .discriminatedUnion('kind', [
        z.object({ kind: z.literal('service'), serviceId: z.uuid() }),
        z.object({
          kind: z.literal('contract'),
          startsAt: z.iso.datetime(),
          endsAt: z.iso.datetime().optional(),
          terms: z.string().min(2).max(10000),
        }),
      ])
      .parse(await req.json());
    await db().transaction(async (tx) => {
      if (value.kind === 'service') {
        const [service] = await tx
          .select()
          .from(services)
          .where(
            and(eq(services.id, value.serviceId), eq(services.active, true)),
          );
        if (!service) throw new ApiError(404, 'Active service not found.');
        await tx
          .insert(clientServices)
          .values({ clientId: id, serviceId: value.serviceId })
          .onConflictDoNothing();
      } else
        await tx.insert(contracts).values({
          clientId: id,
          startsAt: new Date(value.startsAt),
          endsAt: value.endsAt ? new Date(value.endsAt) : null,
          terms: value.terms,
        });
      await tx.insert(auditLogs).values({
        actorId: actor.id,
        action: 'add_' + value.kind,
        entity: 'client',
        entityId: id,
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
            ? 'Invalid service or contract details.'
            : 'Client services unavailable.',
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
