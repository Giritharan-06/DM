import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq, lte, lt, sql, isNull, ne } from 'drizzle-orm';
import { Resend } from 'resend';
import {
  emailDeliveryLogs,
  rateLimits,
  followUps,
  leads,
  tasks,
  users,
  notifications,
  notificationPreferences,
} from '@zyroz/database/schema';
async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      'Configure DATABASE_URL before running the scheduled worker.',
    );
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const database = drizzle(pool);
  const resend =
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM
      ? new Resend(process.env.RESEND_API_KEY)
      : null;
  try {
    const due = new Date(Date.now() + 3600000);
    const [followReminders, taskReminders] = await Promise.all([
      database
        .select({
          id: followUps.id,
          assignedTo: followUps.assignedTo,
          dueAt: followUps.dueAt,
          title: leads.businessName,
          leadId: leads.id,
          email: users.email,
          allowEmail: notificationPreferences.email,
          allowInApp: notificationPreferences.inApp,
        })
        .from(followUps)
        .innerJoin(leads, eq(leads.id, followUps.leadId))
        .innerJoin(users, eq(users.id, followUps.assignedTo))
        .leftJoin(
          notificationPreferences,
          eq(notificationPreferences.userId, users.id),
        )
        .where(and(isNull(followUps.completedAt), lte(followUps.dueAt, due)))
        .limit(500),
      database
        .select({
          id: tasks.id,
          assignedTo: tasks.assignedTo,
          dueAt: tasks.deadline,
          title: tasks.title,
          email: users.email,
          allowEmail: notificationPreferences.email,
          allowInApp: notificationPreferences.inApp,
        })
        .from(tasks)
        .innerJoin(users, eq(users.id, tasks.assignedTo))
        .leftJoin(
          notificationPreferences,
          eq(notificationPreferences.userId, users.id),
        )
        .where(and(ne(tasks.status, 'completed'), lte(tasks.deadline, due)))
        .limit(500),
    ]);
    for (const reminder of [
      ...followReminders.map((r) => ({
        ...r,
        kind: 'Follow-up',
        href: '/leads/' + r.leadId,
      })),
      ...taskReminders.map((r) => ({
        ...r,
        kind: 'Task',
        href: '/tasks/' + r.id,
      })),
    ]) {
      const dedupeKey = `reminder:${reminder.kind}:${reminder.id}:${reminder.dueAt.toISOString()}`;
      await database.transaction(async (tx) => {
        if (reminder.allowInApp !== false)
          await tx
            .insert(notifications)
            .values({
              dedupeKey,
              userId: reminder.assignedTo,
              title: `${reminder.kind} reminder`,
              body: `${reminder.title} · Due ${reminder.dueAt.toISOString()}`,
              href: reminder.href,
            })
            .onConflictDoNothing({ target: notifications.dedupeKey });
        if (reminder.allowEmail === true)
          await tx
            .insert(emailDeliveryLogs)
            .values({
              dedupeKey,
              to: reminder.email,
              subject: `ZYROZ ${reminder.kind.toLowerCase()} reminder`,
              body: `A ${reminder.kind.toLowerCase()} is due in your workspace. ${process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3001'}${reminder.href}`,
            })
            .onConflictDoNothing({ target: emailDeliveryLogs.dedupeKey });
      });
    }
    for (let n = 0; resend && n < 25; n++) {
      const processed = await database.transaction(async (tx) => {
        const [job] = await tx
          .select()
          .from(emailDeliveryLogs)
          .where(
            and(
              eq(emailDeliveryLogs.status, 'queued'),
              lte(emailDeliveryLogs.nextAttemptAt, new Date()),
              lt(emailDeliveryLogs.attempts, 5),
            ),
          )
          .for('update', { skipLocked: true })
          .limit(1);
        if (!job) return false;
        try {
          const result = await resend.emails.send(
            {
              from: process.env.EMAIL_FROM!,
              to: job.to,
              subject: job.subject,
              text: job.body,
            },
            { idempotencyKey: job.id },
          );
          if (result.error) throw new Error(result.error.message);
          await tx
            .update(emailDeliveryLogs)
            .set({
              status: 'accepted',
              providerId: result.data?.id,
              attempts: job.attempts + 1,
              error: null,
            })
            .where(eq(emailDeliveryLogs.id, job.id));
        } catch (error) {
          const attempts = job.attempts + 1;
          await tx
            .update(emailDeliveryLogs)
            .set({
              attempts,
              status: attempts >= 5 ? 'failed' : 'queued',
              error:
                error instanceof Error ? error.message : 'Provider failure',
              nextAttemptAt: new Date(
                Date.now() + Math.min(3600, 60 * 2 ** attempts) * 1000,
              ),
            })
            .where(eq(emailDeliveryLogs.id, job.id));
        }
        return true;
      });
      if (!processed) break;
    }
    await database
      .delete(rateLimits)
      .where(lt(rateLimits.expiresAt, new Date()));
    const [summary] = await database
      .select({
        accepted: sql<number>`count(*) filter (where status='accepted')`,
        failed: sql<number>`count(*) filter (where status='failed')`,
      })
      .from(emailDeliveryLogs);
    console.log(
      'Email queue processed. Provider acceptance is not confirmed delivery.',
      summary,
    );
  } finally {
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
