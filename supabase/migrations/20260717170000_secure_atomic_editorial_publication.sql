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

revoke all on table public.editorial_record_versions
  from anon, authenticated;
revoke all on table public.editorial_record_heads
  from anon, authenticated;
revoke all on table public.editorial_audit_events
  from anon, authenticated;
revoke all on table public.publication_queue
  from anon, authenticated;
revoke all on table public.scheduled_publications
  from anon, authenticated;

grant select on table public.editorial_record_versions
  to authenticated;
grant select on table public.editorial_record_heads
  to authenticated;
grant select on table public.editorial_audit_events
  to authenticated;
grant select on table public.publication_queue
  to authenticated;
grant select on table public.scheduled_publications
  to authenticated;

drop policy if exists
  "authenticated users can read editorial versions"
on public.editorial_record_versions;
drop policy if exists
  "authenticated users can read editorial heads"
on public.editorial_record_heads;
drop policy if exists
  "authenticated users can read editorial audit"
on public.editorial_audit_events;
drop policy if exists
  "authenticated users can read publication queue"
on public.publication_queue;
drop policy if exists
  "authenticated users can read schedules"
on public.scheduled_publications;

drop policy if exists
  "permitted users can read editorial versions"
on public.editorial_record_versions;
create policy
  "permitted users can read editorial versions"
on public.editorial_record_versions
for select
to authenticated
using (
  (select forge_private.has_permission('cms.history.view'))
);

drop policy if exists
  "permitted users can read editorial heads"
on public.editorial_record_heads;
create policy
  "permitted users can read editorial heads"
on public.editorial_record_heads
for select
to authenticated
using (
  (select forge_private.has_permission('cms.history.view'))
);

drop policy if exists
  "permitted users can read editorial audit"
on public.editorial_audit_events;
create policy
  "permitted users can read editorial audit"
on public.editorial_audit_events
for select
to authenticated
using (
  (select forge_private.has_permission('cms.history.view'))
);

drop policy if exists
  "publishers can read publication queue"
on public.publication_queue;
create policy
  "publishers can read publication queue"
on public.publication_queue
for select
to authenticated
using (
  (select forge_private.has_permission('cms.publish'))
);

drop policy if exists
  "publishers can read schedules"
on public.scheduled_publications;
create policy
  "publishers can read schedules"
on public.scheduled_publications
for select
to authenticated
using (
  (select forge_private.has_permission('cms.publish'))
);

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
  projection_values jsonb;
  hero_slug text;
  hero_skill_key text;
  hero_id public.heroes.id%type;
begin
  if nullif(trim(p_actor_id), '') is null then
    raise exception 'Publication actor is required.';
  end if;

  select *
  into queue_item
  from public.publication_queue
  where id = p_queue_item_id
  for update;

  if not found then
    raise exception
      'Publication queue item "%" was not found.',
      p_queue_item_id;
  end if;

  if queue_item.status <> 'processing' then
    raise exception
      'Publication queue item "%" must be processing; current status is "%".',
      queue_item.id,
      queue_item.status;
  end if;

  if queue_item.dataset_id not in ('heroes', 'hero-skills') then
    raise exception
      'Dataset "%" has no atomic live publication projection.',
      queue_item.dataset_id;
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
    or approved_version.dataset_id <> queue_item.dataset_id
    or approved_version.record_id <> queue_item.record_id
    or approved_version.version <> queue_item.expected_version
    or approved_version.status <> 'approved'
  then
    raise exception
      'The queued approved version does not match its editorial record.';
  end if;

  next_version := editorial_head.current_version + 1;
  projection_values := approved_version.values;

  if queue_item.dataset_id = 'heroes' then
    hero_slug := coalesce(
      nullif(trim(projection_values->>'slug'), ''),
      queue_item.record_id
    );

    update public.heroes
    set
      name = nullif(trim(projection_values->>'name'), ''),
      slug = hero_slug,
      generation = nullif(projection_values->>'generation', '')::integer,
      troop_type = nullif(trim(projection_values->>'troop_type'), ''),
      rarity = nullif(trim(projection_values->>'rarity'), ''),
      portrait_url = nullif(trim(projection_values->>'portrait_url'), ''),
      description = nullif(trim(projection_values->>'description'), ''),
      is_active = coalesce((projection_values->>'is_active')::boolean, true),
      rally_tier = nullif(trim(projection_values->>'rally_tier'), ''),
      garrison_tier = nullif(trim(projection_values->>'garrison_tier'), ''),
      bear_tier = nullif(trim(projection_values->>'bear_tier'), ''),
      joiner_tier = nullif(trim(projection_values->>'joiner_tier'), ''),
      is_f2p = nullif(projection_values->>'is_f2p', '')::boolean,
      is_vip = nullif(projection_values->>'is_vip', '')::boolean,
      best_use = nullif(trim(projection_values->>'best_use'), ''),
      tags = case
        when jsonb_typeof(projection_values->'tags') = 'array'
          then array(
            select jsonb_array_elements_text(projection_values->'tags')
          )
        else '{}'::text[]
      end,
      source_updated_at = nullif(projection_values->>'source_updated_at', '')::date,
      source_verified = nullif(trim(projection_values->>'source_verified'), ''),
      source_accuracy_score = nullif(projection_values->>'source_accuracy_score', '')::integer,
      source_name = nullif(trim(projection_values->>'source_name'), ''),
      source_url = nullif(trim(projection_values->>'source_url'), ''),
      updated_at = p_occurred_at
    where slug = hero_slug;

    if not found then
      raise exception
        'No canonical Hero with slug "%" exists for publication.',
        hero_slug;
    end if;
  else
    hero_skill_key := coalesce(
      nullif(trim(projection_values->>'id'), ''),
      queue_item.record_id
    );
    hero_slug := nullif(
      trim(projection_values->>'hero_slug'),
      ''
    );

    select id
    into hero_id
    from public.heroes
    where slug = hero_slug
      and is_active = true;

    if not found then
      raise exception
        'No active Hero with slug "%" exists for Hero Skill publication.',
        hero_slug;
    end if;

    insert into public.hero_skills (
      editorial_key,
      hero_id,
      name,
      category,
      skill_type,
      description,
      icon_url,
      display_order,
      slot_index,
      max_level,
      is_active,
      source_updated_at,
      source_verified,
      source_accuracy_score,
      source_name,
      source_url,
      published_version,
      published_version_id,
      published_at,
      published_by,
      updated_at
    )
    values (
      hero_skill_key,
      hero_id,
      nullif(trim(projection_values->>'name'), ''),
      nullif(trim(projection_values->>'category'), ''),
      nullif(trim(projection_values->>'skill_type'), ''),
      nullif(trim(projection_values->>'description'), ''),
      nullif(trim(projection_values->>'icon_url'), ''),
      (projection_values->>'display_order')::integer,
      (projection_values->>'slot_index')::integer,
      (projection_values->>'max_level')::integer,
      coalesce((projection_values->>'is_active')::boolean, true),
      nullif(projection_values->>'source_updated_at', '')::date,
      nullif(trim(projection_values->>'source_verified'), ''),
      nullif(projection_values->>'source_accuracy_score', '')::integer,
      nullif(trim(projection_values->>'source_name'), ''),
      nullif(trim(projection_values->>'source_url'), ''),
      next_version,
      p_published_version_id,
      p_occurred_at,
      p_actor_id,
      p_occurred_at
    )
    on conflict (editorial_key)
    do update set
      hero_id = excluded.hero_id,
      name = excluded.name,
      category = excluded.category,
      skill_type = excluded.skill_type,
      description = excluded.description,
      icon_url = excluded.icon_url,
      display_order = excluded.display_order,
      slot_index = excluded.slot_index,
      max_level = excluded.max_level,
      is_active = excluded.is_active,
      source_updated_at = excluded.source_updated_at,
      source_verified = excluded.source_verified,
      source_accuracy_score = excluded.source_accuracy_score,
      source_name = excluded.source_name,
      source_url = excluded.source_url,
      published_version = excluded.published_version,
      published_version_id = excluded.published_version_id,
      published_at = excluded.published_at,
      published_by = excluded.published_by,
      updated_at = excluded.updated_at;
  end if;

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
    queue_item.dataset_id,
    queue_item.record_id,
    next_version,
    'published',
    approved_version.values,
    approved_version.source,
    p_occurred_at,
    p_actor_id,
    queue_item.note
  );

  update public.editorial_record_heads
  set
    current_version = next_version,
    current_version_id = p_published_version_id,
    status = 'published',
    updated_at = p_occurred_at,
    updated_by = p_actor_id
  where dataset_id = queue_item.dataset_id
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
    queue_item.dataset_id,
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
      'approvedVersionId', approved_version.id
    )
  );

  update public.publication_queue
  set
    status = 'completed',
    completed_at = p_occurred_at,
    failure_message = null,
    metadata = coalesce(metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'publishedVersionId', p_published_version_id
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
    'completedAt', p_occurred_at
  );
end;
$$;

revoke all on function public.publish_editorial_queue_item(
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.publish_editorial_queue_item(
  text,
  text,
  text,
  text,
  timestamptz
) to service_role;

commit;
