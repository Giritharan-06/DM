import { NextRequest, NextResponse } from 'next/server';
import { db, leads } from '@zyroz/database';
import { and, eq, ilike, or, desc, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { stages } from '@zyroz/validation';
import { authorize, leadScope, ApiError } from '@/lib/server';
export async function GET(req: NextRequest) {
  try {
    const actor = await authorize(req.headers, 'leads');
    const p = req.nextUrl.searchParams;
    const search = p.get('q')?.slice(0, 200);
    const stage = p.get('stage');
    const rows = await db()
      .select()
      .from(leads)
      .where(
        and(
          leadScope(actor),
          stage ? eq(leads.stage, z.enum(stages).parse(stage)) : undefined,
          p.get('service')
            ? eq(leads.service, p.get('service')!.slice(0, 200))
            : undefined,
          p.get('assignee') && actor.role === 'owner'
            ? eq(leads.assignedTo, p.get('assignee')!)
            : undefined,
          p.get('from')
            ? gte(leads.createdAt, new Date(z.iso.date().parse(p.get('from'))))
            : undefined,
          p.get('to')
            ? lte(
                leads.createdAt,
                new Date(z.iso.date().parse(p.get('to')) + 'T23:59:59.999Z'),
              )
            : undefined,
          search
            ? or(
                ilike(leads.name, `%${search}%`),
                ilike(leads.businessName, `%${search}%`),
                ilike(leads.email, `%${search}%`),
              )
            : undefined,
        ),
      )
      .orderBy(desc(leads.createdAt))
      .limit(10001);
    if (rows.length > 10000)
      throw new ApiError(
        400,
        'More than 10,000 leads match. Narrow the export filter.',
      );
    const columns = [
      'id',
      'name',
      'businessName',
      'email',
      'phone',
      'industry',
      'service',
      'stage',
      'priority',
      'budget',
      'dealValue',
      'assignedTo',
      'createdAt',
    ] as const;
    const cell = (v: unknown) => {
      let text = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const content = [
      columns.join(','),
      ...rows.map((row) =>
        columns
          .map((key) =>
            cell(
              row[key] instanceof Date
                ? (row[key] as Date).toISOString()
                : row[key],
            ),
          )
          .join(','),
      ),
    ].join('\r\n');
    return new NextResponse('\ufeff' + content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="zyroz-leads.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ApiError ? error.message : 'Export unavailable.',
      },
      { status: error instanceof ApiError ? error.status : 503 },
    );
  }
}
