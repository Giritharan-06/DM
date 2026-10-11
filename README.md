# ZYROZ platform

Two Next.js apps sharing PostgreSQL, authentication, validation and UI packages. Website: port 3000. CRM: port 3001. No customer records are fabricated or stored in localStorage.

## Setup

1. Use Node.js 22+ and pnpm 11.19.0. Run `pnpm install --frozen-lockfile`.
2. Copy `.env.example` to the root `.env`. Configure a Neon development database, a random Better Auth secret of at least 32 characters, and the local URLs.
3. Run `pnpm db:migrate`.
4. Securely inject `PROVISION_PASSWORD` into your shell environment, then run `pnpm owner:create`. The script prompts for account name/email/role and hashes the password with Better Auth. It provisions both owners and employees. Remove the temporary password variable afterward. Do not put passwords in command-line arguments or commits. Public signup remains disabled.
5. Run `pnpm dev`. Open [website](http://localhost:3000) and [CRM](http://localhost:3001).

Without provider configuration the website remains browsable and CRM displays setup instructions. Intake returns an error if persistence is unavailable. Production intake requires Turnstile configuration.

## Verification

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

Database integration tests require a separate disposable `TEST_DATABASE_URL`. They refuse a database identical to `DATABASE_URL` and are skipped when it is absent. No live database/provider/deployment verification is claimed without configuration.

## Features

Responsive website with a premium ivory/navy/coral theme, transparent PNG artwork with optimized WebP delivery, layered parallax, a desktop GSAP ScrollTrigger chapter sequence, reduced-motion alternatives, business-goal recommendations, mobile navigation, social profiles, WhatsApp/contact options, process cards, FAQs, industry selector, demo concepts, validated consultation intake, SEO and draft legal pages. CRM Settings controls public contact and social links. The CRM retains secure sessions and role/assignment controls, database-derived dashboard, lead search/filter/pagination/CSV/bulk actions, detail editing, audit history, optimistic pipeline, and idempotent conversion. See docs/premium-theme.md for artwork prompts and behavior.

Operations include clients/contacts, campaigns/manual metrics, tasks/comments/status/recurrence, follow-ups, team roles, notifications and basic settings. Finance includes quotations/invoices/items, paise arithmetic, configurable tax, sequential numbering, payment references and audit, and PDF exports. R2 and Resend integration boundaries require account configuration. Advertising adapters and the future client portal are explicitly inactive.

See [architecture](docs/architecture.md), [deployment](docs/deployment.md), [testing](docs/testing.md), and [implementation status](docs/status.md). This repository is not an externally verified production deployment; the status document records remaining scope honestly.
