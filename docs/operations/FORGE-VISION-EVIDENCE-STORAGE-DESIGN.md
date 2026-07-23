# Forge Vision Evidence Storage Design

Status: designed, unapplied  
Bucket: `vision-evidence`  
Separate migration: `supabase/migrations/20260723181223_vision_evidence_storage.sql`

The bucket is private. It accepts PNG, JPEG, WebP and TIFF images up to 16 MiB.
The storage object path is server-generated and purpose-bound:

```text
<owner-user-id>/<purpose>/<evidence-image-uuid>.<normalised-extension>
```

Allowed purposes are `mapping_reference`, `test_case`, `scan_source` and
`evidence_crop`. The server creates the corresponding
`vision_evidence_images` row and validates owner, purpose, digest, dimensions,
MIME type, retention and mapping/test-case association before initiating an
upload. Browser clients never choose arbitrary bucket names, object paths or
retention values.

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
bucket-specific design.
