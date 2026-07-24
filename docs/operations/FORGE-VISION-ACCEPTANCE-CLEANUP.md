# Forge Vision acceptance cleanup controls

The cleanup runner is a server-only controlled utility, not a browser API. It exists solely to remove the disposable VISION-001C3 fixture after a separately authorised acceptance session.

## Required identity and guards

`scripts/cleanup-forge-vision-acceptance.mjs` requires `--execute-cleanup`, `FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED=YES`, the exact project reference, exact approved repository SHA, exact run ID, one exact screen-type UUID and exact comma-separated mapping-version UUIDs. The values must exactly match the retained run checkpoint and its `cleanupRequired` state. Wildcards, prefix-only targets and unknown IDs are refused before any database client is created.

The target screen must use `acceptance-vision-<run-id>` and `forge_acceptance`. Every version must belong to that screen, include the exact run ID in its change note and remain Draft or Testing. The runner rejects Published/Deprecated versions and any unexpected child records. It never targets extractor plugins, Field Registry rows, permissions, non-acceptance records, evidence, scans, storage or audit records.

## Cleanup order and retention

The expected fixture has no children, so cleanup deletes only the exact mapping version IDs and then the exact screen type. Child inspection is schema-aware: `vision_mapping_reference_images` has a composite primary key and no `id` column, so every inspected table declares its real `mapping_version_id` filter/select column. The runner uses exact-count/head queries, fails closed on query errors, and blocks on any non-zero count. Database immutability and append-only triggers are never weakened.

Vision audit events are append-only and remain retained. Authoring writes one safe audit event after each fixture mutation. Cleanup reads and reports retained audit IDs/count, rejects credential-like audit payloads, and never deletes audit history.

## Failure and evidence

The runner creates a redacted cleanup plan only after all guards pass, verifies the exact records are gone afterwards, and atomically updates the same restricted checkpoint. Audit events are retained and never deleted. Current fixture cleanup is exact-ID only and requires a new separately approved session. On failure, do not retry blindly or use manual SQL: preserve the redacted report and seek that owner decision. Real mappings, player screenshots and storage objects are prohibited from this fixture.
