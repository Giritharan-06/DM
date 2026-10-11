import "server-only";
import {
  db,
  clients,
  campaigns,
  tasks,
  followUps,
  leads,
  invoices,
  payments,
  quotations,
  notifications,
  users,
  userRoles,
} from "@zyroz/database";
import {
  and,
  or,
  eq,
  ilike,
  gte,
  lte,
  lt,
  desc,
  asc,
  isNull,
  isNotNull,
  ne,
  sql,
  count,
  getTableColumns,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import {
  clientScope,
  campaignScope,
  taskScope,
  followScope,
  leadScope,
  clientView,
  ApiError,
  type Actor,
} from "./server";

export async function listRecords(
  module: string,
  actor: Actor,
  query: URLSearchParams,
  page: number,
  limit: number,
) {
  const text = query.get("q")?.trim().slice(0, 200);
  const pattern = text ? `%${text.replace(/[\\%_]/g, "\\$&")}%` : undefined;
  const status = query.get("status");
  const assigned = query.get("assignee");
  if (assigned) z.string().min(1).max(200).parse(assigned);
  const parseDate = (value: string | null, end = false) =>
    value
      ? new Date(
          z
            .union([z.iso.date(), z.iso.datetime({ offset: true })])
            .parse(value) +
            (value.length === 10
              ? end
                ? "T23:59:59.999Z"
                : "T00:00:00.000Z"
              : ""),
        )
      : undefined;
  const from = parseDate(query.get("from")),
    to = parseDate(query.get("to"), true);
  if (from && to && from > to)
    throw new ApiError(400, "Start date must be before end date.");
  const range = (column: Parameters<typeof gte>[0]) =>
    and(from ? gte(column, from) : undefined, to ? lte(column, to) : undefined);
  const finish = async (
    rows: PromiseLike<unknown[]>,
    totals: PromiseLike<{ value: number }[]>,
  ) => {
    const [records, total] = await Promise.all([rows, totals]);
    return { rows: records, total: total[0].value, page, limit };
  };
  let where: SQL | undefined;
  if (module === "clients") {
    where = and(
      clientScope(actor),
      pattern
        ? or(
            ilike(clients.businessName, pattern),
            ilike(clients.contactPerson, pattern),
            ilike(clients.email, pattern),
          )
        : undefined,
      status
        ? eq(
            clients.status,
            z.enum(["active", "paused", "closed"]).parse(status),
          )
        : undefined,
      assigned ? eq(clients.accountManager, assigned) : undefined,
      range(clients.createdAt),
    );
    const result = await finish(
      db()
        .select({ ...getTableColumns(clients), assignedName: users.name })
        .from(clients)
        .leftJoin(users, eq(users.id, clients.accountManager))
        .where(where)
        .orderBy(desc(clients.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db().select({ value: count() }).from(clients).where(where),
    );
    return {
      ...result,
      rows: (result.rows as (typeof clients.$inferSelect)[]).map((row) =>
        clientView(actor, row),
      ),
    };
  }
  if (module === "campaigns") {
    where = and(
      campaignScope(actor),
      pattern
        ? or(ilike(campaigns.name, pattern), ilike(campaigns.service, pattern))
        : undefined,
      status
        ? eq(
            campaigns.status,
            z.enum(["planned", "active", "paused", "completed"]).parse(status),
          )
        : undefined,
      assigned ? eq(campaigns.assignedTo, assigned) : undefined,
      range(campaigns.startDate),
    );
    return finish(
      db()
        .select({
          ...getTableColumns(campaigns),
          clientName: clients.businessName,
          assignedName: users.name,
        })
        .from(campaigns)
        .leftJoin(clients, eq(clients.id, campaigns.clientId))
        .leftJoin(users, eq(users.id, campaigns.assignedTo))
        .where(where)
        .orderBy(desc(campaigns.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db().select({ value: count() }).from(campaigns).where(where),
    );
  }
  if (module === "tasks") {
    where = and(
      taskScope(actor),
      pattern ? ilike(tasks.title, pattern) : undefined,
      status === "overdue"
        ? and(lt(tasks.deadline, new Date()), ne(tasks.status, "completed"))
        : status
          ? eq(
              tasks.status,
              z
                .enum([
                  "to_do",
                  "in_progress",
                  "review",
                  "completed",
                  "blocked",
                ])
                .parse(status),
            )
          : undefined,
      query.get("priority")
        ? eq(
            tasks.priority,
            z.enum(["low", "medium", "high"]).parse(query.get("priority")),
          )
        : undefined,
      assigned ? eq(tasks.assignedTo, assigned) : undefined,
      range(tasks.deadline),
    );
    return finish(
      db()
        .select({
          ...getTableColumns(tasks),
          assignedName: users.name,
          clientName: clients.businessName,
        })
        .from(tasks)
        .leftJoin(users, eq(users.id, tasks.assignedTo))
        .leftJoin(clients, eq(clients.id, tasks.clientId))
        .where(where)
        .orderBy(asc(tasks.deadline), asc(tasks.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db().select({ value: count() }).from(tasks).where(where),
    );
  }
  if (module === "follow-ups") {
    if (status) z.enum(["open", "completed", "overdue"]).parse(status);
    where = and(
      followScope(actor),
      leadScope(actor),
      pattern
        ? or(
            ilike(followUps.notes, pattern),
            ilike(leads.businessName, pattern),
          )
        : undefined,
      status === "completed"
        ? isNotNull(followUps.completedAt)
        : status
          ? isNull(followUps.completedAt)
          : undefined,
      status === "overdue" ? lt(followUps.dueAt, new Date()) : undefined,
      assigned ? eq(followUps.assignedTo, assigned) : undefined,
      range(followUps.dueAt),
    );
    return finish(
      db()
        .select({
          ...getTableColumns(followUps),
          assignedName: users.name,
          leadName: leads.businessName,
          leadPhone: leads.phone,
          leadEmail: leads.email,
        })
        .from(followUps)
        .innerJoin(leads, eq(leads.id, followUps.leadId))
        .leftJoin(users, eq(users.id, followUps.assignedTo))
        .where(where)
        .orderBy(asc(followUps.dueAt), asc(followUps.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db()
        .select({ value: count() })
        .from(followUps)
        .innerJoin(leads, eq(leads.id, followUps.leadId))
        .where(where),
    );
  }
  if (module === "invoices") {
    if (status)
      z.enum([
        "unpaid",
        "partially_paid",
        "paid",
        "cancelled",
        "overdue",
      ]).parse(status);
    where = and(
      pattern
        ? or(
            ilike(invoices.number, pattern),
            ilike(clients.businessName, pattern),
          )
        : undefined,
      status === "overdue"
        ? and(
            lt(invoices.dueDate, new Date()),
            ne(invoices.status, "cancelled"),
            ne(invoices.status, "paid"),
          )
        : status
          ? eq(invoices.status, status)
          : undefined,
      range(invoices.date),
    );
    return finish(
      db()
        .select({
          ...getTableColumns(invoices),
          clientName: clients.businessName,
        })
        .from(invoices)
        .leftJoin(clients, eq(clients.id, invoices.clientId))
        .where(where)
        .orderBy(desc(invoices.createdAt), asc(invoices.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db()
        .select({ value: count() })
        .from(invoices)
        .leftJoin(clients, eq(clients.id, invoices.clientId))
        .where(where),
    );
  }
  if (module === "payments") {
    where = and(
      pattern
        ? or(
            ilike(payments.reference, pattern),
            ilike(invoices.number, pattern),
          )
        : undefined,
      range(payments.receivedAt),
    );
    return finish(
      db()
        .select({
          ...getTableColumns(payments),
          invoiceNumber: invoices.number,
        })
        .from(payments)
        .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
        .where(where)
        .orderBy(desc(payments.receivedAt), asc(payments.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db()
        .select({ value: count() })
        .from(payments)
        .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
        .where(where),
    );
  }
  if (module === "quotations") {
    where = and(
      actor.role === "sales"
        ? sql`(EXISTS(SELECT 1 FROM leads l WHERE l.id=${quotations.leadId} AND l.assigned_to=${actor.id} AND l.archived_at IS NULL) OR EXISTS(SELECT 1 FROM clients c WHERE c.id=${quotations.clientId} AND c.account_manager=${actor.id} AND c.archived_at IS NULL))`
        : undefined,
      status
        ? eq(
            quotations.status,
            z.enum(["draft", "sent", "approved", "rejected"]).parse(status),
          )
        : undefined,
      pattern
        ? or(
            ilike(clients.businessName, pattern),
            ilike(leads.businessName, pattern),
          )
        : undefined,
      range(quotations.createdAt),
    );
    return finish(
      db()
        .select({
          ...getTableColumns(quotations),
          clientName: clients.businessName,
          leadName: leads.businessName,
        })
        .from(quotations)
        .leftJoin(clients, eq(clients.id, quotations.clientId))
        .leftJoin(leads, eq(leads.id, quotations.leadId))
        .where(where)
        .orderBy(desc(quotations.createdAt), asc(quotations.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db()
        .select({ value: count() })
        .from(quotations)
        .leftJoin(clients, eq(clients.id, quotations.clientId))
        .leftJoin(leads, eq(leads.id, quotations.leadId))
        .where(where),
    );
  }
  if (module === "notifications") {
    where = and(
      actor.role === "owner"
        ? or(eq(notifications.userId, actor.id), isNull(notifications.userId))
        : eq(notifications.userId, actor.id),
      status === "unread" ? isNull(notifications.readAt) : undefined,
    );
    return finish(
      db()
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db().select({ value: count() }).from(notifications).where(where),
    );
  }
  if (module === "team") {
    where = pattern
      ? or(ilike(users.name, pattern), ilike(users.email, pattern))
      : undefined;
    return finish(
      db()
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: userRoles.role,
          openTasks: sql<number>`(SELECT count(*)::int FROM tasks t WHERE t.assigned_to=${users.id} AND t.status != 'completed')`,
          overdueTasks: sql<number>`(SELECT count(*)::int FROM tasks t WHERE t.assigned_to=${users.id} AND t.status != 'completed' AND t.deadline < now())`,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .where(where)
        .orderBy(asc(users.name), asc(users.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db().select({ value: count() }).from(users).where(where),
    );
  }
  throw new ApiError(404, "Unknown record list.");
}
