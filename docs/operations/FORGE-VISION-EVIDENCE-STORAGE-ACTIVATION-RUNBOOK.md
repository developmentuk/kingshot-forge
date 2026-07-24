# Forge Vision evidence storage activation runbook

Status: **future owner-approved VISION-001D1B only — do not execute in D1A**
Project: `hrvdhjscwitqpwjhnjkm`
Required branch: `feature/vision-mapper`

## Exact artifacts

- Original persistence migration: `supabase/migrations/20260722193000_vision_001a_contracts_and_persistence.sql`.
- Frozen storage migration: `supabase/migrations/20260723181223_vision_evidence_storage.sql`.
- Frozen storage migration SHA-256: `0b7a3f7a0c8ac2db78bc9d172c7efcdff17ed4c807867ef67af80aadc77104dd`.
- Prepared corrective migration: `supabase/migrations/20260724140000_vision_evidence_storage_governance.sql`.
- Adapter-support migration: `supabase/migrations/20260724153000_vision_evidence_adapter_support.sql`.

The original storage migration and corrective migration must be reconciled against their approved Git blob hashes before application. No migration is applied by this runbook document.

## Stop gates

Stop if the branch is not `feature/vision-mapper`, the worktree is dirty, the approved SHA is not exact, the Supabase project is not `hrvdhjscwitqpwjhnjkm`, either migration hash differs, the original persistence migration is not already verified, a `vision-evidence` bucket or policy already exists unexpectedly, migration ledger state is ambiguous, or any credential/actor/approval evidence is missing.

## Future application procedure

1. Obtain separate owner approval naming the exact commit, project, migrations and operator.
2. Run the repository, migration-hash and project-binding preflight; capture read-only output.
3. Inspect existing Storage buckets and policies for collisions; expect no `vision-evidence` bucket or bucket-specific policy.
4. Inspect migration history and reconcile the original Vision persistence migration as already applied.
5. Apply the frozen storage migration, then the prepared governance and adapter-support corrections, through the separately approved migration workflow.
6. Verify the private bucket, exact MIME allowlist, 16 MiB limit, upload-intent constraints, RLS/grants and absence of anonymous access.
7. Verify authenticated owner/user/reviewer boundaries and that service-role access exists only server-side.
8. Create one synthetic test object through the service boundary with explicit consent/purpose; never use a real screenshot.
9. Verify exact metadata computed from downloaded bytes, SHA-256, dimensions, signature/MIME agreement, two-hour provider upload lifetime versus 15-minute Forge intent, five-minute signed-read expiry and audit events.
10. Exercise an expired intent, late-upload orphan containment, cross-owner denial, malformed path, unsupported MIME, oversized file, excessive pixels, duplicate hash and metadata-failure containment.
11. Delete the exact test object and metadata through the retention workflow; verify zero test objects and retained audit metadata.
12. Record the final bucket/policy/catalogue/migration evidence and owner decision.

## Failure containment and rollback

Do not manually delete by prefix or issue SQL outside the approved migration workflow. If an object exists without verified metadata, quarantine it by exact path and stop. If metadata exists without an object, retain the audit trail and mark the discrepancy for reconciliation. If policy or migration state differs, stop without mutation. Rollback requires a separately reviewed forward migration or exact provider deletion workflow; never rewrite the frozen migration or weaken append-only controls.

## Required evidence

The repository-only mocked harness is `node --import tsx scripts/run-forge-vision-evidence-activation.mjs`; it performs exact local gates and a synthetic in-memory lifecycle. `--execute` is an explicit fail-closed boundary and is disabled in D1A2. Capture exact commit and migration hashes, project binding, migration ledger, bucket configuration, policies, anonymous denial, authenticated owner/reviewer matrix, signed URL expiry, synthetic object digest, zero-object post-cleanup counts, retained audit metadata, logs without secrets/URLs/image bytes, and the owner approval. Do not claim activation or legal compliance without this evidence.
