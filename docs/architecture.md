# Architecture

The public website writes to the shared database through its own intake route. CRM accepts only authenticated private operations. Database code imports `server-only`; public validation and UI packages contain no credentials. Zustand holds navigation UI state only. TanStack Query manages API cache and optimistic pipeline rollback.

The schema defines auth, roles, permissions, leads/history/assignments, clients/contacts/services/contracts, campaigns/metrics/assets, tasks/comments/assignments, follow-ups, finance/items/payments/counters, notifications/preferences, email queue, files, settings and audit. Business IDs are UUIDs; Better Auth IDs are strings. Money is integer paise; tax is basis points.

Lead conversion locks its lead and a unique client lead ID prevents retries from duplicating clients. Invoice numbering increments a year counter inside the invoice transaction. Payment recording locks the invoice, checks its balance/reference and writes payment, status and audit atomically. Task recurrence is guarded by the transition to completed and a row lock.

## Access boundaries

The permission matrix is in `packages/auth/src/permissions.ts`. Every API validates a session and module permission. Sales reads assigned leads/account-managed clients; marketing reads assigned campaigns/tasks/account-managed clients. Owners manage team roles. Client accounts have no enabled modules. Host-only CRM cookies keep the website outside the session boundary; mutations check the exact origin. Production cookies are Secure, with Better Auth session expiry and HttpOnly/SameSite behavior.

## Metrics

Lead counts use leads created in the selected range, excluding archived/inaccessible rows. Conversion is Won leads in that created cohort divided by the cohort size. Revenue is received payments, not invoice totals. Outstanding is total minus paid across noncancelled invoices. Active clients and open follow-ups are current snapshots. CPC/CPL/ROAS use manually entered spend/clicks, spend/leads and revenue/spend; zero denominators show no metric. Small samples do not establish trends.

## Notifications and retention

Website intake atomically queues owner notifications and optional email. `pnpm jobs` claims email rows using SKIP LOCKED, retries with backoff five times and uses provider idempotency keys. `accepted` is not confirmed delivery. A scheduler must run the worker.

Archive is not erasure. Establish a reviewed retention period and purge/anonymize expired personal data through a relationally aware administration process. Financial/audit retention may differ. The worker deletes expired intake rate counters. Backups retain deleted information until their configured expiry. Advertising providers and verified delivery webhooks require further implementation.
