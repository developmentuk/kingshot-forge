# Kingshot Forge Project Constitution

`docs/AEGIS.md` is the authoritative operational constitution for Kingshot Forge. It governs how the platform is designed, implemented, validated and released. Supporting product direction remains in `docs/FORGE_BLUEPRINT.md`; binding architectural decisions remain in `docs/ADR/`; detailed engineering standards remain in `governance/`.

## Identity and canonical systems

- Product: **Kingshot Forge**
- Product owner: **Clark**
- Engineering partner: **Aegis**
- Repository: `developmentuk/kingshot-forge`
- Production: `https://kingshot-forge.vercel.app/`
- Supabase project: `hrvdhjscwitqpwjhnjkm`
- Google Analytics measurement ID: `G-8L3HYETN51`
- GitHub is the canonical source for code and documentation.
- Supabase is the canonical source for persistent platform data.
- Never expose secrets, service-role keys, access tokens or OAuth URLs.

## Forge Principles

1. **Players first.** Every capability must solve a clear player, alliance, kingdom or editorial need.
2. **One canonical source of truth.** Canonical facts are authored once, published once and consumed everywhere.
3. **Editorial before intelligence.** Recommendations, calculators and intelligence must depend on governed published data.
4. **Provenance is mandatory.** Every material fact must be traceable to evidence and an editorial decision.
5. **Verification before publication.** Unreviewed or unverified records must not become canonical public data.
6. **Evidence is first-class data.** Sources, supporting evidence, dates and confidence are structured records, not informal notes.
7. **Domains before features.** Shared domain capabilities are completed before disconnected feature expansion.
8. **Complete vertical slices.** A capability is delivered end to end, not as isolated UI, database or API scaffolding.
9. **History is immutable.** Editorial and audit history is append-only; rollback creates a new version.
10. **Server-side authority.** Permissions, publication, privileged mutations and audit records are enforced on the server.
11. **Mobile first.** Core administration and public workflows must work on supported mobile layouts.
12. **Shared design system.** New surfaces reuse established components, interaction patterns and responsive behaviour.
13. **Every fact is explainable.** Users and editors must be able to understand where a fact came from and how trustworthy it is.
14. **Simple before clever.** Challenge complexity that does not improve safety, maintainability or user value.
15. **Production is the proof.** Local success is insufficient until the exact commit is deployed and smoke-tested.

## Domain Architecture

Forge is organised into explicit domains rather than isolated pages.

### Domain 0 — Editorial Intelligence

Owns evidence acquisition, source staging, provenance, confidence, verification logic, completeness measurement and readiness reporting.

### Domain 1 — Editorial Platform

Owns canonical records, immutable versions, structured editing, validation, workflow, permissions, publishing, archive, restore, rollback, audit and dataset administration.

### Domain 2 — Player

Owns verified player identity, profiles, player-owned progression, preferences and public visibility. Player data may reference canonical records but must not duplicate canonical facts as an editable second source of truth.

### Domain 3 — Alliance

Owns alliances, membership, leadership, permissions, recruitment and shared operational resources.

### Domain 4 — Kingdom

Owns kingdoms, administration, state history, KvK relationships and community information.

### Domain 5 — Intelligence

Owns analysis, recommendations, comparisons and decision support powered exclusively by published canonical data.

### Domain 6 — Calculators

Owns calculators, planners and forecasts powered exclusively by published canonical datasets and explainable formulas.

### Dependency direction

```text
Public/Admin UI → Domain Service → Platform Service → Repository Contract → Persistence
```

Dependencies point inward toward stable contracts. Domain code may extend shared platform behaviour but must not bypass dataset, editorial, publishing, permission, history or audit services.

## Editorial Intelligence

Editorial Intelligence converts external observations and community knowledge into governed evidence suitable for editorial review.

Required capabilities:

- source registration and source identity;
- discovery and import timestamps;
- raw evidence preservation;
- normalised source facts;
- multiple evidence sources per canonical claim;
- source reliability and confidence assessment;
- conflict identification;
- editorial notes and supporting evidence;
- verification coverage and completeness metrics;
- no automatic publication from source staging.

Source-staging data is evidence, not canonical truth. It must pass normalisation, review and verification before publication.

## Verification Centre

The Verification Centre is the shared operational surface for reviewing evidence and deciding whether records are ready to publish.

Every editorial record must support:

- source name;
- source URL;
- discovery date;
- import date;
- verification status;
- confidence score and band;
- editorial notes;
- supporting evidence;
- reviewer and review date;
- lifecycle and audit history.

Canonical lifecycle:

```text
Discovered → Imported → Normalised → Reviewed → Verified → Published → Archived
```

Lifecycle transitions are explicit named operations. Incidental field edits must not silently change workflow state.

## Canonical Data Model

Canonical content describes Kingshot facts or Forge editorial judgement. Personal and operational data belongs to players, alliances or kingdoms.

Canonical records require:

- stable dataset ID and record key;
- schema-backed values;
- immutable versions;
- a mutable record head using optimistic concurrency;
- provenance and confidence metadata;
- validation results;
- explicit workflow status;
- append-only audit events;
- an explicit published projection.

> **Publish once. Consume everywhere.**

A consumer must not maintain an independent editable copy of canonical facts. Personal data may reference canonical records by stable keys. Immutable snapshots are permitted only where audit or historical display requires them.

## Editorial Workflow

The standard workflow is:

1. Discover evidence.
2. Import and preserve the raw source payload.
3. Normalise source facts against the dataset contract.
4. Create or update a draft canonical record.
5. Validate the record and provenance.
6. Submit for review.
7. Review evidence, conflicts and confidence.
8. Verify or return for changes.
9. Approve publication through server-side permissions.
10. Publish through the shared publishing platform.
11. Consume the published projection from approved services, adapters or APIs.
12. Archive, restore or rollback through new immutable versions.

Drafts and staged evidence must never be consumed by public product surfaces.

## Evidence and Provenance

Evidence is stored independently from canonical editorial conclusions so that multiple sources can support or contradict the same claim.

Minimum provenance requirements:

- source identity and URL;
- retrieval or discovery date;
- import run and imported date where applicable;
- raw or preserved supporting evidence;
- normalisation method;
- claim or record association;
- reviewer notes;
- verification decision;
- confidence rationale.

Conflicting evidence must remain visible. Editors resolve conflicts through an auditable decision rather than deleting inconvenient source material.

## Confidence Model

Confidence expresses the strength of evidence for a fact; it is not a substitute for workflow status.

Standard bands:

- **95–100 — Verified:** multiple independent sources agree and material values have direct in-game or authoritative confirmation.
- **85–94 — Confirmed:** two or more credible sources agree, without complete independent in-game confirmation.
- **70–84 — Likely:** one credible source or partially corroborated evidence is internally consistent.
- **50–69 — Estimated:** sources conflict, definitions differ or the best-supported value remains uncertain.
- **0–49 — Tentative:** weak, incomplete, old or single-source evidence requiring further investigation.

Confidence must include a rationale and may be assessed at dataset, record and material-field level. A high confidence score does not bypass review or verification.

## Design System

All Forge surfaces must reuse the shared design system.

Required standards:

- consistent page shells, navigation, cards, forms, tables, badges, dialogs and feedback states;
- accessible labels, focus behaviour, keyboard use and semantic structure;
- responsive layouts that do not depend on desktop-only tables;
- readable status and confidence language that does not rely on colour alone;
- loading, empty, unavailable, validation-error and permission-denied states;
- no placeholder pages in production-ready domains;
- no domain-specific redesign where shared components already solve the need.

## Quality Gates

A milestone is complete only when all applicable gates pass:

- the project builds successfully;
- automated checks pass without new blocking warnings;
- the feature works locally;
- the exact commit deploys successfully to Vercel;
- the deployed runtime is smoke-tested;
- desktop and mobile workflows are validated;
- canonical datasets and published projections are used correctly;
- server-side permissions are enforced;
- validation and failure states work;
- migrations and persistent data paths are verified;
- documentation describes current reality;
- Forge Principles are met.

Known warnings are non-blocking only when documented and unchanged in count and scope.

## Definition of Done

A capability is done only when:

- its intended user outcome works end to end;
- architecture and domain boundaries are respected;
- authentication and authorisation are enforced on the server;
- data contracts, validation, provenance and confidence are complete;
- persistence and migrations are verified where required;
- immutable history and audit events are present for material mutations;
- publication is explicit, observable and recoverable;
- public consumers read published-only data;
- desktop and mobile states are complete;
- local, Vercel and production or preview validation pass;
- documentation, Roadmap and Release Notes are updated;
- the work is committed to GitHub with a coherent message.

A UI, table, endpoint or happy path alone is never sufficient evidence of completion.

## Sprint Methodology

Forge uses an **Epic → Sprint → Milestone → Release** model.

1. One active epic, sprint and release are developed at a time.
2. A sprint begins with a defined objective, scope, acceptance criteria and affected contracts.
3. Work proceeds milestone-first; one milestone is completed before the next begins.
4. Each milestone reuses existing platform capabilities before introducing new abstractions.
5. Each milestone ends with implementation review, checks, documentation and a logical Git commit.
6. The release ends with end-to-end validation, exact-commit deployment, smoke testing, Roadmap and Release Notes updates.
7. Release candidates remain on a focused branch until accepted.
8. `main` represents the accepted production line.
9. Tags identify completed releases using semantic versioning.
10. Deferred work is documented explicitly and never counted as complete.
11. Readiness percentages are calculated from implemented and validated capabilities, never estimates.

## Authoritative supporting documents

Read these before changing product boundaries or shared platform behaviour:

- `docs/FORGE_BLUEPRINT.md`
- `docs/ADR/ADR-001-canonical-content.md`
- `governance/ARCHITECTURE_PRINCIPLES.md`
- `governance/CODING_STANDARDS.md`
- `governance/DEVELOPMENT_WORKFLOW.md`
- `governance/RELEASE_PROCESS.md`
- `governance/VERSIONING.md`

Changes to product pillars, domain boundaries, canonical publishing, security principles, sprint methodology or the Definition of Done require an ADR and corresponding constitution and Blueprint updates.

## Player Identity milestone — release 0.7.2

The Player Identity vertical slice is now active on the player-facing release branch. `PlayerIdentityContext` is the browser source of truth for the authenticated user's primary `player_accounts` row. It reads through the publishable Supabase client, exposes loading, unlinked and retryable failure states, and refreshes after the `kingshot-player-updated` event. Account mutations remain in the existing linked-player workflow; no second identity store or schema was introduced.

My Forge now presents this identity as a Player Headquarters. The heading uses the linked player's real name, kingdom, optional profile alliance, verification status, visibility and a safe avatar fallback. Its priority action is derived from authentication, identity loading/error state, profile completion and visibility. Existing saved name and artwork functionality remains local to the Forge Library.

Key player routes:

- `/my-forge` — Player Headquarters and saved Forge library.
- `/my-forge/player-identity` — private Player Passport, linked-player verification and visibility summary.
- `/my-forge/profile` — Edit Passport for player-controlled profile fields and visibility controls.
- `/my-forge/transfer-profile` — owned Transfer Profile editor (the existing `/transfer-profile` URL remains available).
- `/my-forge/heroes` — owned Hero Showcase editor.
- `/my-forge/progression` — owned progression snapshots.
- `/player/:forgeId` and `/players/:forgeId` — the same public profile projection, with public profile and account visibility enforced.

Player planning flow:

- `PlayerIdentityContext` supplies the authenticated user's primary `player_accounts` row to My Forge, progression, Hero Showcase and Transfer Profile; feature pages do not perform a second primary-account lookup.
- `/my-forge/progression` records immutable `player_progression_snapshots` owned by that linked account. A first snapshot makes progression complete; each snapshot keeps its own public/private flag and notes remain owner-visible through the private read.
- Progression ownership is explicit: the linked API owns player name, Player ID, Kingdom, Town Center, avatar and API refresh time; the player owns current/highest power, Truegold, VIP, Infantry/Cavalry/Archers tiers, Governor Gear score, Governor Charm score, notes and visibility. Town Center is copied into a snapshot only as the existing historical context column and is never editable in the form.
- Town Center, Truegold, troop tiers and VIP use the canonical terminology and published Data Engine output. The source dataset's `lancer` and `marksman` identifiers are compatibility details mapped to player-facing Cavalry and Archers labels; stored columns remain unchanged. Selector values are derived from normalised published records and revalidated before insert. Gear and Charm remain controlled non-negative numeric scores because their published datasets expose per-step/per-level values, not a reliable whole-governor score.
- Forge Progress is the four-section required calculation: linked player, profile record, first progression snapshot and six-slot Hero Showcase. Each section contributes 25%, and the first incomplete section supplies the next action. Public Presence and Transfer Ready are presentation-only optional badges and never affect the required percentage.
- The My Forge Player Headquarters presents a status summary, one next action, core milestones and earned/locked badges. Badges are derived from existing reads and require no new persistence or gamification service.
- Player Passport is the full private account home at the compatibility route `/my-forge/player-identity`. It owns the compact identity record, verification/visibility context, completion detail, badges and links to Edit Passport, progression, showcase and optional Transfer Profile. My Forge is only the lightweight landing summary; public profiles remain separate public projections.
- The final player page structure is My Forge → Player Passport → Edit Passport, with Personal Progression and optional Transfer Profile as separate tools. API-owned identity values are shown read-only in compact context banners; Edit Passport contains only player-controlled fields.
- Player field ownership is explicit in the UI: PlayerIdentityContext owns API player name, ID, avatar, Kingdom, Town Center, link/verification state and refresh time; Edit Passport owns alliance, VIP, language, play style, transfer status, about text and visibility; Personal Progression owns saved power, Truegold, troop tiers, Gear, Charm, notes and snapshot visibility; Hero Showcase owns selected heroes and its six-slot completion; Transfer Profile owns only optional transfer readiness and preferences.
- My Forge is intentionally lightweight: it shows one compact status summary, one next action, visual tool launchers and up to three earned badge previews. Player Passport owns the full visual completion view, four required milestone tiles, image-led optional badge gallery, compact domain summaries and player actions. Edit Passport and Personal Progression use compact linked-player context and do not repeat the full Passport hero.
- Required milestones are presentation-derived from real saved data: Identity Linked, Passport Created, Hero Showcase and Progress Tracked. Optional badges are presentation-only and use existing reads: Identity Linked, Passport Builder, Hero Curator, Progress Tracker, Public Presence and Transfer Ready. Badge emblems are lightweight inline SVG treatments; no remote or licensed artwork and no new persistence are introduced.
- Transfer Profile remains private unless its own `status` is `looking` and `is_public` is enabled. Private notes, Discord details and contact preferences are never used by public profile reads.
- Profile, progression, Hero Showcase and Transfer Profile saves emit `kingshot-player-updated`, allowing dependent My Forge planning state to refresh.

Canonical player routes are `/my-forge`, `/my-forge/player-identity`, `/my-forge/profile`, `/my-forge/progression` (Personal Progression), `/my-forge/transfer-profile`, `/my-forge/heroes`, `/transfer-profile`, `/player/:forgeId` and `/player/:forgeId/progression` (with `/players/:forgeId` retained as the public profile alias). Local setup requires copying `.env.example` to `.env.local` and filling the two publishable Supabase variables; no service-role key belongs in the browser.

Public profile reads select only public profile fields and non-sensitive player display fields. They require both `player_profiles.is_public` and `player_accounts.is_public`; `user_id`, link metadata and support data are not selected for public presentation. Browser code uses the publishable Supabase key only; service-role credentials remain server-only.

Validation completed for this milestone: Player Identity structural validation, focused and vertical-slice tests, TypeScript production build and lint, targeted route checks, and Data Engine record-shape checks for troops, Truegold and VIP. Legacy progression values are preserved in history and rendered with a review label when they are no longer in the published selector options; no destructive migration is performed. Lint retains the repository's existing seven warnings in unrelated/shared files. Live signed-in route and RLS verification still require a deployment or authenticated browser session with access to the configured Supabase project.

### Release 0.7.5 Player ID verification trust model

For Auto Redeem, Forge verifies that a Player ID is valid through the Kingshot player service and links it to the authenticated Forge account. Forge does not request a game password or claim official account authentication. The trusted server link/revalidation route owns the canonical player fields, `verification_status`, `verification_method` and `verified_at`; browser roles cannot mutate verification columns or verification events. A legacy `linked` row remains ineligible until that same server path revalidates it. Consent and the provider-health pause are independent gates.

## Active Release

### Release 0.7.5 — Auto Redeem

Working branch:

```text
release/0.7.5-auto-redeem
```

Release objective: complete the consented, verified-player Auto Redeem vertical slice on the existing Forge architecture, with server-only provider transport, sequential processing, safe outcomes, private history and an admin kill switch while preserving manual redemption.

Milestone order:

1. scoped text-art schema and RLS correction;
2. player submission and exact-text validation;
3. status and moderation workflow;
4. approved-only gallery;
5. accessibility, responsive states and focused validation;
6. documentation and release preparation.

Release constraints:

- reuse existing domain, permission and design-system capabilities;
- keep all database and storage changes limited to Community Art Studio;
- preserve published-data, privacy and server-side permission boundaries;
- apply only the approved Community Art Studio migration and storage policies;
- use the connected Supabase project for scoped verification;
- finish and validate one UX slice before beginning the next;
- do not redesign the architecture or create parallel sources of truth.
- keep creator attribution public-safe and expose reactions only as published-art aggregates;
- keep the moderator queue role-gated and never expose private notes or submitter identity in gallery responses.

This milestone is complete only when the shared UX polish is validated, historical releases remain immutable, debug output is removed, AEGIS reflects the active branch and the repository is ready for Clark's final production validation.

### Sprint 8.0C — Workspace UX and Forge Contributors

Sprint 8.0C corrects the shared internal workspace visual contract: dark
surfaces, compact operational headings, responsive workspace switching,
readable sidebar status treatment and honest planned destinations. The public
Forge Contributor catalogue is typed in `src/data/contributorRoles.ts` and is
available through `/join` and `/join/:roleSlug`. All roles are explicitly
unpaid, voluntary hobby/community roles.

The secure application form, application persistence and forced RLS,
Operations review centre, audit events and onboarding foundation are now
implemented through the recruitment service and protected APIs. The public
catalogue collects no application information. Acceptance remains separate
from canonical platform-role assignment. Local build/lint and recruitment
architecture checks pass; authenticated browser and final Supabase security
validation remain release gates.

### Auto Redeem visibility contract

The Auto Redeem interaction remains rendered for authenticated users while context is loading, unavailable, environment-disabled, paused or circuit-open. The action is disabled with a safe explanation and manual official redemption remains available. This presentation rule does not weaken server enforcement of configuration, provider health, verified linkage, consent or active-code eligibility.

### Release 0.7.0 Sprint 9.2 — Forge Render Engine Calibration Lab validation

Working branch: `feature/kingshot-art-renderer`.

The corrective validation sprint is implemented locally: calibration values now reach per-glyph styles, family relevance and unavailable benchmark states are explicit, the workspace is compact and readable, and the admin Calibration Lab remains available at `/admin/render-engine`. No persistence or Supabase write was added. The branch is ready for another human visual validation pass.

Validation commands: `npm run test:render-engine`, `npm run build`, `npm run lint`, and the existing `npm run check` suite. The benchmark registry deliberately marks missing source records as metadata-only and records no image-comparison percentages. Calibration and reference screenshots remain browser-local. The future Forge Screenshot Intelligence Engine is documented but not implemented.

Handover: preserve the existing Art Studio renderer adapter and copied artwork text; verify desktop and mobile previews, each device profile, local profile save/restore, local screenshot upload, overlay opacity and permission denial manually before accepting the milestone. Persistence is browser-local only; do not merge to `main`, deploy or add Supabase persistence.

Release 0.7.2 issue verification: repository history identifies the private `/my-forge/player-identity` route mismatch, fixed by `ff14418` (`fix(player-identity): restore private identity route`). That commit is already an ancestor of `feature/kingshot-art-renderer`, and the current route uses the corrected absolute path. No duplicate fix was added to Sprint 9.3; `scripts/test-render-engine.mjs` retains a regression assertion for the route shape.

## Session bootstrap

At the start of every development session:

1. Read this constitution from the requested branch.
2. Inspect the active branch and exact head commit.
3. Read any supporting architecture documents affected by the sprint.
4. Use the connected Supabase project read-only until a write is explicitly required by the milestone.
5. Continue from the current head; do not use local ZIP snapshots unless Clark explicitly requests that workflow.
