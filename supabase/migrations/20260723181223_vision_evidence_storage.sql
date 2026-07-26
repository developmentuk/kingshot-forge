begin;

-- VISION-001C2A preparation only. Apply only after
-- 20260722193000_vision_001a_contracts_and_persistence.sql has been
-- separately approved and verified. The application and this file are never
-- intended to run together as an implicit activation.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vision-evidence',
  'vision-evidence',
  false,
  16777216,
  array['image/png', 'image/jpeg', 'image/webp', 'image/tiff']::text[]
)
on conflict (id) do nothing;

-- Browser clients do not receive INSERT, UPDATE or DELETE policies for this
-- bucket. The server initiates uploads and signed reads after validating the
-- corresponding vision_evidence_images record and actor permission. The
-- reviewer SELECT policy is intentionally limited to the governed evidence
-- review permission; no public or anon object access is created.
drop policy if exists vision_evidence_reviewer_read on storage.objects;
create policy vision_evidence_reviewer_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vision-evidence'
  and public.has_forge_permission('vision.evidence.review')
);

-- No browser mutation policy is intentional. Service-role/server-owned
-- upload and deletion operations bypass storage RLS and remain behind the
-- Forge Vision API boundary.

commit;
