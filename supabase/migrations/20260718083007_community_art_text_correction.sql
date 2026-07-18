begin;

-- Community Art Studio correction: the canonical artwork is copyable text.
-- This migration refuses to remove image columns or the bucket if production
-- contains any rows or objects that would need an explicit data decision.

do $$
declare
  submission_count bigint;
  object_count bigint;
  reference_count bigint;
begin
  select count(*) into submission_count
  from public.community_art_submissions;
  select count(*) into object_count
  from storage.objects
  where bucket_id = 'community-art-submissions';
  select count(*) into reference_count
  from public.community_art_submissions
  where storage_path is not null;

  if submission_count <> 0 or object_count <> 0 or reference_count <> 0 then
    raise exception 'Community Art image correction requires review: rows %, objects %, references %.', submission_count, object_count, reference_count;
  end if;
end;
$$;

drop policy if exists community_art_storage_insert_own_prefix on storage.objects;
drop policy if exists community_art_storage_select_own_pending on storage.objects;
drop policy if exists community_art_storage_select_pending_moderator on storage.objects;
drop view if exists public.community_art_public_gallery;

alter table public.community_art_submissions
  drop constraint if exists community_art_storage_path_check,
  drop constraint if exists community_art_title_length,
  drop constraint if exists community_art_description_length,
  drop constraint if exists community_art_tags_length,
  drop constraint if exists community_art_attribution_check,
  drop constraint if exists community_art_confirmations_check,
  drop constraint if exists community_art_moderation_check,
  drop constraint if exists community_art_submissions_category_check,
  drop constraint if exists community_art_submissions_mime_type_check,
  drop constraint if exists community_art_submissions_file_size_bytes_check,
  drop constraint if exists community_art_submissions_image_width_check,
  drop constraint if exists community_art_submissions_image_height_check;

alter table public.community_art_submissions
  drop column if exists storage_path,
  drop column if exists mime_type,
  drop column if exists file_size_bytes,
  drop column if exists image_width,
  drop column if exists image_height;

alter table public.community_art_submissions
  rename column moderation_note to moderation_note_private;

alter table public.community_art_submissions
  add column artwork_text text,
  add column compatibility_status text not null default 'untested',
  add column character_count integer generated always as (char_length(artwork_text)) stored,
  add column line_count integer generated always as (
    1 + length(artwork_text) - length(replace(artwork_text, E'\n', ''))
  ) stored,
  add column submitter_feedback text;

alter table public.community_art_submissions
  alter column artwork_text set not null;

alter table public.community_art_submissions
  add constraint community_art_category_check check (category in (
    'Cats', 'Animals', 'Characters', 'Announcements', 'Battle', 'KvK',
    'Alliance', 'Flags', 'Pixel Art', 'Nature', 'Funny', 'Gaming',
    'Seasonal', 'Other'
  )),
  add constraint community_art_title_check check (char_length(title) between 1 and 120),
  add constraint community_art_description_check check (char_length(description) <= 2000),
  add constraint community_art_tags_check check (cardinality(tags) <= 10),
  add constraint community_art_text_check check (
    char_length(artwork_text) between 1 and 20000
    and char_length(trim(artwork_text)) > 0
    and line_count between 1 and 100
  ),
  add constraint community_art_compatibility_check check (compatibility_status in ('untested', 'needs_testing', 'verified', 'known_issues')),
  add constraint community_art_attribution_check check (
    (attribution_type in ('profile', 'custom') and attribution_name is not null and char_length(trim(attribution_name)) between 1 and 120)
    or (attribution_type = 'anonymous' and attribution_name is null)
  ),
  add constraint community_art_confirmations_check check (ownership_confirmed and guidelines_confirmed),
  add constraint community_art_moderation_check check (
    (status = 'pending' and moderated_by is null and moderated_at is null and published_at is null)
    or (status in ('approved', 'rejected') and moderated_by is not null and moderated_at is not null and published_at is null)
    or (status = 'published' and moderated_by is not null and moderated_at is not null and published_at is not null)
  );

revoke all on table public.community_art_submissions from anon, authenticated;
grant select (
  id, title, description, category, tags, artwork_text, compatibility_status,
  character_count, line_count, attribution_type, attribution_name, status,
  created_at, moderated_at, published_at, submitter_feedback
) on table public.community_art_submissions to authenticated;
grant insert (
  user_id, title, description, category, tags, artwork_text,
  attribution_type, attribution_name, ownership_confirmed, guidelines_confirmed
) on table public.community_art_submissions to authenticated;
grant select (
  id, title, description, category, tags, artwork_text, compatibility_status,
  character_count, line_count, attribution_name, status, published_at
) on table public.community_art_submissions to anon;

create view public.community_art_public_gallery
with (security_invoker = true, security_barrier = true)
as
select
  id,
  title,
  description,
  category,
  tags,
  artwork_text,
  compatibility_status,
  character_count,
  line_count,
  case when line_count <= 3 then 'compact' when line_count <= 8 then 'standard' else 'large' end as size_class,
  attribution_name as creator_attribution,
  published_at
from public.community_art_submissions
where status = 'published';

revoke all on table public.community_art_public_gallery from public;
grant select on table public.community_art_public_gallery to anon, authenticated;

-- Supabase protects storage.buckets from direct SQL deletion. The bucket was
-- verified empty and unreferenced; its policies are removed above. Delete it
-- later through the Storage API or dashboard after this migration is applied.

commit;
