# Forge Vision evidence storage governance

Status: **prepared, unapplied, and not activated**
Programme: VISION-001D1
Project: `hrvdhjscwitqpwjhnjkm`
Bucket: `vision-evidence`

This document defines the private evidence boundary for a future separately approved activation. It does not create a bucket, upload an object, apply a migration, run a worker, or create an evidence record.

## Frozen migration review

The canonical frozen migration is `supabase/migrations/20260723181223_vision_evidence_storage.sql` with SHA-256 `0b7a3f7a0c8ac2db78bc9d172c7efcdff17ed4c807867ef67af80aadc77104dd`. It remains unchanged, unapplied and excluded.

It correctly establishes a private bucket, the four allowlisted image MIME types, a 16 MiB limit, and reviewer-only authenticated object reads. It creates no public URL policy and no browser INSERT, UPDATE or DELETE policy. The migration is therefore safe as the storage-bucket foundation, but it is not sufficient as the complete lifecycle boundary.

Gaps requiring the prepared corrective migration `supabase/migrations/20260724140000_vision_evidence_storage_governance.sql` are:

- no short-lived upload-intent or abandoned-upload state;
- no database-enforced exact object-path grammar;
- no verified-object timestamp tying metadata to a server HEAD plus SHA-256 check;
- no legal/moderation hold field;
- no bounded deletion reason or explicit active-hash duplicate guard;
- no database lifecycle state connecting an upload reservation to evidence metadata;
- no owner-required constraint for scan-source evidence.

The corrective migration is prepared but must remain unapplied until a new owner-approved activation session. Neither migration is silently rewritten.

## Upload-pattern decision

The canonical pattern is **C: Supabase signed upload URL with exact server-owned
path and intent binding**. Pattern A, server-mediated upload, would avoid a
reusable browser credential but cannot safely claim support for the governed 16
MiB maximum across the current Vercel request-body and function-timeout envelope
without a separately approved hosting/runtime proof. Pattern B, authenticated
direct upload, would require a new narrowly scoped Storage INSERT policy,
authenticated-session binding, no-overwrite enforcement and an additional live
RLS proof. Pattern C uses the existing provider behaviour, has zero recurring
infrastructure cost, and keeps the browser unable to choose a bucket or path.

Forge intent expiry is 15 minutes. Supabase's signed upload credential is
represented as its actual two-hour lifetime and is never mislabeled as a
15-minute token. A late upload therefore remains possible after Forge intent
expiry; completion rejects expired intents, and the exact reserved path is
quarantined/deleted by the governed orphan workflow. The two lifetimes are
deliberately separate in the contracts and adapter response.

## Server-only boundary

`server/vision/evidenceStorageService.ts` implements the provider-neutral orchestration boundary. Its provider adapter is the only layer permitted to know storage SDK details. Browser code receives no storage secret, bucket name authority, unrestricted path authority or permanent URL.

`server/vision/evidence/supabaseVisionEvidenceRepository.ts` maps the exact
upload-intent, evidence-image and append-only audit operations through the
server Supabase client factory. `server/vision/evidence/supabaseVisionEvidenceProvider.ts`
uses Storage API signed upload/read, exact-object download and exact-path remove;
it never deletes `storage.objects` through SQL.

Supported operations are:

- `createUploadIntent` — validates active ownership, purpose, consent, MIME, size and retention, then generates the exact path and short-lived signed upload URL;
- `completeUpload` — HEAD-verifies bucket/path, bytes, MIME, dimensions and SHA-256 before trusted metadata is recorded;
- `getEvidenceMetadata` — owner or explicit evidence-review access only;
- `createShortLivedReadUrl` — owner/reviewer access, maximum five-minute expiry, no public URL;
- `verifyStoredObject` — exact metadata/object comparison;
- `requestEvidenceDeletion` — exact evidence ID and bounded reason;
- `executeRetentionDeletion` — reviewer-only exact-path deletion, blocked by legal hold, retaining audit metadata;
- `abandonUpload` — exact intent cancellation with audit history.

The service never invokes OCR, starts a worker, writes canonical game data, selects an arbitrary bucket/path, accepts a client-owned path, or treats upload success as data verification.

## Evidence lifecycle

1. Create an upload intent with purpose, owner, consent where required, MIME, byte limit and retention.
2. Generate a server-owned path: `<owner-uuid>/<purpose>/<evidence-uuid>.<extension>`.
3. Issue a short-lived signed upload URL for the fixed private bucket.
4. Upload the object privately.
5. Download the exact private object server-side with no-store semantics and
   verify byte length, MIME signature, dimensions and SHA-256 from the bytes.
6. Reject unsupported, oversized, malformed, duplicate or mismatched objects.
7. Record verified evidence metadata only after object verification succeeds.
8. Link evidence to a mapping reference, test case or scan through separately governed operations.
9. Issue short-lived signed read URLs only to the owner or authorised reviewers.
10. Hand verified evidence to a separately governed worker; never start extraction implicitly.
11. Enforce purpose-specific retention and preserve legal/moderation holds.
12. Request deletion by exact evidence ID and reason.
13. Delete the exact storage path through the provider adapter.
14. Mark metadata deleted and retain minimum audit metadata without image bytes.
15. Reconcile failures and orphan objects through a controlled retention workflow.

Failure behaviour is fail-closed: an upload failure abandons the intent; metadata failure triggers exact-object containment and does not create trusted evidence; a storage/database disagreement remains reviewable and is never silently repaired; expired signed URLs are unusable; duplicate hashes do not create a second active record; user deletion revokes access and schedules governed deletion; legal or moderation holds block deletion; worker failure leaves evidence unconfirmed and auditable.

## Retention and privacy contract

| Purpose | Default | Maximum | Extension authority |
| --- | ---: | ---: | --- |
| Mapping reference | 30 days | 365 days | Evidence reviewer only |
| Administrative test case | 30 days | 180 days | Evidence reviewer only |
| User scan source | 7 days | 30 days | Evidence reviewer only |
| Derived evidence crop | 7 days | 30 days | Evidence reviewer only; inherits source hold |
| Failed upload intent | 1 day | 7 days | Retention operator |

The existing seven-day default is not applied blindly: reference and administrative test evidence need a longer review window, while user sources and derived crops remain short-lived. These are product governance defaults, not a legal-compliance claim. Originals and crops are never public. Profile screenshots are treated as potentially personally identifying; access is owner/reviewer-bound, logs exclude image bytes, signed URLs and raw OCR text, and model training requires separate explicit consent.

## Security invariants

- Private bucket only; no permanent public URLs.
- Fixed bucket and server-generated exact paths only.
- Owner equality is checked against the authenticated actor; reviewer permission is explicit.
- MIME, extension, byte size, dimensions and SHA-256 are independently verified.
- Storage metadata is not trusted until the object is verified.
- Audit events contain lifecycle metadata only, never image bytes, signed URLs, secrets or raw OCR text.
- Evidence cannot automatically update player, profile, alliance, kingdom or published game data.
- Published mappings remain immutable.

Activation is **NO-GO** until the runbook is separately approved and its migration, policy collision, authenticated boundary, signed-URL, test-object cleanup and zero-object evidence are captured.
