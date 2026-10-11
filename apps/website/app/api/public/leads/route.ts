import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import {
  db,
  leads,
  leadActivities,
  notifications,
  emailDeliveryLogs,
  rateLimits,
} from '@zyroz/database';
import { sql } from 'drizzle-orm';
import { enquirySchema } from '@zyroz/validation';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    const expected =
      process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
    if (origin !== expected)
      return NextResponse.json(
        { error: 'Invalid request origin.' },
        { status: 403 },
      );
    if (Number(req.headers.get('content-length') || 0) > 16000)
      return NextResponse.json(
        { error: 'Submission too large.' },
        { status: 413 },
      );
    const raw = await req.text();
    if (raw.length > 16000)
      return NextResponse.json(
        { error: 'Submission too large.' },
        { status: 413 },
      );
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
    }
    const result = enquirySchema.safeParse(json);
    if (!result.success)
      return NextResponse.json(
        {
          error: 'Check your enquiry details and consent.',
          fields: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    const value = result.data;
    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.TURNSTILE_SECRET_KEY
    )
      return NextResponse.json(
        {
          error:
            'Consultation intake is awaiting bot-protection configuration.',
        },
        { status: 503 },
      );
    if (process.env.TURNSTILE_SECRET_KEY) {
      const verify = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: value.turnstileToken || '',
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const checked = await verify.json();
      if (!checked.success || checked.hostname !== new URL(expected).hostname)
        return NextResponse.json(
          { error: 'Please complete the security check.' },
          { status: 400 },
        );
    }
    const forwarded = process.env.VERCEL
      ? req.headers.get('x-vercel-forwarded-for')
      : req.headers.get('x-forwarded-for');
    const address = forwarded?.split(',')[0]?.trim() || 'local';
    const key = createHash('sha256')
      .update(address + '|' + new Date().toISOString().slice(0, 13))
      .digest('hex');
    const [limit] = await db()
      .insert(rateLimits)
      .values({ key, count: 1, expiresAt: new Date(Date.now() + 3600000) })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: { count: sql`${rateLimits.count}+1` },
      })
      .returning();
    if (limit.count > 8)
      return NextResponse.json(
        { error: 'Too many enquiries. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '3600' } },
      );
    const dedupeKey = createHash('sha256')
      .update(
        [value.email, value.businessName.toLowerCase(), value.service].join(
          '|',
        ),
      )
      .digest('hex');
    await db().transaction(async (tx) => {
      const [lead] = await tx
        .insert(leads)
        .values({
          name: value.name,
          businessName: value.businessName,
          phone: value.phone,
          email: value.email,
          industry: value.industry,
          service: value.service,
          budget: value.budget,
          goal: value.goal,
          message: value.message,
          utm: value.utm,
          consentAt: new Date(),
          dedupeKey,
        })
        .onConflictDoNothing({ target: leads.dedupeKey })
        .returning();
      if (!lead) return;
      await tx.insert(leadActivities).values({
        leadId: lead.id,
        type: 'created',
        description: 'Consultation enquiry received from website.',
      });
      await tx.insert(notifications).values({
        title: 'New consultation enquiry',
        body: `${lead.businessName} is interested in ${lead.service}.`,
        href: `/leads/${lead.id}`,
      });
      if (process.env.OWNER_NOTIFICATION_EMAIL)
        await tx.insert(emailDeliveryLogs).values({
          to: process.env.OWNER_NOTIFICATION_EMAIL,
          subject: 'New ZYROZ consultation enquiry',
          body: `A new enquiry is available in your CRM. ${process.env.NEXT_PUBLIC_CRM_URL}/leads/${lead.id}`,
        });
    });
    return NextResponse.json(
      {
        success: true,
        message: 'Thank you. Your consultation enquiry has been received.',
      },
      { status: 202 },
    );
  } catch (error) {
    console.error(
      'Lead intake failed',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return NextResponse.json(
      { error: 'We could not save your enquiry. Please try again shortly.' },
      { status: 503 },
    );
  }
}
