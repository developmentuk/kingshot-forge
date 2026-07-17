-- PLAYER IDENTITY REPLACEMENT SCHEMA PROPOSAL — UNAPPLIED
-- Sprint 9.4 local design artifact. This is deliberately outside supabase/migrations.
-- It must not be run against production. It requires Clark and Aegis approval,
-- a reconstructed migration baseline, a clean non-production rehearsal, and a
-- replacement of the terminal ROLLBACK with an approved migration receipt step.

begin;

do $$
begin
  if current_setting('forge.player_identity_validation_mode', true)
       is distinct from 'non_production_approved_rehearsal' then
    raise exception using
      message = 'Player Identity proposal aborted: non-production approval marker missing',
      hint = 'Do not execute this proposal. Follow docs/player-identity/NON_PRODUCTION_MIGRATION_VALIDATION.md.';
  end if;
end
$$;

-- Baseline guards: names from discovery are checked, never assumed canonical.
do $$
begin
  if to_regclass('public.player_accounts') is null
     or to_regclass('public.player_profiles') is null then
    raise exception 'Player Identity proposal aborted: discovered legacy baseline is absent';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'player_accounts'
      and column_name = 'user_id'
  ) then
    raise exception 'Player Identity proposal aborted: player_accounts.user_id drift detected';
  end if;
end
$$;

create schema if not exists player_identity_private;
revoke all on schema player_identity_private from public, anon, authenticated;

create table player_identity_private.user_identities (
  id bigint generated always as identity primary key,
  forge_user_id uuid not null references auth.users(id) on delete restrict,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_identities_forge_user_unique unique (forge_user_id)
);

create table player_identity_private.game_characters (
  id bigint generated always as identity primary key,
  external_player_reference text not null,
  display_name text not null check (char_length(display_name) between 1 and 64),
  kingdom_display_name text,
  alliance_display_name text,
  created_at timestamptz not null default now(),
  constraint game_characters_external_reference_unique unique (external_player_reference)
);

create table player_identity_private.character_links (
  id bigint generated always as identity primary key,
  user_identity_id bigint not null references player_identity_private.user_identities(id) on delete restrict,
  game_character_id bigint not null references player_identity_private.game_characters(id) on delete restrict,
  link_state text not null check (link_state in ('proposed', 'linked', 'revoked', 'disputed', 'removed')),
  dispute_state text not null default 'none' check (dispute_state in ('none', 'open', 'resolved')),
  active_eligible boolean not null default false,
  revision bigint not null check (revision > 0),
  proposed_at timestamptz not null default now(),
  linked_at timestamptz,
  revoked_at timestamptz,
  disputed_at timestamptz,
  removed_at timestamptz,
  constraint character_links_identity_id_pair_unique unique (user_identity_id, id)
);

create unique index character_links_one_current_owner_idx
  on player_identity_private.character_links (game_character_id)
  where link_state in ('proposed', 'linked', 'disputed');
create index character_links_user_state_idx
  on player_identity_private.character_links (user_identity_id, link_state);
create index character_links_game_character_idx
  on player_identity_private.character_links (game_character_id);

create table player_identity_private.primary_preferences (
  user_identity_id bigint primary key references player_identity_private.user_identities(id) on delete cascade,
  character_link_id bigint not null,
  revision bigint not null check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint primary_preferences_owned_link_fk
    foreign key (user_identity_id, character_link_id)
    references player_identity_private.character_links(user_identity_id, id)
    on delete restrict,
  constraint primary_preferences_link_unique unique (character_link_id)
);

create table player_identity_private.verification_records (
  id bigint generated always as identity primary key,
  character_link_id bigint not null references player_identity_private.character_links(id) on delete restrict,
  verification_state text not null check (verification_state in ('unverified', 'pending', 'verified', 'expired', 'revoked', 'disputed', 'rejected')),
  provider_key text,
  evidence_locator text,
  assurance text not null default 'none' check (assurance in ('none', 'low', 'moderate', 'high')),
  reason_codes text[] not null default '{}',
  issued_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  disputed_at timestamptz,
  revision bigint not null check (revision > 0),
  recorded_at timestamptz not null default now(),
  constraint verification_expiry_after_issue check (expires_at is null or issued_at is null or expires_at > issued_at)
);
create index verification_records_link_recorded_idx
  on player_identity_private.verification_records (character_link_id, recorded_at desc);

create table player_identity_private.public_aliases (
  id bigint generated always as identity primary key,
  user_identity_id bigint not null references player_identity_private.user_identities(id) on delete cascade,
  routing_alias text not null check (routing_alias ~ '^[a-z][a-z0-9_-]{7,47}$'),
  display_alias text,
  alias_state text not null default 'proposed' check (alias_state in ('proposed', 'active', 'disabled', 'retired')),
  revision bigint not null check (revision > 0),
  created_at timestamptz not null default now(),
  retired_at timestamptz
);
create unique index public_aliases_current_route_idx
  on player_identity_private.public_aliases (routing_alias)
  where alias_state in ('proposed', 'active', 'disabled');
create index public_aliases_identity_idx
  on player_identity_private.public_aliases (user_identity_id);

create table player_identity_private.visibility_settings (
  user_identity_id bigint primary key references player_identity_private.user_identities(id) on delete cascade,
  audience text not null default 'private' check (audience in ('private', 'selected_fields', 'authenticated_forge_users', 'alliance', 'public')),
  visible_fields text[] not null default '{}',
  revision bigint not null check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint visibility_allowlist check (visible_fields <@ array['displayName','avatar','kingdom','alliance','heroShowcase','activityIndicators','publicAlias']::text[])
);

create table player_identity_private.hero_showcase_selections (
  id bigint generated always as identity primary key,
  user_identity_id bigint not null references player_identity_private.user_identities(id) on delete cascade,
  game_character_id bigint not null references player_identity_private.game_characters(id) on delete restrict,
  hero_key text not null,
  display_order smallint not null check (display_order >= 0),
  claimed_progression jsonb not null default '{}',
  revision bigint not null check (revision > 0),
  constraint hero_showcase_identity_hero_unique unique (user_identity_id, hero_key)
);
create index hero_showcase_character_idx
  on player_identity_private.hero_showcase_selections (game_character_id);

create table player_identity_private.support_cases (
  id bigint generated always as identity primary key,
  user_identity_id bigint references player_identity_private.user_identities(id) on delete restrict,
  case_kind text not null,
  case_state text not null check (case_state in ('open', 'awaiting_information', 'approval_required', 'resolved')),
  private_notes text,
  revision bigint not null check (revision > 0),
  opened_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index support_cases_state_opened_idx
  on player_identity_private.support_cases (case_state, opened_at desc);
create index support_cases_identity_idx
  on player_identity_private.support_cases (user_identity_id);

create table player_identity_private.high_risk_approvals (
  id bigint generated always as identity primary key,
  support_case_id bigint references player_identity_private.support_cases(id) on delete restrict,
  operation text not null,
  initiator_forge_user_id uuid not null references auth.users(id) on delete restrict,
  approver_forge_user_id uuid references auth.users(id) on delete restrict,
  reason text not null check (char_length(reason) >= 8),
  approval_scope text not null,
  approval_state text not null check (approval_state in ('requested', 'approved', 'rejected', 'expired')),
  expected_revision bigint not null check (expected_revision > 0),
  expires_at timestamptz,
  recorded_at timestamptz not null default now(),
  constraint high_risk_approver_differs check (approver_forge_user_id is null or approver_forge_user_id <> initiator_forge_user_id)
);
create index high_risk_approvals_case_idx
  on player_identity_private.high_risk_approvals (support_case_id);
create index high_risk_approvals_initiator_idx
  on player_identity_private.high_risk_approvals (initiator_forge_user_id);
create index high_risk_approvals_approver_idx
  on player_identity_private.high_risk_approvals (approver_forge_user_id);

create table player_identity_private.identity_audit_events (
  id bigint generated always as identity primary key,
  user_identity_id bigint references player_identity_private.user_identities(id) on delete restrict,
  event_name text not null,
  actor_forge_user_id uuid references auth.users(id) on delete restrict,
  identity_revision bigint not null check (identity_revision > 0),
  safe_metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);
create index identity_audit_identity_time_idx
  on player_identity_private.identity_audit_events (user_identity_id, occurred_at desc);
create index identity_audit_actor_idx
  on player_identity_private.identity_audit_events (actor_forge_user_id);

create table player_identity_private.migration_receipts (
  id bigint generated always as identity primary key,
  migration_key text not null unique,
  baseline_fingerprint text not null,
  reconciliation_counts jsonb not null,
  approved_by text[] not null,
  applied_at timestamptz not null default now(),
  rollback_reference text not null
);

-- Server-owned safe projection. It omits every internal identifier and gates
-- every optional field through the explicit visibility allowlist.
create view player_identity_private.safe_public_profiles
with (security_invoker = true)
as
select
  pa.routing_alias,
  case when 'displayName' = any(vs.visible_fields) then gc.display_name end as display_name,
  case when 'kingdom' = any(vs.visible_fields) then gc.kingdom_display_name end as kingdom_display_name,
  case when 'alliance' = any(vs.visible_fields) then gc.alliance_display_name end as alliance_display_name,
  vs.revision as visibility_revision
from player_identity_private.public_aliases pa
join player_identity_private.visibility_settings vs on vs.user_identity_id = pa.user_identity_id
join player_identity_private.primary_preferences pp on pp.user_identity_id = pa.user_identity_id
join player_identity_private.character_links cl on cl.id = pp.character_link_id and cl.link_state = 'linked'
join player_identity_private.game_characters gc on gc.id = cl.game_character_id
where pa.alias_state = 'active'
  and vs.audience = 'public'
  and 'publicAlias' = any(vs.visible_fields);

-- All tables are private and server-owned. RLS is defense in depth; no browser
-- role receives direct privileges or a policy in this proposal.
alter table player_identity_private.user_identities enable row level security;
alter table player_identity_private.game_characters enable row level security;
alter table player_identity_private.character_links enable row level security;
alter table player_identity_private.primary_preferences enable row level security;
alter table player_identity_private.verification_records enable row level security;
alter table player_identity_private.public_aliases enable row level security;
alter table player_identity_private.visibility_settings enable row level security;
alter table player_identity_private.hero_showcase_selections enable row level security;
alter table player_identity_private.support_cases enable row level security;
alter table player_identity_private.high_risk_approvals enable row level security;
alter table player_identity_private.identity_audit_events enable row level security;
alter table player_identity_private.migration_receipts enable row level security;

revoke all on all tables in schema player_identity_private from public, anon, authenticated;
revoke all on all sequences in schema player_identity_private from public, anon, authenticated;
grant usage on schema player_identity_private to service_role;
grant select, insert, update on player_identity_private.user_identities,
  player_identity_private.game_characters,
  player_identity_private.character_links,
  player_identity_private.primary_preferences,
  player_identity_private.verification_records,
  player_identity_private.public_aliases,
  player_identity_private.visibility_settings,
  player_identity_private.hero_showcase_selections,
  player_identity_private.support_cases,
  player_identity_private.high_risk_approvals
to service_role;
grant select, insert on player_identity_private.identity_audit_events,
  player_identity_private.migration_receipts to service_role;
grant select on player_identity_private.safe_public_profiles to service_role;
grant usage, select on all sequences in schema player_identity_private to service_role;

-- Compatibility staging is read-only: production rehearsal must materialise
-- a reconciliation report, never update the discovered legacy tables.
create view player_identity_private.legacy_player_account_reconciliation
with (security_invoker = true)
as
select
  pa.user_id as legacy_user_id,
  'legacy'::text as source_classification,
  'unverified'::text as ownership_verification_interpretation
from public.player_accounts pa;
revoke all on player_identity_private.legacy_player_account_reconciliation from public, anon, authenticated;
grant select on player_identity_private.legacy_player_account_reconciliation to service_role;

-- Abort conditions before an approved migration could replace this ROLLBACK:
-- * live/checked-in migration counts are not reconciled;
-- * duplicate current character owners exist;
-- * a user has multiple legacy characters without an explicit mapping decision;
-- * unsafe public views or permissive policies remain reachable;
-- * SECURITY DEFINER ownership/search_path/EXECUTE review is incomplete;
-- * row counts, nullability, alias collisions, or audit reconciliation differ;
-- * rollback snapshot and tested recovery procedure are absent.

rollback;
