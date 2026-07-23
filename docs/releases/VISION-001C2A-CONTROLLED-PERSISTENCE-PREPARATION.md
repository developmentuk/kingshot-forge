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

The VISION-001A persistence migration and its owner-approved screen-type policy correction are applied. Independent live catalog checks confirmed seven enums, 17 tables, the governed publication function and policies, one seeded extractor plugin, and zero authored screen types, mapping versions or field mappings. No `vision-evidence` bucket exists because storage remains deferred. The live policy now qualifies `vision_screen_types.id`. Authoring remains frozen until separately approved authenticated acceptance completes.

Advisor observations are recorded for follow-up: 34 of 44 Vision foreign keys lack covering indexes, six Vision policies have auth RLS init-plan performance notices, and `publish_vision_mapping_version` has the expected authenticated `SECURITY DEFINER` advisor warning. Publication is internally guarded by `vision.admin.publish`; `public` and `anon` cannot execute it. No index changes are included.

Migration SHA-256 digests, including the corrective migration, are recorded in the activation manifest and runbook as canonical raw Git blob bytes at the approved execution commit. The activation precondition verifier uses those Git objects as its integrity authority; a Windows CRLF working-tree conversion may produce a different filesystem digest without changing repository content. The next gate is VISION-001C3 authenticated acceptance with the disposable fixture and cleanup controls; storage remains separately deferred. Vercel preview verification remains subject to the project’s authentication wall.
