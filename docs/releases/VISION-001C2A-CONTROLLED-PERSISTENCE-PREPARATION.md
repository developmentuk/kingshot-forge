# VISION-001C2A controlled persistence preparation

This handover records the completed Forge Vision persistence application and applied screen-type policy correction. The accepted C1A baseline is `512f930ccfe53770d889b907d57c2005f4f4c30b`; the activation package was introduced at `78b46612efac6a093026e875d6d75115c165eaad` on `feature/vision-mapper`, and PR #15 remains draft. The owner-approved execution commit is captured in the activation manifest.

Prepared artifacts:

- `supabase/migrations/20260723120000_vision_screen_types_read_policy_fix.sql` — applied corrective migration for the published screen-type read policy.
- `supabase/migrations/20260723181223_vision_evidence_storage.sql` — separate, deferred private evidence bucket design.
- `docs/operations/FORGE-VISION-PERSISTENCE-ACTIVATION-RUNBOOK.md` — canonical application order, stop gates, verifier, and rollback evidence.
- `docs/operations/FORGE-VISION-EVIDENCE-STORAGE-DESIGN.md` — ownership, MIME, retention, signed access, and deletion design.
- `docs/operations/FORGE-VISION-PERMISSION-TRANSITION.md` — temporary `cms.view` gate and separately activated `vision.admin.read` transition.
- `docs/TESTING/FORGE-VISION-AUTHENTICATED-ACCEPTANCE.md` — owner/admin and negative acceptance checklist.
- `shared/platform/vision/activationVerifier.ts` and `scripts/verify-forge-vision-activation.mjs` — read-only metadata verifier with fixture tests.
- `docs/operations/FORGE-VISION-ACTIVATION-MANIFEST.json` — project, ancestry and migration SHA-256 integrity manifest.
- `shared/platform/vision/activationPrecondition.ts` and `scripts/verify-forge-vision-activation-preconditions.mjs` — read-only external execution-SHA/Git/digest preflight.

The VISION-001A persistence migration and its owner-approved screen-type policy correction are applied. Independent live catalog checks confirmed seven enums, 17 tables, the governed publication function and policies, one seeded extractor plugin, and zero authored screen types, mapping versions or field mappings after cleanup. No `vision-evidence` bucket exists because storage remains deferred. The live policy now qualifies `vision_screen_types.id`. The implemented authenticated authoring boundary is operationally accepted; storage remains frozen.

Advisor observations are recorded for follow-up: 34 of 44 Vision foreign keys lack covering indexes, six Vision policies have auth RLS init-plan performance notices, and `publish_vision_mapping_version` has the expected authenticated `SECURITY DEFINER` advisor warning. Publication is internally guarded by `vision.admin.publish`; `public` and `anon` cannot execute it. No index changes are included.

Migration SHA-256 digests, including the corrective migration, are recorded in the activation manifest and runbook as canonical raw Git blob bytes at the approved execution commit. The activation precondition verifier uses those Git objects as its integrity authority; a Windows CRLF working-tree conversion may produce a different filesystem digest without changing repository content. VISION-001C3 authenticated acceptance with the disposable fixture and cleanup controls is now closed PASS; storage remains separately deferred. Vercel preview verification remains subject to the project’s authentication wall.

VISION-001C3A1 hardens that next gate locally: no execution SHA is embedded in source; execution and verification require an explicit SHA and immutable READY preview URL; protected-preview bypass is redacted; list preflight attests deployment/actor permissions; server mutations append safe correlation-aware audit events; and a restricted atomic checkpoint carries the exact fixture IDs through verification and cleanup. No authenticated acceptance API request, Supabase CLI/database operation, storage operation, migration, deployment, or release action was performed by this change.

## VISION-001C3A2 harness repair handover

The controlled C3B run created one synthetic screen type and one Testing mapping version, completed the metadata and Testing transitions, passed anonymous rejection and deployment/actor preflight, and retained four append-only audit events. C3B verify and cleanup were blocked by two repository-only harness defects: verify treated the retained fixture as a collision, and cleanup selected `id` from the composite-primary-key `vision_mapping_reference_images` table. C3A2 repairs both defects without contacting the live preview or database.

Verify mode now requires the exact retained checkpoint IDs, accepts only the single expected synthetic screen and exact version set, validates ownership, version number, Testing status and metadata, and preserves `cleanupRequired: true`. Execute-mode collision protection remains unchanged. Cleanup now uses explicit schema-aware `mapping_version_id` inspections for every child table, fails closed on errors or non-zero counts, deletes only exact IDs in version-then-screen order, and retains audit history. Mocked tests cover the repaired verify and cleanup paths, including failed checkpoints, composite-key inspection, deletion order, audit retention and fail-closed guards.

The existing C3B fixture was pending VISION-001C3B1 verify and cleanup at this handover stage; later C3A4 verification and C3B2 exact cleanup passed once. Storage remains absent, the implemented authoring boundary is accepted, and C3B execute, verification and cleanup must never be rerun.

## VISION-001C3A3 checkpoint provenance handover

The repaired verifier now supports an explicit, fail-closed handover for a retained checkpoint whose original execution SHA or preview origin differs from the current verifier. `--checkpoint-approved-sha` and `--checkpoint-base-url` are both mandatory for cross-provenance verification, must match the stored checkpoint exactly, and never bypass current repository or deployment attestation. Same-provenance verification remains unchanged and uses `handoverUsed: false`.

## VISION-001C3A4 cleanup runtime repair handover

Cross-provenance verification passed exactly once after an authenticated HTTP 200 JSON precheck. The retained checkpoint was verified and preserved the exact fixture IDs plus both execution and verification provenance records. The first cleanup attempt stopped before database access because plain Node could not resolve `server/database/supabaseAdmin.js`; no deletion occurred. C3B2 then completed the separately approved exact-ID cleanup; verification must not be rerun.

The canonical cleanup command is `npm run cleanup:forge-vision-acceptance -- <arguments>`, which uses `node --import tsx` and dynamically loads the actual `server/database/supabaseAdmin.ts` module. Operators must not use the former plain-Node command. Exact-ID cleanup, seven zero child counts, four retained audit events, absent storage, and checkpoint authority remain unchanged. C3B execute mode must never be rerun.

Successful verification preserves the original execution provenance and appends separate verification provenance containing the current verifier SHA/origin, attested deployment SHA, verification timestamp and handover metadata. Exact fixture IDs, cleanupRequired and mutationPerformed remained unchanged through cleanup. Cleanup preserved both provenance records while retaining append-only audit events and exact-ID-only deletion semantics. No live verify, cleanup, HTTP request, Supabase/database activity, checkpoint modification or fixture change occurred in C3A3. The C3B fixture was removed by exact-ID cleanup in C3B2; C3B execute, verification and cleanup must never be rerun.

## VISION-001C3C authenticated acceptance closeout

VISION-001C is closed PASS for the implemented authenticated authoring boundary. Anonymous access was rejected; owner/admin permission checks, screen-type creation, Draft mapping-version creation, metadata update, Draft → Testing transition, server-authoritative audit creation, cross-provenance verification and exact-ID cleanup all passed. The synthetic screen and mapping records were removed, all Vision authoring and child tables returned to zero, exactly four append-only audit events remain, and the `vision-evidence` bucket remains absent.

Persistence and the current authoring boundary are operationally accepted. Storage remains frozen; worker extraction, regions, field mappings, testing workflows and publication remain future governed stages. No real Kingshot mapping was created. The C3A → C3A1 → C3A2 → C3A3 → C3A4 → C3B → C3B1 → C3B2 → C3C relationship is preserved in the FRKS closeout record.

## VISION-001D1 secure evidence storage governance preparation

D1A reviewed the frozen private-bucket migration without applying it and prepared
a provider-neutral server-only lifecycle boundary, upload-intent correction,
retention policy, threat model, activation runbook and mocked failure-injection
tests. The frozen migration remains unchanged and the `vision-evidence` bucket,
objects, policies and evidence rows remain absent. No worker, OCR, real image,
HTTP request, Supabase operation or migration application was performed.

The prepared boundary verifies owner, purpose, consent, MIME, size, exact path,
dimensions, SHA-256 and storage HEAD metadata before recording trusted evidence;
it limits signed reads to five minutes, blocks duplicate active hashes and legal
holds, deletes by exact evidence ID/path, and retains minimum audit metadata.
Worker extraction, regions, field mappings, testing, publication, storage
activation and any live object test are deferred to separately approved stages.

## VISION-001D1A2 Supabase adapter and activation harness

D1A2 resolved the pre-activation integration gaps without contacting Supabase.
The selected upload pattern is an exact-path Supabase signed upload URL: Forge
intent validity is 15 minutes while the provider credential is represented as
its true two-hour lifetime. Completion never trusts client metadata or
object-info alone; the server downloads the exact private object with no-store
semantics, enforces the 16 MiB limit, computes SHA-256 from bytes and derives
dimensions from bounded PNG/JPEG/WebP/TIFF headers before recording evidence.

The concrete repository, Storage provider, server API actions and mocked
activation harness are checked in. The harness defaults to synthetic in-memory
execution and its explicit `--execute` path fails closed in D1A2. A new
unapplied adapter-support migration adds the exact byte-length column required
by the verified metadata contract. Both prior migrations remain unchanged and
unapplied; storage remains inactive and D1B remains separately owner-approved.
## Follow-up status

VISION-001D1B remains a halted synthetic activation. VISION-001D1A3 is repository-only repair work for typed validation and exact cleanup orchestration; it does not authorize activation, cleanup, migration changes, or production promotion.
## D1A4 follow-up

The migrations remain applied and the activation remains halted. D1A4 completes the repository cleanup boundary only; it does not retry activation or mutate the live incident.
