-- Sprint 9.3 local schema proposal only.
--
-- This migration intentionally contains no canonical data, staged-fact
-- promotion or publication. It must not be applied until Clark and Aegis have
-- approved the source policy, identity ADR, publication-function revision and
-- a controlled non-production validation plan.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

create schema if not exists forge_private;
revoke all on schema forge_private from public;
grant usage on schema forge_private to service_role;

do $$
begin
  if exists (select 1 from public.hero_skills) then
    raise exception
      'Hero Skill governance foundation requires an approved data migration plan before existing canonical rows can be changed.';
  end if;
end;
$$;

create table public.source_evidence_records (
  id uuid primary key default gen_random_uuid(),
  dataset_id text not null,
  source_key text not null,
  origin text not null,
  source_name text not null,
  source_url text,
  retrieved_at timestamptz not null,
  content_digest text not null,
  source_version text,
  licensing_decision text not null default 'pending',
  attribution text,
  extraction_method text not null,
  reviewed_by text,
  reviewed_at timestamptz,
  review_status text not null default 'extracted',
  evidence_notes text,
  superseded_by_id uuid references public.source_evidence_records(id),
  superseded_at timestamptz,
  withdrawn_at timestamptz,
  withdrawal_reason text,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_evidence_dataset_id_check
    check (dataset_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint source_evidence_source_key_check
    check (length(trim(source_key)) > 0),
  constraint source_evidence_origin_check
    check (origin in (
      'official',
      'authoritative-publisher',
      'approved-community',
      'community',
      'user-submitted',
      'archive',
      'unknown'
    )),
  constraint source_evidence_url_check
    check (source_url is null or source_url ~ '^https?://'),
  constraint source_evidence_digest_check
    check (content_digest ~ '^sha256:[0-9a-f]{64}$'),
  constraint source_evidence_licensing_check
    check (licensing_decision in (
      'pending',
      'approved',
      'rejected',
      'restricted'
    )),
  constraint source_evidence_extraction_method_check
    check (extraction_method in (
      'manual',
      'structured-file',
      'api',
      'scrape',
      'screenshot',
      'other'
    )),
  constraint source_evidence_review_status_check
    check (review_status in (
      'extracted',
      'staged',
      'reviewed',
      'approved',
      'rejected',
      'withdrawn',
      'superseded'
    )),
  constraint source_evidence_approved_check
    check (
      review_status <> 'approved'
      or (
        licensing_decision = 'approved'
        and nullif(trim(source_version), '') is not null
        and nullif(trim(reviewed_by), '') is not null
        and reviewed_at is not null
        and nullif(trim(attribution), '') is not null
      )
    ),
  constraint source_evidence_withdrawal_check
    check (
      (
        review_status <> 'withdrawn'
        and withdrawn_at is null
        and withdrawal_reason is null
      )
      or (
        review_status = 'withdrawn'
        and
        withdrawn_at is not null
        and nullif(trim(withdrawal_reason), '') is not null
      )
    ),
  constraint source_evidence_superseded_check
    check (
      (
        review_status <> 'superseded'
        and superseded_by_id is null
        and superseded_at is null
      )
      or (
        review_status = 'superseded'
        and superseded_by_id is not null
        and superseded_by_id <> id
        and superseded_at is not null
      )
    ),
  constraint source_evidence_revision_check check (revision > 0),
  unique (dataset_id, source_key, content_digest)
);

create index if not exists source_evidence_dataset_review_idx
  on public.source_evidence_records (
    dataset_id,
    review_status,
    licensing_decision
  );

create index if not exists source_evidence_superseded_idx
  on public.source_evidence_records (superseded_by_id)
  where superseded_by_id is not null;

alter table public.source_evidence_records enable row level security;
revoke all on table public.source_evidence_records
  from public, anon, authenticated;
grant select, insert, update on table public.source_evidence_records
  to service_role;

alter table public.hero_skills
  add column if not exists identity_seed text,
  add column if not exists identity_version integer not null default 1,
  add column if not exists variant_kind text not null default 'base',
  add column if not exists variant_index integer not null default 1,
  add column if not exists progression_availability text not null default 'unknown',
  add column if not exists unlock_availability text not null default 'unknown',
  add column if not exists unlock_groups_operator text,
  add column if not exists verification_state text not null default 'unreviewed',
  add column if not exists publication_eligible boolean not null default false,
  add column if not exists primary_source_evidence_id uuid,
  add column if not exists source_version text,
  add column if not exists source_retrieved_at timestamptz,
  add column if not exists source_evidence_digest text,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists withdrawn_at timestamptz,
  add column if not exists withdrawal_reason text,
  add column if not exists revision integer not null default 1;

alter table public.hero_skills
  alter column id drop default,
  alter column identity_seed set not null;

alter table public.hero_skills
  drop constraint if exists hero_skills_identity_seed_key,
  add constraint hero_skills_identity_seed_key unique (identity_seed),
  drop constraint if exists hero_skills_identity_version_check,
  add constraint hero_skills_identity_version_check
    check (identity_version = 1),
  drop constraint if exists hero_skills_variant_kind_check,
  add constraint hero_skills_variant_kind_check
    check (variant_kind in ('base', 'awakening')),
  drop constraint if exists hero_skills_variant_index_check,
  add constraint hero_skills_variant_index_check
    check (variant_index > 0),
  drop constraint if exists hero_skills_progression_availability_check,
  add constraint hero_skills_progression_availability_check
    check (progression_availability in (
      'complete',
      'partial',
      'unavailable',
      'unknown'
    )),
  drop constraint if exists hero_skills_unlock_availability_check,
  add constraint hero_skills_unlock_availability_check
    check (unlock_availability in (
      'complete',
      'partial',
      'unavailable',
      'unknown'
    )),
  drop constraint if exists hero_skills_unlock_groups_operator_check,
  add constraint hero_skills_unlock_groups_operator_check
    check (unlock_groups_operator is null or unlock_groups_operator in ('all', 'any')),
  drop constraint if exists hero_skills_verification_state_check,
  add constraint hero_skills_verification_state_check
    check (verification_state in (
      'unreviewed',
      'reviewed',
      'verified',
      'rejected',
      'withdrawn'
    )),
  drop constraint if exists hero_skills_source_evidence_digest_check,
  add constraint hero_skills_source_evidence_digest_check
    check (
      source_evidence_digest is null
      or source_evidence_digest ~ '^sha256:[0-9a-f]{64}$'
    ),
  drop constraint if exists hero_skills_review_check,
  add constraint hero_skills_review_check
    check (
      verification_state <> 'verified'
      or (
        nullif(trim(reviewed_by), '') is not null
        and reviewed_at is not null
      )
    ),
  drop constraint if exists hero_skills_withdrawal_check,
  add constraint hero_skills_withdrawal_check
    check (
      (
        verification_state <> 'withdrawn'
        and withdrawn_at is null
        and withdrawal_reason is null
      )
      or (
        verification_state = 'withdrawn'
        and
        withdrawn_at is not null
        and nullif(trim(withdrawal_reason), '') is not null
      )
    ),
  drop constraint if exists hero_skills_publication_eligibility_check,
  add constraint hero_skills_publication_eligibility_check
    check (
      publication_eligible = false
      or (
        verification_state = 'verified'
        and withdrawn_at is null
        and nullif(trim(name), '') is not null
        and nullif(trim(description), '') is not null
        and primary_source_evidence_id is not null
        and source_retrieved_at is not null
        and source_evidence_digest is not null
        and reviewed_at is not null
        and nullif(trim(reviewed_by), '') is not null
      )
    ),
  drop constraint if exists hero_skills_revision_check,
  add constraint hero_skills_revision_check check (revision > 0);

alter table public.hero_skills
  drop constraint if exists hero_skills_category_check;
alter table public.hero_skills
  add constraint hero_skills_category_check
  check (category in ('conquest', 'expedition', 'talent'));

alter table public.hero_skills
  drop constraint if exists hero_skills_primary_source_evidence_fkey;
alter table public.hero_skills
  add constraint hero_skills_primary_source_evidence_fkey
  foreign key (primary_source_evidence_id)
  references public.source_evidence_records(id)
  on delete restrict;

alter table public.hero_skills
  drop constraint if exists hero_skills_published_version_fkey;
alter table public.hero_skills
  add constraint hero_skills_published_version_fkey
  foreign key (published_version_id)
  references public.editorial_record_versions(id)
  on delete restrict;

drop index if exists public.hero_skills_active_hero_slot_uidx;
alter table public.hero_skills
  drop constraint if exists hero_skills_hero_category_slot_key;

create unique index if not exists hero_skills_canonical_slot_uidx
  on public.hero_skills (
    hero_id,
    category,
    slot_index,
    variant_kind,
    variant_index
  )
  where is_active and withdrawn_at is null;

create index if not exists hero_skills_primary_source_evidence_idx
  on public.hero_skills (primary_source_evidence_id)
  where primary_source_evidence_id is not null;

create index if not exists hero_skills_published_version_id_idx
  on public.hero_skills (published_version_id)
  where published_version_id is not null;

create table public.hero_skill_source_evidence (
  skill_id uuid not null references public.hero_skills(id) on delete restrict,
  evidence_id uuid not null
    references public.source_evidence_records(id) on delete restrict,
  claim_scope text not null,
  is_primary boolean not null default false,
  reviewed_by text not null,
  reviewed_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (skill_id, evidence_id, claim_scope),
  constraint hero_skill_source_evidence_reviewer_check
    check (nullif(trim(reviewed_by), '') is not null),
  constraint hero_skill_source_evidence_scope_check
    check (claim_scope in (
      'identity',
      'name',
      'category',
      'slot',
      'description',
      'progression',
      'unlock'
    ))
);

create unique index if not exists hero_skill_source_primary_uidx
  on public.hero_skill_source_evidence (skill_id)
  where is_primary;

alter table public.hero_skill_source_evidence enable row level security;
revoke all on table public.hero_skill_source_evidence
  from public, anon, authenticated;
grant select, insert on table public.hero_skill_source_evidence
  to service_role;

create index hero_skill_source_evidence_evidence_id_idx
  on public.hero_skill_source_evidence (evidence_id);

create table public.hero_skill_progression_levels (
  id uuid primary key,
  identity_seed text not null unique,
  skill_id uuid not null references public.hero_skills(id) on delete restrict,
  level_number integer not null,
  canonical_text text not null,
  structured_effects jsonb,
  source_evidence_id uuid not null
    references public.source_evidence_records(id) on delete restrict,
  verification_state text not null,
  display_order integer not null,
  published_version_id text not null
    references public.editorial_record_versions(id) on delete restrict,
  published_at timestamptz not null,
  withdrawn_at timestamptz,
  withdrawal_reason text,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hero_skill_progression_level_check check (level_number > 0),
  constraint hero_skill_progression_text_check
    check (nullif(trim(canonical_text), '') is not null),
  constraint hero_skill_progression_effects_check
    check (
      structured_effects is null
      or jsonb_typeof(structured_effects) = 'array'
    ),
  constraint hero_skill_progression_verification_check
    check (verification_state = 'verified'),
  constraint hero_skill_progression_order_check check (display_order > 0),
  constraint hero_skill_progression_withdrawal_check
    check (
      (withdrawn_at is null and withdrawal_reason is null)
      or (
        withdrawn_at is not null
        and nullif(trim(withdrawal_reason), '') is not null
      )
    ),
  constraint hero_skill_progression_revision_check check (revision > 0)
);

create unique index if not exists hero_skill_progression_level_uidx
  on public.hero_skill_progression_levels (skill_id, level_number)
  where withdrawn_at is null;

create unique index if not exists hero_skill_progression_order_uidx
  on public.hero_skill_progression_levels (skill_id, display_order)
  where withdrawn_at is null;

create index hero_skill_progression_skill_id_idx
  on public.hero_skill_progression_levels (skill_id);

create index hero_skill_progression_evidence_id_idx
  on public.hero_skill_progression_levels (source_evidence_id);

create index hero_skill_progression_version_id_idx
  on public.hero_skill_progression_levels (published_version_id);

alter table public.hero_skill_progression_levels enable row level security;
revoke all on table public.hero_skill_progression_levels
  from public, anon, authenticated;
grant select on table public.hero_skill_progression_levels
  to anon, authenticated;
grant select, insert, update on table public.hero_skill_progression_levels
  to service_role;

create policy "Verified published Hero Skill progression is readable"
on public.hero_skill_progression_levels
for select
to anon, authenticated
using (
  verification_state = 'verified'
  and withdrawn_at is null
  and exists (
    select 1
    from public.hero_skills as skill
    where skill.id = hero_skill_progression_levels.skill_id
      and skill.publication_eligible = true
      and skill.verification_state = 'verified'
      and skill.is_active = true
      and skill.withdrawn_at is null
      and skill.published_version_id =
        hero_skill_progression_levels.published_version_id
  )
);

create table public.hero_skill_unlock_groups (
  id uuid primary key,
  identity_seed text not null unique,
  skill_id uuid not null references public.hero_skills(id) on delete restrict,
  combine_operator text not null,
  group_order integer not null,
  published_version_id text not null
    references public.editorial_record_versions(id) on delete restrict,
  published_at timestamptz not null,
  withdrawn_at timestamptz,
  withdrawal_reason text,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hero_skill_unlock_group_id_skill_key unique (id, skill_id),
  constraint hero_skill_unlock_group_operator_check
    check (combine_operator in ('all', 'any')),
  constraint hero_skill_unlock_group_order_check check (group_order > 0),
  constraint hero_skill_unlock_group_withdrawal_check
    check (
      (withdrawn_at is null and withdrawal_reason is null)
      or (
        withdrawn_at is not null
        and nullif(trim(withdrawal_reason), '') is not null
      )
    ),
  constraint hero_skill_unlock_group_revision_check check (revision > 0)
);

create unique index if not exists hero_skill_unlock_group_order_uidx
  on public.hero_skill_unlock_groups (skill_id, group_order)
  where withdrawn_at is null;

create index hero_skill_unlock_group_skill_id_idx
  on public.hero_skill_unlock_groups (skill_id);

create index hero_skill_unlock_group_version_id_idx
  on public.hero_skill_unlock_groups (published_version_id);

alter table public.hero_skill_unlock_groups enable row level security;
revoke all on table public.hero_skill_unlock_groups
  from public, anon, authenticated;
grant select on table public.hero_skill_unlock_groups to anon, authenticated;
grant select, insert, update on table public.hero_skill_unlock_groups
  to service_role;

create policy "Verified published Hero Skill unlock groups are readable"
on public.hero_skill_unlock_groups
for select
to anon, authenticated
using (
  withdrawn_at is null
  and exists (
    select 1
    from public.hero_skills as skill
    where skill.id = hero_skill_unlock_groups.skill_id
      and skill.publication_eligible = true
      and skill.verification_state = 'verified'
      and skill.is_active = true
      and skill.withdrawn_at is null
      and skill.published_version_id =
        hero_skill_unlock_groups.published_version_id
  )
);

create table public.hero_skill_unlock_requirements (
  id uuid primary key,
  identity_seed text not null unique,
  group_id uuid not null,
  skill_id uuid not null,
  requirement_type text not null,
  requirement_operator text not null,
  requirement_value jsonb not null,
  related_domain_id text,
  display_fallback text,
  source_evidence_id uuid not null
    references public.source_evidence_records(id) on delete restrict,
  verification_state text not null,
  requirement_order integer not null,
  published_version_id text not null
    references public.editorial_record_versions(id) on delete restrict,
  published_at timestamptz not null,
  withdrawn_at timestamptz,
  withdrawal_reason text,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hero_skill_unlock_requirement_group_fkey
    foreign key (group_id, skill_id)
    references public.hero_skill_unlock_groups(id, skill_id)
    on delete restrict,
  constraint hero_skill_unlock_requirement_type_check
    check (requirement_type in (
      'hero_level',
      'hero_star_level',
      'skill_level',
      'widget_level',
      'exclusive_gear_level',
      'awakening_state',
      'other'
    )),
  constraint hero_skill_unlock_requirement_operator_check
    check (requirement_operator in ('eq', 'neq', 'gte', 'lte', 'in')),
  constraint hero_skill_unlock_requirement_verification_check
    check (verification_state = 'verified'),
  constraint hero_skill_unlock_requirement_order_check
    check (requirement_order > 0),
  constraint hero_skill_unlock_requirement_withdrawal_check
    check (
      (withdrawn_at is null and withdrawal_reason is null)
      or (
        withdrawn_at is not null
        and nullif(trim(withdrawal_reason), '') is not null
      )
    ),
  constraint hero_skill_unlock_requirement_revision_check
    check (revision > 0)
);

create unique index if not exists hero_skill_unlock_requirement_order_uidx
  on public.hero_skill_unlock_requirements (group_id, requirement_order)
  where withdrawn_at is null;

create index hero_skill_unlock_requirement_group_skill_idx
  on public.hero_skill_unlock_requirements (group_id, skill_id);

create index hero_skill_unlock_requirement_skill_id_idx
  on public.hero_skill_unlock_requirements (skill_id);

create index hero_skill_unlock_requirement_evidence_id_idx
  on public.hero_skill_unlock_requirements (source_evidence_id);

create index hero_skill_unlock_requirement_version_id_idx
  on public.hero_skill_unlock_requirements (published_version_id);

alter table public.hero_skill_unlock_requirements enable row level security;
revoke all on table public.hero_skill_unlock_requirements
  from public, anon, authenticated;
grant select on table public.hero_skill_unlock_requirements
  to anon, authenticated;
grant select, insert, update on table public.hero_skill_unlock_requirements
  to service_role;

create policy "Verified published Hero Skill unlock requirements are readable"
on public.hero_skill_unlock_requirements
for select
to anon, authenticated
using (
  verification_state = 'verified'
  and withdrawn_at is null
  and exists (
    select 1
    from public.hero_skill_unlock_groups as requirement_group
    join public.hero_skills as skill
      on skill.id = requirement_group.skill_id
    where requirement_group.id = hero_skill_unlock_requirements.group_id
      and requirement_group.withdrawn_at is null
      and requirement_group.published_version_id =
        hero_skill_unlock_requirements.published_version_id
      and skill.publication_eligible = true
      and skill.verification_state = 'verified'
      and skill.is_active = true
      and skill.withdrawn_at is null
      and skill.published_version_id =
        hero_skill_unlock_requirements.published_version_id
  )
);

create or replace function forge_private.enforce_governed_record_revision()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception
      'Governed source and canonical projection records are withdrawn, not deleted.';
  end if;

  if new.id is distinct from old.id then
    raise exception 'Governed record identity is immutable.';
  end if;

  if new.revision <> old.revision + 1 then
    raise exception
      'Governed record update requires revision %.', old.revision + 1;
  end if;

  if tg_table_name = 'source_evidence_records' and (
    old.dataset_id is distinct from new.dataset_id
    or old.source_key is distinct from new.source_key
    or old.content_digest is distinct from new.content_digest
    or old.source_version is distinct from new.source_version
    or old.retrieved_at is distinct from new.retrieved_at
  ) then
    raise exception
      'Changed source content or version requires a new source evidence record.';
  end if;

  if tg_table_name = 'hero_skill_progression_levels' and (
    old.identity_seed is distinct from new.identity_seed
    or old.skill_id is distinct from new.skill_id
    or old.level_number is distinct from new.level_number
  ) then
    raise exception
      'Hero Skill progression identity and binding are immutable.';
  end if;

  if tg_table_name = 'hero_skill_unlock_groups' and (
    old.identity_seed is distinct from new.identity_seed
    or old.skill_id is distinct from new.skill_id
    or old.group_order is distinct from new.group_order
  ) then
    raise exception
      'Hero Skill unlock group identity and binding are immutable.';
  end if;

  if tg_table_name = 'hero_skill_unlock_requirements' and (
    old.identity_seed is distinct from new.identity_seed
    or old.group_id is distinct from new.group_id
    or old.skill_id is distinct from new.skill_id
    or old.requirement_order is distinct from new.requirement_order
  ) then
    raise exception
      'Hero Skill unlock requirement identity and binding are immutable.';
  end if;

  return new;
end;
$$;

revoke all on function forge_private.enforce_governed_record_revision()
  from public, anon, authenticated;
grant execute on function forge_private.enforce_governed_record_revision()
  to service_role;

create trigger enforce_source_evidence_revision
before update or delete on public.source_evidence_records
for each row execute function forge_private.enforce_governed_record_revision();

create trigger enforce_hero_skill_revision
before update or delete on public.hero_skills
for each row execute function forge_private.enforce_governed_record_revision();

create trigger enforce_hero_skill_progression_revision
before update or delete on public.hero_skill_progression_levels
for each row execute function forge_private.enforce_governed_record_revision();

create trigger enforce_hero_skill_unlock_group_revision
before update or delete on public.hero_skill_unlock_groups
for each row execute function forge_private.enforce_governed_record_revision();

create trigger enforce_hero_skill_unlock_requirement_revision
before update or delete on public.hero_skill_unlock_requirements
for each row execute function forge_private.enforce_governed_record_revision();

create or replace function forge_private.prevent_hero_skill_evidence_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1
      from public.source_evidence_records as evidence
      where evidence.id = new.evidence_id
        and evidence.review_status = 'approved'
        and evidence.licensing_decision = 'approved'
        and evidence.withdrawn_at is null
        and evidence.superseded_by_id is null
    ) then
      raise exception
        'Hero Skill evidence relationships require approved current evidence.';
    end if;

    if new.is_primary and not exists (
      select 1
      from public.hero_skills as skill
      where skill.id = new.skill_id
        and skill.primary_source_evidence_id = new.evidence_id
    ) then
      raise exception
        'Primary Hero Skill evidence must match the canonical source binding.';
    end if;

    return new;
  end if;

  raise exception
    'Hero Skill evidence relationships are immutable; withdraw the canonical record instead.';
end;
$$;

revoke all on function forge_private.prevent_hero_skill_evidence_mutation()
  from public, anon, authenticated;
grant execute on function forge_private.prevent_hero_skill_evidence_mutation()
  to service_role;

create trigger prevent_hero_skill_evidence_mutation
before insert or update or delete on public.hero_skill_source_evidence
for each row execute function forge_private.prevent_hero_skill_evidence_mutation();

create or replace function forge_private.enforce_hero_skill_child_publication()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  evidence_id uuid;
  evidence_scope text;
begin
  if not exists (
    select 1
    from public.hero_skills as skill
    where skill.id = new.skill_id
      and skill.publication_eligible = true
      and skill.verification_state = 'verified'
      and skill.is_active = true
      and skill.withdrawn_at is null
      and skill.published_version_id = new.published_version_id
      and skill.published_at = new.published_at
  ) then
    raise exception
      'Hero Skill child publication must match an eligible parent publication.';
  end if;

  if tg_table_name = 'hero_skill_progression_levels' then
    evidence_id := new.source_evidence_id;
    evidence_scope := 'progression';
  elsif tg_table_name = 'hero_skill_unlock_requirements' then
    evidence_id := new.source_evidence_id;
    evidence_scope := 'unlock';

    if not exists (
      select 1
      from public.hero_skill_unlock_groups as requirement_group
      where requirement_group.id = new.group_id
        and requirement_group.skill_id = new.skill_id
        and requirement_group.published_version_id = new.published_version_id
        and requirement_group.published_at = new.published_at
        and requirement_group.withdrawn_at is null
    ) then
      raise exception
        'Hero Skill unlock requirement must match its published group.';
    end if;
  end if;

  if evidence_id is not null and not exists (
    select 1
    from public.source_evidence_records as evidence
    join public.hero_skill_source_evidence as relationship
      on relationship.evidence_id = evidence.id
    where evidence.id = evidence_id
      and evidence.review_status = 'approved'
      and evidence.licensing_decision = 'approved'
      and evidence.withdrawn_at is null
      and evidence.superseded_by_id is null
      and relationship.skill_id = new.skill_id
      and relationship.claim_scope = evidence_scope
  ) then
    raise exception
      'Hero Skill child publication requires approved linked evidence.';
  end if;

  return new;
end;
$$;

revoke all on function forge_private.enforce_hero_skill_child_publication()
  from public, anon, authenticated;
grant execute on function forge_private.enforce_hero_skill_child_publication()
  to service_role;

create trigger enforce_hero_skill_progression_publication
before insert or update on public.hero_skill_progression_levels
for each row execute function forge_private.enforce_hero_skill_child_publication();

create trigger enforce_hero_skill_unlock_group_publication
before insert or update on public.hero_skill_unlock_groups
for each row execute function forge_private.enforce_hero_skill_child_publication();

create trigger enforce_hero_skill_unlock_requirement_publication
before insert or update on public.hero_skill_unlock_requirements
for each row execute function forge_private.enforce_hero_skill_child_publication();

create or replace function forge_private.enforce_hero_skill_governance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
    old.id is distinct from new.id
    or old.identity_seed is distinct from new.identity_seed
    or old.identity_version is distinct from new.identity_version
    or old.hero_id is distinct from new.hero_id
    or old.variant_kind is distinct from new.variant_kind
    or old.variant_index is distinct from new.variant_index
  ) then
    raise exception
      'Hero Skill identity and Hero binding are immutable; withdraw and replace an incorrectly bound record.';
  end if;

  if new.publication_eligible is true then
    if new.verification_state <> 'verified'
      or new.withdrawn_at is not null
    then
      raise exception
        'Hero Skill eligibility requires a verified, non-withdrawn canonical record.';
    end if;

    if not exists (
      select 1
      from public.source_evidence_records as evidence
      join public.hero_skill_source_evidence as relationship
        on relationship.evidence_id = evidence.id
      where evidence.id = new.primary_source_evidence_id
        and evidence.review_status = 'approved'
        and evidence.licensing_decision = 'approved'
        and evidence.withdrawn_at is null
        and evidence.superseded_by_id is null
        and evidence.content_digest = new.source_evidence_digest
        and evidence.source_name = new.source_name
        and evidence.source_url is not distinct from new.source_url
        and evidence.source_version is not distinct from new.source_version
        and evidence.retrieved_at = new.source_retrieved_at
        and relationship.skill_id = new.id
        and relationship.is_primary = true
    ) then
      raise exception
        'Hero Skill eligibility requires approved, linked and digest-matched source evidence.';
    end if;
  end if;

  if new.published_version_id is not null then
    if new.publication_eligible is not true
      or new.verification_state <> 'verified'
      or new.withdrawn_at is not null
    then
      raise exception
        'Hero Skill publication requires an eligible, verified, non-withdrawn canonical record.';
    end if;

  end if;

  return new;
end;
$$;

revoke all on function forge_private.enforce_hero_skill_governance()
  from public, anon, authenticated;
grant execute on function forge_private.enforce_hero_skill_governance()
  to service_role;

drop trigger if exists enforce_hero_skill_governance
  on public.hero_skills;
create trigger enforce_hero_skill_governance
before insert or update on public.hero_skills
for each row execute function forge_private.enforce_hero_skill_governance();

drop policy if exists "Hero skills are publicly readable"
  on public.hero_skills;
drop policy if exists "Published hero skills are publicly readable"
  on public.hero_skills;
drop policy if exists "Approved published Hero Skills are publicly readable"
  on public.hero_skills;

create policy "Approved published Hero Skills are publicly readable"
on public.hero_skills
for select
to anon, authenticated
using (
  is_active = true
  and publication_eligible = true
  and verification_state = 'verified'
  and withdrawn_at is null
  and published_version_id is not null
);

create or replace view public.published_hero_skills
with (security_invoker = true)
as
select
  skill.id,
  skill.hero_id,
  hero.slug as hero_slug,
  hero.name as hero_name,
  skill.name,
  skill.category,
  skill.description,
  skill.display_order,
  skill.slot_index,
  skill.max_level,
  skill.variant_kind,
  skill.variant_index,
  skill.progression_availability,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'level', progression.level_number,
        'canonicalText', progression.canonical_text,
        'effects', coalesce(progression.structured_effects, '[]'::jsonb),
        'displayOrder', progression.display_order
      )
      order by progression.display_order, progression.level_number
    )
    from public.hero_skill_progression_levels as progression
    where progression.skill_id = skill.id
      and progression.published_version_id = skill.published_version_id
      and progression.verification_state = 'verified'
      and progression.withdrawn_at is null
  ), '[]'::jsonb) as progression,
  skill.unlock_availability,
  skill.unlock_groups_operator,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'operator', requirement_group.combine_operator,
        'order', requirement_group.group_order,
        'requirements', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'type', requirement.requirement_type,
              'operator', requirement.requirement_operator,
              'value', requirement.requirement_value,
              'relatedDomainId', requirement.related_domain_id,
              'displayFallback', requirement.display_fallback,
              'order', requirement.requirement_order
            )
            order by requirement.requirement_order
          )
          from public.hero_skill_unlock_requirements as requirement
          where requirement.group_id = requirement_group.id
            and requirement.published_version_id = skill.published_version_id
            and requirement.verification_state = 'verified'
            and requirement.withdrawn_at is null
        ), '[]'::jsonb)
      )
      order by requirement_group.group_order
    )
    from public.hero_skill_unlock_groups as requirement_group
    where requirement_group.skill_id = skill.id
      and requirement_group.published_version_id = skill.published_version_id
      and requirement_group.withdrawn_at is null
  ), '[]'::jsonb) as unlock_groups,
  skill.source_name,
  skill.source_url,
  skill.source_version,
  skill.source_retrieved_at,
  skill.published_version_id,
  skill.published_at
from public.hero_skills as skill
join public.heroes as hero on hero.id = skill.hero_id
where skill.is_active = true
  and skill.publication_eligible = true
  and skill.verification_state = 'verified'
  and skill.withdrawn_at is null
  and skill.published_version_id is not null
  and hero.is_active = true;

grant select on public.published_hero_skills to anon, authenticated;

comment on table public.source_evidence_records is
  'Domain 0 source evidence. Staging or extraction alone never grants canonical status.';
comment on table public.hero_skill_progression_levels is
  'Verified published Hero Skill level facts; textual effects are valid without numeric extraction.';
comment on table public.hero_skill_unlock_requirements is
  'Verified typed Hero Skill unlock facts. Exclusive Gear references remain cross-domain identities.';
comment on column public.hero_skills.identity_seed is
  'Immutable UUID-v5 seed minted only after source and identity approval.';
comment on column public.hero_skills.publication_eligible is
  'Materialised server-side eligibility; never trusted from browser input.';

-- Rollback must be a separately reviewed forward migration. It must restore the
-- legacy public projection only after proving no canonical progression, unlock
-- or evidence relationships would be lost. Do not use ad hoc destructive SQL.

commit;
