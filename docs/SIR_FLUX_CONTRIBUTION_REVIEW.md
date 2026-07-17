# Sir Flux Contribution Review

## Attribution

Kingshot Forge may reuse and expand concepts, workflows and algorithms contributed by **Sir Flux** from the donated `Kingshot-kvk-planner` project.

Public attribution standard:

> Original concepts and engineering inspiration for selected Forge Operations capabilities by Sir Flux. Adapted, expanded and integrated natively into Kingshot Forge.

The donated application is not merged as a standalone product. Forge reimplements approved capabilities within its existing Vite, React, TypeScript, Vercel Functions, Supabase, authentication, permission, editorial and design-system architecture.

## Review outcome

The contribution contains valuable working concepts across three future Forge workstreams:

1. **Gift Centre** — gift-code discovery, validation, redemption, per-player claim history and operational monitoring.
2. **KvK Operations** — preparation campaigns, resource and speed-up pledges, scoring projections, battle attendance, buff scheduling and coordinated rally timing.
3. **Alliance Operations** — alliance roster administration, proxy/imported player identities, member history and leadership views.

The contribution must be treated as a design and algorithm source rather than a repository dependency. Its Next.js, Better Auth, Drizzle ORM and standalone PostgreSQL architecture would duplicate Forge platform capabilities.

## Reusable concepts

### Gift Centre — highest priority

- central gift-code registry;
- code discovery and verification state;
- linked-player redemption attempts;
- success and failure reason normalisation;
- redemption history;
- administrative monitoring;
- future notifications and safe retries.

### KvK Operations

- campaign definitions and preparation days;
- resource and speed-up pledges;
- configurable scoring rules;
- alliance and kingdom projected totals;
- royal buff scheduling;
- battle-segment availability;
- rally launch sequencing and participant travel times.

### Alliance Operations

- leadership-scoped roster management;
- member availability and contribution summaries;
- linked or proxy player records;
- alliance transfer and profile-history timelines;
- joining-hero skill visibility for authorised leaders.

## Native integration rules

- Reuse Forge authentication, roles and permissions.
- Reuse `player_accounts`, `player_profiles`, alliances, kingdoms and memberships.
- Reuse canonical published Hero, event and scoring datasets.
- Store secrets only in server-side environment configuration.
- Never expose signing material or redemption credentials to the browser.
- Require explicit player consent before automated redemption.
- Apply rate limits, bounded retries and idempotency.
- Record every redemption attempt and outcome for audit and support.
- Keep operational player data separate from canonical editorial data.
- Use the shared Forge design system and mobile-first interaction patterns.
- Add Sir Flux attribution to contributor-facing product documentation and the future About page.

## Security findings

The donated source includes a hard-coded endpoint signing secret. That value must not be copied into Forge source code, documentation, commits or browser bundles. Any endpoint integration must be implemented behind a Vercel Function using environment configuration and reviewed before production use.

The standalone proxy-player and authentication implementation must not be imported. Forge already owns player identity, role enforcement and Supabase access control.

## Delivery order

1. Complete Release 0.7.1 Editorial Platform Completion.
2. Resume and complete the Player Domain identity and linked-account foundations.
3. Deliver **Gift Centre** as the first Operations vertical slice.
4. Extend Alliance and Kingdom identity to support operational scoping.
5. Deliver KvK preparation, battle attendance and buff scheduling.
6. Deliver coordinated rally operations and later intelligence features.

Gift-code automation is intentionally prioritised ahead of broader KvK Operations because it provides immediate player value and can be delivered as a smaller, independently governed vertical slice.
