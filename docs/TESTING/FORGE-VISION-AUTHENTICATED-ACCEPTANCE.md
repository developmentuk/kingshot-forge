# Forge Vision authenticated acceptance checklist

Status: persistence is operationally accepted; `vision_screen_types_read` correction is applied; storage remains deferred. VISION-001C3B created one controlled synthetic fixture: creation, metadata update and Testing transition passed; anonymous rejection and deployment/actor preflight passed. The authenticated precheck returned HTTP 200 JSON, and cross-provenance verification passed exactly once. The retained checkpoint is verified, preserves the exact screen-type and mapping-version IDs, and preserves both execution and verification provenance records. Cleanup stopped before database access because the plain Node runtime could not resolve `server/database/supabaseAdmin.js`; no deletion occurred. Cleanup remains pending a separately approved cleanup-only session. Verification must not be rerun, C3B execute must never be rerun, and authoring remains frozen.

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

Run `npm run accept:forge-vision-authenticated -- --plan --run-id c3a1-plan-check` first. The plan is local only. Live execution requires `--execute`, an exact 40-character `--approved-sha`, run ID, project reference, and immutable HTTPS Vercel deployment URL (not a branch alias; no path, query, fragment, or credentials), `FORGE_VISION_ACCEPTANCE_APPROVED=YES`, `FORGE_VISION_ACCEPTANCE_STORAGE_EXCLUDED=YES`, a short-lived owner/admin bearer token in `FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN`, and the protected-preview secret only in `VERCEL_AUTOMATION_BYPASS_SECRET`.

Every request uses `redirect: 'manual'`; any 3xx response fails without recording a redirect location. The list preflight requires JSON/200, attested deployment SHA equal to `--approved-sha`, an active actor with read/edit/test permissions, and canonical `ocr.tesseract.cli`. Execute mode separately rejects any run-ID collision. Verify mode accepts only the retained exact checkpoint IDs, requires exactly one matching screen and the exact Testing version metadata, and rejects additional run-ID records. Every POST carries its action, one UUID correlation ID and the run ID. The API response exposes only deployment SHA plus actor account status, roles, and `vision.*` permission keys.

`--verify` is read-only and separately requires the exact run ID, screen-type ID, mapping-version IDs, approved SHA, base URL, bearer token and bypass secret. It validates only the synthetic fixture, metadata and Testing status. A retained checkpoint created by an earlier approved execution may be checked by a repaired verifier only through the explicit pair `--checkpoint-approved-sha` and `--checkpoint-base-url`; provenance is never inferred. Execution provenance records the original checkpoint SHA/origin and execution evidence, while verification provenance records the current verifier SHA/origin, attested deployment SHA, timestamp and whether handover was used. Same-provenance verification needs no handover flags; cross-provenance verification requires both flags and still attests the current repository, deployment and request origin. The runner records a stable, owner-restricted checkpoint before mutation and after each transition; failure reports its checkpoint path and known IDs. Do not delete that checkpoint automatically.

Clark should establish that session in the browser or local secure environment and supply only the short-lived token environment variable; credentials, cookies and session payloads must never be pasted into chat, committed or written to evidence. The runner redacts sensitive headers and token-like values and writes execution evidence outside the repository. Any failed mutation means cleanup is required before another run.

Required sign-off evidence: the exact READY preview URL and its Git SHA, redacted checkpoint/request summaries, screenshots, console and network review, acceptance/cleanup JSON, and read-only post-cleanup counts. Confirm no direct browser table writes or storage calls. The C3B fixture has passed its single approved cross-provenance verification and remains pending exact cleanup under a separately approved cleanup-only session; storage remains absent, verification must not be rerun, general authoring remains frozen, and C3B execute mode must never be rerun.
