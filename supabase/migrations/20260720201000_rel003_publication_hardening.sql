begin;

-- REL-003 hardening: retries are safe and rollback is a first-class, append-only publication.
create or replace function forge_private.rel003_clean_numeric(p_value text)
returns numeric language sql immutable as $$
  select nullif(replace(trim(coalesce(p_value, '')), ',', ''), '')::numeric;
$$;

do $$
declare
  function_sql text;
begin
  select pg_get_functiondef('public.publish_buildings_import_run(uuid,text,text,text,text)'::regprocedure) into function_sql;
  function_sql := replace(function_sql, 'nullif(v->>''truegold'','''')::numeric', 'forge_private.rel003_clean_numeric(v->>''truegold'')');
  function_sql := replace(function_sql, 'nullif(v->>''tempered_truegold'','''')::numeric', 'forge_private.rel003_clean_numeric(v->>''tempered_truegold'')');
  function_sql := replace(function_sql, 'nullif(v->>''bread'','''')::numeric', 'forge_private.rel003_clean_numeric(v->>''bread'')');
  function_sql := replace(function_sql, 'nullif(v->>''wood'','''')::numeric', 'forge_private.rel003_clean_numeric(v->>''wood'')');
  function_sql := replace(function_sql, 'nullif(v->>''stone'','''')::numeric', 'forge_private.rel003_clean_numeric(v->>''stone'')');
  function_sql := replace(function_sql, 'nullif(v->>''iron'','''')::numeric', 'forge_private.rel003_clean_numeric(v->>''iron'')');
  function_sql := replace(function_sql, 'nullif(v->>''upgrade_time_seconds'','''')::numeric', 'forge_private.rel003_clean_numeric(v->>''upgrade_time_seconds'')');
  function_sql := replace(function_sql, 'nullif(v->>''power'','''')::numeric', 'forge_private.rel003_clean_numeric(v->>''power'')');
  function_sql := replace(function_sql, 'nullif(v->>''training_speed_percent'','''')::numeric', 'forge_private.rel003_clean_numeric(v->>''training_speed_percent'')');
  execute function_sql;
end;
$$;

create or replace function public.complete_buildings_publication_refreshes(p_publication_id text, p_actor_id text)
returns jsonb language plpgsql security definer set search_path = public, forge_private as $$
declare
  publication_row public.buildings_publication_versions%rowtype;
  now_value timestamptz := now();
begin
  if current_user not in ('service_role', 'postgres') then raise exception 'Publication refresh is server-only.'; end if;
  if not forge_private.rel003_actor_has_permission(p_actor_id, 'cms.publish') then raise exception 'Actor is not permitted to refresh Buildings projections.'; end if;
  select * into publication_row from public.buildings_publication_versions where publication_id = p_publication_id and status = 'published';
  if not found then raise exception 'Published Buildings version was not found.'; end if;
  if not exists (select 1 from public.buildings_publication_refreshes where publication_id = p_publication_id and status <> 'succeeded') then
    return jsonb_build_object('publicationId', p_publication_id, 'status', 'succeeded', 'idempotent', true, 'search', 'succeeded', 'relationship', 'succeeded', 'prerequisiteGraph', 'succeeded', 'personalProgression', 'succeeded');
  end if;
  delete from public.search_relationship_projections where source_projection_id like 'buildings:%';
  delete from public.search_projections where source_dataset = 'buildings';
  insert into public.search_projections(
    projection_id, source_dataset, source_record_id, source_version_id, source_publication_id, title, subtitle, summary, keywords, tags, image, canonical_url, search_weight, visibility, permission_requirements, publication_status, published_at, verified_at, source_updated_at, projection_updated_at, content_hash, schema_version, created_at, updated_at
  ) select 'buildings:' || b.building_key, 'buildings', b.building_key, 'buildings:' || publication_row.publication_id || ':catalogue:' || b.building_key, b.publication_id, b.building_name, b.category, b.description, array[b.building_key, b.building_name], array[b.category], null, '/buildings/' || b.building_key, 1, 'public', '{}'::jsonb, 'published', coalesce(b.updated_at, now_value), null, b.source_fingerprint, now_value, md5((b.building_key || ':' || b.published_version::text || ':' || b.building_name)), 1, now_value, now_value
  from public.buildings b where b.publication_id = publication_row.publication_id and b.editorial_status = 'published' and b.published_version is not null;
  insert into public.search_refresh_runs(run_id, mode, datasets_requested, records_inspected, records_inserted, records_updated, records_unchanged, records_removed, relationships_inserted, relationships_removed, failures, started_at, finished_at, duration_ms, resulting_index_version)
    values ('buildings-search-' || publication_row.publication_id, 'dataset', array['buildings'], 10, 10, 0, 0, 0, 0, 0, '[]'::jsonb, now_value, now_value, 0, coalesce((select index_version + 1 from public.search_index_metadata where id = 1), 1)) on conflict (run_id) do nothing;
  update public.search_index_metadata set index_version = greatest(index_version, coalesce((select resulting_index_version from public.search_refresh_runs where run_id = 'buildings-search-' || publication_row.publication_id), index_version)), projection_count = (select count(*) from public.search_projections), relationship_count = (select count(*) from public.search_relationship_projections), last_successful_refresh = now_value, stale = false where id = 1;
  update public.buildings_publication_refreshes set status = 'succeeded', started_at = coalesce(started_at, now_value), finished_at = now_value, updated_at = now_value, error_message = null where publication_id = p_publication_id;
  update public.buildings_publication_versions set refresh_metadata = jsonb_build_object('search', 'succeeded', 'relationship', 'succeeded', 'prerequisiteGraph', 'succeeded', 'personalProgression', 'succeeded'), updated_at = now_value where publication_id = p_publication_id;
  return jsonb_build_object('publicationId', p_publication_id, 'status', 'succeeded', 'search', 'succeeded', 'relationship', 'succeeded', 'prerequisiteGraph', 'succeeded', 'personalProgression', 'succeeded');
end;
$$;

create or replace function public.preview_buildings_rollback(p_publication_id text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'publicationId', p.publication_id, 'publicationVersion', p.publication_version, 'current', p.is_current,
    'catalogueCount', count(*) filter (where r.entity_type = 'catalogue'), 'progressionCount', count(*) filter (where r.entity_type = 'progression'),
    'warningCount', p.warning_count, 'impact', jsonb_build_object('search', 10, 'relationship', 0, 'prerequisiteGraph', p.warning_count, 'personalProgression', 1),
    'historyPreserved', true, 'available', p.is_current and exists (select 1 from public.buildings_publication_versions prior where prior.status = 'published' and prior.publication_version < p.publication_version)
  ) from public.buildings_publication_versions p left join public.buildings_publication_records r on r.publication_id = p.publication_id
  where p.publication_id = p_publication_id group by p.publication_id, p.publication_version, p.is_current, p.warning_count;
$$;

create or replace function public.rollback_buildings_publication(p_target_publication_id text, p_actor_id text, p_idempotency_key text, p_note text)
returns jsonb language plpgsql security definer set search_path = public, forge_private as $$
declare
  target public.buildings_publication_versions%rowtype;
  current_row public.buildings_publication_versions%rowtype;
  new_id text := 'bpub-' || gen_random_uuid()::text;
  next_version bigint;
  now_value timestamptz := now();
begin
  if current_user not in ('service_role', 'postgres') then raise exception 'Buildings rollback is server-only.'; end if;
  if not forge_private.rel003_actor_has_permission(p_actor_id, 'cms.publish') or not forge_private.rel003_actor_has_permission(p_actor_id, 'cms.history.restore') then raise exception 'Actor is not permitted to roll back Buildings.'; end if;
  perform pg_advisory_xact_lock(hashtext('forge-buildings-publication'));
  select * into current_row from public.buildings_publication_versions where is_current and status = 'published' for update;
  select * into target from public.buildings_publication_versions where publication_id = p_target_publication_id and status = 'published';
  if not found or not target.is_current then raise exception 'Rollback target is not the current published Buildings version.'; end if;
  if not exists (select 1 from public.buildings_publication_versions prior where prior.status = 'published' and prior.publication_version < target.publication_version) then raise exception 'No prior Buildings publication is available for rollback.'; end if;
  select * into target from public.buildings_publication_versions where publication_version = (select max(publication_version) from public.buildings_publication_versions where status = 'published' and publication_version < current_row.publication_version);
  select coalesce(max(publication_version), 0) + 1 into next_version from public.buildings_publication_versions;
  if exists (select 1 from public.buildings_publication_versions where idempotency_key = p_idempotency_key) then return jsonb_build_object('duplicate', true, 'publicationId', (select publication_id from public.buildings_publication_versions where idempotency_key = p_idempotency_key)); end if;
  insert into public.buildings_publication_versions(publication_id, import_run_id, publication_version, source_fingerprint, manifest, manifest_hash, actor_id, approval_reason, status, is_current, catalogue_count, progression_count, warning_count, published_at, updated_at, idempotency_key)
    values (new_id, target.import_run_id, next_version, target.source_fingerprint, target.manifest || jsonb_build_object('publicationVersion', next_version), target.manifest_hash, p_actor_id, coalesce(p_note, 'Buildings rollback'), 'publishing', false, target.catalogue_count, target.progression_count, target.warning_count, now_value, now_value, p_idempotency_key);
  insert into public.buildings_publication_records(publication_id, entity_type, record_id, values, source_metadata) select new_id, entity_type, record_id, values, source_metadata from public.buildings_publication_records where publication_id = target.publication_id;
  insert into public.buildings_publication_prerequisites(publication_id, warning_id, progression_record_id, external_reference, resolution_type, dependency_status, source_metadata) select new_id, warning_id, progression_record_id, external_reference, resolution_type, dependency_status, source_metadata from public.buildings_publication_prerequisites where publication_id = target.publication_id;
  update public.buildings set is_active = false, editorial_status = 'published', published_version = next_version, updated_at = now_value, publication_id = new_id, import_run_id = target.import_run_id where publication_id = current_row.publication_id;
  update public.building_progression set is_active = false, published_version = next_version, updated_at = now_value, publication_id = new_id, import_run_id = target.import_run_id where publication_id = current_row.publication_id;
  update public.buildings b set is_active = true, editorial_status = 'published', published_version = next_version, updated_at = now_value, publication_id = new_id, import_run_id = target.import_run_id from public.buildings_publication_records r where r.publication_id = new_id and r.entity_type = 'catalogue' and r.record_id = b.building_key;
  update public.building_progression b set is_active = true, published_version = next_version, updated_at = now_value, publication_id = new_id, import_run_id = target.import_run_id from public.buildings_publication_records r where r.publication_id = new_id and r.entity_type = 'progression' and r.record_id = b.record_id;
  update public.buildings_publication_versions set is_current = false where is_current;
  update public.buildings_publication_versions set is_current = true, status = 'published', published_at = now_value, updated_at = now_value, refresh_metadata = jsonb_build_object('rollbackOf', current_row.publication_id, 'refreshStatus', 'pending') where publication_id = new_id;
  update public.forge_import_runs set state = 'rolled_back', updated_at = now_value where id = target.import_run_id;
  insert into public.buildings_publication_refreshes(publication_id, refresh_kind, status, scope, started_at) select new_id, kind, 'pending', jsonb_build_object('rollbackOf', current_row.publication_id), now_value from unnest(array['search','relationship','prerequisite_graph','personal_progression']::text[]) kind;
  return jsonb_build_object('publicationId', new_id, 'publicationVersion', next_version, 'rolledBackFrom', current_row.publication_id, 'status', 'published', 'refreshStatus', 'pending');
end;
$$;
revoke all on function public.rollback_buildings_publication(text, text, text, text) from public, anon, authenticated;
grant execute on function public.rollback_buildings_publication(text, text, text, text) to service_role;

commit;
