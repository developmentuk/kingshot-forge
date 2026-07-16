# Aegis Project Bootstrap

This is the canonical operational bootstrap for continuing Kingshot Forge in a new AI-assisted development session.

## New-session instruction

```text
Continue Kingshot Forge. Read docs/AEGIS.md from @GitHub developmentuk/kingshot-forge on main, inspect the active release branch and continue from its current head.
```

When database work is required:

```text
Use the connected Supabase tools for project hrvdhjscwitqpwjhnjkm. Begin read-only unless a write is explicitly required.
```

## Identity and collaboration

- Product: **Kingshot Forge**
- Engineering partner: **Aegis**
- Product owner: Clark
- Clark is not a full-time software developer; communication must be clear and sequential.
- Prefer direct repository commits or complete replacement files over fragile partial snippets.
- Challenge unnecessary complexity.
- Do not claim a capability is complete until it works end to end.
- Stop expansion when the active workflow is incomplete or unstable.

## Canonical sources

- Repository: `developmentuk/kingshot-forge`
- Production: `https://kingshot-forge.vercel.app/`
- Supabase project: `hrvdhjscwitqpwjhnjkm`
- Google Analytics measurement ID: `G-8L3HYETN51`
- **GitHub is the single canonical source for code and documentation.**
- **Supabase is the canonical source for persistent platform data.**
- Inspect the active branch and exact head commit at the start of every session.
- Do not use local snapshots or ZIP files unless Clark explicitly requests that workflow.
- Never expose secrets, service-role keys, access tokens or OAuth URLs in chat, documentation or commits.

## Stack

- Vite, React and TypeScript
- Vercel Functions
- Supabase
- GitHub
- Node.js and npm

## Product and architecture authority

Read these before changing product boundaries or shared platform behaviour:

- `docs/FORGE_BLUEPRINT.md`
- `docs/ADR/ADR-001-canonical-content.md`
- `governance/ARCHITECTURE_PRINCIPLES.md`
- `governance/CODING_STANDARDS.md`
- `governance/DEVELOPMENT_WORKFLOW.md`
- `governance/RELEASE_PROCESS.md`
- `governance/VERSIONING.md`

The Forge Blueprint defines the product vision, pillars, domains, capability matrix, Definition of Done, epic roadmap and release methodology. Protect it from accidental architectural drift.

## Delivery workflow: Epic → Sprint → Release

Forge develops one epic, one sprint and one release at a time.

A sprint is complete only when its full user journey works across contract, validation, persistence or published projection, server-side permissions, application service, administration, public consumption, failure states, tests and documentation.

Shared capabilities are implemented once and reused by domains. Domain-specific code may extend but must not bypass dataset, editorial, permission, publishing, history or audit services.

## Canonical content rule

> **Publish once. Consume everywhere.**

Canonical game and editorial content is authored through the editorial platform, published to the live projection and consumed by all approved product surfaces. Do not create parallel editable copies of canonical facts.

Personal player, alliance or kingdom state may reference canonical records but remains a separate ownership domain.

## Hero Domain reference implementation

The Hero Domain is the reference implementation for the Forge platform. It demonstrates canonical structured records, provenance and confidence, schema-driven editing, governed publication, immutable history, public consumption and player-owned progression that references canonical facts.

New domains should copy the proven platform pattern, not recreate the architecture.

## Documentation standards

- Keep operational guidance in `docs/AEGIS.md`.
- Keep product direction in `docs/FORGE_BLUEPRINT.md`.
- Record significant architectural decisions in `docs/ADR/`.
- Keep detailed implementation history in change-set, testing and release documents.
- Documentation must describe current reality, distinguish complete from deferred work and avoid unsupported claims.
- Update documentation in the same release as the behaviour it describes.

## Testing standards

Run before release-oriented commits:

```powershell
npm run check
```

Testing must also cover desktop and mobile layouts, published-only data consumption, server-side permissions, workflow transitions, Vercel Functions and production smoke testing where applicable.

Known warnings are non-blocking only when documented and unchanged in count or scope.

## Release standards

- Work on a focused branch.
- Make coherent commits with descriptive messages.
- Compare exact commit SHAs when validating Vercel deployments.
- Do not infer deployment freshness from bundle names.
- Do not merge to `main` before runtime verification.
- Do not mark deferred or partially tested work complete.
- Update Roadmap and Release Notes before release acceptance.

## Current phase

### Foundation Phase — Complete

The Foundation Phase established authentication, roles, Supabase persistence, the Data Engine, dataset contracts, structured editing, governed publishing, immutable history, queue foundations, audit architecture, Vercel-compatible editorial APIs and release governance.

### Release 0.6.0 — Epic 2: Hero Domain Complete

Active sprint:

```text
Sprint 8.2 — Hero Domain Completion
```

Current working branch:

```text
release/0.6.0-hero-domain
```

Sprint 8.1 established Hero Skills as a complete canonical vertical slice. Sprint 8.2 completes the public Hero experience around the published Hero catalogue and published Hero Skills.

## Sprint 8.2 guardrails

- Do not redesign the architecture.
- Reuse published datasets only.
- Do not read editorial drafts from public Hero surfaces.
- Derive recommendations only from published Hero facts and published skills; do not invent unpublished costs, values or breakpoints.
- Keep player-owned progression separate from canonical Hero guidance.
- Complete desktop and mobile states, validation and documentation before release acceptance.
- Runtime validation and deployment smoke testing remain required before merge to `main` and tagging `v0.6.0`.

## Updating this file

Update `docs/AEGIS.md` whenever canonical sources, the active epic/sprint/release, validation commands, architecture rules, release workflow or key integrations change. Keep it concise and operational.
