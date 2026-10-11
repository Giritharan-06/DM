# Status and limits

The public website and CRM build locally. CRM records use PostgreSQL rather than browser storage. No customer sample data is seeded. Neon connection, migrations and initialization of the service/source/permission catalogs were verified on 11 October 2026; all 39 public tables are present. The owner account was provisioned, and sign-in plus authenticated dashboard access were verified. Broader authenticated workflows, storage and email delivery verification remain pending.

Implemented source includes scoped lead filters, pipeline updates, CSV exports and bulk actions; lead conversion; clients, contacts, service linking and contracts; campaign edits and manual metrics; assigned tasks, comments, recurrence and employee workload counts; follow-up scheduling; quotation approval and invoice conversion; invoice PDFs and payment recording; nine report datasets; employee provisioning; catalog settings, audit records and notification preferences/reminders.

Remaining scope and verification:

- Neon migrations are applied to the configured DATABASE_URL. Integration tests still require a separate disposable TEST_DATABASE_URL. Production domains and session cookies require deployment verification.
- R2 uploads, Turnstile checks and Resend email delivery require configured providers. Email acceptance is not confirmed delivery; delivery webhooks remain inactive.
- Tasks and follow-ups now have monthly calendar grids with daily agendas and keyboard navigation. Recurrence exceptions, invitation/password recovery and MFA need expansion.
- Pipeline customization, configurable role restrictions and security settings editors remain incomplete. Credit notes/refunds need a dedicated workflow.
- Retention is a current cohort snapshot rather than historical retention. Advertising provider adapters and the optional client portal remain future integrations; no advertising data is simulated.
- Dashboard now includes lead growth, sources, funnel, recorded revenue, campaign enquiries, tasks and notifications. Agency profile changes update owner workspace branding and billing documents. Public contact/social links require genuine configuration; privacy and terms are labeled drafts.
- Website imagery uses generated 3D illustrations guided by the supplied reference images. Invoice/legal text requires agency review before production use.

Do not describe the full master prompt as complete or this service as production verified. Implemented source, automated local checks and live provider verification are separate milestones.

CRM development update: scoped module searches, status/date/priority/assignment filters, counted pagination, named record relationships, task-board updates with rollback, validated agency profile settings and a server-enforced role access matrix are implemented. `/preview` is a development-only, read-only design preview with clearly labelled illustrative records. It does not bypass authentication for real records or seed customer data. Production returns 404 for this preview.
