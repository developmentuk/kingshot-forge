begin;

create schema if not exists forge_private;
revoke all on schema forge_private from public;
grant usage on schema forge_private to authenticated, service_role;

create or replace function forge_private.has_permission(
  p_permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.forge_user_roles as user_role
    join public.forge_role_permissions as role_permission
      on role_permission.role::text = user_role.role::text
    where user_role.user_id = (select auth.uid())
      and role_permission.permission_key::text = p_permission_key
  );
$$;

revoke all on function forge_private.has_permission(text) from public;
grant execute on function forge_private.has_permission(text)
  to authenticated, service_role;

create index if not exists editorial_versions_status_idx
  on public.editorial_record_versions (dataset_id, status, created_at desc);
create index if not exists editorial_versions_actor_idx
  on public.editorial_record_versions (created_by, created_at desc);
create index if not exists editorial_audit_actor_idx
  on public.editorial_audit_events (actor_id, occurred_at desc);
create index if not exists editorial_audit_action_idx
  on public.editorial_audit_events (action, occurred_at desc);
create index if not exists publication_queue_dataset_status_idx
  on public.publication_queue (dataset_id, status, requested_at desc);
create index if not exists scheduled_publications_dataset_status_idx
  on public.scheduled_publications (dataset_id, status, scheduled_for);

create or replace function forge_private.prevent_editorial_history_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Editorial history is append-only; % is not permitted.',
    tg_op;
end;
$$;

revoke all on function forge_private.prevent_editorial_history_mutation() from public;
grant execute on function forge_private.prevent_editorial_history_mutation()
  to service_role;

drop trigger if exists editorial_record_versions_immutable
  on public.editorial_record_versions;
create trigger editorial_record_versions_immutable
before update or delete on public.editorial_record_versions
for each row execute function forge_private.prevent_editorial_history_mutation();

drop trigger if exists editorial_audit_events_immutable
  on public.editorial_audit_events;
create trigger editorial_audit_events_immutable
before update or delete on public.editorial_audit_events
for each row execute function forge_private.prevent_editorial_history_mutation();

alter table public.editorial_record_versions enable row level security;
alter table public.editorial_record_heads enable row level security;
alter table public.editorial_audit_events enable row level security;
alter table public.publication_queue enable row level security;
alter table public.scheduled_publications enable row level security;

revoke all on table public.editorial_record_versions from anon, authenticated;
revoke all on table public.editorial_record_heads from anon, authenticated;
revoke all on table public.editorial_audit_events from anon, authenticated;
revoke all on table public.publication_queue from anon, authenticated;
revoke all on table public.scheduled_publications from anon, authenticated;

grant select on table public.editorial_record_versions to authenticated;
grant select on table public.editorial_record_heads to authenticated;
grant select on table public.editorial_record_versions to service_role;
grant select on table public.editorial_record_heads to service_role;
grant select on table public.editorial_audit_events to service_role;
grant select on table public.publication_queue to service_role;
grant select on table public.scheduled_publications to service_role;

drop policy if exists "authenticated users can read editorial versions"
  on public.editorial_record_versions;
drop policy if exists "authenticated users can read editorial heads"
  on public.editorial_record_heads;
drop policy if exists "authenticated users can read editorial audit"
  on public.editorial_audit_events;
drop policy if exists "authenticated users can read publication queue"
  on public.publication_queue;
drop policy if exists "authenticated users can read schedules"
  on public.scheduled_publications;

drop policy if exists "permitted users can read editorial versions"
  on public.editorial_record_versions;
create policy "permitted users can read editorial versions"
on public.editorial_record_versions
for select to authenticated
using ((select forge_private.has_permission('cms.history.view')));

drop policy if exists "permitted users can read editorial heads"
  on public.editorial_record_heads;
create policy "permitted users can read editorial heads"
on public.editorial_record_heads
for select to authenticated
using ((select forge_private.has_permission('cms.history.view')));

drop policy if exists "permitted users can read editorial audit"
  on public.editorial_audit_events;
create policy "permitted users can read editorial audit"
on public.editorial_audit_events
for select to authenticated
using ((select forge_private.has_permission('cms.history.view')));

drop policy if exists "publishers can read publication queue"
  on public.publication_queue;
create policy "publishers can read publication queue"
on public.publication_queue
for select to authenticated
using ((select forge_private.has_permission('cms.publish')));

drop policy if exists "publishers can read schedules"
  on public.scheduled_publications;
create policy "publishers can read schedules"
on public.scheduled_publications
for select to authenticated
using ((select forge_private.has_permission('cms.publish')));

create or replace function public.rollback_editorial_version(
  p_dataset_id text,
  p_record_id text,
  p_target_version_id text,
  p_actor_id text,
  p_published_version_id text,
  p_audit_event_id text,
  p_occurred_at timestamptz,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_head public.editorial_record_heads%rowtype;
  current_version public.editorial_record_versions%rowtype;
  target_version public.editorial_record_versions%rowtype;
  actor_id text;
  next_version integer;
  next_head jsonb;
  next_version_payload jsonb;
  audit_payload jsonb;
begin
  actor_id := case
    when current_user in ('service_role', 'postgres') then p_actor_id
    else (select auth.uid())::text
  end;

  if nullif(trim(actor_id), '') is null
    or actor_id is distinct from p_actor_id
  then
    raise exception 'Rollback actor must match the authenticated server actor.';
  end if;

  if current_user not in ('service_role', 'postgres')
    and not (select forge_private.has_permission('cms.history.restore'))
  then
    raise exception 'Actor is not permitted to roll back editorial history.';
  end if;

  select * into current_head
  from public.editorial_record_heads
  where dataset_id = p_dataset_id and record_id = p_record_id
  for update;

  if not found then
    raise exception 'Editorial record "%/%" was not found.', p_dataset_id, p_record_id;
  end if;

  if current_head.status not in ('published', 'archived') then
    raise exception 'Only published or archived editorial records can be rolled back.';
  end if;

  select * into current_version
  from public.editorial_record_versions
  where id = current_head.current_version_id
  for share;

  select * into target_version
  from public.editorial_record_versions
  where id = p_target_version_id
    and dataset_id = p_dataset_id
    and record_id = p_record_id
  for share;

  if not found then
    raise exception 'Rollback target does not belong to the editorial record.';
  end if;

  if target_version.version >= current_head.current_version then
    raise exception 'Rollback target must be older than the current version.';
  end if;

  next_version := current_head.current_version + 1;
  next_head := jsonb_build_object(
    'dataset_id', p_dataset_id,
    'record_id', p_record_id,
    'current_version', next_version,
    'current_version_id', p_published_version_id,
    'status', 'published',
    'updated_at', p_occurred_at,
    'updated_by', actor_id
  );
  next_version_payload := jsonb_build_object(
    'id', p_published_version_id,
    'dataset_id', p_dataset_id,
    'record_id', p_record_id,
    'version', next_version,
    'status', 'published',
    'values', target_version.values,
    'source', target_version.source,
    'created_at', p_occurred_at,
    'created_by', actor_id,
    'note', p_note
  );
  audit_payload := jsonb_build_object(
    'id', p_audit_event_id,
    'dataset_id', p_dataset_id,
    'record_id', p_record_id,
    'version_id', p_published_version_id,
    'action', 'rolled_back',
    'actor_id', actor_id,
    'occurred_at', p_occurred_at,
    'from_status', current_head.status,
    'to_status', 'published',
    'note', p_note,
    'metadata', jsonb_build_object(
      'rolledBackFromVersion', current_head.current_version,
      'rolledBackToVersion', target_version.version,
      'rolledBackToVersionId', target_version.id
    )
  );

  perform public.commit_editorial_version(
    next_head,
    next_version_payload,
    audit_payload,
    current_head.current_version
  );

  return jsonb_build_object(
    'datasetId', p_dataset_id,
    'recordId', p_record_id,
    'publishedVersionId', p_published_version_id,
    'publishedVersion', next_version,
    'rolledBackToVersionId', target_version.id,
    'completedAt', p_occurred_at
  );
end;
$$;

revoke all on function public.rollback_editorial_version(
  text, text, text, text, text, text, timestamptz, text
) from public, anon, authenticated;
grant execute on function public.rollback_editorial_version(
  text, text, text, text, text, text, timestamptz, text
) to service_role;

comment on table public.editorial_record_versions is
  'Immutable versions for governed Forge editorial records.';
comment on table public.editorial_record_heads is
  'Current optimistic-concurrency head for each Forge editorial record.';
comment on table public.editorial_audit_events is
  'Append-only audit history for editorial mutations.';
comment on table public.publication_queue is
  'Server-owned queue for atomic approved editorial publication.';
comment on table public.scheduled_publications is
  'Server-owned schedule for approved editorial publication.';
comment on function public.rollback_editorial_version(
  text, text, text, text, text, text, timestamptz, text
) is
  'Atomically publishes a new monotonic version copied from an older version; never deletes history.';

revoke all on function public.commit_editorial_version(jsonb, jsonb, jsonb, integer)
  from public, anon, authenticated;
grant execute on function public.commit_editorial_version(jsonb, jsonb, jsonb, integer)
  to service_role;

commit;
