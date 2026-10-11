# Deployment: Vercel and Neon

No accounts or domains have been provisioned. Target domains are placeholders.

1. Create a Neon production project and separate development/test branches. Use SSL connection strings and choose regions/retention according to your requirements. Do not disable certificate verification.
2. Create two Vercel projects using a plan suitable for commercial use. Root directories: `apps/website` and `apps/crm`. Enable workspace access outside the root, use the Next.js preset and install with `pnpm install --frozen-lockfile`. Build the selected app from the monorepo root using `pnpm --filter @zyroz/website build` or `pnpm --filter @zyroz/crm build`.
3. Configure provider secrets in hosting environment variables, never client variables. Both projects need `DATABASE_URL`; CRM needs `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`. Both need the public app URLs. Website additionally needs Turnstile site/secret keys and optional owner email recipient/business contacts. Configure Resend/R2 variables where those integrations run. See `.env.example`.
4. Review migrations, take a restore point, and run `pnpm db:migrate` once from a trusted environment before dependent app code accepts traffic. Do not casually run schema push against production. Provision owner/employees with protected temporary-password injection.
5. Confirm domain ownership, add each domain in its respective Vercel project, and copy the exact DNS values Vercel gives you. Apex and subdomain record values are provider-specific; do not invent them. Wait for HTTPS validation.
6. Set canonical origins: `BETTER_AUTH_URL=https://crm.zyroz.com`, `NEXT_PUBLIC_CRM_URL=https://crm.zyroz.com`, `NEXT_PUBLIC_WEBSITE_URL=https://zyroz.com`. Use separate configured URLs for previews. CRM cookies are host-only, with no public cross-origin auth sharing.
7. Restrict Turnstile to the actual hostname. Intake refuses production submissions without it. Keep origins behind trusted proxies that overwrite client-IP headers; Vercel uses its provided trusted header.
8. Verify your Resend sending domain with its supplied SPF/DKIM/DMARC records. Set `EMAIL_FROM`. Schedule `pnpm jobs` in a secured Node job runner. The worker is not an automatically configured Vercel Cron endpoint. Delivery webhooks are future work; acceptance is not delivery.
9. Configure a private R2 bucket/restricted credentials and exact CRM-origin CORS for PUT/GET/HEAD plus Content-Type. Test upload confirmation, signed URL expiry and denied unassigned downloads.
10. Configure genuine agency contact/legal information. Review draft legal pages, consent, financial issuance requirements and retention. Run isolated database and full authenticated acceptance tests before enabling traffic.

## Backup and recovery

Select Neon point-in-time history suitable for your plan; keep encrypted exports in independently controlled storage. Restrict backup credentials and practice restoration to a new branch. Reconcile financial references and email idempotency after recovery. Configure R2 retention/backups separately. Roll back application code only when schema compatibility is preserved; never blindly reverse financial migrations. Rotate compromised secrets and revoke sessions.
