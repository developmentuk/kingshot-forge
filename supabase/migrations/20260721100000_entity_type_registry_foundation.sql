-- ARCH-001 / Sprint 1.1 identity foundation.
-- Review-gated: do not apply until the architecture checkpoint and focused
-- identity/RLS tests are approved. Forge identities remain derived from
-- canonical records; this migration intentionally creates no forge_entities rows.
create table if not exists public.entity_type_registry (
  entity_type text primary key,
  namespace text not null unique,
  resolver_key text not null unique,
  canonical_source text not null,
  published_state_rule text not null,
  route_policy text not null,
  search_adapter_key text not null,
  required_read_capability text not null,
  required_write_capability text not null,
  media_eligible boolean not null default false,
  tag_eligible boolean not null default false,
  relationship_eligible boolean not null default false,
  progression_eligible boolean not null default false,
  archive_behaviour text not null default 'hide' check (archive_behaviour in ('hide', 'retain')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_type_registry_entity_type_check check (entity_type ~ '^[a-z][a-z0-9_]*$'),
  constraint entity_type_registry_namespace_check check (namespace ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint entity_type_registry_resolver_check check (resolver_key <> ''),
  constraint entity_type_registry_source_check check (canonical_source <> '')
);

alter table public.entity_type_registry enable row level security;
alter table public.entity_type_registry force row level security;

revoke all on table public.entity_type_registry from anon, authenticated;
grant select on table public.entity_type_registry to anon, authenticated;
grant all on table public.entity_type_registry to service_role;

drop policy if exists entity_type_registry_safe_read on public.entity_type_registry;
create policy entity_type_registry_safe_read on public.entity_type_registry
  for select to anon, authenticated using (enabled = true);

insert into public.entity_type_registry (
  entity_type, namespace, resolver_key, canonical_source, published_state_rule,
  route_policy, search_adapter_key, required_read_capability,
  required_write_capability, media_eligible, tag_eligible,
  relationship_eligible, progression_eligible, archive_behaviour
) values
  ('building', 'building', 'building', 'public.buildings', 'editorial_status=published and published_version is not null', '/buildings/:slug', 'search.building', 'entity.building.read', 'entity.building.write', false, false, true, true, 'hide'),
  ('building_progression', 'building-progression', 'building-progression', 'public.building_progression', 'parent building is published', '/buildings/:parent/progression', 'search.building-progression', 'entity.building.read', 'entity.building.write', false, false, true, true, 'hide'),
  ('hero', 'hero', 'hero', 'public.heroes', 'published projection only', '/companion/heroes/:slug', 'search.hero', 'entity.hero.read', 'entity.hero.write', true, false, true, false, 'hide'),
  ('hero_skill', 'hero-skill', 'hero-skill', 'public.published_hero_skills', 'published projection only', '/companion/heroes/:hero/skills', 'search.hero-skill', 'entity.hero.read', 'entity.hero.write', true, false, true, false, 'hide'),
  ('hero_gear', 'hero-gear', 'hero-gear', 'public.hero_gear', 'published projection only', '/companion/heroes/:hero/gear', 'search.hero-gear', 'entity.hero.read', 'entity.hero.write', true, false, true, false, 'hide'),
  ('hero_widget', 'hero-widget', 'hero-widget', 'public.hero_widgets', 'published projection only', '/companion/heroes/:hero', 'search.hero-widget', 'entity.hero.read', 'entity.hero.write', true, false, false, false, 'hide'),
  ('event', 'event', 'event', 'public.events', 'published projection only', '/events/:slug', 'search.event', 'entity.event.read', 'entity.event.write', false, false, true, false, 'hide'),
  ('troop', 'troop', 'troop', 'public.troops', 'published projection only', '/troops/:slug', 'search.troop', 'entity.troop.read', 'entity.troop.write', false, false, true, true, 'hide'),
  ('gear', 'gear', 'gear', 'public.gear', 'published projection only', '/gear/:slug', 'search.gear', 'entity.gear.read', 'entity.gear.write', true, false, true, true, 'hide'),
  ('charm', 'charm', 'charm', 'public.charm', 'published projection only', '/charms/:slug', 'search.charm', 'entity.charm.read', 'entity.charm.write', true, false, true, true, 'hide'),
  ('research', 'research', 'research', 'public.research', 'published projection only', '/research/:slug', 'search.research', 'entity.research.read', 'entity.research.write', false, false, true, true, 'hide'),
  ('war_academy', 'war-academy', 'war-academy', 'public.war_academy', 'published projection only', '/war-academy/:slug', 'search.war-academy', 'entity.war-academy.read', 'entity.war-academy.write', false, false, true, true, 'hide'),
  ('player', 'player', 'player', 'public.player_profiles', 'visibility=public', '/player/:localKey', 'search.player', 'entity.player.read', 'entity.player.write', true, false, true, false, 'hide'),
  ('alliance', 'alliance', 'alliance', 'public.alliances', 'visibility=public', '/alliances/:slug', 'search.alliance', 'entity.alliance.read', 'entity.alliance.write', true, false, true, false, 'hide'),
  ('kingdom', 'kingdom', 'kingdom', 'public.kingdoms', 'visibility=public', '/kingdoms/:slug', 'search.kingdom', 'entity.kingdom.read', 'entity.kingdom.write', false, false, true, false, 'hide'),
  ('guide', 'guide', 'guide', 'public.guides', 'published projection only', '/guides/:slug', 'search.guide', 'entity.guide.read', 'entity.guide.write', true, false, true, false, 'hide'),
  ('article', 'article', 'article', 'public.articles', 'published projection only', '/articles/:slug', 'search.article', 'entity.article.read', 'entity.article.write', true, false, true, false, 'hide'),
  ('video', 'video', 'video', 'public.videos', 'published projection only', '/videos/:slug', 'search.video', 'entity.video.read', 'entity.video.write', true, false, true, false, 'hide'),
  ('creator', 'creator', 'creator', 'public.creators', 'published projection only', '/creators/:slug', 'search.creator', 'entity.creator.read', 'entity.creator.write', true, false, true, false, 'hide'),
  ('tool', 'tool', 'tool', 'public.tools', 'published projection only', '/tools/:slug', 'search.tool', 'entity.tool.read', 'entity.tool.write', false, false, true, false, 'hide'),
  ('calculator', 'calculator', 'calculator', 'public.calculators', 'published projection only', '/calculators/:slug', 'search.calculator', 'entity.calculator.read', 'entity.calculator.write', false, false, true, false, 'hide'),
  ('dataset', 'dataset', 'dataset', 'public.datasets', 'published projection only', '/datasets/:slug', 'search.dataset', 'entity.dataset.read', 'entity.dataset.write', false, false, false, false, 'retain')
on conflict (entity_type) do nothing;

comment on table public.entity_type_registry is 'Server-authoritative Forge entity type metadata. It is not an entity store.';

-- Search remains the existing projection system; this nullable additive field
-- lets supported projections carry Forge IDs without replacing projection IDs.
alter table public.search_projections add column if not exists forge_id text;
create index if not exists search_projections_forge_id_idx on public.search_projections (forge_id) where forge_id is not null;
alter table public.search_projections drop constraint if exists search_projection_forge_id_check;
alter table public.search_projections add constraint search_projection_forge_id_check
  check (forge_id is null or forge_id ~ '^[a-z0-9]+(-[a-z0-9]+)*\.[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*$');
