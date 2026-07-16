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

### Epic

An epic completes a product domain or major platform outcome. Do not begin another epic while the active epic contains unfinished release work unless the deferral is explicit and documented.

### Sprint

A sprint delivers one complete vertical slice with a defined user outcome and acceptance criteria. It must use existing shared platform capabilities before introducing new abstractions.

### Release

A release packages validated sprint outcomes. Every release ends with:

1. automated validation;
2. database verification where applicable;
3. end-to-end desktop and mobile testing;
4. documentation and ADR updates where applicable;
5. Roadmap and Release Notes updates;
6. logical GitHub commits;
7. Vercel deployment of the exact commit;
8. deployed smoke testing;
9. merge to `main` and semantic version tag when accepted.

## Complete vertical slice methodology

A slice is complete only when the user journey works across every required layer:

1. domain contract and canonical key;
2. validation and error behaviour;
3. persistence or published data projection;
4. server-side authentication and authorisation;
5. application service and API;
6. administrative workflow;
7. public or product consumer;
8. loading, empty, failure and recovery states;
9. automated and runtime testing;
10. operational and product documentation.

Do not build disconnected UI, database or service layers and describe them as a feature.

## Shared platform capability principles

- Shared capabilities are implemented once and reused by domains.
- Domain-specific code may extend but must not bypass dataset, editorial, permission, publishing, history or audit services.
- Keep client and server responsibilities separate.
- Mutation permissions are enforced server-side; hidden controls are not security.
- Supabase service-role access remains server-side only.
- Editorial versions are immutable.
- Record heads use optimistic concurrency.
- Every editorial mutation appends an audit event.
- Unsaved editor changes survive non-destructive refreshes and tab-focus events.
- Concurrency conflicts preserve the user's working copy and provide actionable recovery.
- Validate Vercel server-function compilation, not only the Vite client build.

## Canonical content rule

> **Publish once. Consume everywhere.**

Canonical game and editorial content is authored through the editorial platform, published to the live projection and consumed by all approved product surfaces. Do not create parallel editable copies of canonical facts.

Personal player, alliance or kingdom state may reference canonical records but remains a separate ownership domain.

## Hero Domain reference implementation

The Hero Domain is the reference implementation for the Forge platform. It must demonstrate:

- canonical structured records;
- provenance and confidence;
- schema-driven editing;
- draft, review, approval and publication;
- immutable history, comparison and rollback;
- public consumption of the published record;
- player-owned progression data that references rather than duplicates canonical facts.

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

This currently includes PM2B structural validation, lint and production build.

Testing must also cover, where applicable:

- unit and contract validation;
- server-side permission matrices;
- database constraints, indexes and RLS;
- optimistic concurrency;
- workflow transitions;
- queue, schedule, failure, retry and cancellation paths;
- desktop and mobile layouts;
- deployed Vercel Functions;
- authenticated end-to-end scenarios;
- production smoke testing.

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

The Foundation Phase established:

- authentication and Forge roles;
- Supabase persistence;
- Data Engine and dataset contracts;
- reusable dataset adapters and validation;
- structured Record Editor;
- draft, review, approval and publication workflow;
- immutable history, comparison, archive, restore and rollback;
- publication queue and scheduled publishing foundations;
- server-side permission and audit architecture;
- Vercel-compatible editorial APIs;
- governance, release and testing documentation;
- the Heroes editorial path as the first platform reference.

Known Foundation follow-ups that are not blockers for Hero Domain development must remain explicit in sprint planning rather than being silently forgotten.

### Release 0.6.0 — Epic 2: Hero Domain Complete

Active sprint:

```text
Sprint 8.1 — Hero Skills
```

Current working branch at kick-off:

```text
feature/pm2b-editorial-workflow
```

Inspect its live head before every change. The documentation close-out must be committed before Sprint 8.1 implementation begins.

## Sprint 8.1 guardrails

- Do not redesign the architecture.
- Use the existing dataset, editorial, publishing and permission platform.
- Treat Hero Skills as a complete canonical vertical slice.
- Define the skill contract and stable keys before UI work.
- Publish through the existing workflow.
- Ensure administrative and public Hero consumers use the published canonical data.
- Keep player-owned progression separate from canonical skill definitions.
- Finish testing and documentation before starting the next Hero sprint.

## Updating this file

Update `docs/AEGIS.md` whenever canonical sources, the active epic/sprint/release, validation commands, architecture rules, release workflow or key integrations change. Keep it concise and operational.
