import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  leads,
  userRoles,
  leadAssignments,
  leadActivities,
  auditLogs,
} from '@zyroz/database';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import {
  authorize,
  leadScope,
  checkOrigin,
  limitMutation,
  ApiError,
} from '@/lib/server';
export async function PATCH(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, 'leads');
    checkOrigin(req);
    await limitMutation(actor);
    const input = z
      .object({
        ids: z.array(z.uuid()).min(1).max(100),
        action: z.enum(['archive', 'assign']),
        assignedTo: z.string().optional(),
      })
      .parse(await req.json());
    if (input.action === 'assign') {
      if (actor.role !== 'owner')
        throw new ApiError(403, 'Only owners can assign leads.');
      const [role] = await db()
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, input.assignedTo || ''),
            eq(userRoles.role, 'sales'),
          ),
        );
      if (!role) throw new ApiError(400, 'Select a sales employee.');
    }
    await db().transaction(async (tx) => {
      const accessible = await tx
        .select()
        .from(leads)
        .where(and(inArray(leads.id, input.ids), leadScope(actor)))
        .for('update');
      if (accessible.length !== new Set(input.ids).size)
        throw new ApiError(404, 'One or more selected leads are unavailable.');
      await tx
        .update(leads)
        .set(
          input.action === 'archive'
            ? { archivedAt: new Date(), updatedAt: new Date() }
            : { assignedTo: input.assignedTo!, updatedAt: new Date() },
        )
        .where(inArray(leads.id, input.ids));
      await tx.insert(leadActivities).values(
        accessible.map((row) => ({
          leadId: row.id,
          actorId: actor.id,
          type: input.action,
          description:
            input.action === 'archive'
              ? 'Lead archived in bulk.'
              : 'Lead reassigned in bulk.',
        })),
      );
      if (input.action === 'assign')
        await tx.insert(leadAssignments).values(
          accessible.map((row) => ({
            leadId: row.id,
            userId: input.assignedTo!,
          })),
        );
      await tx.insert(auditLogs).values(
        accessible.map((row) => ({
          actorId: actor.id,
          action: input.action,
          entity: 'lead',
          entityId: row.id,
        })),
      );
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ApiError
            ? error.message
            : error instanceof z.ZodError
              ? 'Invalid bulk action.'
              : 'Bulk action failed.',
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
}
