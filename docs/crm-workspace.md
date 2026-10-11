# CRM workspace

Run `pnpm dev` and open `http://localhost:3001/preview` to review the development design without Neon. The preview is read-only, displays illustrative records and is unavailable in production. The connected CRM remains at `http://localhost:3001/` and requires database configuration, migrations and an owner account as described in README.md.

The connected workspace includes dashboard charts and record drilldowns; lead management and a persisted sales pipeline; clients, campaign metrics, tasks and follow-ups; quotations, invoices, PDFs and payments; reports, employee management, notifications and settings.

Record searches and filters run on the server before pagination and preserve assigned-record permissions. Task status changes update immediately and restore the previous data on a failed save. Tasks and follow-ups offer a monthly calendar and daily agenda; month ranges follow the browser's local time zone. Boards and calendars display up to 100 records per page and include controls for additional records.

Owner settings include validated agency identity, billing details and brand color, website contact/social/WhatsApp configuration, service catalog, notification preferences, audit history and a view of enforced role access. Role permissions are fixed in source; this is not a custom permission editor.

Local verification covers calendar boundaries, agency validation and desktop/mobile preview flows. Live authentication, CRUD persistence, financial transactions and provider delivery still require configured Neon/provider accounts and separate test database credentials. See docs/status.md for remaining master-prompt scope.
