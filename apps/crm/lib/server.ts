import 'server-only';
import { auth } from '@zyroz/auth';
import { canAccess, type Module, type Role } from '@zyroz/auth/permissions';
import {
  db,
  userRoles,
  leads,
  clients,
  campaigns,
  tasks,
  followUps,
  auditLogs,
  rateLimits,
} from '@zyroz/database';
import { eq, and, isNull, sql, type SQL } from 'drizzle-orm';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type Actor = { id: string; name: string; role: Role };
export async function authorize(
  headers: Headers,
  module: Module,
): Promise<Actor> {
  const session = await auth().api.getSession({ headers });
  if (!session) throw new ApiError(401, 'Please sign in.');
  const [assignment] = await db()
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id));
  if (!assignment || !canAccess(assignment.role, module))
    throw new ApiError(
      403,
      'You do not have permission to access this module.',
    );
  return {
    id: session.user.id,
    name: session.user.name,
    role: assignment.role,
  };
}
export function leadScope(actor: Actor): SQL | undefined {
  return and(
    isNull(leads.archivedAt),
    actor.role === 'sales' ? eq(leads.assignedTo, actor.id) : undefined,
  );
}
export function clientScope(actor: Actor): SQL | undefined {
  return and(
    isNull(clients.archivedAt),
    actor.role === 'sales'
      ? eq(clients.accountManager, actor.id)
      : actor.role === 'marketing'
        ? sql`(${clients.accountManager}=${actor.id} OR EXISTS (SELECT 1 FROM campaigns c WHERE c.client_id=${clients.id} AND c.assigned_to=${actor.id}) OR EXISTS (SELECT 1 FROM tasks t WHERE t.client_id=${clients.id} AND t.assigned_to=${actor.id}))`
        : undefined,
  );
}
export function campaignScope(actor: Actor) {
  return actor.role === 'marketing'
    ? eq(campaigns.assignedTo, actor.id)
    : undefined;
}
export async function assertCampaign(actor: Actor, id: string) {
  const [row] = await db()
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), campaignScope(actor)));
  if (!row) throw new ApiError(404, 'Campaign not found.');
  return row;
}
export function clientView<T extends { monthlyRetainer: number }>(
  actor: Actor,
  row: T,
) {
  return {
    ...row,
    monthlyRetainer: ['owner', 'finance'].includes(actor.role)
      ? row.monthlyRetainer
      : null,
  };
}
export function taskScope(actor: Actor) {
  return actor.role !== 'owner' ? eq(tasks.assignedTo, actor.id) : undefined;
}
export function followScope(actor: Actor) {
  return actor.role === 'sales'
    ? eq(followUps.assignedTo, actor.id)
    : undefined;
}
export async function assertLead(actor: Actor, id: string) {
  const [row] = await db()
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), leadScope(actor)));
  if (!row) throw new ApiError(404, 'Lead not found.');
  return row;
}
export async function assertClient(actor: Actor, id: string) {
  const [row] = await db()
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), clientScope(actor)));
  if (!row) throw new ApiError(404, 'Client not found.');
  return row;
}
export async function audit(
  actor: Actor,
  action: string,
  entity: string,
  entityId: string,
) {
  await db()
    .insert(auditLogs)
    .values({ actorId: actor.id, action, entity, entityId });
}
export function checkOrigin(req: Request) {
  if (
    req.headers.get('origin') !==
    (process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3001')
  )
    throw new ApiError(403, 'Invalid request origin.');
}
export async function limitMutation(actor: Actor) {
  const key = `crm:${actor.id}:${Math.floor(Date.now() / 60000)}`;
  const [row] = await db()
    .insert(rateLimits)
    .values({ key, count: 1, expiresAt: new Date(Date.now() + 120000) })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: { count: sql`${rateLimits.count}+1` },
    })
    .returning();
  if (row.count > 100)
    throw new ApiError(429, 'Too many changes. Please wait one minute.');
}
