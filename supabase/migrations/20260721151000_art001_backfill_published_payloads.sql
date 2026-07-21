begin;

-- Existing published Community Art is already approved by the legacy workflow.
-- Preserve its publication state while creating the ART-001 payload boundary.
update public.community_art_submissions
set approved_copy_payload = normalised_text,
    approved_payload_hash = md5(normalised_text),
    approved_payload_version = 1
where status = 'published'
  and approved_copy_payload is null;

insert into public.community_art_payload_versions
  (artwork_id, version, payload, payload_hash, render_profile, repair_operations, created_by)
select id, 1, approved_copy_payload, approved_payload_hash,
       compatibility_profile, repair_operations, coalesce(moderated_by, user_id)
from public.community_art_submissions
where status = 'published'
  and approved_copy_payload is not null
on conflict (artwork_id, version) do nothing;

commit;
