alter table public.hero_skills
  add column if not exists editorial_key text,
  add column if not exists is_active boolean not null default true,
  add column if not exists source_updated_at date,
  add column if not exists source_verified text,
  add column if not exists source_accuracy_score integer,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists published_version integer,
  add column if not exists published_version_id text,
  add column if not exists published_at timestamptz,
  add column if not exists published_by text;

alter table public.hero_skills
  drop constraint if exists hero_skills_source_accuracy_score_check;
alter table public.hero_skills
  add constraint hero_skills_source_accuracy_score_check
  check (source_accuracy_score is null or source_accuracy_score between 0 and 100);

alter table public.hero_skills
  drop constraint if exists hero_skills_slot_index_check;
alter table public.hero_skills
  add constraint hero_skills_slot_index_check check (slot_index > 0);

alter table public.hero_skills
  drop constraint if exists hero_skills_display_order_check;
alter table public.hero_skills
  add constraint hero_skills_display_order_check check (display_order > 0);

alter table public.hero_skills
  drop constraint if exists hero_skills_max_level_check;
alter table public.hero_skills
  add constraint hero_skills_max_level_check check (max_level > 0);

create unique index if not exists hero_skills_editorial_key_uidx
  on public.hero_skills (editorial_key)
  where editorial_key is not null;

create unique index if not exists hero_skills_active_hero_slot_uidx
  on public.hero_skills (hero_id, slot_index)
  where is_active;

create unique index if not exists hero_skills_active_hero_display_order_uidx
  on public.hero_skills (hero_id, display_order)
  where is_active;

create index if not exists hero_skills_public_lookup_idx
  on public.hero_skills (hero_id, display_order, slot_index)
  where is_active;

alter table public.hero_skills enable row level security;

drop policy if exists "Published hero skills are publicly readable" on public.hero_skills;
create policy "Published hero skills are publicly readable"
  on public.hero_skills
  for select
  to anon, authenticated
  using (is_active = true and published_version_id is not null);

revoke insert, update, delete on public.hero_skills from anon, authenticated;
grant select on public.hero_skills to anon, authenticated;

create or replace view public.published_hero_skills
with (security_invoker = true)
as
select
  hs.id,
  hs.editorial_key,
  hs.hero_id,
  h.slug as hero_slug,
  h.name as hero_name,
  hs.name,
  hs.category,
  hs.skill_type,
  hs.description,
  hs.icon_url,
  hs.display_order,
  hs.slot_index,
  hs.max_level,
  hs.source_updated_at,
  hs.source_verified,
  hs.source_accuracy_score,
  hs.source_name,
  hs.source_url,
  hs.published_version,
  hs.published_at,
  hs.updated_at
from public.hero_skills hs
join public.heroes h on h.id = hs.hero_id
where hs.is_active = true
  and hs.published_version_id is not null
  and h.is_active = true;

grant select on public.published_hero_skills to anon, authenticated;
