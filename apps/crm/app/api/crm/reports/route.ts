import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  leads,
  clients,
  campaigns,
  campaignMetrics,
  invoices,
  invoiceItems,
  payments,
  followUps,
  users,
} from '@zyroz/database';
import { and, gte, lte, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { authorize, ApiError } from '@/lib/server';
export const runtime = 'nodejs';
type Row = Record<string, string | number | null>;
export async function GET(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, 'reports');
    const params = req.nextUrl.searchParams;
    const from = params.get('from')
      ? new Date(z.iso.date().parse(params.get('from')))
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = params.get('to')
      ? new Date(z.iso.date().parse(params.get('to')) + 'T23:59:59.999Z')
      : new Date();
    if (from > to || to.getTime() - from.getTime() > 366 * 86400000)
      throw new ApiError(
        400,
        'Choose a valid reporting period of at most one year.',
      );
    const database = db();
    const [
      leadRows,
      clientRows,
      paymentRows,
      invoiceRows,
      itemRows,
      campaignRows,
      metricRows,
      followRows,
      people,
    ] = await Promise.all([
      actor.role === 'owner'
        ? database
            .select()
            .from(leads)
            .where(
              and(
                isNull(leads.archivedAt),
                gte(leads.createdAt, from),
                lte(leads.createdAt, to),
              ),
            )
        : Promise.resolve([]),
      database.select().from(clients).where(isNull(clients.archivedAt)),
      database
        .select()
        .from(payments)
        .where(
          and(gte(payments.receivedAt, from), lte(payments.receivedAt, to)),
        ),
      database.select().from(invoices),
      database.select().from(invoiceItems),
      database.select().from(campaigns),
      database
        .select()
        .from(campaignMetrics)
        .where(
          and(gte(campaignMetrics.date, from), lte(campaignMetrics.date, to)),
        ),
      actor.role === 'owner'
        ? database
            .select()
            .from(followUps)
            .where(and(gte(followUps.dueAt, from), lte(followUps.dueAt, to)))
        : Promise.resolve([]),
      actor.role === 'owner'
        ? database.select({ id: users.id, name: users.name }).from(users)
        : Promise.resolve([]),
    ]);
    const names = new Map(people.map((p) => [p.id, p.name]));
    const clientNames = new Map(clientRows.map((c) => [c.id, c.businessName]));
    const group = (rows: typeof leadRows, key: 'source' | 'assignedTo') => {
      const result = new Map<
        string,
        { name: string; leads: number; won: number; dealValuePaise: number }
      >();
      for (const row of rows) {
        const value = row[key] || 'Unassigned';
        const current = result.get(value) || {
          name: key === 'assignedTo' ? names.get(value) || value : value,
          leads: 0,
          won: 0,
          dealValuePaise: 0,
        };
        current.leads++;
        if (row.stage === 'won') {
          current.won++;
          current.dealValuePaise += row.dealValue;
        }
        result.set(value, current);
      }
      return [...result.values()].map((r) => ({
        ...r,
        conversionPercent: r.leads ? +((100 * r.won) / r.leads).toFixed(2) : 0,
      }));
    };
    const revenue = new Map<string, number>();
    for (const payment of paymentRows) {
      const month = payment.receivedAt.toISOString().slice(0, 7);
      revenue.set(month, (revenue.get(month) || 0) + payment.amount);
    }
    const campaignPerformance = campaignRows.map((c) => {
      const metrics = metricRows.filter((m) => m.campaignId === c.id);
      const sum = (
        key: 'clicks' | 'leads' | 'spend' | 'revenue' | 'impressions',
      ) => metrics.reduce((s, m) => s + m[key], 0);
      return {
        campaign: c.name,
        entries: metrics.length,
        source: metrics.some((m) => m.source !== 'manual')
          ? 'mixed/imported'
          : 'manual',
        impressions: sum('impressions'),
        clicks: sum('clicks'),
        leads: sum('leads'),
        spendPaise: sum('spend'),
        cpcPaise: sum('clicks')
          ? Math.round(sum('spend') / sum('clicks'))
          : null,
        cplPaise: sum('leads') ? Math.round(sum('spend') / sum('leads')) : null,
        roas: sum('spend') ? +(sum('revenue') / sum('spend')).toFixed(2) : null,
      };
    });
    const serviceRevenue = new Map<string, number>();
    for (const payment of paymentRows) {
      const items = itemRows.filter((i) => i.invoiceId === payment.invoiceId);
      const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
      if (!subtotal) continue;
      let allocated = 0;
      items.forEach((item, index) => {
        const amount =
          index === items.length - 1
            ? payment.amount - allocated
            : Math.round(
                (payment.amount * item.quantity * item.rate) / subtotal,
              );
        allocated += amount;
        serviceRevenue.set(
          item.description,
          (serviceRevenue.get(item.description) || 0) + amount,
        );
      });
    }
    const cohort = clientRows.filter((c) => c.createdAt < from);
    const retained = cohort.filter((c) => c.status === 'active').length;
    const followGroup = new Map<
      string,
      { employee: string; due: number; completed: number; overdue: number }
    >();
    for (const follow of followRows) {
      const current = followGroup.get(follow.assignedTo) || {
        employee: names.get(follow.assignedTo) || follow.assignedTo,
        due: 0,
        completed: 0,
        overdue: 0,
      };
      current.due++;
      if (follow.completedAt) current.completed++;
      else if (follow.dueAt < new Date()) current.overdue++;
      followGroup.set(follow.assignedTo, current);
    }
    const reports: {
      key: string;
      title: string;
      definition: string;
      restricted?: boolean;
      rows: Row[];
    }[] = [
      {
        key: 'sources',
        title: 'Lead source performance',
        definition:
          'Leads created in the period; Won counts and conversion use that same cohort.',
        restricted: actor.role !== 'owner',
        rows: group(leadRows, 'source'),
      },
      {
        key: 'conversion',
        title: 'Lead conversion',
        definition:
          'Current stages of the created cohort, excluding archived leads.',
        restricted: actor.role !== 'owner',
        rows: [
          'new',
          'contacted',
          'qualified',
          'proposal_sent',
          'negotiation',
          'won',
          'lost',
        ].map((stage) => ({
          stage,
          count: leadRows.filter((l) => l.stage === stage).length,
        })),
      },
      {
        key: 'employees',
        title: 'Employee sales performance',
        definition:
          'Assigned cohort leads and Won estimated deal value; deal value is not received revenue.',
        restricted: actor.role !== 'owner',
        rows: group(leadRows, 'assignedTo'),
      },
      {
        key: 'revenue',
        title: 'Monthly revenue',
        definition:
          'Payments received during the period, grouped by UTC month.',
        rows: [...revenue.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, receivedPaise]) => ({ month, receivedPaise })),
      },
      {
        key: 'outstanding',
        title: 'Outstanding invoices',
        definition:
          'Current unpaid balances across all noncancelled invoices, regardless of period.',
        rows: invoiceRows
          .filter((i) => i.status !== 'cancelled' && i.total > i.paid)
          .map((i) => ({
            invoice: i.number,
            client: clientNames.get(i.clientId) || i.clientId,
            outstandingPaise: i.total - i.paid,
            dueDate: i.dueDate.toISOString().slice(0, 10),
            status: i.dueDate < new Date() ? 'overdue' : i.status,
          })),
      },
      {
        key: 'campaigns',
        title: 'Campaign performance',
        definition:
          'Metrics recorded in the period. Manual data is labeled; zero denominators show no ratio.',
        rows: campaignPerformance,
      },
      {
        key: 'retention',
        title: 'Client retention snapshot',
        definition:
          'Clients acquired before the period start that are currently active. This is a current snapshot, not historical retention.',
        rows: [
          {
            cohortClients: cohort.length,
            currentActive: retained,
            currentActivePercent: cohort.length
              ? +((retained / cohort.length) * 100).toFixed(2)
              : null,
          },
        ],
      },
      {
        key: 'services',
        title: 'Service revenue allocation',
        definition:
          'Received payments allocated proportionally across invoice line descriptions; discount and tax follow the same weights.',
        rows: [...serviceRevenue.entries()].map(
          ([service, allocatedPaise]) => ({ service, allocatedPaise }),
        ),
      },
      {
        key: 'followups',
        title: 'Follow-up completion',
        definition:
          'Follow-ups due in the period; completion/overdue reflect their current state.',
        restricted: actor.role !== 'owner',
        rows: [...followGroup.values()].map((v) => ({
          ...v,
          completionPercent: v.due
            ? +((v.completed / v.due) * 100).toFixed(2)
            : 0,
        })),
      },
    ];
    return NextResponse.json(
      { reports, period: { from, to } },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ApiError
            ? error.message
            : error instanceof z.ZodError
              ? 'Invalid reporting dates.'
              : 'Reports unavailable.',
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
