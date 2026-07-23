# Forge Vision acceptance cleanup controls

The cleanup runner is a server-only controlled utility, not a browser API. It exists solely to remove the disposable VISION-001C3 fixture after a separately authorised acceptance session.

## Required identity and guards

`scripts/cleanup-forge-vision-acceptance.mjs` requires `--execute-cleanup`, `FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED=YES`, the exact project reference, exact approved repository SHA, exact run ID, one exact screen-type UUID and exact comma-separated mapping-version UUIDs. Wildcards, prefix-only targets and unknown IDs are refused before any database client is created.

The target screen must use `acceptance-vision-<run-id>` and `forge_acceptance`. Every version must belong to that screen, include the exact run ID in its change note and remain Draft or Testing. The runner rejects Published/Deprecated versions and any unexpected child records. It never targets extractor plugins, Field Registry rows, permissions, non-acceptance records, evidence, scans, storage or audit records.

## Cleanup order and retention

The expected fixture has no children, so cleanup deletes only the exact mapping version IDs and then the exact screen type. Child inspection covers mapping references, regions, field mappings, test cases/results, scan runs and extraction evidence; any non-zero count blocks cleanup. Database immutability and append-only triggers are never weakened.

Vision audit events are append-only and must remain retained. The current authoring API does not create fixture audit events; if later API work adds them, their payload must contain no credentials or screenshots and cleanup must still not delete them.

## Failure and evidence

The runner creates a redacted cleanup plan only after all guards pass, verifies the exact records are gone afterwards, and writes machine-readable evidence outside the repository. On failure, do not retry blindly or use manual SQL: preserve the redacted report and seek a separate owner decision. Real mappings, player screenshots and storage objects are prohibited from this fixture.
