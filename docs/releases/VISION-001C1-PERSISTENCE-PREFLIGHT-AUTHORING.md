# VISION-001C1 — Persistence Preflight and Authoring Foundation

Date: 23 July 2026  
Branch: `feature/vision-mapper`  
Expected base: `32310b745c9910859fed8d2973b4ce1bba145cc0`  
Status: implemented locally; Supabase application approval remains outstanding

## Delivered

- Added provider-neutral Vision authoring contracts and lifecycle policy helpers.
- Added server-only `/api/vision` read and mutation boundary for screen types, mapping versions, successors, metadata, Testing submission, Field Registry and extractor manifests.
- Enforced server permission checks and rejected Published/Deprecated metadata mutation; successors are new Draft rows with predecessor references.
- Added an honest Vision Studio authoring foundation with loading, empty, error and persistence-unavailable states. The browser does not access Vision tables directly.
- Preserved the temporary `cms.view` route gate. After migration approval, the route and navigation gate should be changed to `vision.admin.read` and the edit actions should use `vision.admin.edit`.

## Supabase read-only preflight

Project `hrvdhjscwitqpwjhnjkm` was inspected without applying SQL or writing data.

Verified:

- Migration `20260722193000` is not present in `supabase_migrations.schema_migrations`.
- No `vision_*` tables or Vision functions exist in the live public schema.
- `forge_platform_role` values exactly match the migration: `owner`, `admin`, `moderator`, `content_creator`, `beta_tester`, `contributor`, `viewer`.
- `pgcrypto` and `uuid-ossp` are installed; `gen_random_uuid()` is therefore available.
- `forge_permissions.permission_key` and `forge_role_permissions` have the expected text/enum shape; the Vision permission inserts are compatible.
- `auth.users` exists and current Forge foreign-key conventions target `auth.users.id`.
- `has_forge_permission(text)` and `get_my_forge_access()` are PostgreSQL-owned `SECURITY DEFINER` functions with `search_path` set to empty and schema-qualified references.
- No `vision-evidence` storage bucket exists. Storage policies/assumptions must be reviewed when evidence upload is introduced.

Findings and recommendation:

- No blocking incompatibility was found in the checked-in migration against the inspected live schema.
- Do not apply the migration in this milestone. Before application, run the migration in a disposable branch and verify RLS, grants, policy execution, function privileges and storage policy design.
- The migration is conditionally safe to apply after an approved transaction/backup window and branch rehearsal. It creates `FORCE ROW LEVEL SECURITY`, grants only authenticated `SELECT`, revokes browser mutation privileges, and grants publication execution only to authenticated users; server mutations remain authoritative.
- Rollback requires restoring the pre-migration schema or a reviewed compensating migration because the immutable/audit design intentionally restricts destructive cleanup.

## Validation evidence

Executed:

- `npm install` — passed; npm reported 11 existing audit findings (3 moderate, 8 high).
- `npm run test:forge-vision` — passed, including platform, worker and authoring tests.
- `npm run test:forge-vision-worker` — passed.
- `npm run lint` — completed with pre-existing warnings; no new lint error remains.
- `npm run build` — passed after the authoring boundary fix.
- Full `npm run check` and authenticated browser acceptance were not completed in this handover.

## Persistence and security state

No live Supabase write occurred. No migration was applied. No worker was deployed. No Kingshot screen definition, coordinate, target table or authored mapping was seeded.

Known limitations: mutations cannot be exercised until persistence is approved/applied; publication remains database-governed and out of scope; evidence storage and mapping-child authoring screens remain future work; exact authorised-account browser acceptance remains pending.

## Next milestone

Approve and apply the rehearsed migration, then validate authenticated owner/admin authoring end to end before implementing reference evidence, region/anchor authoring and testing workflows.
