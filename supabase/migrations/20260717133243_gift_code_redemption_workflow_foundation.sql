-- Sprint 9.4 proposal only. This migration is intentionally unapplied.
-- Rollback starts by keeping every Gift Code and queue gate disabled. The
-- additive tables and immutable history remain in place until a separately
-- approved retention migration can remove them safely.

begin;

create schema if not exists private;

create or replace function private.gift_code_metadata_is_safe(
  metadata jsonb
)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select
    jsonb_typeof(metadata) = 'object'
    and not exists (
      select 1
      from jsonb_each(metadata) as entry(key, value)
      where key !~ '^[a-z][a-z0-9_]*$'
        or key ~* (
          'secret|signature|cookie|token|authorization|password|'
          'payload|raw|player.?id|gift.?code'
        )
        or jsonb_typeof(value) not in (
          'string',
          'number',
          'boolean',
          'null'
        )
    );
$$;

create or replace function private.prevent_gift_code_history_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception
    'Gift Code attempt and audit history is append-only.';
end;
$$;

create or replace function private.validate_gift_code_consent_revocation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.revoked_at is not null then
    raise exception 'Revoked Gift Code consent is immutable.';
  end if;

  if new.revoked_at is null
    or new.revoked_at < old.granted_at
    or new.version <> old.version + 1
    or new.updated_at < old.updated_at
    or new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.player_account_id is distinct from old.player_account_id
    or new.character_ref is distinct from old.character_ref
    or new.character_revision is distinct from old.character_revision
    or new.provider_id is distinct from old.provider_id
    or new.environment is distinct from old.environment
    or new.provider_mode is distinct from old.provider_mode
    or new.purpose is distinct from old.purpose
    or new.policy_version is distinct from old.policy_version
    or new.policy_digest is distinct from old.policy_digest
    or new.evidence_version is distinct from old.evidence_version
    or new.evidence_metadata is distinct from old.evidence_metadata
    or new.granted_at is distinct from old.granted_at
    or new.expires_at is distinct from old.expires_at
    or new.created_at is distinct from old.created_at
  then
    raise exception
      'Gift Code consent may only be revoked once.';
  end if;

  return new;
end;
$$;

create or replace function private.validate_gift_code_request_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  transition_allowed boolean := false;
begin
  if new.optimistic_version <> old.optimistic_version + 1
    or new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.player_account_id is distinct from old.player_account_id
    or new.character_ref is distinct from old.character_ref
    or new.character_revision is distinct from old.character_revision
    or new.consent_id is distinct from old.consent_id
    or new.provider_id is distinct from old.provider_id
    or new.provider_mode is distinct from old.provider_mode
    or new.environment is distinct from old.environment
    or new.operation is distinct from old.operation
    or new.code_publication_id is distinct from old.code_publication_id
    or new.publication_version is distinct from old.publication_version
    or new.idempotency_version is distinct from old.idempotency_version
    or new.idempotency_hash is distinct from old.idempotency_hash
    or new.maximum_attempts is distinct from old.maximum_attempts
    or new.created_at is distinct from old.created_at
  then
    raise exception
      'Immutable Gift Code request identity or version changed.';
  end if;

  transition_allowed := case old.status
    when 'requested' then new.status in (
      'queued', 'cancelled', 'expired', 'withdrawn'
    )
    when 'queued' then new.status in (
      'processing', 'cancelled', 'expired', 'withdrawn'
    )
    when 'processing' then new.status in (
      'succeeded',
      'already_claimed',
      'failed_retryable',
      'failed_terminal',
      'ambiguous',
      'expired',
      'withdrawn'
    )
    when 'failed_retryable' then new.status in (
      'queued', 'cancelled', 'expired', 'withdrawn'
    )
    else false
  end;

  if not transition_allowed then
    raise exception 'Invalid Gift Code request lifecycle transition.';
  end if;

  return new;
end;
$$;

create or replace function private.validate_gift_code_attempt_finalization()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.version <> 0
    or old.outcome <> 'not_started'
    or old.completed_at is not null
    or new.version <> 1
    or new.outcome = 'not_started'
    or new.completed_at is null
    or new.id is distinct from old.id
    or new.request_id is distinct from old.request_id
    or new.user_id is distinct from old.user_id
    or new.ordinal is distinct from old.ordinal
    or new.provider_id is distinct from old.provider_id
    or new.lease_owner is distinct from old.lease_owner
    or new.started_at is distinct from old.started_at
    or new.created_at is distinct from old.created_at
  then
    raise exception
      'Gift Code attempts support one immutable finalization only.';
  end if;

  return new;
end;
$$;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

revoke all on function private.gift_code_metadata_is_safe(jsonb)
  from public, anon, authenticated;
revoke all on function private.prevent_gift_code_history_mutation()
  from public, anon, authenticated;
revoke all on function private.validate_gift_code_consent_revocation()
  from public, anon, authenticated;
revoke all on function private.validate_gift_code_request_transition()
  from public, anon, authenticated;
revoke all on function private.validate_gift_code_attempt_finalization()
  from public, anon, authenticated;

grant execute on function private.gift_code_metadata_is_safe(jsonb)
  to service_role;
grant execute on function private.prevent_gift_code_history_mutation()
  to service_role;
grant execute on function private.validate_gift_code_consent_revocation()
  to service_role;
grant execute on function private.validate_gift_code_request_transition()
  to service_role;
grant execute on function private.validate_gift_code_attempt_finalization()
  to service_role;

create table public.gift_code_redemption_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  player_account_id uuid not null references
    public.player_accounts(id) on delete restrict,
  character_ref text not null check (btrim(character_ref) <> ''),
  character_revision bigint not null check (character_revision > 0),
  provider_id text not null check (provider_id ~ '^[a-z0-9-]+$'),
  environment text not null check (environment ~ '^[a-z0-9-]+$'),
  provider_mode text not null check (
    provider_mode in ('single_code', 'automatic_selection')
  ),
  purpose text not null check (
    purpose = 'official_gift_code_redemption'
  ),
  policy_version text not null check (btrim(policy_version) <> ''),
  policy_digest text not null check (
    policy_digest ~ '^[a-f0-9]{64}$'
  ),
  evidence_version text not null check (btrim(evidence_version) <> ''),
  evidence_metadata jsonb not null default '{}'::jsonb check (
    private.gift_code_metadata_is_safe(evidence_metadata)
  ),
  granted_at timestamptz not null,
  revoked_at timestamptz,
  expires_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  retention_until timestamptz,
  check (expires_at is null or expires_at > granted_at),
  check (revoked_at is null or revoked_at >= granted_at),
  check (updated_at >= created_at),
  check (retention_until is null or retention_until >= created_at),
  unique (
    user_id,
    player_account_id,
    provider_id,
    environment,
    provider_mode,
    purpose,
    policy_version,
    policy_digest,
    granted_at
  ),
  unique (
    id,
    user_id,
    player_account_id,
    character_ref,
    character_revision,
    provider_id,
    environment,
    provider_mode
  )
);

create table public.gift_code_redemption_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  player_account_id uuid not null references
    public.player_accounts(id) on delete restrict,
  character_ref text not null check (btrim(character_ref) <> ''),
  character_revision bigint not null check (character_revision > 0),
  consent_id uuid not null,
  provider_id text not null check (provider_id ~ '^[a-z0-9-]+$'),
  provider_mode text not null check (
    provider_mode in ('single_code', 'automatic_selection')
  ),
  environment text not null check (environment ~ '^[a-z0-9-]+$'),
  operation text not null default 'redeem' check (operation = 'redeem'),
  code_publication_id text not null check (
    btrim(code_publication_id) <> ''
  ),
  publication_version text not null check (
    btrim(publication_version) <> ''
  ),
  idempotency_version text not null check (
    idempotency_version = 'giftcode-redemption:v2'
  ),
  idempotency_hash text not null check (
    idempotency_hash ~ '^[a-f0-9]{64}$'
  ),
  status text not null default 'requested' check (
    status in (
      'requested',
      'queued',
      'processing',
      'succeeded',
      'already_claimed',
      'failed_retryable',
      'failed_terminal',
      'ambiguous',
      'cancelled',
      'expired',
      'withdrawn'
    )
  ),
  result_code text not null default 'request_accepted' check (
    result_code in (
      'request_accepted',
      'already_claimed',
      'request_cancelled',
      'request_expired',
      'request_withdrawn',
      'retry_budget_exhausted',
      'rate_limited',
      'security_hold',
      'provider_success',
      'provider_retryable_failure',
      'provider_terminal_failure',
      'provider_ambiguous',
      'provider_not_supported',
      'provider_not_sent',
      'invalid_player',
      'invalid_code',
      'signing_failure',
      'authorisation_failure',
      'provider_unavailable'
    )
  ),
  completed_attempts smallint not null default 0 check (
    completed_attempts between 0 and 3
  ),
  maximum_attempts smallint not null default 3 check (
    maximum_attempts = 3
  ),
  next_attempt_at timestamptz,
  lease_owner text,
  lease_acquired_at timestamptz,
  lease_expires_at timestamptz,
  optimistic_version bigint not null default 1 check (
    optimistic_version > 0
  ),
  cancellation_requested_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason_code text,
  code_expires_at timestamptz,
  expired_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  terminal_at timestamptz,
  retention_until timestamptz,
  unique (idempotency_version, idempotency_hash),
  unique (id, user_id),
  foreign key (
    consent_id,
    user_id,
    player_account_id,
    character_ref,
    character_revision,
    provider_id,
    environment,
    provider_mode
  ) references public.gift_code_redemption_consents (
    id,
    user_id,
    player_account_id,
    character_ref,
    character_revision,
    provider_id,
    environment,
    provider_mode
  ) on delete restrict,
  check (updated_at >= created_at),
  check (
    (lease_owner is null and lease_acquired_at is null and lease_expires_at is null)
    or (
      lease_owner is not null
      and lease_acquired_at is not null
      and lease_expires_at is not null
      and lease_expires_at > lease_acquired_at
    )
  ),
  check (
    (status = 'processing') = (lease_owner is not null)
  ),
  check (
    (status = 'succeeded' and result_code = 'provider_success')
    or (status = 'already_claimed' and result_code = 'already_claimed')
    or (status = 'ambiguous' and result_code = 'provider_ambiguous')
    or (status = 'cancelled' and result_code = 'request_cancelled')
    or (status = 'expired' and result_code = 'request_expired')
    or (status = 'withdrawn' and result_code = 'request_withdrawn')
    or (
      status = 'failed_retryable'
      and result_code in (
        'provider_retryable_failure',
        'provider_not_sent',
        'rate_limited'
      )
    )
    or (
      status = 'failed_terminal'
      and result_code not in (
        'request_accepted',
        'provider_success',
        'already_claimed',
        'provider_retryable_failure',
        'provider_ambiguous'
      )
    )
    or (
      status in ('requested', 'queued', 'processing')
      and result_code = 'request_accepted'
    )
  ),
  check (
    (status in (
      'succeeded',
      'already_claimed',
      'failed_terminal',
      'ambiguous',
      'cancelled',
      'expired',
      'withdrawn'
    )) = (terminal_at is not null)
  ),
  check (status <> 'ambiguous' or next_attempt_at is null),
  check (
    status <> 'cancelled'
    or (cancelled_at is not null and cancellation_reason_code is not null)
  ),
  check (status <> 'expired' or expired_at is not null),
  check (status <> 'withdrawn' or withdrawn_at is not null),
  check (retention_until is null or retention_until >= created_at)
);

create table public.gift_code_redemption_attempts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references
    public.gift_code_redemption_requests(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  ordinal smallint not null check (ordinal between 1 and 3),
  provider_id text not null check (provider_id ~ '^[a-z0-9-]+$'),
  outcome text not null default 'not_started' check (
    outcome in (
      'not_started',
      'simulated',
      'provider_success',
      'provider_already_claimed',
      'provider_terminal_failure',
      'provider_retryable_failure',
      'provider_ambiguous',
      'provider_not_sent',
      'cancelled',
      'lease_expired'
    )
  ),
  request_disposition text not null default 'not_sent' check (
    request_disposition in ('not_sent', 'sent', 'unknown')
  ),
  result_code text not null default 'provider_not_sent' check (
    result_code in (
      'simulation_only',
      'already_claimed',
      'request_cancelled',
      'provider_success',
      'provider_retryable_failure',
      'provider_terminal_failure',
      'provider_ambiguous',
      'provider_not_supported',
      'provider_not_sent',
      'invalid_player',
      'invalid_code',
      'signing_failure',
      'authorisation_failure',
      'rate_limited',
      'lease_expired'
    )
  ),
  safe_diagnostic_code text,
  retryable boolean not null default false,
  lease_owner text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  deadline_at timestamptz,
  version smallint not null default 0 check (version in (0, 1)),
  created_at timestamptz not null default now(),
  retention_until timestamptz,
  unique (request_id, ordinal),
  foreign key (request_id, user_id) references
    public.gift_code_redemption_requests(id, user_id) on delete restrict,
  check (deadline_at is null or deadline_at > started_at),
  check (completed_at is null or completed_at >= started_at),
  check (
    (outcome = 'not_started' and completed_at is null and version = 0)
    or (outcome <> 'not_started' and completed_at is not null and version = 1)
  ),
  check (
    outcome <> 'simulated'
    or (
      request_disposition = 'not_sent'
      and result_code = 'simulation_only'
    )
  ),
  check (
    outcome <> 'provider_success'
    or (request_disposition = 'sent' and result_code = 'provider_success')
  ),
  check (
    outcome <> 'provider_already_claimed'
    or (request_disposition = 'sent' and result_code = 'already_claimed')
  ),
  check (
    outcome <> 'provider_retryable_failure'
    or (
      request_disposition = 'not_sent'
      and result_code in ('provider_retryable_failure', 'rate_limited')
    )
  ),
  check (
    outcome <> 'provider_ambiguous'
    or (
      request_disposition in ('sent', 'unknown')
      and result_code = 'provider_ambiguous'
    )
  ),
  check (
    outcome <> 'provider_not_sent'
    or (request_disposition = 'not_sent' and result_code = 'provider_not_sent')
  ),
  check (
    outcome <> 'provider_terminal_failure'
    or (
      request_disposition in ('not_sent', 'sent')
      and result_code in (
        'provider_terminal_failure',
        'provider_not_supported',
        'invalid_player',
        'invalid_code',
        'signing_failure',
        'authorisation_failure'
      )
    )
  ),
  check (
    outcome <> 'cancelled'
    or (request_disposition = 'not_sent' and result_code = 'request_cancelled')
  ),
  check (
    outcome <> 'lease_expired'
    or (request_disposition = 'not_sent' and result_code = 'lease_expired')
  ),
  check (retention_until is null or retention_until >= created_at)
);

create table public.gift_code_redemption_audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references
    public.gift_code_redemption_requests(id) on delete restrict,
  attempt_id uuid references
    public.gift_code_redemption_attempts(id) on delete restrict,
  consent_id uuid references
    public.gift_code_redemption_consents(id) on delete restrict,
  user_id uuid references auth.users(id) on delete restrict,
  player_account_id uuid references
    public.player_accounts(id) on delete restrict,
  code_publication_id text,
  publication_version text,
  event_type text not null check (btrim(event_type) <> ''),
  sequence bigint not null check (sequence > 0),
  actor_type text not null check (
    actor_type in ('user', 'support', 'admin', 'worker', 'system', 'deployment')
  ),
  actor_id text,
  provider_id text,
  environment text not null check (btrim(environment) <> ''),
  correlation_id text not null check (btrim(correlation_id) <> ''),
  privacy_classification text not null check (
    privacy_classification in (
      'operational',
      'player_sensitive',
      'consent_evidence',
      'security_audit'
    )
  ),
  metadata jsonb not null default '{}'::jsonb check (
    private.gift_code_metadata_is_safe(metadata)
  ),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  retention_until timestamptz,
  unique (request_id, sequence),
  foreign key (request_id, user_id) references
    public.gift_code_redemption_requests(id, user_id) on delete restrict,
  check (request_id is null or user_id is not null),
  check (retention_until is null or retention_until >= created_at)
);

create table public.gift_code_provider_health (
  provider_id text not null check (provider_id ~ '^[a-z0-9-]+$'),
  environment text not null check (environment ~ '^[a-z0-9-]+$'),
  provider_enabled boolean not null default false,
  circuit_state text not null default 'open' check (
    circuit_state in ('closed', 'open', 'half_open')
  ),
  health_status text not null default 'disabled' check (
    health_status in (
      'disabled', 'unknown', 'healthy', 'degraded', 'unhealthy', 'critical'
    )
  ),
  health_score smallint check (health_score between 0 and 100),
  reason_code text not null default 'provider_disabled',
  optimistic_version bigint not null default 1 check (
    optimistic_version > 0
  ),
  cooldown_until timestamptz,
  changed_by text not null,
  changed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  retention_until timestamptz,
  primary key (provider_id, environment),
  check (
    (provider_enabled = false and health_status = 'disabled')
    or provider_enabled = true
  ),
  check (
    (health_status in ('disabled', 'unknown') and health_score is null)
    or (health_status not in ('disabled', 'unknown') and health_score is not null)
  ),
  check (updated_at >= changed_at)
);

create table public.gift_code_provider_rate_limits (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null check (provider_id ~ '^[a-z0-9-]+$'),
  environment text not null check (environment ~ '^[a-z0-9-]+$'),
  scope_type text not null check (
    scope_type in ('source', 'user', 'character', 'publication', 'provider')
  ),
  scope_key_hash text not null check (
    scope_key_hash ~ '^[a-f0-9]{64}$'
  ),
  window_started_at timestamptz not null,
  window_expires_at timestamptz not null,
  allowed_count integer not null check (allowed_count >= 0),
  consumed_count integer not null default 0 check (consumed_count >= 0),
  optimistic_version bigint not null default 1 check (
    optimistic_version > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  retention_until timestamptz,
  unique (
    provider_id,
    environment,
    scope_type,
    scope_key_hash,
    window_started_at
  ),
  check (window_expires_at > window_started_at),
  check (consumed_count <= allowed_count),
  check (updated_at >= created_at)
);

create table public.gift_code_redemption_security_holds (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (
    scope_type in ('user', 'character', 'request', 'publication', 'provider')
  ),
  user_id uuid references auth.users(id) on delete restrict,
  player_account_id uuid references
    public.player_accounts(id) on delete restrict,
  request_id uuid references
    public.gift_code_redemption_requests(id) on delete restrict,
  code_publication_id text,
  provider_id text,
  environment text,
  status text not null default 'active' check (
    status in ('active', 'released')
  ),
  reason_code text not null check (btrim(reason_code) <> ''),
  case_reference text not null check (btrim(case_reference) <> ''),
  placed_by text not null check (btrim(placed_by) <> ''),
  placed_at timestamptz not null default now(),
  released_by text,
  released_at timestamptz,
  optimistic_version bigint not null default 1 check (
    optimistic_version > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  retention_until timestamptz,
  check (
    (scope_type = 'user' and user_id is not null)
    or (scope_type = 'character' and player_account_id is not null)
    or (scope_type = 'request' and request_id is not null)
    or (scope_type = 'publication' and code_publication_id is not null)
    or (scope_type = 'provider' and provider_id is not null and environment is not null)
  ),
  check (
    (status = 'active' and released_at is null and released_by is null)
    or (status = 'released' and released_at is not null and released_by is not null)
  ),
  check (released_at is null or released_at >= placed_at),
  check (updated_at >= created_at)
);

create trigger gift_code_consent_revocation_only
before update on public.gift_code_redemption_consents
for each row execute function
  private.validate_gift_code_consent_revocation();

create trigger gift_code_request_transition_guard
before update on public.gift_code_redemption_requests
for each row execute function
  private.validate_gift_code_request_transition();

create trigger gift_code_attempt_finalize_once
before update on public.gift_code_redemption_attempts
for each row execute function
  private.validate_gift_code_attempt_finalization();

create trigger gift_code_attempt_delete_guard
before delete on public.gift_code_redemption_attempts
for each row execute function
  private.prevent_gift_code_history_mutation();

create trigger gift_code_audit_append_only
before update or delete on public.gift_code_redemption_audit_events
for each row execute function
  private.prevent_gift_code_history_mutation();

create index gift_code_consents_owner_idx
on public.gift_code_redemption_consents (
  user_id,
  player_account_id,
  provider_id,
  environment,
  granted_at desc
);

create index gift_code_consents_player_fk_idx
on public.gift_code_redemption_consents (player_account_id);

create index gift_code_requests_consent_fk_idx
on public.gift_code_redemption_requests (consent_id);

create index gift_code_requests_player_fk_idx
on public.gift_code_redemption_requests (player_account_id);

create index gift_code_requests_owner_history_idx
on public.gift_code_redemption_requests (
  user_id,
  created_at desc,
  id desc
);

create index gift_code_requests_character_history_idx
on public.gift_code_redemption_requests (
  player_account_id,
  created_at desc,
  id desc
);

create index gift_code_requests_publication_history_idx
on public.gift_code_redemption_requests (
  code_publication_id,
  publication_version,
  created_at desc
);

create index gift_code_requests_due_claim_idx
on public.gift_code_redemption_requests (
  next_attempt_at,
  id
)
where status in ('queued', 'failed_retryable')
  and lease_owner is null;

create index gift_code_requests_expired_lease_idx
on public.gift_code_redemption_requests (
  lease_expires_at,
  id
)
where status = 'processing';

create index gift_code_attempts_request_fk_idx
on public.gift_code_redemption_attempts (request_id);

create index gift_code_attempts_owner_idx
on public.gift_code_redemption_attempts (
  user_id,
  started_at desc,
  id desc
);

create index gift_code_audit_request_idx
on public.gift_code_redemption_audit_events (
  request_id,
  sequence
)
where request_id is not null;

create index gift_code_audit_attempt_fk_idx
on public.gift_code_redemption_audit_events (attempt_id)
where attempt_id is not null;

create index gift_code_audit_consent_fk_idx
on public.gift_code_redemption_audit_events (consent_id)
where consent_id is not null;

create index gift_code_audit_owner_idx
on public.gift_code_redemption_audit_events (
  user_id,
  occurred_at desc,
  id desc
)
where user_id is not null;

create index gift_code_audit_player_fk_idx
on public.gift_code_redemption_audit_events (player_account_id)
where player_account_id is not null;

create index gift_code_rate_limits_expiry_idx
on public.gift_code_provider_rate_limits (window_expires_at);

create index gift_code_holds_user_fk_idx
on public.gift_code_redemption_security_holds (user_id)
where user_id is not null;

create index gift_code_holds_player_fk_idx
on public.gift_code_redemption_security_holds (player_account_id)
where player_account_id is not null;

create index gift_code_holds_request_fk_idx
on public.gift_code_redemption_security_holds (request_id)
where request_id is not null;

create index gift_code_holds_active_scope_idx
on public.gift_code_redemption_security_holds (
  scope_type,
  provider_id,
  environment,
  created_at desc
)
where status = 'active';

alter table public.gift_code_redemption_consents
  enable row level security;
alter table public.gift_code_redemption_requests
  enable row level security;
alter table public.gift_code_redemption_attempts
  enable row level security;
alter table public.gift_code_redemption_audit_events
  enable row level security;
alter table public.gift_code_provider_health
  enable row level security;
alter table public.gift_code_provider_rate_limits
  enable row level security;
alter table public.gift_code_redemption_security_holds
  enable row level security;

alter table public.gift_code_redemption_consents
  force row level security;
alter table public.gift_code_redemption_requests
  force row level security;
alter table public.gift_code_redemption_attempts
  force row level security;
alter table public.gift_code_redemption_audit_events
  force row level security;
alter table public.gift_code_provider_health
  force row level security;
alter table public.gift_code_provider_rate_limits
  force row level security;
alter table public.gift_code_redemption_security_holds
  force row level security;

create policy "Gift Code owners read their consent"
on public.gift_code_redemption_consents
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Gift Code owners read their requests"
on public.gift_code_redemption_requests
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Gift Code owners read their safe attempts"
on public.gift_code_redemption_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Gift Code owners read their safe audit events"
on public.gift_code_redemption_audit_events
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Authenticated users read coarse provider health"
on public.gift_code_provider_health
for select
to authenticated
using (true);

revoke all on table
  public.gift_code_redemption_consents,
  public.gift_code_redemption_requests,
  public.gift_code_redemption_attempts,
  public.gift_code_redemption_audit_events,
  public.gift_code_provider_health,
  public.gift_code_provider_rate_limits,
  public.gift_code_redemption_security_holds
from public, anon, authenticated;

grant all on table
  public.gift_code_redemption_consents,
  public.gift_code_redemption_requests,
  public.gift_code_redemption_attempts,
  public.gift_code_redemption_audit_events,
  public.gift_code_provider_health,
  public.gift_code_provider_rate_limits,
  public.gift_code_redemption_security_holds
to service_role;

grant select (
  id,
  character_ref,
  provider_id,
  environment,
  provider_mode,
  purpose,
  policy_version,
  granted_at,
  revoked_at,
  expires_at,
  version
) on public.gift_code_redemption_consents to authenticated;

grant select (
  id,
  character_ref,
  provider_id,
  provider_mode,
  environment,
  code_publication_id,
  publication_version,
  status,
  result_code,
  completed_attempts,
  maximum_attempts,
  next_attempt_at,
  optimistic_version,
  created_at,
  updated_at,
  terminal_at
) on public.gift_code_redemption_requests to authenticated;

grant select (
  id,
  request_id,
  ordinal,
  outcome,
  result_code,
  started_at,
  completed_at
) on public.gift_code_redemption_attempts to authenticated;

grant select (
  id,
  request_id,
  event_type,
  sequence,
  privacy_classification,
  occurred_at
) on public.gift_code_redemption_audit_events to authenticated;

grant select (
  provider_id,
  environment,
  provider_enabled,
  health_status,
  updated_at
) on public.gift_code_provider_health to authenticated;

create view public.gift_code_redemption_consent_status
with (security_invoker = true)
as
select
  id as consent_id,
  character_ref,
  provider_id,
  environment,
  provider_mode,
  purpose,
  policy_version,
  granted_at,
  revoked_at,
  expires_at,
  version,
  (
    revoked_at is null
    and (expires_at is null or expires_at > now())
  ) as consent_valid
from public.gift_code_redemption_consents;

create view public.gift_code_redemption_history
with (security_invoker = true)
as
select
  id as request_id,
  character_ref,
  provider_id,
  environment,
  code_publication_id,
  publication_version,
  status,
  result_code,
  created_at,
  updated_at
from public.gift_code_redemption_requests;

create view public.gift_code_redemption_request_detail
with (security_invoker = true)
as
select
  id as request_id,
  character_ref,
  provider_id,
  environment,
  code_publication_id,
  publication_version,
  status,
  result_code,
  completed_attempts,
  maximum_attempts,
  next_attempt_at,
  optimistic_version,
  created_at,
  updated_at,
  terminal_at,
  status in ('requested', 'queued', 'failed_retryable') as cancellable,
  (
    status = 'failed_retryable'
    and completed_attempts < maximum_attempts
  ) as retry_available,
  status = 'ambiguous' as ambiguity_review_required
from public.gift_code_redemption_requests;

create view public.gift_code_redemption_attempt_summary
with (security_invoker = true)
as
select
  id as attempt_id,
  request_id,
  ordinal,
  outcome,
  result_code,
  started_at,
  completed_at
from public.gift_code_redemption_attempts;

create view public.gift_code_redemption_current_status
with (security_invoker = true)
as
select
  id as request_id,
  character_ref,
  provider_id,
  environment,
  code_publication_id,
  publication_version,
  status,
  result_code,
  next_attempt_at,
  optimistic_version,
  updated_at
from public.gift_code_redemption_requests
where status in (
  'requested',
  'queued',
  'processing',
  'failed_retryable',
  'ambiguous'
);

create view public.gift_code_redemption_eligibility_context
with (security_invoker = true)
as
select
  consent.character_ref,
  consent.provider_id,
  consent.environment,
  consent.provider_mode,
  consent.policy_version,
  consent.consent_valid,
  coalesce(health.provider_enabled, false) as provider_available,
  coalesce(health.health_status, 'disabled') as provider_health_status
from public.gift_code_redemption_consent_status as consent
left join public.gift_code_provider_health as health
  on health.provider_id = consent.provider_id
  and health.environment = consent.environment;

revoke all on table
  public.gift_code_redemption_consent_status,
  public.gift_code_redemption_history,
  public.gift_code_redemption_request_detail,
  public.gift_code_redemption_attempt_summary,
  public.gift_code_redemption_current_status,
  public.gift_code_redemption_eligibility_context
from public, anon, authenticated;

grant select on table
  public.gift_code_redemption_consent_status,
  public.gift_code_redemption_history,
  public.gift_code_redemption_request_detail,
  public.gift_code_redemption_attempt_summary,
  public.gift_code_redemption_current_status,
  public.gift_code_redemption_eligibility_context
to authenticated, service_role;

comment on table public.gift_code_redemption_requests is
  'Disabled-by-default Gift Centre request lifecycle and durable queue proposal.';
comment on table public.gift_code_redemption_attempts is
  'Finalize-once Gift Centre attempt history; never stores raw provider payloads.';
comment on table public.gift_code_redemption_audit_events is
  'Append-only, privacy-filtered Gift Centre audit history.';
comment on view public.gift_code_redemption_eligibility_context is
  'Owner-scoped consent and coarse provider availability only; Player and publication eligibility remain server ports.';

commit;
