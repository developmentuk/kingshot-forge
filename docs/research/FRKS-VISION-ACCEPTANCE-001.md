# FRKS-VISION-ACCEPTANCE-001 — VISION-001C Authenticated Acceptance Closeout

Status: **PASS / operationally accepted for implemented scope**  
Closeout: VISION-001C3C  
Programme: Forge Vision  
Repository: `developmentuk/kingshot-forge`  
Acceptance branch: `feature/vision-mapper`  
Acceptance closeout commit: `0338c4de778be3ac075f773fe5be4fc6b95cea56`

## Decision

VISION-001C authenticated owner/admin authoring acceptance passed. Anonymous access was rejected; authenticated permission checks passed; screen-type creation, Draft mapping-version creation, metadata update and Draft → Testing transition passed; server-authoritative audit events were created; cross-provenance verification passed; and exact-ID cleanup passed.

The disposable synthetic screen type and mapping version were removed. Final Vision authoring and child-table counts are zero. Four append-only audit events remain, with credential-free payloads and retained actor/entity references. Evidence storage remains excluded and the `vision-evidence` bucket remains absent. No real Kingshot mapping was created.

## Evidence summary

- Exact synthetic fixture: `acceptance-vision-c3b-20260724-a01` / `forge_acceptance`.
- Exact cleanup order: mapping version first, screen type second.
- Final checkpoint: `status: cleaned`, `cleanupRequired: false`, `deleted: true`.
- Execution and verification provenance records remain preserved; verification handover remains recorded.
- Final counts: screen types, mapping versions, reference images, regions, field mappings, test cases, test results, scan runs and extraction evidence all zero.
- Retained event types: `vision.screen_type.created`, `vision.mapping.draft_created`, `vision.mapping.metadata_updated`, `vision.mapping.submitted_testing`.

## Security controls proven

- Anonymous API access rejected; owner/admin permissions required for authoring.
- Exact SHA, immutable preview and actor/permission preflight gates were enforced.
- Protected-preview credentials were redacted and not persisted in evidence.
- Cleanup was exact-ID-only, schema-aware, fail-closed on child records, and append-only-audit safe.
- No wildcard, prefix, manual SQL, Supabase CLI, storage operation or credential disclosure occurred.

## Defects corrected

- C3A1: acceptance gates, deployment/actor attestation, redaction, audit context and checkpoint controls.
- C3A2: retained-fixture verification and composite-key child inspection repairs.
- C3A3: explicit cross-provenance checkpoint handover.
- C3A4: TypeScript admin runtime loading and canonical cleanup command.

## Relationship and remaining boundary

This closeout preserves the sequence: C3A → C3A1 → C3A2 → C3A3 → C3A4 → C3B → C3B1 → C3B2 → C3C. C3B execute, verification and cleanup must never be rerun.

Storage remains frozen. Worker extraction, regions, field mappings, testing workflows and publication remain deferred future governed stages. No VISION-001D work is started by this record.

## VISION-001D1 governance preparation

D1A records the secure evidence storage design as prepared, unapplied and inactive.
The frozen storage migration remains unchanged; the prepared corrective migration
adds upload-intent lifecycle state, verified-object provenance, legal hold,
bounded deletion metadata and an active SHA-256 duplicate guard. The server-only
provider boundary and mocked tests cover ownership, consent, exact paths, MIME,
size, object verification, signed URL limits, abandonment, exact deletion,
retention and audit isolation.

No bucket, object, evidence row, worker job or live storage/API state was created
or changed. The next stage requires separate owner approval and fresh activation
evidence. D1A does not authorize D1D2 worker extraction.

## VISION-001D1A2 adapter preparation

D1A2 identified and resolved the missing concrete Supabase repository/provider
boundary and the mismatch between the 15-minute Forge intent and Supabase's
two-hour signed upload credential. The canonical decision is exact-path signed
upload with explicit late-upload orphan containment. Server-side verification
downloads exact private bytes, applies a 16 MiB bound, computes SHA-256, parses
PNG/JPEG/WebP/TIFF signatures and dimensions, enforces a 40-million-pixel cap,
and rejects signature/MIME disagreement or truncation.

The repository maps upload intents, evidence metadata and append-only audit
events through `getSupabaseAdmin`; the provider uses only Storage API download,
signed URL and exact single-path remove. The API actions are strict,
server-authorised and canonical-write/worker-free. The mocked activation harness
proves exact IDs, path, digest, dimensions, expiry, cross-boundary cleanup and
retained audit events without network access. The adapter-support migration is
prepared but unapplied. D1B remains separately owner-approved.
## D1B status and D1A3 repair

The evidence storage migrations are provisioned, but the synthetic activation is halted and remains NO-GO for acceptance. D1A3 repairs typed validation and adds a mocked exact incident cleanup harness; it does not access Supabase or change the live incident.
## D1A4 status

The live synthetic incident remains unchanged and acceptance remains NO-GO. D1A4 repairs gateway wiring, structured retained evidence, Git and expiry gates, and the seven-to-eight audit transition. A new owner approval is required before any exact cleanup attempt.

D1A5 repairs total versus incident-specific audit counts and migration-ledger verification. No live access or cleanup occurred.

D1A6 repairs governance capture wiring; the exact cleanup remains pending the authorized fresh captures and one execution.

## Final incident closure

The separately approved exact synthetic evidence cleanup completed once at `2026-07-24T17:37:18.700791Z` on `125c40a4f9d5c894c13a9bcd2f0a25bf726eca25`. The object, both upload intents, all evidence rows and all Storage objects are absent. Eight total Vision audit events remain, four incident-specific, and the original four VISION-001C audit events are unchanged. The private bucket and applied migrations remain active with governance controls intact. No activation, OCR or worker execution occurred.

## VISION-LINK-001A status

The subsequent OCR Account Linking MVP uses the already-provisioned private
evidence boundary and does not reopen the closed synthetic incident. The
corrective pass adds immediate safe Player ID prefill without lookup/link
mutation, exact owner cancellation for completed account-linking evidence,
and a browser response that excludes raw OCR text. Preview Tesseract runtime
health, authenticated synthetic acceptance and real-screen calibration remain
separate owner gates; no production promotion is claimed.
## VISION-LINK-001C runtime acceptance evidence

The checked-in synthetic acceptance PNG is
`fixtures/vision/account-linking/synthetic-profile.png`. Manifest SHA-256:
`c1293cf0d08e9aa41cdc10f0bf484d1f1805d376b96b043cc22fd570c3f29071`.
It contains only synthetic values: Player ID `987654321`, name `EMBER FOX`
and kingdom `42`. The real-runtime test loads the PNG and asserts the actual
Tesseract.js candidate rather than treating parser-only text as runtime proof.
The fixture is not evidence of real-screen Kingshot accuracy.

## VISION-LINK-003 and VISION-LINK-004 calibration record

The genuine V2 owner acceptance was NO-GO: Kingdom succeeded, unsafe Player ID
output was suppressed, the mandatory Player ID failed, and the damaged display
name remained review-only. No real account value is recorded here. V3 responds
with configured line and icon-excluding numeric geometry, four bounded OCR
observations, executed greyscale and threshold preprocessing, deterministic
label-context consensus, and safe browser diagnostics. Synthetic and adversarial
tests use fake values only; no real screenshot or account data is committed.

## VISION-LINK-005 component-based extraction

The owner-supplied map demonstrated that the previous line-oriented model was
the wrong abstraction. V4 separately maps the avatar, alliance tag, display
name, ID label, ID digits, clipboard exclusion, Town Centre components and
Kingdom label/digits while retaining v1-v3. Player ID can only come from the
configured digits crop and requires context, two agreeing observations, one
strong `.55` observation and one supporting `.35` observation. Synthetic PNG
and JPEG fixtures contain fake values only; no live evidence or database
mutation is recorded.
