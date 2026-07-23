# Forge Vision Persistence Activation Runbook

Status: prepared, unapplied  
Programme: VISION-001C2A  
Required application order: `20260722193000_vision_001a_contracts_and_persistence.sql`, then the separately reviewed storage migration `20260723181223_vision_evidence_storage.sql`  
Project: `hrvdhjscwitqpwjhnjkm`  
Accepted C1A baseline: `512f930ccfe53770d889b907d57c2005f4f4c30b`
Activation-package commit: `78b46612efac6a093026e875d6d75115c165eaad`
Owner-approved execution commit: supplied externally and captured in activation evidence. See `docs/operations/FORGE-VISION-ACTIVATION-MANIFEST.json`.

This runbook is executable only after owner approval. It does not authorise
activation by itself. Do not apply either migration while the approval gate is
open.

## 1. Preconditions and stop gates

The operator must be a Supabase project owner or database administrator with
permission to apply migrations, inspect `pg_catalog`, inspect Storage objects
and review security/performance advisors. The Forge operator must separately
be an authorised owner/admin for the post-activation acceptance checklist.

Stop immediately if:

- no explicit owner-approved execution SHA is supplied;
- the checked-out HEAD does not exactly equal the externally supplied execution SHA;
- the working tree is not clean, the branch is not `feature/vision-mapper`, or HEAD does not descend from the activation-package commit;
- either migration file fails the recorded SHA-256 digest check;
- the target project is not `hrvdhjscwitqpwjhnjkm`;
- migration `20260722193000` is already applied but has not been reconciled;
- any `public.vision_%` object exists unexpectedly;
- a `vision-evidence` bucket exists unexpectedly;
- the role enum, permission schema or auth references differ from the preflight;
- the operator cannot capture SQL output and migration history as evidence.

The migration is one transaction, but PostgreSQL object creation, locks and
catalog changes are still real effects. A failed transaction should roll back
atomically; diagnose the exact error before retrying. Do not manually delete
partial objects in production. After application, prefer a forward corrective
migration.

## 2. Read-only pre-activation queries

Run these as read-only catalog queries and save the output:

```sql
select version, name
from supabase_migrations.schema_migrations
where version >= '20260722193000'
order by version;

select table_name
from information_schema.tables
where table_schema = 'public' and table_name like 'vision_%'
order by table_name;

select typname, enumlabel
from pg_type join pg_enum on pg_enum.enumtypid = pg_type.oid
where typnamespace = 'public'::regnamespace and typname like 'vision_%'
order by typname, enumsortorder;

select extname, extversion
from pg_extension
where extname in ('pgcrypto', 'uuid-ossp');

select enumlabel
from pg_enum
where enumtypid = 'public.forge_platform_role'::regtype
order by enumsortorder;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
  and (tablename like 'vision_%' or tablename = 'objects')
order by schemaname, tablename, policyname;
```

Expected pre-activation state for Vision is zero tables, no Vision types or
functions, no `vision-evidence` bucket, `pgcrypto` available, and the seven
Forge platform roles recorded in the C1A preflight.

## 3. Application procedure

1. Run `npm run verify:forge-vision-activation-preconditions -- --approved-sha <owner-approved-execution-sha>` and preserve the read-only JSON output. This command does not connect to Supabase or apply migrations.
2. Confirm the exact commit and project reference in the operator terminal.
3. Review the complete unapplied migration and this runbook.
4. Apply only `20260722193000_vision_001a_contracts_and_persistence.sql` through the approved Supabase migration workflow.
5. Do not apply the storage migration in the same change window until the persistence verification below passes and a second approval is recorded.
6. Capture migration history, catalog verification, policy/grant output and advisor output.
7. After persistence acceptance, apply `20260723181223_vision_evidence_storage.sql` as a separate approved migration.

The original migration begins and commits a single transaction. It creates seven
enums, 17 tables, indexes, functions, triggers, policies, permission rows and
grants. The storage migration is also transactional and does not overwrite an
existing bucket configuration; its expected digest is recorded in the manifest.

## 4. Immediate persistence verification

Run the read-only verifier:

```bash
node scripts/verify-forge-vision-activation.mjs path/to/vision-activation-metadata.json
```

The metadata file is produced from the catalog query template in
`scripts/verify-forge-vision-activation.mjs`; it is not a database write path.
The verifier must report all required objects, RLS/force-RLS, policies,
permissions and no authored screen/mapping seeds. A failure is a stop gate.

Required object counts and names:

- seven enums: `vision_mapping_status`, `vision_scan_status`, `vision_value_status`, `vision_extractor_family`, `vision_execution_mode`, `vision_plugin_status`, and `vision_detection_method`;
- 17 tables: field registry, extractor plugins, screen types, mapping versions, evidence images, mapping references, regions, field mappings, mapping extractors, mapping regions, test cases, test results, scan runs, scan values, extraction evidence, user corrections and audit events;
- publication function `public.publish_vision_mapping_version(uuid)`;
- immutability functions/triggers, append-only evidence triggers, four indexes beyond table constraints and all named policies in the migration;
- exactly one seeded extractor plugin, `ocr.tesseract.cli`, and zero screen types, mapping versions and field mappings.

## 5. Grants, RLS and permission verification

Verify every Vision table has RLS and FORCE RLS. Verify `authenticated` has
only the intended `SELECT` table grants and no `INSERT`, `UPDATE` or `DELETE`
grant. Verify `anon` has no table grants. Verify the publication function is
not executable by `public` or `anon` and is executable by `authenticated`.
Verify `public.has_forge_permission` remains schema-qualified, owned by the
database owner, `SECURITY DEFINER`, and configured with an empty search path.
Verify all seven Vision permissions exist and role assignments match the
migration exactly: owner/admin receive admin read/edit/test/publish and
evidence capabilities; moderator receives read/test/evidence; scan roles
receive only their documented scan permissions.

## 6. Negative and immutability tests

Using an unauthorised browser session, confirm Vision table reads and writes
are denied. Using an authorised session, confirm reads require the expected
permission and browser table mutation remains denied. Exercise the server API
with an authorised actor for Draft screen-type creation and Draft version
creation only after live persistence is approved.

Create neutral acceptance data only under the acceptance checklist. Verify:

- Published and Deprecated versions reject metadata, child-content and delete mutations;
- Published-to-Deprecated is allowed only through the governed lifecycle operation;
- a successor is a new Draft with a predecessor reference;
- evidence, test results, corrections and audit events reject update/delete;
- every field mapping references an enabled Field Registry key;
- publication rejects missing governed mappings, primary extractors, enabled test cases or passing results.

Remove acceptance records only through an explicitly approved forward cleanup
operation before real authoring begins; never use ad hoc production deletes.

## 7. Storage activation verification

Only after persistence verification passes, apply the separate storage migration.
Verify the bucket is private, limited to PNG/JPEG/WebP/TIFF and 16 MiB, with no
public URL policy. Verify authenticated users have no object INSERT/UPDATE/
DELETE policy and only users with `vision.evidence.review` can read objects
through the Storage API. Server upload initiation must validate purpose,
owner, path and matching `vision_evidence_images` metadata before creating a
signed upload/read URL.

## 8. Advisors and performance

Run Supabase security and performance advisors after each approved migration.
Review FORCE RLS, missing policies, overly broad grants, function search paths,
unindexed foreign-key/query paths and storage policy findings. Do not dismiss
security findings without an owner-approved rationale.

## 9. Failure containment and rollback

If the transaction fails, preserve the exact error and migration history, do
not retry blindly, and stop. If the migration commits but verification fails,
freeze authoring and public consumption, preserve catalog evidence and use a
forward corrective migration. A destructive rollback is not represented as
safe: PostgreSQL objects, permission rows, audit history or storage metadata
may already have been observed by operators. Recovery must be a reviewed
database restore or compensating migration with explicit evidence handling.

## 10. Handover evidence and go/no-go

Capture commit SHA, project ref, operator identity, timestamps, migration
history, verifier JSON, table/type/function/trigger/index/policy/grant output,
advisor findings, negative browser results, authenticated acceptance results,
storage bucket configuration and preview URL.

Migration integrity evidence at the activation package:

- `supabase/migrations/20260722193000_vision_001a_contracts_and_persistence.sql`: `126b863fdc6b7114572083687f1376023ad6d3cb0c1dcecb37fbda40f7acc9ac`
- `supabase/migrations/20260723181223_vision_evidence_storage.sql`: `0b7a3f7a0c8ac2db78bc9d172c7efcdff17ed4c807867ef67af80aadc77104dd`

GO requires every stop gate, verifier check, advisor review, negative browser
test and authorised acceptance item to pass. Until then, the recommendation is
NO-GO for applying persistence or storage. This preparation milestone itself
remains NO-GO because the live migration and bucket are intentionally absent.
