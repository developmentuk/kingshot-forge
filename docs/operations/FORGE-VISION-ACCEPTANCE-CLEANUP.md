# Forge Vision acceptance cleanup controls

The cleanup runner is a server-only controlled utility, not a browser API. The disposable VISION-001C3 fixture cleanup completed successfully under exact-ID owner approval.

Invoke cleanup only through the canonical command:

`npm run cleanup:forge-vision-acceptance -- <arguments>`

This command uses `node --import tsx` and dynamically imports the actual TypeScript admin module at `server/database/supabaseAdmin.ts`. Do not invoke the script through plain `node`; that runtime cannot resolve the TypeScript admin module. The retained checkpoint is now the cleaned authority: `status: cleaned`, `cleanupRequired: false`, and `deleted: true`, with both provenance records and exact historical IDs preserved.

## Required identity and guards

`scripts/cleanup-forge-vision-acceptance.mjs` requires `--execute-cleanup`, `FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED=YES`, the exact project reference, exact approved repository SHA, exact run ID, one exact screen-type UUID and exact comma-separated mapping-version UUIDs. The values must exactly match the retained run checkpoint and its `cleanupRequired` state. Wildcards, prefix-only targets and unknown IDs are refused before any database client is created.

The target screen must use `acceptance-vision-<run-id>` and `forge_acceptance`. Every version must belong to that screen, include the exact run ID in its change note and remain Draft or Testing. The runner rejects Published/Deprecated versions and any unexpected child records. It never targets extractor plugins, Field Registry rows, permissions, non-acceptance records, evidence, scans, storage or audit records.

## Cleanup order and retention

The completed cleanup deleted only the exact mapping version ID first and then the exact screen type ID. The pre-cleanup fixture had no children. Child inspection is schema-aware: `vision_mapping_reference_images` has a composite primary key and no `id` column, so every inspected table declares its real `mapping_version_id` filter/select column. The runner uses exact-count/head queries, fails closed on query errors, and blocks on any non-zero count. Database immutability and append-only triggers were never weakened.

Vision audit events are append-only and remain retained: exactly four fixture events remain. Authoring wrote one safe audit event after each fixture mutation. Cleanup read and reported the retained audit IDs/count, rejected credential-like audit payloads, and never deleted audit history.

## Failure and evidence

The runner created a redacted cleanup plan only after all guards passed, verified both exact records were gone afterwards, and atomically updated the same restricted checkpoint. Cleanup preserved the original execution provenance and separate verification provenance. Provenance handover did not broaden exact-ID deletion authority. Audit events remain retained and storage remains excluded. No wildcard or manual SQL cleanup occurred. Real mappings, player screenshots and storage objects were prohibited from this fixture.
