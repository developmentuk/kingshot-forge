begin;

create table if not exists public.building_editorial_overrides (
  building_key text primary key references public.buildings(building_key) on delete cascade,
  values jsonb not null default '{}'::jsonb,
  published_version_id text not null references public.editorial_record_versions(id) on delete restrict,
  published_version integer not null check (published_version > 0),
  published_at timestamptz not null,
  published_by text not null,
  updated_at timestamptz not null default now(),
  constraint building_editorial_overrides_values_object
    check (jsonb_typeof(values) = 'object'),
  constraint building_editorial_overrides_image_alt
    check (
      nullif(trim(values->>'image_url'), '') is null
      or nullif(trim(values->>'image_alt_text'), '') is not null
    )
);

alter table public.building_editorial_overrides enable row level security;
alter table public.building_editorial_overrides force row level security;
revoke all on public.building_editorial_overrides from public, anon, authenticated;
grant select, insert, update, delete on public.building_editorial_overrides to service_role;

create or replace function forge_private.apply_building_editorial_override(
  p_building_key text,
  p_values jsonb,
  p_published_version_id text,
  p_published_version integer,
  p_actor_id text,
  p_published_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nullif(trim(p_building_key), '') is null then
    raise exception 'Building key is required for an editorial projection.';
  end if;

  if jsonb_typeof(coalesce(p_values, '{}'::jsonb)) <> 'object' then
    raise exception 'Building editorial values must be a JSON object.';
  end if;

  if not exists (
    select 1 from public.buildings where building_key = p_building_key
  ) then
    raise exception 'No canonical Building with key "%" exists for publication.', p_building_key;
  end if;

  if nullif(trim(p_values->>'image_url'), '') is not null
    and nullif(trim(p_values->>'image_alt_text'), '') is null
  then
    raise exception 'Building image alt text is required when an image is supplied.';
  end if;

  insert into public.building_editorial_overrides (
    building_key,
    values,
    published_version_id,
    published_version,
    published_at,
    published_by,
    updated_at
  )
  values (
    p_building_key,
    coalesce(p_values, '{}'::jsonb),
    p_published_version_id,
    p_published_version,
    p_published_at,
    p_actor_id,
    p_published_at
  )
  on conflict (building_key)
  do update set
    values = excluded.values,
    published_version_id = excluded.published_version_id,
    published_version = excluded.published_version,
    published_at = excluded.published_at,
    published_by = excluded.published_by,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function forge_private.apply_building_editorial_override(text, jsonb, text, integer, text, timestamptz) from public;
grant execute on function forge_private.apply_building_editorial_override(text, jsonb, text, integer, text, timestamptz) to service_role;

do $$
begin
  if to_regprocedure('public.publish_editorial_queue_item_core(text,text,text,text,timestamp with time zone)') is null then
    alter function public.publish_editorial_queue_item(text, text, text, text, timestamptz)
      rename to publish_editorial_queue_item_core;
  end if;
end;
$$;

create or replace function public.publish_editorial_queue_item(
  p_queue_item_id text,
  p_actor_id text,
  p_published_version_id text,
  p_audit_event_id text,
  p_occurred_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  queue_item public.publication_queue%rowtype;
  editorial_head public.editorial_record_heads%rowtype;
  approved_version public.editorial_record_versions%rowtype;
  next_version integer;
  building_key text;
begin
  select *
  into queue_item
  from public.publication_queue
  where id = p_queue_item_id
  for update;

  if not found then
    raise exception 'Publication queue item "%" was not found.', p_queue_item_id;
  end if;

  if queue_item.dataset_id <> 'buildings' then
    return public.publish_editorial_queue_item_core(
      p_queue_item_id,
      p_actor_id,
      p_published_version_id,
      p_audit_event_id,
      p_occurred_at
    );
  end if;

  if nullif(trim(p_actor_id), '') is null then
    raise exception 'Publication actor is required.';
  end if;

  if queue_item.status <> 'processing' then
    raise exception
      'Publication queue item "%" must be processing; current status is "%".',
      queue_item.id,
      queue_item.status;
  end if;

  select *
  into editorial_head
  from public.editorial_record_heads
  where dataset_id = queue_item.dataset_id
    and record_id = queue_item.record_id
  for update;

  if not found then
    raise exception
      'Editorial record "%/%" was not found.',
      queue_item.dataset_id,
      queue_item.record_id;
  end if;

  if editorial_head.current_version <> queue_item.expected_version
    or editorial_head.current_version_id <> queue_item.version_id
  then
    raise exception
      'Editorial publication is stale for "%/%".',
      queue_item.dataset_id,
      queue_item.record_id;
  end if;

  if editorial_head.status <> 'approved' then
    raise exception
      'Editorial record "%/%" must be approved before publication.',
      queue_item.dataset_id,
      queue_item.record_id;
  end if;

  select *
  into approved_version
  from public.editorial_record_versions
  where id = queue_item.version_id;

  if not found
    or approved_version.dataset_id <> 'buildings'
    or approved_version.record_id <> queue_item.record_id
    or approved_version.version <> queue_item.expected_version
    or approved_version.status <> 'approved'
  then
    raise exception 'The queued approved Building version does not match its editorial record.';
  end if;

  building_key := coalesce(
    nullif(trim(approved_version.values->>'key'), ''),
    nullif(trim(approved_version.values->>'building_key'), ''),
    queue_item.record_id
  );
  next_version := editorial_head.current_version + 1;

  insert into public.editorial_record_versions (
    id,
    dataset_id,
    record_id,
    version,
    status,
    values,
    source,
    created_at,
    created_by,
    note
  )
  values (
    p_published_version_id,
    'buildings',
    queue_item.record_id,
    next_version,
    'published',
    approved_version.values,
    approved_version.source,
    p_occurred_at,
    p_actor_id,
    queue_item.note
  );

  perform forge_private.apply_building_editorial_override(
    building_key,
    approved_version.values,
    p_published_version_id,
    next_version,
    p_actor_id,
    p_occurred_at
  );

  update public.editorial_record_heads
  set
    current_version = next_version,
    current_version_id = p_published_version_id,
    status = 'published',
    updated_at = p_occurred_at,
    updated_by = p_actor_id
  where dataset_id = 'buildings'
    and record_id = queue_item.record_id;

  insert into public.editorial_audit_events (
    id,
    dataset_id,
    record_id,
    version_id,
    action,
    actor_id,
    occurred_at,
    from_status,
    to_status,
    note,
    metadata
  )
  values (
    p_audit_event_id,
    'buildings',
    queue_item.record_id,
    p_published_version_id,
    'published',
    p_actor_id,
    p_occurred_at,
    'approved',
    'published',
    queue_item.note,
    jsonb_build_object(
      'queueItemId', queue_item.id,
      'approvedVersionId', approved_version.id,
      'projection', 'building_editorial_overrides'
    )
  );

  update public.publication_queue
  set
    status = 'completed',
    completed_at = p_occurred_at,
    failure_message = null,
    metadata = coalesce(metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'publishedVersionId', p_published_version_id,
        'projection', 'building_editorial_overrides'
      )
  where id = queue_item.id
    and status = 'processing';

  if not found then
    raise exception
      'Publication queue item "%" changed during publication.',
      queue_item.id;
  end if;

  return jsonb_build_object(
    'queueItemId', queue_item.id,
    'publishedVersionId', p_published_version_id,
    'publishedVersion', next_version,
    'completedAt', p_occurred_at,
    'projection', 'building_editorial_overrides'
  );
end;
$$;

revoke all on function public.publish_editorial_queue_item(text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.publish_editorial_queue_item(text, text, text, text, timestamptz) to service_role;

do $$
begin
  if to_regprocedure('public.rollback_editorial_version_core(text,text,text,text,text,text,timestamp with time zone,text)') is null then
    alter function public.rollback_editorial_version(text, text, text, text, text, text, timestamptz, text)
      rename to rollback_editorial_version_core;
  end if;
end;
$$;

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
set search_path = ''
as $$
declare
  result jsonb;
  published_version public.editorial_record_versions%rowtype;
  building_key text;
begin
  result := public.rollback_editorial_version_core(
    p_dataset_id,
    p_record_id,
    p_target_version_id,
    p_actor_id,
    p_published_version_id,
    p_audit_event_id,
    p_occurred_at,
    p_note
  );

  if p_dataset_id <> 'buildings' then
    return result;
  end if;

  select *
  into published_version
  from public.editorial_record_versions
  where id = p_published_version_id;

  if not found then
    raise exception 'Published Building rollback version was not created.';
  end if;

  building_key := coalesce(
    nullif(trim(published_version.values->>'key'), ''),
    nullif(trim(published_version.values->>'building_key'), ''),
    p_record_id
  );

  perform forge_private.apply_building_editorial_override(
    building_key,
    published_version.values,
    p_published_version_id,
    published_version.version,
    p_actor_id,
    p_occurred_at
  );

  return result || jsonb_build_object(
    'projection', 'building_editorial_overrides'
  );
end;
$$;

revoke all on function public.rollback_editorial_version(text, text, text, text, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.rollback_editorial_version(text, text, text, text, text, text, timestamptz, text) to service_role;

commit;
