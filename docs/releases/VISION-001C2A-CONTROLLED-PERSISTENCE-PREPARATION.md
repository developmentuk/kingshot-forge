# VISION-001C2A controlled persistence preparation

This release prepares, but does not activate, Forge Vision persistence. The accepted C1A baseline is `512f930ccfe53770d889b907d57c2005f4f4c30b`; the activation package was introduced at `78b46612efac6a093026e875d6d75115c165eaad` on `feature/vision-mapper`, and PR #15 remains draft. The owner-approved execution commit is supplied externally at activation time and is never predicted inside this self-changing package.

Prepared artifacts:

- `supabase/migrations/20260723181223_vision_evidence_storage.sql` — separate, unapplied private evidence bucket design.
- `docs/operations/FORGE-VISION-PERSISTENCE-ACTIVATION-RUNBOOK.md` — canonical application order, stop gates, verifier, and rollback evidence.
- `docs/operations/FORGE-VISION-EVIDENCE-STORAGE-DESIGN.md` — ownership, MIME, retention, signed access, and deletion design.
- `docs/operations/FORGE-VISION-PERMISSION-TRANSITION.md` — temporary `cms.view` gate and separately activated `vision.admin.read` transition.
- `docs/TESTING/FORGE-VISION-AUTHENTICATED-ACCEPTANCE.md` — owner/admin and negative acceptance checklist.
- `shared/platform/vision/activationVerifier.ts` and `scripts/verify-forge-vision-activation.mjs` — read-only metadata verifier with fixture tests.
- `docs/operations/FORGE-VISION-ACTIVATION-MANIFEST.json` — project, ancestry and migration SHA-256 integrity manifest.
- `shared/platform/vision/activationPrecondition.ts` and `scripts/verify-forge-vision-activation-preconditions.mjs` — read-only external execution-SHA/Git/digest preflight.

The migration review found no reason to apply the persistence contract in this preparation task. Live Supabase catalog checks showed the VISION-001A migration unapplied, zero Vision tables, no Vision bucket, no Vision functions, and the expected existing Forge role set. No Supabase migration, bucket creation, or live database write was performed.

Migration SHA-256 digests are recorded in the activation manifest and runbook. Go/no-go: no-go for activation in this task. The branch is ready for owner-approved controlled activation after authenticated acceptance, final migration review, and explicit application of the two migrations in their documented order. Vercel preview verification remains subject to the project’s authentication wall.
