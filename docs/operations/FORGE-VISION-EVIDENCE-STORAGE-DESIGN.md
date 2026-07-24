# Forge Vision Evidence Storage Design

Status: governed design, prepared and unapplied
Bucket: `vision-evidence`  
Separate migration: `supabase/migrations/20260723181223_vision_evidence_storage.sql`

The frozen bucket foundation is private and accepts PNG, JPEG, WebP and TIFF
images up to 16 MiB and 40 million pixels. It remains unapplied. The lifecycle correction is prepared
in `supabase/migrations/20260724140000_vision_evidence_storage_governance.sql`;
see the governance and activation runbook for the separate approval gate.
The storage object path is server-generated and purpose-bound:

```text
<owner-user-id>/<purpose>/<evidence-image-uuid>.<normalised-extension>
```

Allowed purposes are `mapping_reference`, `test_case`, `scan_source` and
`evidence_crop`. The server creates an upload intent first, then creates the
corresponding `vision_evidence_images` row only after exact private-byte
download, signature, dimensions and SHA-256 verification. Browser clients never choose arbitrary bucket names,
object paths or retention values.

There are no authenticated INSERT, UPDATE or DELETE policies on
`storage.objects` for this bucket. Upload initiation, signed upload creation,
signed reads, deletion requests and orphan cleanup are server-authoritative.
The only authenticated object SELECT policy is for actors with
`vision.evidence.review`; ordinary users receive no unrestricted listing or
object access. No public bucket or public object URL is permitted.

Mapping-reference and test-case images are visible to authorised Vision
reviewers through short-lived signed URLs. Scan-source images are owner-bound
in `vision_evidence_images` and are served through the server after an explicit
owner or evidence-review permission check. Evidence crops inherit the source
scan retention and are never independently public.

Retention is recorded in `retention_until`, with deletion request and
completion timestamps in the evidence row. A scheduled server-owned cleanup
job should delete expired objects only after confirming the metadata row and
write an audit event; orphan scans must report and quarantine rather than
silently delete. User deletion requests revoke access, enqueue governed object
deletion and retain only the minimum audit metadata required by policy.

Operational logs may contain evidence UUID, purpose, actor class, byte count,
digest prefix, outcome and duration. They must not contain image bytes, signed
URLs, raw OCR text, object paths containing user IDs, secrets or unrestricted
storage errors. Evidence is not used for model training without separate,
explicit consent and governance approval.

The migration intentionally does not change existing buckets or broad storage
grants. Before application, the operator must recheck storage policies because
policy composition is permissive and an unrelated broad policy could defeat a
bucket-specific design. D1A does not apply either migration or create any
storage state.

The complete D1A lifecycle, threat model and activation gates are recorded in
`docs/operations/FORGE-VISION-EVIDENCE-STORAGE-GOVERNANCE.md`,
`docs/security/FORGE-VISION-EVIDENCE-STORAGE-THREAT-MODEL.md` and
`docs/operations/FORGE-VISION-EVIDENCE-STORAGE-ACTIVATION-RUNBOOK.md`.
