# Kingshot Forge Project Constitution

## DATA-001 operational record — 20 July 2026

The Buildings workbook preflight passed with 10 catalog rows, 587 progression rows, zero blocking errors, zero duplicates, zero orphans and eight unresolved prerequisite warnings. The source fingerprint is `840d70bc9173ef12d454fe72fbe517FE49124B250562C8FBEF1B68C0F2DD1980`. The workbook remains unmodified; no direct publication occurred. Staging requires an authenticated Forge actor and owner review, and publication remains explicitly gated.

`docs/AEGIS.md` is the authoritative operational constitution for Kingshot Forge. It governs how the platform is designed, implemented, validated and released. Supporting product direction remains in `docs/FORGE_BLUEPRINT.md`; binding architectural decisions remain in `docs/ADR/`; detailed engineering standards remain in `governance/`.

## Identity and canonical systems

- Product: **Kingshot Forge**
- Product owner: **Clark**
- Engineering partner: **Aegis**
- Repository: `developmentuk/kingshot-forge`
- Production: `https://ksforge.app/`
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

### Stable Forge entity identity — Sprint 1.1.1

Forge IDs are namespace-qualified, immutable identifiers in the form
`namespace.local-key`. The server-authoritative registry and resolver fail
closed for invalid IDs, unknown namespaces, disabled types and unpublished
records. Search may carry a Forge ID additively; existing projection IDs and
routes remain compatibility contracts. The review-gated registry migration is
not applied, and this sprint does not complete Media Library, tags, authored
relationships or Creator integrations.

Sprint 1.1.1B applied the registry and route-policy migrations to the connected
Supabase project after preflight. Live counts and RLS/grants were verified;
canonical content and Buildings publication version 1 were unchanged.

ART-001 adds a shared, profile-driven Kingshot text analyzer and preserves
Community Art raw source separately from normalized, rendered-preview and
approved copy payloads. Public gallery and clipboard behavior consume only the
approved payload; moderation repair history is append-only and auditable. ART-002
promotes this to the shared Render Engine Core with immutable binary artifacts,
stage metrics, reversible transformation audits, explicit engine capabilities,
protected raw source, exact approved-payload clipboard writes and responsive
calibration panes. ART-002B applied the source-boundary migration with FORCE RLS
and live grant verification; authenticated role sessions remain an owner
acceptance gate. ART-002C aligned Render Engine navigation, route, API and RLS
checks around explicit capabilities and repaired the owner false-denial caused
by the missing live capability backfill.

ART-002G records the community-art submission recovery boundary: authenticated
player capability is checked server-side; raw UTF-8 source metadata is computed
at the database boundary; submission, pending status and audit are atomic; and
idempotent request IDs prevent duplicate rows. Submission is not approval and
must not create a public or approved payload.

ART-002H records exact-source semantics: file uploads preserve bytes and source
metadata; paste/manual entry records browser-received text without an external
file-equality claim; raw bytes remain moderator-only evidence. ART-003 stays
outside the release candidate while visual calibration remains materially
inaccurate.

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

## Forge Domain Model v1.0 — architecture baseline

`docs/architecture/FORGE-DOMAIN-MODEL.md` is the canonical shared domain model
for future Forge domains. It is an architecture/documentation decision, not an
implementation claim. It establishes namespace-qualified stable Forge IDs, a
fail-closed entity-type registry, semantic progression rows, variable Truegold
stages, governed tags, authored-versus-derived relationships, a future
immutable-version Media Library, and published-only consumer resolution.

The model reuses the current editorial engine (`editorial_record_heads`,
`editorial_record_versions`, `editorial_audit_events`, `publication_queue`) and
current published Search projections. `search_relationship_projections`
remains derived and rebuildable, not an authored relationship store. Buildings
remains the compatibility baseline through `buildings` and
`building_progression`, including explicit phase/tier/stage fields, base-state
rows and publication history.

The Entity Engine, Media Library, shared tag store and authored Relationship
CMS remain future capabilities. They must not be marked complete or introduced
by documentation alone. The first safe implementation sprint is the stable
identity foundation, gated on HOTFIX-002 protected-preview acceptance and owner
approval of the model.

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

The Version 1.0 final release-gate record is maintained at
`docs/releases/V1-FINAL-RELEASE-GATE.md`. Its recommendation remains blocking
until approved cross-user/role sessions, responsive viewport evidence and
owner operational evidence are complete.

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

## RC3 Version 1.0 release gate — 19 July 2026

RC3 validated and deployed the exact candidate from
`recovery/0.9.0-rc3-feature-reconciliation` at
`7cfaad7e75a2078fa04efae6edefb450610c460e` to protected preview deployment
`dpl_Gtg27ukWziY34K3F7yMiaZArgbnv`. Local checks and the Vercel build pass.
Version 1.0 remains **Not Ready** because owner-authenticated preview,
two-user isolation, authenticated editorial/runtime/responsive acceptance and
production smoke are not evidenced. Live Supabase advisor findings also
require owner review before release. The complete gate and promotion plan are
in [`docs/releases/RC3-V1-RELEASE-GATE.md`](releases/RC3-V1-RELEASE-GATE.md).

## RC4 security hardening — 19 July 2026

RC4 reviewed the connected Supabase advisors, SECURITY DEFINER functions, RLS,
RPC grants, authentication integration, API boundaries, operations and
performance. The checked-in hardening migration
`20260719210000_rc4_security_definer_hardening.sql` locks the feedback trigger
search path and removes anonymous/unnecessary public execution grants. It is
not applied to the live project until Clark approves the controlled database
change. Version 1.0 remains **Not Ready** pending live re-advisor results,
Auth settings, backup/monitoring evidence and authenticated smoke acceptance.
See [`RC4-SECURITY-HARDENING.md`](releases/RC4-SECURITY-HARDENING.md).

## RC5 owner security and acceptance — 19 July 2026

The approved RC4 hardening migration is applied and verified on Supabase
project `hrvdhjscwitqpwjhnjkm`. Anonymous legacy RPC execution and the mutable
trigger search path are closed; the remaining eight authenticated warnings are
intentional application contracts. Exact preview deployment is READY, but
leaked-password protection did not persist on the Free plan and authenticated
two-user/editorial/responsive plus operational evidence remains open. RC5
recommendation: **Not Ready for Version 1.0**. See
[`RC5-OWNER-SECURITY-AND-ACCEPTANCE.md`](releases/RC5-OWNER-SECURITY-AND-ACCEPTANCE.md).

## RC5A final owner acceptance — 19 July 2026

RC5A fixed the verified Global Search inline-rendering defect without changing
the search architecture, then deployed commit
`c130173b31444bf6b47a86412f1c54e17efe6f91` to a READY replacement preview.
Owner-authenticated browser evidence confirms body-level dialog placement,
scroll lock, focus entry/restoration, explicit close behaviour and clean
preview diagnostics. The owner-accepted temporary leaked-password risk is
unchanged. Approved User A/User B and editorial-role runtime evidence,
authenticated responsive viewport checks and backup/monitoring ownership
remain open, so the final recommendation is **Not Ready**. See
[`RC5A-FINAL-OWNER-ACCEPTANCE.md`](releases/RC5A-FINAL-OWNER-ACCEPTANCE.md).

## UX-001 experience hardening — 19 July 2026

The focused local hardening work is recorded in
`docs/releases/UX-001-V1-EXPERIENCE-HARDENING.md`; the canonical interface
reference is `docs/design/FORGE-UI-SYSTEM.md`. Search overlay/API handling,
release labels and shared UI tokens were updated. Protected preview,
authenticated cross-role and full responsive owner evidence remain required.

The UX-001 replacement protected preview is READY from commit `1a2f9d5` at
`https://kingshot-forge-qhho6ce8q-clarksim-7474s-projects.vercel.app`.
Agent-rendered Global Search and responsive checks pass; owner visual
confirmation is still required before Version 1.0 acceptance resumes.

## UX-001 exact preview continuation — 19 July 2026

The requested clean UX-001 commit `5e277720d94aaa38a852e6ce996625c7debd2362`
was deployed to protected preview `dpl_6QAuc5AvHLVBrzwfzZnHkYePG8B8` at
`https://kingshot-forge-qw27incbg-clarksim-7474s-projects.vercel.app` and is
`READY`. The Supabase project binding remains `hrvdhjscwitqpwjhnjkm` through
the configured preview environment variables. Global Search containment,
keyboard launch, controlled response handling, preview label, representative
routes, 390/768/1280/1440 responsive checks and console diagnostics passed.
Owner visual acceptance is **Pending owner confirmation**; protected admin,
editorial and operations screens were observed only at their unauthenticated
boundary states. The recommendation remains **Not Ready for Version 1.0**.
5. Continue from the current head; do not use local ZIP snapshots unless Clark explicitly requests that workflow.

### UX-002 Version 1.0 release-blocker remediation

UX-002 keeps the player-level and Town Center contracts separate: linked
`player_level` values outside the snapshot's 1–30 Town Center range are treated
as unknown, never coerced into the database. Search activation, Forge
Connections, settings/Operations surfaces, Hero ratings, Render Engine
navigation, release presentation and KvK Cards/Compact presentation are
recorded in `docs/releases/UX-002-V1-RELEASE-BLOCKER-REMEDIATION.md`.
## UX-003 remediation boundary

UX-003 is limited to owner-verified V1 acceptance failures. API-owned linked-player fields may refresh automatically, while biography, preferences, notes and other editorial/profile fields remain owner-owned. Town Center is accepted only when explicitly present and normalized to the existing 1–30 snapshot contract; values such as `TG6-0` are not silently converted. Search and relationship surfaces must never use the generic Search route as an entity destination.
## UX-004 final workflow controls

Automatic gift redemption remains opt-in and failure-isolated from authentication. Identity mutations notify the target through in-app delivery and audit-linked email delivery status. Render Engine benchmark status is explicit; metadata-only or broken artwork is never presented as ready.

The owner returned DATA-002A for corrections. The corrected workflow records
`review_required` import runs, exposes authenticated staged record detail and
the eight unresolved prerequisite warnings, and keeps publication disabled
until a later explicit owner decision. No publication has occurred.

The recovery evidence is import run `cc925b58-ac6e-4776-875a-1021067118c4` in
Supabase project `hrvdhjscwitqpwjhnjkm`: 10 catalog, 587 progression, 597
total, 710 resolved mappings, 8 unresolved warnings, and zero published
Buildings rows. The previous blank preview is attributed to a deployment
hostname mismatch; the replacement must be checked by exact deployment ID,
commit, protected route and browser console/network evidence.

The corrected preview is deployment `dpl_Bo5KoB4FR5DMi68GyVEFXrtsDd1j` at
`https://kingshot-forge-qhbttrt5d-clarksim-7474s-projects.vercel.app`, deployed
from `4f60adef84c9ab7e28063658a4e6ec1b8a0186bf` with Vercel status `READY`.

## REL-001 publication integrity — 20 July 2026

REL-001 established immutable warning identities across validation, staging,
review, publication certification and audit reconciliation. One source record
may contain multiple warnings; record status is not warning identity. The
append-only warning table and identity-set release certification preserve that
distinction. The existing Buildings run remains `review_required` and
unpublished; publication must continue to fail if any identity set differs.

## REL-002 owner acceptance gate — 20 July 2026

Release-candidate verification and REL-001 migration application passed. Final
owner-authenticated role sessions remain unavailable. The owner supplied the
publication approval phrase, but this branch has no supported atomic Buildings
publication operation, so Buildings remain unpublished and Version 1.0 remains
**Not Ready**. Leaked-password protection remains disabled and accepted only as
a temporary Free-plan risk; it is not enabled.
# REL-003 operational note

Buildings publication uses a server-only atomic RPC, an immutable warning decision ledger, a manifest hash, an idempotency key, and append-only publication snapshots. Public data-engine reads are published-only. Failed publication or refresh steps leave the import run and publication history intact; no client may write publication tables directly.

## REL-004 acceptance boundary

The final browser gate requires authentication on the exact protected preview
hostname. A valid session on an earlier preview is not evidence for the repaired
deployment. REL-004 completed owner-only Content Studio, audit, rollback and
role checks on deployment `dpl_J3JPWgMNpA5iX37kEqTPXvkRmUgV`; no authentication
boundary was bypassed.

## HOTFIX-001 Buildings Admin projection

The Buildings Admin read model is canonical and grouped by `building_key`: 10
catalogue entities contain 587 nested progression records, while publication
storage retains 597 records. Placeholder identity generation is prohibited;
load failures must surface an unavailable/retry state. Buildings edits remain
draft-only through the editorial workflow, with published and staged data
server/read-policy protected.

## HOTFIX-002 player readability and connections

The candidate keeps published Buildings immutable, exposes the existing
published `/buildings` routes through Player navigation, and renders published
progression read-only with shared formatting. Player troop snapshots retain
numeric compatibility values while the UI uses TG1–TG6 terminology. Forge
Connections consumes published relationship results only and renders
deduplicated domain-filtered cards with honest empty states.

## Sprint 1.0.2 player experience stabilisation — 21 July 2026

Buildings progression ordering is a shared contract. Consumers must order
published rows from structured `progression_phase`, `base_level`, `stage` and
`truegold_tier` metadata; displayed labels are presentation only and must not
be used as sort keys. The canonical sequence is normal/base progression,
pre-Truegold transition rows, then Truegold stage/tier rows as defined by the
published workbook.

Player Buildings remains published-only and read-only. Personal Progression
continues to store the existing numeric snapshot schema, maps legacy T1–T5
values without destructive conversion, and presents the player-facing troop
labels as TG1–TG6 for Infantry, Cavalry and Archers. Forge Connections may show
only published relationship results with a real relationship type and a
supported destination; tags may enrich a card but cannot create a relationship.

Sprint 1.0.2 preview follow-up: Player View acceptance verified the Buildings
directory and seven required Buildings deep links, corrected normal-before-
Truegold ordering, read-only published tables, navigation/dashboard
discoverability and no document-level horizontal overflow at 390/768/1280/1440.
Console diagnostics were empty. Personal Progression save/reload/history and
owner/admin acceptance remain unverified because the available session was not
authenticated for those routes; no write was attempted.
## ART-002G / ART-003 release boundary

Community Art submission uses a service-role-only atomic RPC with server-owned raw
hash/byte length, request UUID idempotency and an append-only audit event. Render
calibration is a separate prediction-only capability with context-specific profiles;
it does not grant moderation or alter approved payloads. The exact candidate is in a
protected READY preview, with authenticated player/moderator acceptance still required
before production promotion.
## Character preservation control

AEGIS treats silent character mutation as a publication integrity failure. Community Art warnings must remain warnings unless a moderator explicitly approves a reversible edit. Existing submissions are audited and reported for owner review; they are never rewritten by the preservation audit.
