begin;

-- ART-001: preserve the submitted source and version the independently
-- approved plain-text payload. Existing editorial status and publication
-- columns remain the workflow authority.
alter table public.community_art_submissions
  add column if not exists raw_source_text text,
  add column if not exists normalised_text text,
  add column if not exists approved_copy_payload text,
  add column if not exists rendered_preview_payload text,
  add column if not exists compatibility_profile text not null default 'kingshot-chat-bubble',
  add column if not exists repair_operations jsonb not null default '[]'::jsonb,
  add column if not exists source_hash text,
  add column if not exists approved_payload_hash text,
  add column if not exists approved_payload_version integer;

update public.community_art_submissions
set raw_source_text = coalesce(raw_source_text, artwork_text),
    normalised_text = coalesce(normalised_text, replace(replace(artwork_text, E'\r\n', E'\n'), E'\r', E'\n')),
    rendered_preview_payload = coalesce(rendered_preview_payload, replace(replace(artwork_text, E'\r\n', E'\n'), E'\r', E'\n')),
    source_hash = coalesce(source_hash, md5(coalesce(artwork_text, '')))
where raw_source_text is null or normalised_text is null or rendered_preview_payload is null or source_hash is null;

alter table public.community_art_submissions
  alter column raw_source_text set not null,
  alter column normalised_text set not null,
  alter column rendered_preview_payload set not null;

create table if not exists public.community_art_payload_versions (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.community_art_submissions(id) on delete cascade,
  version integer not null check (version > 0),
  payload text not null check (char_length(payload) between 1 and 20000),
  payload_hash text not null,
  render_profile text not null,
  repair_operations jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (artwork_id, version),
  unique (artwork_id, payload_hash)
);

create index if not exists community_art_payload_versions_artwork_idx
  on public.community_art_payload_versions (artwork_id, version desc);

create or replace function public.prevent_community_art_raw_source_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.raw_source_text is distinct from old.raw_source_text then
    raise exception 'raw_source_text is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists community_art_raw_source_immutable on public.community_art_submissions;
create trigger community_art_raw_source_immutable
before update on public.community_art_submissions
for each row execute function public.prevent_community_art_raw_source_change();

alter table public.community_art_payload_versions enable row level security;
alter table public.community_art_payload_versions force row level security;
revoke all on table public.community_art_payload_versions from anon, authenticated;
grant select on table public.community_art_payload_versions to authenticated;
create policy community_art_payload_versions_owner_or_moderator
on public.community_art_payload_versions
for select to authenticated
using (
  exists (select 1 from public.community_art_submissions s where s.id = artwork_id and s.user_id = (select auth.uid()))
  or (select public.has_forge_permission('moderation.manage'))
);
grant all on table public.community_art_payload_versions to service_role;

revoke all on table public.community_art_submissions from anon, authenticated;
grant select (
  id, title, description, category, tags, artwork_text, raw_source_text,
  normalised_text, approved_copy_payload, rendered_preview_payload,
  compatibility_profile, repair_operations, source_hash,
  approved_payload_hash, approved_payload_version, compatibility_status,
  character_count, line_count, attribution_type, attribution_name, status,
  created_at, moderated_at, published_at, submitter_feedback
) on table public.community_art_submissions to authenticated;
grant insert (
  user_id, title, description, category, tags, artwork_text, raw_source_text,
  normalised_text, rendered_preview_payload, compatibility_profile,
  repair_operations, source_hash, attribution_type, attribution_name,
  ownership_confirmed, guidelines_confirmed, compatibility_status
) on table public.community_art_submissions to authenticated;
grant select (
  id, title, description, category, tags, artwork_text, normalised_text,
  approved_copy_payload, rendered_preview_payload, compatibility_profile,
  approved_payload_hash, approved_payload_version, compatibility_status,
  character_count, line_count, attribution_name, status, published_at
) on table public.community_art_submissions to anon;

commit;

