begin;

-- Release 0.7.4 Community Art Studio.
-- Rollback (after disabling application code): drop the public view, policies,
-- table and dedicated storage bucket created by this migration.

do $$
begin
  if exists (select 1 from storage.buckets where id = 'community-art-submissions') then
    if exists (
      select 1
      from storage.buckets
      where id = 'community-art-submissions'
        and (
          public is true
          or file_size_limit <> 5242880
          or allowed_mime_types is distinct from array['image/jpeg', 'image/png', 'image/webp']::text[]
        )
    ) then
      raise exception 'community-art-submissions bucket exists with incompatible settings';
    end if;
  else
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'community-art-submissions',
      'community-art-submissions',
      false,
      5242880,
      array['image/jpeg', 'image/png', 'image/webp']::text[]
    );
  end if;
end;
$$;

create table public.community_art_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  description text not null default '',
  category text not null check (category in (
    'alliance_banner',
    'profile_banner',
    'player_name_design',
    'chat_decoration',
    'alliance_art',
    'other'
  )),
  tags text[] not null default '{}',
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 5242880),
  image_width integer not null check (image_width between 128 and 4096),
  image_height integer not null check (image_height between 128 and 4096),
  attribution_type text not null check (attribution_type in ('profile', 'custom', 'anonymous')),
  attribution_name text,
  ownership_confirmed boolean not null default false,
  guidelines_confirmed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'published')),
  moderation_note text,
  moderated_by uuid references auth.users(id) on delete restrict,
  moderated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_art_title_length check (char_length(title) between 1 and 120),
  constraint community_art_description_length check (char_length(description) <= 2000),
  constraint community_art_tags_length check (cardinality(tags) <= 10),
  constraint community_art_storage_path_check check (
    storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  ),
  constraint community_art_attribution_check check (
    (attribution_type in ('profile', 'custom') and attribution_name is not null and char_length(trim(attribution_name)) between 1 and 120)
    or (attribution_type = 'anonymous' and attribution_name is null)
  ),
  constraint community_art_confirmations_check check (ownership_confirmed and guidelines_confirmed),
  constraint community_art_moderation_check check (
    (status = 'pending' and moderated_by is null and moderated_at is null and moderation_note is null and published_at is null)
    or (status in ('approved', 'rejected') and moderated_by is not null and moderated_at is not null and published_at is null)
    or (status = 'published' and moderated_by is not null and moderated_at is not null and published_at is not null)
  )
);

create index community_art_submissions_user_created_idx
  on public.community_art_submissions (user_id, created_at desc);
create index community_art_submissions_moderation_queue_idx
  on public.community_art_submissions (status, created_at asc)
  where status = 'pending';
create index community_art_submissions_public_gallery_idx
  on public.community_art_submissions (category, published_at desc)
  where status = 'published';

create or replace function public.set_community_art_submission_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger community_art_submissions_updated_at
before update on public.community_art_submissions
for each row execute function public.set_community_art_submission_updated_at();

alter table public.community_art_submissions enable row level security;
alter table public.community_art_submissions force row level security;

revoke all on table public.community_art_submissions from anon, authenticated;
grant select, insert on table public.community_art_submissions to authenticated;

create policy community_art_submissions_select_owner
on public.community_art_submissions
for select to authenticated
using ((select auth.uid()) = user_id);

create policy community_art_submissions_select_moderator
on public.community_art_submissions
for select to authenticated
using ((select public.has_forge_permission('moderation.manage')));

create policy community_art_submissions_insert_pending_owner
on public.community_art_submissions
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and moderated_by is null
  and moderated_at is null
  and moderation_note is null
  and published_at is null
);

create policy community_art_submissions_select_published_public
on public.community_art_submissions
for select to anon, authenticated
using (status = 'published');

grant select (
  id, title, description, category, tags, attribution_type,
  attribution_name, mime_type, image_width, image_height, published_at
)
on table public.community_art_submissions to anon;

create or replace view public.community_art_public_gallery
with (security_invoker = true, security_barrier = true)
as
select
  id,
  title,
  description,
  category,
  tags,
  attribution_name as creator_attribution,
  mime_type,
  image_width,
  image_height,
  published_at
from public.community_art_submissions as submission
where status = 'published';

revoke all on table public.community_art_public_gallery from public;
grant select on table public.community_art_public_gallery to anon, authenticated;

create policy community_art_storage_insert_own_prefix
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'community-art-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy community_art_storage_select_own_pending
on storage.objects
for select to authenticated
using (
  bucket_id = 'community-art-submissions'
  and exists (
    select 1
    from public.community_art_submissions as submission
    where submission.storage_path = name
      and submission.user_id = (select auth.uid())
      and submission.status = 'pending'
  )
);

create policy community_art_storage_select_pending_moderator
on storage.objects
for select to authenticated
using (
  bucket_id = 'community-art-submissions'
  and (select public.has_forge_permission('moderation.manage'))
  and exists (
    select 1
    from public.community_art_submissions as submission
    where submission.storage_path = name
      and submission.status = 'pending'
  )
);

commit;
