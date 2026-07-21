begin;

create extension if not exists pgcrypto;

-- ART-002: raw source is an immutable binary boundary. Moderation capability is
-- deliberately separate from verification and CMS viewing permissions.
alter table public.community_art_submissions
  add column if not exists raw_source_sha256 text,
  add column if not exists raw_source_byte_length integer;

update public.community_art_submissions
set raw_source_sha256 = coalesce(raw_source_sha256, encode(digest(convert_to(raw_source_text, 'UTF8'), 'sha256'), 'hex')),
    raw_source_byte_length = coalesce(raw_source_byte_length, octet_length(raw_source_text));

alter table public.community_art_submissions
  alter column raw_source_sha256 set not null,
  alter column raw_source_byte_length set not null;

alter table public.community_art_submissions enable row level security;
alter table public.community_art_submissions force row level security;

create or replace function public.prevent_community_art_raw_source_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (new.raw_source_text is distinct from old.raw_source_text or new.raw_source_sha256 is distinct from old.raw_source_sha256 or new.raw_source_byte_length is distinct from old.raw_source_byte_length) then
    raise exception 'raw source artifact is immutable';
  end if;
  return new;
end;
$$;

-- Replace the broad authenticated select grant from ART-001. Own submissions
-- remain available through the server-authorised API; raw source is moderator-only.
revoke select on table public.community_art_submissions from authenticated;
grant select (id,title,description,category,tags,normalised_text,approved_copy_payload,rendered_preview_payload,compatibility_profile,repair_operations,approved_payload_hash,approved_payload_version,compatibility_status,character_count,line_count,attribution_type,attribution_name,status,created_at,moderated_at,published_at,submitter_feedback) on public.community_art_submissions to authenticated;
revoke select on table public.community_art_submissions from anon;
grant select (id,title,description,category,tags,approved_copy_payload,rendered_preview_payload,compatibility_profile,approved_payload_hash,approved_payload_version,compatibility_status,character_count,line_count,attribution_name,status,published_at) on public.community_art_submissions to anon;
grant select (id,title,description,category,tags,artwork_text,raw_source_text,raw_source_sha256,raw_source_byte_length,normalised_text,approved_copy_payload,rendered_preview_payload,compatibility_profile,repair_operations,source_hash,approved_payload_hash,approved_payload_version,compatibility_status,character_count,line_count,attribution_type,attribution_name,status,created_at,moderated_at,published_at,submitter_feedback,user_id) on public.community_art_submissions to service_role;

commit;
