# Player Identity Read-Only Schema Discovery

**Status:** Complete for Sprint 9.3 architectural discovery; not a canonical schema baseline
**Project reference:** `hrvdhjscwitqpwjhnjkm`
**Observed:** 17 July 2026
**Database:** Supabase project `Kingshot Forge`, region `eu-west-2`, PostgreSQL `17.6.1.141`
**Repository evidence head at discovery start:** `0a14d1be10be24c456b3e4b439954e2a0c30c591`

## Evidence boundary

Discovery used the connected Supabase metadata tools and catalog-only SQL wrapped in `BEGIN TRANSACTION READ ONLY` / `COMMIT`. The inspected surfaces were project identity, tables and columns, constraints, RLS policies, relations/views, table and function grants, function security metadata, schema privileges, migration history, and Supabase security/performance advisors.

No application rows, authentication records, secrets, provider credentials, proof material, or user content were requested or retained. Table row-count estimates returned by metadata tooling were not used as product evidence. No DDL, DML, migration command, function call with business effects, branch operation, or Supabase write was performed.

Live schema is evidence, not automatically canonical. Findings below are deliberately classified as **Confirmed**, **Inferred**, **Missing**, **Unsafe**, or **Proposed**.

## Confirmed findings

### Identity and access objects

| Object | Confirmed purpose and shape | Sprint 9.3 assessment |
| --- | --- | --- |
| `auth.users` | Supabase authentication authority exists; `public.profiles.id` and `public.forge_user_roles.user_id` reference it. | Authentication authority only. No game-character ownership inference is permitted. |
| `public.profiles` | Forge user profile keyed to Auth; includes display/profile/global-role-era fields and a Forge-facing identifier. RLS is enabled. | Existing user/profile compatibility source, not a public Player projection. |
| `public.forge_user_roles` | One global role row per authenticated user. RLS is enabled; users can read their own row. | Reusable only as a future actor-resolution input. It does not represent Alliance authority. |
| `public.forge_permissions` / `public.forge_role_permissions` | Global permission catalogue and role mapping. RLS is enabled; signed-in users can read them. | Separate from future resource-scoped Alliance capabilities. |

### Player and character objects

| Object | Confirmed purpose and constraints | Sprint 9.3 assessment |
| --- | --- | --- |
| `public.player_accounts` | Combines Forge user, raw game Player ID, display observations, Kingdom value, legacy verification fields, primary flag, public flag, and verification audit references. `player_id` is unique and `user_id` is also unique. | Legacy/ambiguous aggregate. The unique user key structurally prevents multiple linked characters and conflicts with the approved contract cardinality. Link, observation, primary preference, visibility and trust are combined. |
| `public.player_verification_events` | Records previous/new legacy verification state, method, requester/reviewer and notes. RLS is enabled. | Useful historical evidence only. It is not a provider-neutral verification case/evidence/revision model and cannot establish positive ownership without an approved source. |
| `public.player_profiles` | One-to-one extension of `player_accounts`, including profile/progression/transfer-oriented fields and a public flag. | Legacy profile aggregate; it mixes concerns that future projections must separate. |
| `public.player_progression_snapshots` | Player-account progression observations with creator and public flag. RLS is enabled. | Potential observation history, not identity authority. Public exposure needs a field projection rather than row-level publication. |
| `public.player_heroes` and child tables | Character-scoped Hero ownership/progression/showcase data with canonical Hero foreign keys and progression checks. | Existing Hero claim data. Canonical facts remain Hero Domain-owned and editorial recommendations remain Editorial-owned. |

### Kingdom, Alliance and Transfer objects

| Object | Confirmed purpose and constraints | Sprint 9.3 assessment |
| --- | --- | --- |
| `public.kingdoms` | Kingdom catalogue with active/verification-era metadata. | Safe summaries may be consumed later through a port; verification-like labels are not Character Ownership Verification. |
| `public.player_kingdom_memberships` | Combines player account, Forge user, Kingdom, lifecycle status, source and effective timestamps. | Ambiguous compatibility source. User duplication and verification-source vocabulary need recovery review. |
| `public.alliances` | Alliance catalogue with public/active/recruitment/verification-era fields. | Safe summaries only in this milestone. |
| `public.alliance_memberships` | Combines request, review, current membership, rank, Forge user, player account and Kingdom data. | Application, membership tenure and rank are not separated. It is not an Alliance authority model. |
| `public.alliance_admins` | Alliance/user association with hard-coded management booleans and grant lifecycle. | Legacy authority-like source. Sprint 9.3 does not consume it or map it to global roles. |
| `public.alliance_audit_log` | Mutable-shape JSON before/after audit rows linked to Alliance, user and player account. | Existing audit evidence, not yet the immutable Player event contract. |
| `public.transfer_profiles` and related Transfer tables | Transfer listing/application/history data linked to user, player account, Kingdom and Alliance. | Separate domain with private/contact risk. It is excluded from Player public projections. |

### Public view

`public.alliance_membership_details` is the only matching Player/Alliance view found. It is configured with `security_invoker=true`, so base-table RLS remains relevant. Its selected columns nevertheless include raw Player ID, Forge/profile identifier, internal user/account/membership identifiers, request message and review notes. It is not safe as the future public Player projection.

### Reusable constraints and controls

- UUID-style primary keys and explicit foreign keys are already common.
- RLS is enabled on every inspected Player/Kingdom/Alliance/role table.
- `player_accounts.player_id` has a global uniqueness constraint; whether global uniqueness is a valid game invariant still requires product/provider evidence.
- Kingdom-number bounds and several Hero/progression numeric checks provide useful validation evidence.
- `player_heroes` prevents duplicate Hero rows for the same player account and canonical Hero.
- `alliance_admins` prevents duplicate Alliance/user administrator rows.
- The public view uses invoker security, which is the safer view posture, but field selection remains unsafe.
- Authenticated roles cannot create objects in `public` or `auth`; they have schema usage only.

## Inferred findings

- `player_accounts` is functioning as user-character link, observed character record, primary preference, visibility switch and verification summary at once. This inference follows from its columns and constraints, not from row contents.
- Existing primary-only browser behaviour is reinforced by the unique `user_id` constraint; compatibility code likely assumes one row.
- Legacy values named `verified` may describe historical application state, but no approved provider, proof chain, evidence lifecycle or assurance contract was found. Sprint 9.3 therefore treats them as untrusted legacy labels.
- Current public access relies primarily on RLS selecting whole rows. RLS controls rows, not which selected columns are safe; this is incompatible with the new field-allowlisted projection boundary.
- Several Alliance functions are intended to centralise server-side decisions, but catalogue metadata alone does not prove their internal checks are complete.

## Missing findings

The live model does not provide a confirmed canonical structure for:

- a separate Forge User identity and reusable Game Character identity;
- many character links per Forge User;
- a link lifecycle with independent dispute, revocation, removal and revision;
- an enforceable exactly-one Primary preference across multiple current links;
- request-bound Active Character resolution;
- provider-neutral verification cases, evidence references, assurance, expiry, dispute and revocation revisions;
- opaque public aliases with rotation/revocation policy;
- field-level private/public visibility selections;
- immutable Player Identity event history;
- resource-scoped Alliance capabilities separate from global Forge roles;
- a reproducible checked-in baseline for all live Player tables/functions/policies;
- approved retention, deletion, recovery and support-intervention controls.

## Unsafe or review-required findings

### Public field exposure

- The anonymous/authenticated `player_accounts` SELECT policy permits whole rows when `is_public` is true. Because the table contains raw Player ID, Forge user linkage, internal link-like ID and verification-era fields, a row allowed by RLS can expose more than the future public contract permits.
- `profiles` has a public SELECT policy with predicate `true`, exposing every selectable profile column to `anon` and `authenticated` under current grants.
- `alliance_membership_details` carries internal IDs, raw Player ID, Forge identifier, request text and review notes. Invoker security limits rows according to base policies but does not remove unsafe columns.
- Public policies on memberships, progression and Hero rows publish complete source rows rather than field-minimised projections.

### Grants and functions

- `anon` and `authenticated` have broad table privileges on many legacy Player/Alliance objects. RLS blocks many row operations, but least-privilege grants are not aligned to the narrow operations actually intended. Notably, the observed `authenticated` table grant for `player_accounts` omits `UPDATE` even though an UPDATE policy exists, creating policy/grant drift.
- Supabase security advisors report `WARN` findings for public and signed-in execution of multiple `SECURITY DEFINER` Alliance/Kingdom functions, including membership request/review/cancel/leave functions and capability helpers. Their ACLs include `PUBLIC`, `anon`, `authenticated` and `service_role` execute grants. This is a review-required invocation surface, not proof of an exploit.
- The inspected security-definer functions set `search_path=public`; future hardening should prefer an empty search path with schema-qualified objects where practicable.
- RLS is enabled but not forced on inspected tables. Owners and service roles remain privileged and must be kept behind server boundaries.

### Policy and performance diagnostics

Supabase performance advisors report:

- unindexed foreign keys across Player, Alliance, Kingdom and Transfer relationships, including legacy verification-event and audit references;
- auth-function initialisation-plan warnings on Alliance, Player profile, Player Hero and global-role policies;
- multiple permissive policies on Alliance memberships, Player Heroes, Kingdom memberships, progression snapshots and verification events;
- unused indexes across several inspected Player/Alliance objects.

These are review inputs only. An unused-index advisory on a young or low-traffic project is not sufficient authority to drop an index.

## Migration drift

The live migration history returned eight entries:

1. `20260716123855 configure_companion_images_bucket`
2. `20260716124514 secure_companion_image_editor_uploads`
3. `20260716133025 create_platform_feedback_reports`
4. `20260716160334 hero_skills_editorial_projection`
5. `20260716160958 hero_skills_editorial_key_constraint`
6. `20260716173131 player_domain_progression_visibility`
7. `20260716175552 player_hero_complete_skill_progression`
8. `20260716200603 kingshotguide_one_off_source_staging`

At discovery start, this worktree contained five checked-in migration files with different timestamps/names and did not contain the two live Player migrations, the Hero key-constraint migration, or the one-off source-staging migration. Conversely, the checked-in PM2B editorial persistence migration was not present in the returned live history. This is confirmed history drift; it does not establish which side is canonical.

## Migration-recovery requirements

Before any Player migration is designed or applied:

1. classify the target environment and name the migration authority;
2. produce a sanitised catalogue snapshot and integrity receipt from an approved point in time;
3. reconcile live migration records with every accepted repository branch and deployment record;
4. recover or reconstruct missing migrations without copying unverifiable live state blindly;
5. decide which legacy structures are retained behind compatibility adapters and which need forward repair;
6. review every future table's explicit grants, RLS policies, policy indexes and foreign-key indexes;
7. test the recovered baseline and forward sequence in an approved isolated non-production target;
8. rehearse rollback/compensation and verify that legacy positive verification labels remain non-authoritative;
9. obtain Clark, Aegis, Database, Security and Privacy approval required by ADR-0115 and the approval matrix.

## Proposed contract response

Sprint 9.3 introduces only additive TypeScript contracts and injected ports. It does not bind those contracts to the live table names above. The compatibility/recovery layer should later map live evidence into the approved domain model without promoting legacy labels, exposing raw identifiers, or silently choosing a Primary Character. Physical schema names, API routes, migration order and production policies remain unapproved.

## Stop conditions reached

Discovery found enough metadata to complete the contract foundation. It also found enough drift and public/grant risk to prohibit a production persistence adapter or migration in this milestone. Work stops at read-only evidence, contracts, pure policies, ports and tests.

## Current Supabase references checked

- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Secure database data](https://supabase.com/docs/guides/database/secure-data)
- [Breaking-change changelog](https://supabase.com/changelog?tags=breaking-change)

Supabase's April 2026 grant-default change affects newly created objects while existing objects retain their grants. It does not repair the broad grants observed on these legacy objects; any future baseline must specify grants explicitly.
