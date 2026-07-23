# Forge Vision authenticated acceptance checklist

Status: persistence is operationally accepted; `vision_screen_types_read` correction is applied; storage remains deferred. Authenticated acceptance has not been executed. VISION-001C3A prepares the harness and cleanup controls; authoring remains frozen pending a separately approved session.

## Currently testable authenticated authoring acceptance

- Anonymous `GET` and `POST /api/vision` return 401.
- Active users without `vision.admin.read` receive 403 for lists.
- Read-only users can list screen types, mapping versions, enabled Field Registry entries and testing/active extractors, but receive 403 for mutations.
- Active owner/admin actors with `vision.admin.read`, `vision.admin.edit` and `vision.admin.test` can create a disposable synthetic screen type, create a Draft version, update Draft metadata and submit it for Testing.
- The empty state, extractor visibility, metadata reload, Testing status, permission-denied and API-error states can be evidenced in Vision Studio at narrow and desktop viewports.

## Deferred acceptance

Regions, field mappings, extractor configuration, test cases/results, publication, published-successor acceptance, image evidence/storage, worker extraction, user corrections and append-only evidence flows are not exposed through the current authoring API and remain unaccepted.

## Controlled fixture

Every execution uses a fresh UUID-like run ID and only these values:

- screen key: `acceptance-vision-<run-id>` (the persisted `screen_key` contract permits hyphens, not dots)
- game key: `forge_acceptance`
- label: `Forge Vision Acceptance <run-id>`
- layout family: `synthetic_acceptance`
- game version: `acceptance-only`
- change note: `VISION-001C3 ACCEPTANCE — DISPOSABLE <run-id>`

The fixture contains one screen type, one Draft mapping version, a metadata update and a Testing transition. It never includes real Kingshot screens, screenshots, fields, mappings, regions, scans, evidence or publication.

## Future execution and evidence

Run `npm run accept:forge-vision-authenticated -- --plan` first. Live execution requires `--execute`, an exact project/SHA/run ID/base URL, `FORGE_VISION_ACCEPTANCE_APPROVED=YES`, `FORGE_VISION_ACCEPTANCE_STORAGE_EXCLUDED=YES`, and a short-lived owner/admin bearer token provided only through `FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN`.

Clark should establish that session in the browser or local secure environment and supply only the short-lived token environment variable; credentials, cookies and session payloads must never be pasted into chat, committed or written to evidence. The runner redacts sensitive headers and token-like values and writes execution evidence outside the repository. Any failed mutation means cleanup is required before another run.

Required sign-off evidence: redacted request/response summaries, screenshots, console and network review, acceptance/cleanup JSON, and read-only post-cleanup counts. Confirm no direct browser table writes or storage calls.
