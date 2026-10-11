import { NextRequest, NextResponse } from "next/server";
import {
  db,
  leads,
  leadActivities,
  leadAssignments,
  leadStageHistory,
  clients,
  clientContacts,
  clientServices,
  services,
  files,
  campaigns,
  campaignMetrics,
  tasks,
  taskAssignments,
  taskComments,
  followUps,
  quotations,
  quotationItems,
  invoices,
  invoiceItems,
  invoiceCounters,
  payments,
  notifications,
  notificationPreferences,
  users,
  userRoles,
  systemSettings,
  auditLogs,
} from "@zyroz/database";
import {
  and,
  eq,
  asc,
  desc,
  ilike,
  or,
  count,
  sql,
  isNull,
  gte,
  lte,
} from "drizzle-orm";
import { z } from "zod";
import { createHash } from "node:crypto";
import {
  enquirySchema,
  leadPatchSchema,
  clientSchema,
  campaignSchema,
  taskSchema,
  followUpSchema,
  financeSchema,
  quotationSchema,
  paymentSchema,
  totals,
  agencyProfileSchema,
} from "@zyroz/validation";
import {
  authorize,
  checkOrigin,
  limitMutation,
  ApiError,
  leadScope,
  clientScope,
  campaignScope,
  taskScope,
  followScope,
  assertLead,
  assertClient,
  assertCampaign,
  clientView,
  audit,
} from "@/lib/server";
import type { Module } from "@zyroz/auth/permissions";
import { listRecords } from "@/lib/list-records";
type Context = { params: Promise<{ path: string[] }> };
const modules = [
  "dashboard",
  "leads",
  "clients",
  "campaigns",
  "tasks",
  "follow-ups",
  "quotations",
  "invoices",
  "payments",
  "reports",
  "notifications",
  "team",
  "settings",
];
export const runtime = "nodejs";
async function handler(req: NextRequest, ctx: Context) {
  try {
    const [module, id, action] = (await ctx.params).path;
    if (!modules.includes(module)) throw new ApiError(404, "Unknown module.");
    const actor = await authorize(req.headers, module as Module);
    if (id && !["team", "settings"].includes(module)) z.uuid().parse(id);
    const query = req.nextUrl.searchParams;
    const page = Math.floor(
      Math.max(1, Math.min(10000, Number(query.get("page")) || 1)),
    );
    const limit = Math.floor(
      Math.min(100, Math.max(1, Number(query.get("limit")) || 25)),
    );
    const since = query.get("from")
      ? new Date(
          z
            .union([z.iso.date(), z.iso.datetime({ offset: true })])
            .parse(query.get("from")),
        )
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const until = query.get("to")
      ? new Date(
          z
            .union([z.iso.date(), z.iso.datetime({ offset: true })])
            .parse(query.get("to")) +
            (query.get("to")!.length === 10 ? "T23:59:59.999Z" : ""),
        )
      : new Date();
    if (req.method === "GET") {
      if (
        !id &&
        [
          "clients",
          "campaigns",
          "tasks",
          "follow-ups",
          "quotations",
          "invoices",
          "payments",
          "notifications",
          "team",
        ].includes(module)
      ) {
        return NextResponse.json(
          await listRecords(module, actor, query, page, limit),
        );
      }
      if (module === "clients" && id && action) {
        await assertClient(actor, id);
        if (
          ["quotations", "invoices", "payments"].includes(action) &&
          !["owner", "finance"].includes(actor.role)
        )
          throw new ApiError(403, "Financial records are restricted.");
        let rows: unknown[] = [];
        if (action === "campaigns")
          rows = await db()
            .select()
            .from(campaigns)
            .where(and(eq(campaigns.clientId, id), campaignScope(actor)));
        else if (action === "tasks")
          rows = await db()
            .select()
            .from(tasks)
            .where(and(eq(tasks.clientId, id), taskScope(actor)));
        else if (action === "files")
          rows = await db().select().from(files).where(eq(files.clientId, id));
        else if (action === "services")
          rows = await db()
            .select({ id: clientServices.id, name: services.name })
            .from(clientServices)
            .innerJoin(services, eq(services.id, clientServices.serviceId))
            .where(eq(clientServices.clientId, id));
        else if (action === "invoices")
          rows = await db()
            .select()
            .from(invoices)
            .where(eq(invoices.clientId, id));
        else if (action === "quotations")
          rows = await db()
            .select()
            .from(quotations)
            .where(eq(quotations.clientId, id));
        else if (action === "payments")
          rows = await db()
            .select({
              id: payments.id,
              amount: payments.amount,
              reference: payments.reference,
              receivedAt: payments.receivedAt,
            })
            .from(payments)
            .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
            .where(eq(invoices.clientId, id));
        else if (action === "activity")
          rows = await db()
            .select()
            .from(auditLogs)
            .where(
              and(eq(auditLogs.entity, "client"), eq(auditLogs.entityId, id)),
            )
            .orderBy(desc(auditLogs.createdAt));
        else throw new ApiError(404, "Unknown client section.");
        return NextResponse.json({ rows });
      }
      if (module === "tasks" && id && action === "attachments") {
        const [task] = await db()
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, id), taskScope(actor)));
        if (!task) throw new ApiError(404, "Task not found.");
        return NextResponse.json({
          rows: await db().select().from(files).where(eq(files.taskId, id)),
        });
      }
      if (module === "quotations" && id) {
        const [row] = await db()
          .select()
          .from(quotations)
          .where(eq(quotations.id, id));
        if (!row) throw new ApiError(404, "Quotation not found.");
        if (row.clientId) await assertClient(actor, row.clientId);
        else if (row.leadId) await assertLead(actor, row.leadId);
        else throw new ApiError(404, "Quotation not found.");
        return NextResponse.json({
          quotation: row,
          items: await db()
            .select()
            .from(quotationItems)
            .where(eq(quotationItems.quotationId, id)),
        });
      }
      if (module === "leads") {
        if (id) {
          const lead = await assertLead(actor, id);
          return NextResponse.json({
            lead,
            activities: await db()
              .select()
              .from(leadActivities)
              .where(eq(leadActivities.leadId, id))
              .orderBy(desc(leadActivities.createdAt)),
          });
        }
        const search = query.get("q")?.slice(0, 200);
        const stage = query.get("stage");
        const where = and(
          leadScope(actor),
          search
            ? or(
                ilike(leads.businessName, `%${search}%`),
                ilike(leads.name, `%${search}%`),
                ilike(leads.email, `%${search}%`),
              )
            : undefined,
          stage
            ? eq(
                leads.stage,
                z
                  .enum([
                    "new",
                    "contacted",
                    "qualified",
                    "proposal_sent",
                    "negotiation",
                    "won",
                    "lost",
                  ])
                  .parse(stage),
              )
            : undefined,
          query.get("assignee") && actor.role === "owner"
            ? eq(leads.assignedTo, query.get("assignee")!)
            : undefined,
          query.get("service")
            ? eq(leads.service, query.get("service")!.slice(0, 200))
            : undefined,
          query.get("from") ? gte(leads.createdAt, since) : undefined,
          query.get("to") ? lte(leads.createdAt, until) : undefined,
        );
        const [total] = await db()
          .select({ value: count() })
          .from(leads)
          .where(where);
        return NextResponse.json({
          rows: await db()
            .select()
            .from(leads)
            .where(where)
            .orderBy(
              query.get("sort") === "oldest"
                ? asc(leads.createdAt)
                : query.get("sort") === "business"
                  ? asc(leads.businessName)
                  : query.get("sort") === "value"
                    ? desc(leads.dealValue)
                    : desc(leads.createdAt),
            )
            .limit(limit)
            .offset((page - 1) * limit),
          total: total.value,
          page,
        });
      }
      if (module === "dashboard" || module === "reports") {
        const leadRows = ["owner", "sales"].includes(actor.role)
          ? await db()
              .select()
              .from(leads)
              .where(
                and(
                  leadScope(actor),
                  gte(leads.createdAt, since),
                  lte(leads.createdAt, until),
                ),
              )
          : [];
        const clientRows = await db()
          .select()
          .from(clients)
          .where(clientScope(actor));
        const financial = ["owner", "finance"].includes(actor.role);
        const invoiceRows = financial ? await db().select().from(invoices) : [];
        const paymentRows = financial
          ? await db()
              .select()
              .from(payments)
              .where(
                and(
                  gte(payments.receivedAt, since),
                  lte(payments.receivedAt, until),
                ),
              )
          : [];
        const followRows = ["owner", "sales"].includes(actor.role)
          ? await db()
              .select()
              .from(followUps)
              .innerJoin(leads, eq(leads.id, followUps.leadId))
              .where(
                and(
                  followScope(actor),
                  leadScope(actor),
                  isNull(followUps.completedAt),
                ),
              )
              .orderBy(asc(followUps.dueAt))
          : [];
        const openTasks = await db()
          .select()
          .from(tasks)
          .where(and(taskScope(actor), sql`${tasks.status} != 'completed'`))
          .orderBy(asc(tasks.deadline))
          .limit(6);
        const campaignResults = ["owner", "marketing"].includes(actor.role)
          ? await db()
              .select({
                name: campaigns.name,
                value: sql<number>`coalesce(sum(${campaignMetrics.leads}),0)::int`,
              })
              .from(campaigns)
              .leftJoin(
                campaignMetrics,
                and(
                  eq(campaignMetrics.campaignId, campaigns.id),
                  gte(campaignMetrics.date, since),
                  lte(campaignMetrics.date, until),
                ),
              )
              .where(campaignScope(actor))
              .groupBy(campaigns.id, campaigns.name)
              .orderBy(desc(sql`sum(${campaignMetrics.leads})`))
              .limit(8)
          : [];
        const updates = await db()
          .select()
          .from(notifications)
          .where(
            actor.role === "owner"
              ? or(
                  eq(notifications.userId, actor.id),
                  isNull(notifications.userId),
                )
              : eq(notifications.userId, actor.id),
          )
          .orderBy(desc(notifications.createdAt))
          .limit(4);
        const won = leadRows.filter((l) => l.stage === "won").length;
        return NextResponse.json({
          kpis: {
            totalLeads: leadRows.length,
            newLeads: leadRows.filter((l) => l.stage === "new").length,
            qualifiedLeads: leadRows.filter((l) => l.stage === "qualified")
              .length,
            activeClients: clientRows.filter((c) => c.status === "active")
              .length,
            revenue: financial
              ? paymentRows.reduce((s, p) => s + p.amount, 0)
              : null,
            pendingPayments: financial
              ? invoiceRows
                  .filter((i) => i.status !== "cancelled")
                  .reduce((s, i) => s + i.total - i.paid, 0)
              : null,
            conversionRate: leadRows.length ? (won / leadRows.length) * 100 : 0,
            upcomingFollowUps: followRows.length,
          },
          leads: leadRows
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 6),
          followUps: followRows
            .slice(0, 6)
            .map((row) => ({
              ...row.follow_ups,
              leadName: row.leads.businessName,
            })),
          openTasks,
          campaignResults,
          updates,
          funnel: [
            "new",
            "contacted",
            "qualified",
            "proposal_sent",
            "negotiation",
            "won",
            "lost",
          ].map((stage) => ({
            name: stage,
            value: leadRows.filter((l) => l.stage === stage).length,
          })),
          sources: Object.entries(
            leadRows.reduce<Record<string, number>>(
              (a, l) => ({ ...a, [l.source]: (a[l.source] || 0) + 1 }),
              {},
            ),
          ).map(([name, value]) => ({ name, value })),
          growth: Object.entries(
            leadRows.reduce<Record<string, number>>((a, l) => {
              const name = l.createdAt.toISOString().slice(0, 10);
              return { ...a, [name]: (a[name] || 0) + 1 };
            }, {}),
          )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, value]) => ({ name, value })),
          monthlyRevenue: financial
            ? Object.entries(
                paymentRows.reduce<Record<string, number>>((a, p) => {
                  const name = p.receivedAt.toISOString().slice(0, 7);
                  return { ...a, [name]: (a[name] || 0) + p.amount / 100 };
                }, {}),
              ).map(([name, value]) => ({ name, value }))
            : [],
          period: { from: since, to: until },
          financial,
        });
      }
      if (module === "clients") {
        if (id)
          return NextResponse.json({
            client: clientView(actor, await assertClient(actor, id)),
            contacts: await db()
              .select()
              .from(clientContacts)
              .where(eq(clientContacts.clientId, id)),
          });
        return NextResponse.json({
          rows: (
            await db()
              .select()
              .from(clients)
              .where(clientScope(actor))
              .orderBy(desc(clients.createdAt))
              .limit(limit)
              .offset((page - 1) * limit)
          ).map((row) => clientView(actor, row)),
        });
      }
      if (module === "campaigns") {
        if (id) {
          const [row] = await db()
            .select()
            .from(campaigns)
            .where(and(eq(campaigns.id, id), campaignScope(actor)));
          if (!row) throw new ApiError(404, "Campaign not found.");
          return NextResponse.json({
            campaign: row,
            metrics: await db()
              .select()
              .from(campaignMetrics)
              .where(eq(campaignMetrics.campaignId, id)),
          });
        }
        return NextResponse.json({
          rows: await db()
            .select()
            .from(campaigns)
            .where(campaignScope(actor))
            .limit(limit)
            .offset((page - 1) * limit),
        });
      }
      if (module === "tasks") {
        if (id) {
          const [row] = await db()
            .select()
            .from(tasks)
            .where(and(eq(tasks.id, id), taskScope(actor)));
          if (!row) throw new ApiError(404, "Task not found.");
          return NextResponse.json({
            task: row,
            comments: await db()
              .select()
              .from(taskComments)
              .where(eq(taskComments.taskId, id)),
          });
        }
        return NextResponse.json({
          rows: await db()
            .select()
            .from(tasks)
            .where(taskScope(actor))
            .limit(limit)
            .offset((page - 1) * limit),
        });
      }
      if (module === "follow-ups")
        return NextResponse.json({
          rows: await db()
            .select()
            .from(followUps)
            .where(followScope(actor))
            .orderBy(followUps.dueAt)
            .limit(limit)
            .offset((page - 1) * limit),
        });
      if (module === "quotations") {
        const rows = await db()
          .select()
          .from(quotations)
          .limit(limit)
          .offset((page - 1) * limit);
        const allowed = [];
        for (const row of rows) {
          if (actor.role !== "sales") {
            allowed.push(row);
            continue;
          }
          try {
            if (row.leadId) await assertLead(actor, row.leadId);
            else if (row.clientId) await assertClient(actor, row.clientId);
            else continue;
            allowed.push(row);
          } catch {}
        }
        return NextResponse.json({ rows: allowed });
      }
      if (module === "invoices") {
        if (id) {
          const [row] = await db()
            .select()
            .from(invoices)
            .where(eq(invoices.id, id));
          if (!row) throw new ApiError(404, "Invoice not found.");
          return NextResponse.json({
            invoice: row,
            items: await db()
              .select()
              .from(invoiceItems)
              .where(eq(invoiceItems.invoiceId, id)),
          });
        }
        return NextResponse.json({
          rows: await db()
            .select()
            .from(invoices)
            .orderBy(desc(invoices.createdAt))
            .limit(limit)
            .offset((page - 1) * limit),
        });
      }
      if (module === "payments")
        return NextResponse.json({
          rows: await db()
            .select()
            .from(payments)
            .orderBy(desc(payments.createdAt))
            .limit(limit)
            .offset((page - 1) * limit),
        });
      if (module === "notifications")
        return NextResponse.json({
          rows: await db()
            .select()
            .from(notifications)
            .where(
              actor.role === "owner"
                ? or(
                    eq(notifications.userId, actor.id),
                    isNull(notifications.userId),
                  )
                : eq(notifications.userId, actor.id),
            )
            .orderBy(desc(notifications.createdAt))
            .limit(limit),
        });
      if (module === "team")
        return NextResponse.json({
          rows: await db()
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              role: userRoles.role,
            })
            .from(users)
            .leftJoin(userRoles, eq(users.id, userRoles.userId))
            .limit(limit),
        });
      if (module === "settings")
        return NextResponse.json({
          rows: await db().select().from(systemSettings),
          audit: await db()
            .select()
            .from(auditLogs)
            .orderBy(desc(auditLogs.createdAt))
            .limit(50),
        });
    }
    checkOrigin(req);
    await limitMutation(actor);
    const raw = await req.text();
    if (raw.length > 32000) throw new ApiError(413, "Request too large.");
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      throw new ApiError(400, "Invalid JSON.");
    }
    if (module === "leads" && req.method === "POST" && !id) {
      const value = enquirySchema.parse(input);
      const row = await db().transaction(async (tx) => {
        const dedupeKey = createHash("sha256")
          .update(
            [value.email, value.businessName.toLowerCase(), value.service].join(
              "|",
            ),
          )
          .digest("hex");
        const [created] = await tx
          .insert(leads)
          .values({
            ...value,
            consentAt: new Date(),
            dedupeKey,
            source: "manual",
            assignedTo: actor.role === "sales" ? actor.id : null,
          })
          .onConflictDoNothing({ target: leads.dedupeKey })
          .returning();
        if (!created)
          throw new ApiError(
            409,
            "A lead already exists for this email, business and service.",
          );
        await tx.insert(leadActivities).values({
          leadId: created.id,
          actorId: actor.id,
          type: "created",
          description: "Lead added by the agency team.",
        });
        await tx.insert(auditLogs).values({
          actorId: actor.id,
          action: "create",
          entity: "lead",
          entityId: created.id,
        });
        return created;
      });
      return NextResponse.json(row, { status: 201 });
    }
    if (module === "leads" && id) {
      const current = await assertLead(actor, id);
      if (action === "convert" && req.method === "POST") {
        if (current.stage !== "won")
          throw new ApiError(409, "Mark the lead Won before converting.");
        const result = await db().transaction(async (tx) => {
          const [locked] = await tx
            .select()
            .from(leads)
            .where(eq(leads.id, id))
            .for("update");
          if (locked.stage !== "won")
            throw new ApiError(
              409,
              "Lead stage has changed. Refresh before converting.",
            );
          const [existing] = await tx
            .select()
            .from(clients)
            .where(eq(clients.leadId, id));
          if (existing) return existing;
          const [client] = await tx
            .insert(clients)
            .values({
              leadId: id,
              businessName: current.businessName,
              contactPerson: current.name,
              email: current.email,
              phone: current.phone,
              industry: current.industry,
              accountManager: current.assignedTo,
            })
            .returning();
          await tx.insert(clientContacts).values({
            clientId: client.id,
            name: current.name,
            email: current.email,
            phone: current.phone,
          });
          await tx.insert(leadActivities).values({
            leadId: id,
            actorId: actor.id,
            type: "converted",
            description: "Converted to client.",
          });
          await tx.insert(auditLogs).values({
            actorId: actor.id,
            action: "convert",
            entity: "lead",
            entityId: id,
          });
          return client;
        });
        return NextResponse.json(result);
      }
      if (req.method === "PATCH") {
        const value = leadPatchSchema.parse(input);
        if (actor.role !== "owner" && value.assignedTo !== undefined)
          throw new ApiError(403, "Only the owner can assign employees.");
        if (value.assignedTo) {
          const [member] = await db()
            .select()
            .from(userRoles)
            .where(
              and(
                eq(userRoles.userId, value.assignedTo),
                eq(userRoles.role, "sales"),
              ),
            );
          if (!member) throw new ApiError(400, "Assign a sales employee.");
        }
        const { archive, nextFollowUp, ...rest } = value;
        const row = await db().transaction(async (tx) => {
          const [locked] = await tx
            .select()
            .from(leads)
            .where(eq(leads.id, id))
            .for("update");
          const [changed] = await tx
            .update(leads)
            .set({
              ...rest,
              updatedAt: new Date(),
              ...(nextFollowUp !== undefined
                ? { nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null }
                : {}),
              ...(archive !== undefined
                ? { archivedAt: archive ? new Date() : null }
                : {}),
            })
            .where(eq(leads.id, id))
            .returning();
          if (value.stage && value.stage !== locked.stage)
            await tx.insert(leadStageHistory).values({
              leadId: id,
              fromStage: locked.stage,
              toStage: value.stage,
              actorId: actor.id,
            });
          if (value.assignedTo)
            await tx
              .insert(leadAssignments)
              .values({ leadId: id, userId: value.assignedTo });
          await tx.insert(leadActivities).values({
            leadId: id,
            actorId: actor.id,
            type: value.stage ? "stage_changed" : "updated",
            description: value.stage
              ? `Stage updated to ${value.stage}.`
              : "Lead details updated.",
          });
          await tx.insert(auditLogs).values({
            actorId: actor.id,
            action: "update",
            entity: "lead",
            entityId: id,
            metadata: { fields: Object.keys(value) },
          });
          return changed;
        });
        return NextResponse.json(row);
      }
    }
    if (module === "clients" && req.method === "POST") {
      if (id && action === "contacts") {
        await assertClient(actor, id);
        const value = z
          .object({
            name: z.string().min(2).max(200),
            email: z.email(),
            phone: z.string().max(20).optional(),
          })
          .parse(input);
        const [row] = await db()
          .insert(clientContacts)
          .values({ ...value, clientId: id })
          .returning();
        return NextResponse.json(row, { status: 201 });
      }
      if (actor.role === "marketing")
        throw new ApiError(403, "Client creation is restricted.");
      const value = clientSchema.parse(input);
      if (actor.role === "sales") value.accountManager = actor.id;
      const [row] = await db()
        .insert(clients)
        .values({
          ...value,
          contractStart: value.contractStart
            ? new Date(value.contractStart)
            : undefined,
          renewalDate: value.renewalDate
            ? new Date(value.renewalDate)
            : undefined,
        })
        .returning();
      await audit(actor, "create", "client", row.id);
      return NextResponse.json(row, { status: 201 });
    }
    if (module === "clients" && id && req.method === "PATCH") {
      await assertClient(actor, id);
      if (actor.role === "marketing")
        throw new ApiError(403, "Client editing is restricted.");
      const value = clientSchema.partial().parse(input);
      if (actor.role === "sales" && value.monthlyRetainer !== undefined)
        throw new ApiError(403, "Retainer changes require finance access.");
      if (actor.role !== "owner" && value.accountManager !== undefined)
        throw new ApiError(403, "Assignment is restricted.");
      const [row] = await db()
        .update(clients)
        .set({
          ...value,
          contractStart: value.contractStart
            ? new Date(value.contractStart)
            : undefined,
          renewalDate: value.renewalDate
            ? new Date(value.renewalDate)
            : undefined,
        })
        .where(eq(clients.id, id))
        .returning();
      await audit(actor, "update", "client", id);
      return NextResponse.json(clientView(actor, row));
    }
    if (module === "campaigns" && id && req.method === "PATCH") {
      await assertCampaign(actor, id);
      const value = campaignSchema.partial().parse(input);
      if (
        actor.role === "marketing" &&
        value.assignedTo &&
        value.assignedTo !== actor.id
      )
        throw new ApiError(403, "Campaign reassignment requires the owner.");
      if (value.clientId) await assertClient(actor, value.clientId);
      const [row] = await db()
        .update(campaigns)
        .set({
          ...value,
          startDate: value.startDate ? new Date(value.startDate) : undefined,
          endDate: value.endDate ? new Date(value.endDate) : undefined,
        })
        .where(eq(campaigns.id, id))
        .returning();
      await audit(actor, "update", "campaign", id);
      return NextResponse.json(row);
    }
    if (module === "campaigns" && req.method === "POST") {
      if (id && action === "metrics") {
        const [campaign] = await db()
          .select()
          .from(campaigns)
          .where(and(eq(campaigns.id, id), campaignScope(actor)));
        if (!campaign) throw new ApiError(404, "Campaign not found.");
        const value = z
          .object({
            impressions: z.number().int().nonnegative(),
            reach: z.number().int().nonnegative(),
            clicks: z.number().int().nonnegative(),
            leads: z.number().int().nonnegative(),
            conversions: z.number().int().nonnegative(),
            spend: z.number().int().nonnegative(),
            revenue: z.number().int().nonnegative(),
            date: z.iso.datetime(),
          })
          .parse(input);
        const [row] = await db()
          .insert(campaignMetrics)
          .values({
            ...value,
            date: new Date(value.date),
            campaignId: id,
            source: "manual",
          })
          .returning();
        await audit(actor, "metrics", "campaign", id);
        return NextResponse.json(row);
      }
      const value = campaignSchema.parse(input);
      await assertClient(actor, value.clientId);
      if (actor.role !== "owner") value.assignedTo = actor.id;
      const [row] = await db()
        .insert(campaigns)
        .values({
          ...value,
          startDate: new Date(value.startDate),
          endDate: value.endDate ? new Date(value.endDate) : null,
        })
        .returning();
      await audit(actor, "create", "campaign", row.id);
      return NextResponse.json(row, { status: 201 });
    }
    if (module === "tasks" && req.method === "POST") {
      if (id && action === "comments") {
        const [task] = await db()
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, id), taskScope(actor)));
        if (!task) throw new ApiError(404, "Task not found.");
        const value = z
          .object({ body: z.string().min(1).max(5000) })
          .parse(input);
        const [row] = await db()
          .insert(taskComments)
          .values({ ...value, taskId: id, userId: actor.id })
          .returning();
        return NextResponse.json(row);
      }
      const value = taskSchema.parse(input);
      if (actor.role !== "owner") value.assignedTo = actor.id;
      if (value.clientId) await assertClient(actor, value.clientId);
      if (value.campaignId) {
        const campaign = await assertCampaign(actor, value.campaignId);
        if (value.clientId && campaign.clientId !== value.clientId)
          throw new ApiError(400, "Campaign belongs to a different client.");
      }
      const row = await db().transaction(async (tx) => {
        const [created] = await tx
          .insert(tasks)
          .values({ ...value, deadline: new Date(value.deadline) })
          .returning();
        await tx
          .insert(taskAssignments)
          .values({ taskId: created.id, userId: value.assignedTo });
        await tx.insert(auditLogs).values({
          actorId: actor.id,
          action: "create",
          entity: "task",
          entityId: created.id,
        });
        return created;
      });
      return NextResponse.json(row, { status: 201 });
    }
    if (module === "tasks" && id && req.method === "PATCH") {
      const [current] = await db()
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), taskScope(actor)));
      if (!current) throw new ApiError(404, "Task not found.");
      const value = taskSchema.partial().parse(input);
      if (
        actor.role !== "owner" &&
        value.assignedTo &&
        value.assignedTo !== actor.id
      )
        throw new ApiError(403, "Task reassignment requires the owner.");
      if (value.clientId) await assertClient(actor, value.clientId);
      if (value.campaignId) {
        const campaign = await assertCampaign(actor, value.campaignId);
        if (value.clientId && campaign.clientId !== value.clientId)
          throw new ApiError(400, "Campaign belongs to a different client.");
      }
      const row = await db().transaction(async (tx) => {
        const [locked] = await tx
          .select()
          .from(tasks)
          .where(eq(tasks.id, id))
          .for("update");
        const [changed] = await tx
          .update(tasks)
          .set({
            ...value,
            deadline: value.deadline ? new Date(value.deadline) : undefined,
          })
          .where(eq(tasks.id, id))
          .returning();
        if (value.assignedTo && value.assignedTo !== locked.assignedTo) {
          await tx
            .delete(taskAssignments)
            .where(eq(taskAssignments.taskId, id));
          await tx
            .insert(taskAssignments)
            .values({ taskId: id, userId: value.assignedTo });
        }
        if (
          value.status === "completed" &&
          locked.status !== "completed" &&
          locked.recurrenceDays
        )
          await tx.insert(tasks).values({
            title: locked.title,
            assignedTo: locked.assignedTo,
            clientId: locked.clientId,
            campaignId: locked.campaignId,
            priority: locked.priority,
            description: locked.description,
            recurrenceDays: locked.recurrenceDays,
            deadline: new Date(
              locked.deadline.getTime() + locked.recurrenceDays * 86400000,
            ),
          });
        await tx.insert(auditLogs).values({
          actorId: actor.id,
          action: "status",
          entity: "task",
          entityId: id,
        });
        return changed;
      });
      return NextResponse.json(row);
    }
    if (module === "follow-ups" && req.method === "POST") {
      const value = followUpSchema.parse(input);
      await assertLead(actor, value.leadId);
      if (actor.role === "sales") value.assignedTo = actor.id;
      const [row] = await db()
        .insert(followUps)
        .values({ ...value, dueAt: new Date(value.dueAt) })
        .returning();
      await audit(actor, "create", "follow_up", row.id);
      return NextResponse.json(row, { status: 201 });
    }
    if (module === "follow-ups" && id && req.method === "PATCH") {
      const value = z.object({ completed: z.boolean() }).parse(input);
      const [row] = await db()
        .update(followUps)
        .set({ completedAt: value.completed ? new Date() : null })
        .where(and(eq(followUps.id, id), followScope(actor)))
        .returning();
      if (!row) throw new ApiError(404, "Follow-up not found.");
      await audit(actor, "complete", "follow_up", id);
      return NextResponse.json(row);
    }
    if (module === "quotations" && id) {
      const [quote] = await db()
        .select()
        .from(quotations)
        .where(eq(quotations.id, id));
      if (!quote) throw new ApiError(404, "Quotation not found.");
      if (quote.clientId) await assertClient(actor, quote.clientId);
      else if (quote.leadId) await assertLead(actor, quote.leadId);
      if (req.method === "PATCH") {
        const value = z
          .object({ status: z.enum(["draft", "sent", "approved", "rejected"]) })
          .parse(input);
        if (
          actor.role === "sales" &&
          ["approved", "rejected"].includes(value.status)
        )
          throw new ApiError(
            403,
            "Approval requires the owner or finance manager.",
          );
        const changed = await db().transaction(async (tx) => {
          const [locked] = await tx
            .select()
            .from(quotations)
            .where(eq(quotations.id, id))
            .for("update");
          if (!locked) throw new ApiError(404, "Quotation not found.");
          if (locked.invoiceId)
            throw new ApiError(
              409,
              "An invoiced quotation cannot change status.",
            );
          const [updated] = await tx
            .update(quotations)
            .set({
              status: value.status,
              approvedBy: value.status === "approved" ? actor.id : null,
              approvedAt: value.status === "approved" ? new Date() : null,
            })
            .where(eq(quotations.id, id))
            .returning();
          await tx.insert(auditLogs).values({
            actorId: actor.id,
            action: "status",
            entity: "quotation",
            entityId: id,
          });
          return updated;
        });
        return NextResponse.json(changed);
      }
      if (req.method === "POST" && action === "convert") {
        await authorize(req.headers, "invoices");
        const value = z.object({ dueDate: z.iso.datetime() }).parse(input);
        const result = await db().transaction(async (tx) => {
          const [locked] = await tx
            .select()
            .from(quotations)
            .where(eq(quotations.id, id))
            .for("update");
          if (locked.invoiceId) {
            const [existing] = await tx
              .select()
              .from(invoices)
              .where(eq(invoices.id, locked.invoiceId));
            return existing;
          }
          if (locked.status !== "approved")
            throw new ApiError(409, "Approve the quotation before invoicing.");
          let clientId = locked.clientId;
          if (!clientId && locked.leadId) {
            const [client] = await tx
              .select()
              .from(clients)
              .where(eq(clients.leadId, locked.leadId));
            clientId = client?.id || null;
          }
          if (!clientId)
            throw new ApiError(
              409,
              "Convert the Won lead to a client before invoicing.",
            );
          const items = await tx
            .select()
            .from(quotationItems)
            .where(eq(quotationItems.quotationId, id));
          const year = new Date().getFullYear();
          const [counter] = await tx
            .insert(invoiceCounters)
            .values({ year, value: 1 })
            .onConflictDoUpdate({
              target: invoiceCounters.year,
              set: { value: sql`${invoiceCounters.value}+1` },
            })
            .returning();
          const [invoice] = await tx
            .insert(invoices)
            .values({
              number: `ZYR-${year}-${String(counter.value).padStart(5, "0")}`,
              clientId,
              date: new Date(),
              dueDate: new Date(value.dueDate),
              discount: locked.discount,
              taxBps: locked.taxBps,
              gstin: locked.gstin,
              total: locked.total,
              status: locked.total === 0 ? "paid" : "unpaid",
            })
            .returning();
          await tx.insert(invoiceItems).values(
            items.map((item) => ({
              invoiceId: invoice.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
            })),
          );
          await tx
            .update(quotations)
            .set({ invoiceId: invoice.id })
            .where(eq(quotations.id, id));
          await tx.insert(auditLogs).values({
            actorId: actor.id,
            action: "invoice_conversion",
            entity: "quotation",
            entityId: id,
            metadata: { invoiceId: invoice.id },
          });
          return invoice;
        });
        return NextResponse.json(result);
      }
    }
    if (module === "invoices" && id && req.method === "PATCH") {
      const value = z.object({ status: z.literal("cancelled") }).parse(input);
      await db().transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, id))
          .for("update");
        if (!row) throw new ApiError(404, "Invoice not found.");
        if (row.paid > 0)
          throw new ApiError(
            409,
            "Invoices with recorded payments require a separate credit/refund process.",
          );
        await tx.update(invoices).set(value).where(eq(invoices.id, id));
        await tx.insert(auditLogs).values({
          actorId: actor.id,
          action: "cancel",
          entity: "invoice",
          entityId: id,
        });
      });
      return NextResponse.json({ success: true });
    }
    if (["quotations", "invoices"].includes(module) && req.method === "POST") {
      const value =
        module === "quotations"
          ? quotationSchema.parse(input)
          : financeSchema.parse(input);
      if (value.clientId) await assertClient(actor, value.clientId);
      else if ("leadId" in value && value.leadId)
        await assertLead(actor, value.leadId);
      const sum = totals(value.items, value.discount, value.taxBps);
      const row = await db().transaction(async (tx) => {
        if (module === "quotations") {
          const [quote] = await tx
            .insert(quotations)
            .values({
              clientId: value.clientId,
              leadId: "leadId" in value ? value.leadId : undefined,
              gstin: value.gstin,
              validUntil: new Date(value.dueDate),
              discount: value.discount,
              taxBps: value.taxBps,
              total: sum.total,
            })
            .returning();
          await tx
            .insert(quotationItems)
            .values(value.items.map((i) => ({ ...i, quotationId: quote.id })));
          await tx.insert(auditLogs).values({
            actorId: actor.id,
            action: "create",
            entity: "quotation",
            entityId: quote.id,
          });
          return quote;
        }
        const year = new Date().getFullYear();
        const [counter] = await tx
          .insert(invoiceCounters)
          .values({ year, value: 1 })
          .onConflictDoUpdate({
            target: invoiceCounters.year,
            set: { value: sql`${invoiceCounters.value}+1` },
          })
          .returning();
        const [invoice] = await tx
          .insert(invoices)
          .values({
            number: `ZYR-${year}-${String(counter.value).padStart(5, "0")}`,
            clientId: value.clientId!,
            date: new Date(),
            dueDate: new Date(value.dueDate),
            discount: value.discount,
            taxBps: value.taxBps,
            gstin: value.gstin,
            total: sum.total,
            status: sum.total === 0 ? "paid" : "unpaid",
          })
          .returning();
        await tx
          .insert(invoiceItems)
          .values(value.items.map((i) => ({ ...i, invoiceId: invoice.id })));
        await tx.insert(auditLogs).values({
          actorId: actor.id,
          action: "create",
          entity: "invoice",
          entityId: invoice.id,
        });
        return invoice;
      });
      return NextResponse.json(row, { status: 201 });
    }
    if (module === "payments" && req.method === "POST") {
      const value = paymentSchema.parse(input);
      const row = await db().transaction(async (tx) => {
        const [invoice] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, value.invoiceId))
          .for("update");
        if (!invoice) throw new ApiError(404, "Invoice not found.");
        const [previous] = await tx
          .select()
          .from(payments)
          .where(eq(payments.reference, value.reference));
        if (previous) {
          if (
            previous.invoiceId !== value.invoiceId ||
            previous.amount !== value.amount
          )
            throw new ApiError(409, "Payment reference already used.");
          return previous;
        }
        if (
          invoice.status === "cancelled" ||
          invoice.paid + value.amount > invoice.total
        )
          throw new ApiError(
            409,
            "Payment exceeds outstanding balance or invoice is cancelled.",
          );
        const [payment] = await tx
          .insert(payments)
          .values({
            ...value,
            receivedAt: new Date(value.receivedAt),
            recordedBy: actor.id,
          })
          .returning();
        const paid = invoice.paid + value.amount;
        await tx
          .update(invoices)
          .set({
            paid,
            status: paid === invoice.total ? "paid" : "partially_paid",
          })
          .where(eq(invoices.id, invoice.id));
        await tx.insert(auditLogs).values({
          actorId: actor.id,
          action: "payment",
          entity: "invoice",
          entityId: invoice.id,
          metadata: { paymentId: payment.id, amount: value.amount },
        });
        return payment;
      });
      return NextResponse.json(row, { status: 201 });
    }
    if (module === "notifications" && id && req.method === "PATCH") {
      const [row] = await db()
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.id, id),
            actor.role === "owner"
              ? or(
                  eq(notifications.userId, actor.id),
                  isNull(notifications.userId),
                )
              : eq(notifications.userId, actor.id),
          ),
        )
        .returning();
      if (!row) throw new ApiError(404, "Notification not found.");
      return NextResponse.json(row);
    }
    if (module === "team" && id && req.method === "PATCH") {
      const value = z
        .object({ role: z.enum(["sales", "marketing", "finance"]) })
        .parse(input);
      if (id === actor.id)
        throw new ApiError(409, "You cannot change your own role.");
      const [target] = await db()
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, id));
      if (target?.role === "owner")
        throw new ApiError(
          403,
          "Owner changes require the administration script.",
        );
      await db()
        .insert(userRoles)
        .values({ userId: id, role: value.role })
        .onConflictDoUpdate({
          target: userRoles.userId,
          set: { role: value.role },
        });
      await audit(actor, "role_change", "user", id);
      return NextResponse.json({ success: true });
    }
    if (module === "settings" && req.method === "PATCH") {
      const value = z
        .object({
          key: z.enum(["agency", "notifications", "services", "lead_sources"]),
          value: z.record(z.string(), z.unknown()),
        })
        .parse(input);
      if (value.key === "agency")
        value.value = agencyProfileSchema.parse(value.value);
      await db()
        .insert(systemSettings)
        .values(value)
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: value.value, updatedAt: new Date() },
        });
      await audit(actor, "settings", "settings", value.key);
      return NextResponse.json({ success: true });
    }
    if (module === "notifications" && req.method === "POST") {
      const value = z
        .object({ email: z.boolean(), inApp: z.boolean() })
        .parse(input);
      await db()
        .insert(notificationPreferences)
        .values({ ...value, userId: actor.id })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: value,
        });
      return NextResponse.json({ success: true });
    }
    throw new ApiError(405, "This operation is not available.");
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid input.", fields: error.flatten().fieldErrors },
        { status: 400 },
      );
    if (error instanceof ApiError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error(
      "CRM API error",
      error instanceof Error ? error.message : "Unknown",
    );
    return NextResponse.json(
      {
        error:
          "Service unavailable. Check database and authentication configuration.",
      },
      { status: 503 },
    );
  }
}
export const GET = handler;
export const POST = handler;
export const PATCH = handler;
