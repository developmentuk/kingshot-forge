begin;

create table public.oasis_publication_versions (
  publication_id text primary key,
  -- PostgreSQL sequence allocations can retain gaps after rolled-back inserts.
  -- Callers therefore never predict or supply this database-owned identity.
  publication_version bigint generated always as identity unique not null,
  dataset_id text not null default 'oasis-island' check (dataset_id = 'oasis-island'),
  schema_version text not null check (schema_version = 'oasis-public-projection-v2'),
  status text not null check (status = 'published'),
  source_fingerprint text not null,
  manifest jsonb not null,
  manifest_hash text not null check (manifest_hash ~ '^[0-9a-f]{64}$'),
  record_content_hash text not null check (record_content_hash ~ '^[0-9a-f]{64}$'),
  record_count integer not null check (record_count = 55),
  media_count integer not null check (media_count = 111),
  actor_id text not null,
  publication_reason text not null,
  idempotency_key text not null unique,
  rollback_of_publication_id text references public.oasis_publication_versions(publication_id) on delete restrict,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.oasis_publication_records (
  publication_id text not null references public.oasis_publication_versions(publication_id) on delete restrict,
  record_id text not null,
  public_record jsonb not null,
  primary key (publication_id, record_id),
  check (public_record->>'schemaVersion' = 'oasis-public-projection-v2'),
  check (public_record->>'status' = 'published'),
  check (public_record->>'id' = record_id),
  check (not public_record ?| array['_meta', 'source', 'sourceUrl', 'sourceText', 'sourceDocument', 'sourceTableIndex', 'verification', 'verificationHistory', 'verificationNotes', 'provenance', 'provenanceNotes', 'knownConflicts', 'privateSourceFilename', 'imageInventory', 'imageFiles', 'imageVariantFiles', 'assetStem', 'repositoryPath', 'filesystemPath'])
);

create table public.oasis_publication_current (
  singleton boolean primary key default true check (singleton),
  publication_id text not null unique references public.oasis_publication_versions(publication_id) on delete restrict,
  activated_at timestamptz not null,
  activated_by text not null
);

create table public.oasis_publication_audits (
  audit_id uuid primary key default gen_random_uuid(),
  publication_id text not null references public.oasis_publication_versions(publication_id) on delete restrict,
  action text not null check (action in ('published', 'rollback_published')),
  actor_id text not null,
  reason text not null,
  previous_publication_id text,
  manifest_hash text not null,
  occurred_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb
);

create table public.oasis_publication_search_refreshes (
  publication_id text primary key references public.oasis_publication_versions(publication_id) on delete restrict,
  status text not null check (status in ('pending', 'running', 'succeeded', 'failed')) default 'pending',
  attempt_count integer not null default 0,
  error_message text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.oasis_publication_versions enable row level security;
alter table public.oasis_publication_records enable row level security;
alter table public.oasis_publication_current enable row level security;
alter table public.oasis_publication_audits enable row level security;
alter table public.oasis_publication_search_refreshes enable row level security;

revoke all on public.oasis_publication_versions, public.oasis_publication_records,
  public.oasis_publication_current, public.oasis_publication_audits,
  public.oasis_publication_search_refreshes from public, anon, authenticated;
grant select on public.oasis_publication_versions, public.oasis_publication_records,
  public.oasis_publication_current, public.oasis_publication_audits,
  public.oasis_publication_search_refreshes to service_role;

create or replace function public.prevent_oasis_publication_history_mutation()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  raise exception '% is append-only; % is not permitted', tg_table_name, tg_op;
end;
$$;
revoke all on function public.prevent_oasis_publication_history_mutation() from public, anon, authenticated;
grant execute on function public.prevent_oasis_publication_history_mutation() to service_role;

create trigger oasis_versions_immutable before update or delete on public.oasis_publication_versions
for each row execute function public.prevent_oasis_publication_history_mutation();
create trigger oasis_records_immutable before update or delete on public.oasis_publication_records
for each row execute function public.prevent_oasis_publication_history_mutation();
create trigger oasis_audits_immutable before update or delete on public.oasis_publication_audits
for each row execute function public.prevent_oasis_publication_history_mutation();

create or replace function public.oasis_canonical_number(p_value numeric)
returns text language plpgsql immutable strict security invoker set search_path = pg_catalog as $$
begin
  -- oasis-canonical-json-v1: at most seven decimal places and an absolute
  -- magnitude of 100,000,000. Multiplication by 10^7 therefore remains below
  -- JavaScript's maximum safe integer and is reproducible in both runtimes.
  if p_value::text in ('NaN', 'Infinity', '-Infinity')
     or abs(p_value) > 100000000 or p_value <> trunc(p_value, 7) then
    raise exception using
      errcode = '22023',
      message = 'Oasis canonical number is outside the supported magnitude or seven-decimal precision boundary.';
  end if;
  if p_value = 0 then return '0'; end if;
  return trim_scale(p_value)::text;
end;
$$;

create or replace function public.oasis_positive_integer_json_number(p_value jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = pg_catalog as $$
begin
  if jsonb_typeof(p_value) is distinct from 'number' then return false; end if;
  return (p_value #>> '{}')::numeric > 0
    and (p_value #>> '{}')::numeric = trunc((p_value #>> '{}')::numeric);
end;
$$;

create or replace function public.oasis_stable_json(p_value jsonb)
returns text language plpgsql immutable strict security invoker set search_path = pg_catalog as $$
declare
  result text;
begin
  case jsonb_typeof(p_value)
    when 'object' then
      select '{' || coalesce(string_agg(to_jsonb(key)::text || ':' || public.oasis_stable_json(value), ',' order by key collate "C"), '') || '}'
        into result from jsonb_each(p_value);
    when 'array' then
      select '[' || coalesce(string_agg(public.oasis_stable_json(value), ',' order by ordinality), '') || ']'
        into result from jsonb_array_elements(p_value) with ordinality;
    when 'string' then return to_jsonb(p_value #>> '{}')::text;
    when 'number' then return public.oasis_canonical_number((p_value #>> '{}')::numeric);
    else return p_value::text;
  end case;
  return result;
end;
$$;

create or replace function public.oasis_json_has_forbidden_key(p_value jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = pg_catalog as $$
declare
  child record;
begin
  if jsonb_typeof(p_value) = 'object' then
    for child in select key, value from jsonb_each(p_value) loop
      if child.key = any(array[
        '_meta', 'source', 'sourceUrl', 'sourceText', 'sourceDocument', 'sourceTableIndex',
        'verification', 'verificationHistory', 'verificationNotes', 'provenance',
        'provenanceNotes', 'knownConflicts', 'privateSourceFilename', 'imageInventory',
        'imageFiles', 'imageVariantFiles', 'assetStem', 'repositoryPath', 'filesystemPath'
      ]) or public.oasis_json_has_forbidden_key(child.value) then
        return true;
      end if;
    end loop;
  elsif jsonb_typeof(p_value) = 'array' then
    for child in select value from jsonb_array_elements(p_value) loop
      if public.oasis_json_has_forbidden_key(child.value) then return true; end if;
    end loop;
  end if;
  return false;
end;
$$;

create or replace function public.oasis_manifest_sha256(p_manifest jsonb)
returns text language sql immutable strict security invoker set search_path = pg_catalog as $$
  select encode(pg_catalog.sha256(convert_to(public.oasis_stable_json(p_manifest), 'UTF8')), 'hex');
$$;

create or replace function public.oasis_record_content_sha256(p_records jsonb)
returns text language sql immutable strict security invoker set search_path = pg_catalog as $$
  select encode(pg_catalog.sha256(convert_to('oasis-record-content-sha256-v2' || chr(10) || public.oasis_stable_json(
    coalesce((
      select jsonb_agg(record - array['publicationId', 'publicationVersion', 'publishedAt', 'updatedAt'] order by record->>'id' collate "C")
      from jsonb_array_elements(p_records) record
    ), '[]'::jsonb)
  ), 'UTF8')), 'hex');
$$;

revoke all on function public.oasis_canonical_number(numeric) from public, anon, authenticated;
revoke all on function public.oasis_positive_integer_json_number(jsonb) from public, anon, authenticated;
revoke all on function public.oasis_stable_json(jsonb) from public, anon, authenticated;
revoke all on function public.oasis_json_has_forbidden_key(jsonb) from public, anon, authenticated;
revoke all on function public.oasis_manifest_sha256(jsonb) from public, anon, authenticated;
revoke all on function public.oasis_record_content_sha256(jsonb) from public, anon, authenticated;

do $$
declare
  vector record;
begin
  if public.oasis_stable_json('{"z":[3,true,null,"Oasis"],"a":{"width":720,"path":"media/oasis-island/shared/artwork-unavailable.webp"},"count":111}'::jsonb)
       <> '{"a":{"path":"media/oasis-island/shared/artwork-unavailable.webp","width":720},"count":111,"z":[3,true,null,"Oasis"]}'
    or public.oasis_manifest_sha256('{"z":[3,true,null,"Oasis"],"a":{"width":720,"path":"media/oasis-island/shared/artwork-unavailable.webp"},"count":111}'::jsonb)
       <> '8c76a240d927f231e750fb98bc6ee62881471495cb7e6946a1a0898b8c36ff8d' then
    raise exception 'Oasis canonical JSON/hash contract does not match the shared fixture.';
  end if;
  for vector in select * from (values
    ('zero', 0::numeric, '0'),
    ('negative zero', (-0.0)::numeric, '0'),
    ('positive integer', 00042::numeric, '42'),
    ('negative integer', (-00042)::numeric, '-42'),
    ('ordinary decimal', 12.3400::numeric, '12.34'),
    ('redundant decimal zeros', 0001.2300000::numeric, '1.23'),
    ('positive one e minus seven', 0.0000001::numeric, '0.0000001'),
    ('negative one e minus seven', (-0.0000001)::numeric, '-0.0000001'),
    ('at JavaScript lower exponent threshold', 0.0000010::numeric, '0.000001'),
    ('maximum positive magnitude', 100000000.0000000::numeric, '100000000'),
    ('maximum negative magnitude', (-100000000.0000000)::numeric, '-100000000'),
    ('maximum magnitude and precision', 99999999.9999999::numeric, '99999999.9999999')
  ) accepted(name, numeric_value, expected_text) loop
    if public.oasis_canonical_number(vector.numeric_value) <> vector.expected_text then
      raise exception 'Oasis canonical-number vector % failed.', vector.name;
    end if;
  end loop;
  if public.oasis_stable_json('{"z":[-0,0.0000001,-0.0000001,100000000],"a":{"decimal":12.3400,"integer":-42}}'::jsonb)
       <> '{"a":{"decimal":12.34,"integer":-42},"z":[0,0.0000001,-0.0000001,100000000]}'
    or public.oasis_record_content_sha256('[{"id":"z-record","value":-0.0000001,"publicationId":"ignored","publicationVersion":9,"publishedAt":"ignored","updatedAt":"ignored"},{"id":"a-record","value":{"whole":42,"tiny":0.0000001}}]'::jsonb)
       <> 'f1b1d745445d6c18663fac523ef05fae7ed6b3a9e67d4048ea9052dfca67298f' then
    raise exception 'Oasis nested canonical JSON/record hash contract does not match the shared fixture.';
  end if;
  begin
    perform public.oasis_canonical_number(0.00000001::numeric);
    raise exception 'Oasis excessive-precision numeric vector was accepted.';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.oasis_canonical_number('NaN'::numeric);
    raise exception 'Oasis non-finite numeric vector was accepted.';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.oasis_canonical_number(100000000.0000001::numeric);
    raise exception 'Oasis out-of-range numeric vector was accepted.';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.oasis_canonical_number(100000000000000000000::numeric);
    raise exception 'Oasis pre-upper-exponent numeric vector was accepted.';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.oasis_canonical_number(1000000000000000000000::numeric);
    raise exception 'Oasis upper-exponent numeric vector was accepted.';
  exception when sqlstate '22023' then null;
  end;
end;
$$;

create or replace function public.publish_oasis_catalogue(
  p_publication_id text,
  p_schema_version text,
  p_source_fingerprint text,
  p_manifest jsonb,
  p_manifest_hash text,
  p_records jsonb,
  p_actor_id text,
  p_reason text,
  p_idempotency_key text,
  p_rollback_of_publication_id text default null
)
returns jsonb language plpgsql security definer set search_path = pg_catalog as $$
declare
  existing public.oasis_publication_versions%rowtype;
  rollback_source public.oasis_publication_versions%rowtype;
  previous_id text;
  version_value bigint;
  rollback_candidate_content jsonb;
  rollback_source_content jsonb;
  submitted_content_hash text;
  publication_timestamp timestamptz;
  current_publication_timestamp timestamptz;
  publication_timestamp_text text;
  allowed_record_keys constant text[] := array[
    'schemaVersion', 'id', 'name', 'aliases', 'recordType', 'rarity',
    'availabilityCategory', 'footprint', 'typeLimit', 'maxLevel', 'function',
    'levels', 'maxEffects', 'unlock', 'upgrade', 'maxProsperity', 'trustLabel',
    'media', 'publicationId', 'publicationVersion', 'publishedAt', 'updatedAt',
    'canonicalRoute', 'status'
  ];
  expected_missing_ids constant text[] := array[
    'construction-hut', 'fountain-of-life', 'golden-sunset', 'purifier', 'reservoir', 'skating-rink'
  ];
  allowed_trust_labels constant text[] := array[
    'Owner verified in-game', 'Officially verified',
    'Mixed official and community evidence', 'Official mechanics; values partial',
    'Source attachment extracted', 'Community corroborated',
    'Partial source coverage', 'Needs in-game verification'
  ];
  allowed_level_keys constant text[] := array[
    'level', 'prosperity', 'prosperityRequired', 'waterEssencePerHour',
    'bonuses', 'knownEffects', 'exactOutputKnown'
  ];
  allowed_bonus_keys constant text[] := array['label', 'stat', 'valuePct', 'effect'];
  allowed_footprint_keys constant text[] := array['width', 'height', 'display'];
  allowed_unlock_keys constant text[] := array['requirement', 'initialBlueprintPurchase'];
  allowed_upgrade_keys constant text[] := array[
    'currency', 'exchange', 'generalBlueprintRefresh', 'officiallyVerified'
  ];
begin
  -- SECURITY DEFINER makes current_user the owner. The caller boundary is therefore
  -- the explicit EXECUTE revoke/grant below, with only service_role granted access.
  if coalesce(btrim(p_publication_id), '') = '' or coalesce(btrim(p_actor_id), '') = ''
     or coalesce(btrim(p_reason), '') = '' or coalesce(btrim(p_idempotency_key), '') = '' then
    raise exception 'Oasis publication identity, actor, reason and idempotency key are required.';
  end if;
  if p_schema_version <> 'oasis-public-projection-v2' then raise exception 'Unsupported Oasis public projection schema.'; end if;
  if jsonb_typeof(p_manifest) is distinct from 'object' then raise exception 'Oasis manifest must be a JSON object.'; end if;
  if not (p_manifest ?& array[
       'schemaVersion', 'sourceFingerprintVersion', 'sourceFingerprint',
       'sourceAssetCount', 'derivativeAssetCount', 'sourceAssetBytes',
       'derivativeAssetBytes', 'entries', 'missingArtworkRecordIds', 'placeholder'
     ]) then
    raise exception 'Oasis manifest is missing required fields.';
  end if;
  if jsonb_typeof(p_manifest->'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_manifest->'sourceFingerprintVersion') is distinct from 'string'
     or jsonb_typeof(p_manifest->'sourceFingerprint') is distinct from 'string' then
    raise exception 'Oasis manifest text metadata must use JSON strings.';
  end if;
  if p_manifest->>'schemaVersion' is distinct from 'oasis-media-manifest-v2'
     or p_manifest->>'sourceFingerprintVersion' is distinct from 'oasis-source-fingerprint-v2' then
    raise exception 'Unsupported Oasis media manifest or source-fingerprint schema.';
  end if;
  if p_source_fingerprint !~ '^[0-9a-f]{64}$' or p_manifest->>'sourceFingerprint' is distinct from p_source_fingerprint then raise exception 'Oasis source fingerprint does not match the manifest.'; end if;
  if not (p_manifest ? 'sourceAssetCount')
     or public.oasis_positive_integer_json_number(p_manifest->'sourceAssetCount') is distinct from true
     or (case when jsonb_typeof(p_manifest->'sourceAssetCount') = 'number' then (p_manifest->>'sourceAssetCount')::numeric end) is distinct from 111
     or not (p_manifest ? 'derivativeAssetCount')
     or public.oasis_positive_integer_json_number(p_manifest->'derivativeAssetCount') is distinct from true
     or (case when jsonb_typeof(p_manifest->'derivativeAssetCount') = 'number' then (p_manifest->>'derivativeAssetCount')::numeric end) is distinct from 111
     or not (p_manifest ? 'sourceAssetBytes')
     or public.oasis_positive_integer_json_number(p_manifest->'sourceAssetBytes') is distinct from true
     or not (p_manifest ? 'derivativeAssetBytes')
     or public.oasis_positive_integer_json_number(p_manifest->'derivativeAssetBytes') is distinct from true then
    raise exception 'Oasis publication requires exactly 111 mapped media assets and complete byte totals.';
  end if;
  if not (p_manifest ? 'entries') or jsonb_typeof(p_manifest->'entries') is distinct from 'array' or jsonb_array_length(p_manifest->'entries') <> 111 then raise exception 'Oasis manifest requires exactly 111 entries.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_manifest->'entries') entry
    where jsonb_typeof(entry) is distinct from 'object'
      or jsonb_typeof(entry->'recordId') is distinct from 'string'
      or jsonb_typeof(entry->'privateSourceFilename') is distinct from 'string'
      or jsonb_typeof(entry->'sourceChecksum') is distinct from 'string'
      or jsonb_typeof(entry->'publicDerivativePath') is distinct from 'string'
      or jsonb_typeof(entry->'privateDerivativePath') is distinct from 'string'
      or jsonb_typeof(entry->'derivativeChecksum') is distinct from 'string'
      or jsonb_typeof(entry->'mediaRole') is distinct from 'string'
      or jsonb_typeof(entry->'altText') is distinct from 'string'
  ) then raise exception 'Oasis manifest entry text metadata must use JSON strings.'; end if;
  if (select count(distinct entry->>'privateSourceFilename') from jsonb_array_elements(p_manifest->'entries') entry) <> 111 then raise exception 'Oasis private-source identities must be complete and unique.'; end if;
  if (select count(distinct entry->>'publicDerivativePath') from jsonb_array_elements(p_manifest->'entries') entry) <> 111 then raise exception 'Oasis derivative paths must be complete and unique.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_manifest->'entries') entry
    where jsonb_typeof(entry) is distinct from 'object'
      or not (entry ?& array[
        'recordId', 'privateSourceFilename', 'sourceChecksum', 'publicDerivativePath',
        'privateDerivativePath', 'derivativeChecksum', 'sourceBytes', 'derivativeBytes',
        'width', 'height', 'mediaRole', 'levelVariant', 'altText'
      ])
      or coalesce(entry->>'recordId', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      or coalesce(entry->>'privateSourceFilename', '') = ''
      or coalesce(entry->>'sourceChecksum', '') !~ '^[0-9a-f]{64}$'
      or coalesce(entry->>'derivativeChecksum', '') !~ '^[0-9a-f]{64}$'
      or coalesce(entry->>'publicDerivativePath', '') !~ '^media/oasis-island/[a-z0-9-]+/(catalogue|level-[0-9]+)(-variant-[0-9]+)?[.]webp$'
      or entry->>'publicDerivativePath' not like 'media/oasis-island/' || entry->>'recordId' || '/%'
      or entry->>'privateDerivativePath' is distinct from 'fixtures/oasis-001a-publication/' || entry->>'publicDerivativePath'
      or not (entry ? 'sourceBytes') or public.oasis_positive_integer_json_number(entry->'sourceBytes') is distinct from true
      or not (entry ? 'derivativeBytes') or public.oasis_positive_integer_json_number(entry->'derivativeBytes') is distinct from true
      or not (entry ? 'width') or public.oasis_positive_integer_json_number(entry->'width') is distinct from true
      or not (entry ? 'height') or public.oasis_positive_integer_json_number(entry->'height') is distinct from true
      or entry->>'mediaRole' not in ('catalogue', 'level')
      or (entry->>'mediaRole' = 'catalogue' and jsonb_typeof(entry->'levelVariant') <> 'null')
      or (entry->>'mediaRole' = 'level' and (jsonb_typeof(entry->'levelVariant') <> 'number' or (entry->>'levelVariant')::numeric <= 0 or (entry->>'levelVariant')::numeric <> trunc((entry->>'levelVariant')::numeric)))
      or coalesce(entry->>'altText', '') = ''
  ) then raise exception 'Oasis manifest entry metadata is incomplete or invalid.'; end if;
  if (p_manifest->>'sourceAssetBytes')::numeric is distinct from (
       select sum((entry->>'sourceBytes')::numeric) from jsonb_array_elements(p_manifest->'entries') entry
     ) or (p_manifest->>'derivativeAssetBytes')::numeric is distinct from (
       select sum((entry->>'derivativeBytes')::numeric) from jsonb_array_elements(p_manifest->'entries') entry
     ) then
    raise exception 'Oasis manifest byte totals do not match its entries.';
  end if;
  if not (p_manifest ? 'missingArtworkRecordIds') or jsonb_typeof(p_manifest->'missingArtworkRecordIds') is distinct from 'array'
     or jsonb_array_length(p_manifest->'missingArtworkRecordIds') <> 6
     or exists (
       select 1 from jsonb_array_elements(p_manifest->'missingArtworkRecordIds') missing
       where jsonb_typeof(missing) is distinct from 'string'
     ) then
    raise exception 'Oasis missing-artwork IDs do not match the six approved records.';
  end if;
  if (select count(distinct value) from jsonb_array_elements_text(p_manifest->'missingArtworkRecordIds')) <> 6
     or (select array_agg(value order by value) from jsonb_array_elements_text(p_manifest->'missingArtworkRecordIds')) <> expected_missing_ids then
    raise exception 'Oasis missing-artwork IDs do not match the six approved records.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_manifest->'entries') entry
    join jsonb_array_elements_text(p_manifest->'missingArtworkRecordIds') missing(record_id)
      on missing.record_id = entry->>'recordId'
  ) then
    raise exception 'Oasis mapped-artwork and missing-artwork record IDs must be disjoint.';
  end if;
  if not (p_manifest ? 'placeholder') or jsonb_typeof(p_manifest->'placeholder') is distinct from 'object'
     or not ((p_manifest->'placeholder') ?& array[
       'publicDerivativePath', 'privateDerivativePath', 'derivativeChecksum',
       'derivativeBytes', 'width', 'height', 'altText'
     ]) then
    raise exception 'Oasis placeholder metadata is incomplete or invalid.';
  end if;
  if jsonb_typeof(p_manifest#>'{placeholder,publicDerivativePath}') is distinct from 'string'
     or jsonb_typeof(p_manifest#>'{placeholder,privateDerivativePath}') is distinct from 'string'
     or jsonb_typeof(p_manifest#>'{placeholder,derivativeChecksum}') is distinct from 'string'
     or jsonb_typeof(p_manifest#>'{placeholder,altText}') is distinct from 'string' then
    raise exception 'Oasis placeholder text metadata must use JSON strings.';
  end if;
  if p_manifest#>>'{placeholder,publicDerivativePath}' is distinct from 'media/oasis-island/shared/artwork-unavailable.webp'
     or p_manifest#>>'{placeholder,privateDerivativePath}' is distinct from 'fixtures/oasis-001a-publication/media/oasis-island/shared/artwork-unavailable.webp'
     or coalesce(p_manifest#>>'{placeholder,derivativeChecksum}', '') !~ '^[0-9a-f]{64}$'
     or not ((p_manifest->'placeholder') ? 'derivativeBytes') or public.oasis_positive_integer_json_number(p_manifest#>'{placeholder,derivativeBytes}') is distinct from true
     or not ((p_manifest->'placeholder') ? 'width') or public.oasis_positive_integer_json_number(p_manifest#>'{placeholder,width}') is distinct from true
     or not ((p_manifest->'placeholder') ? 'height') or public.oasis_positive_integer_json_number(p_manifest#>'{placeholder,height}') is distinct from true
     or coalesce(p_manifest#>>'{placeholder,altText}', '') = '' then
    raise exception 'Oasis placeholder metadata is incomplete or invalid.';
  end if;
  if jsonb_typeof(p_records) is distinct from 'array' or jsonb_array_length(p_records) <> 55 then raise exception 'Oasis publication requires exactly 55 public records.'; end if;
  if (select count(distinct r->>'id') from jsonb_array_elements(p_records) r) <> 55 then raise exception 'Oasis record IDs must be complete and unique.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_records) r
    where jsonb_typeof(r) <> 'object' or not (r ?& allowed_record_keys)
      or exists (select 1 from jsonb_object_keys(case when jsonb_typeof(r) = 'object' then r else '{}'::jsonb end) key where not key = any(allowed_record_keys))
      or public.oasis_json_has_forbidden_key(r)
      or jsonb_typeof(r->'schemaVersion') <> 'string' or r->>'schemaVersion' <> p_schema_version
      or jsonb_typeof(r->'status') <> 'string' or r->>'status' <> 'published'
      or jsonb_typeof(r->'id') <> 'string' or coalesce(r->>'id', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      or jsonb_typeof(r->'name') <> 'string' or coalesce(btrim(r->>'name'), '') = '' or r->>'name' <> btrim(r->>'name')
      or jsonb_typeof(r->'recordType') <> 'string' or coalesce(btrim(r->>'recordType'), '') = '' or r->>'recordType' <> btrim(r->>'recordType')
      or jsonb_typeof(r->'aliases') <> 'array' or jsonb_typeof(r->'levels') <> 'array'
      or jsonb_typeof(r->'maxEffects') <> 'array' or jsonb_typeof(r->'media') <> 'array'
      or jsonb_typeof(r->'footprint') not in ('object', 'null')
      or jsonb_typeof(r->'unlock') not in ('object', 'null')
      or jsonb_typeof(r->'upgrade') not in ('object', 'null')
      or jsonb_typeof(r->'rarity') not in ('string', 'null')
      or (jsonb_typeof(r->'rarity') = 'string' and (coalesce(btrim(r->>'rarity'), '') = '' or r->>'rarity' <> btrim(r->>'rarity')))
      or jsonb_typeof(r->'availabilityCategory') not in ('string', 'null')
      or (jsonb_typeof(r->'availabilityCategory') = 'string' and (coalesce(btrim(r->>'availabilityCategory'), '') = '' or r->>'availabilityCategory' <> btrim(r->>'availabilityCategory')))
      or jsonb_typeof(r->'function') not in ('string', 'null')
      or (jsonb_typeof(r->'function') = 'string' and (coalesce(btrim(r->>'function'), '') = '' or r->>'function' <> btrim(r->>'function')))
      or jsonb_typeof(r->'typeLimit') not in ('number', 'null')
      or (case when jsonb_typeof(r->'typeLimit') = 'number' then (r->>'typeLimit')::numeric < 1 or (r->>'typeLimit')::numeric <> trunc((r->>'typeLimit')::numeric) else false end)
      or jsonb_typeof(r->'maxLevel') not in ('number', 'null')
      or (case when jsonb_typeof(r->'maxLevel') = 'number' then (r->>'maxLevel')::numeric < 1 or (r->>'maxLevel')::numeric <> trunc((r->>'maxLevel')::numeric) else false end)
      or jsonb_typeof(r->'maxProsperity') not in ('number', 'null')
      or (case when jsonb_typeof(r->'maxProsperity') = 'number' then (r->>'maxProsperity')::numeric < 0 else false end)
      or jsonb_typeof(r->'trustLabel') <> 'string' or not (r->>'trustLabel' = any(allowed_trust_labels))
      or jsonb_typeof(r->'publicationId') <> 'string' or r->>'publicationId' <> p_publication_id
      or jsonb_typeof(r->'publicationVersion') <> 'null'
      or jsonb_typeof(r->'publishedAt') <> 'null'
      or jsonb_typeof(r->'updatedAt') <> 'null'
      or jsonb_typeof(r->'canonicalRoute') <> 'string'
      or r->>'canonicalRoute' <> '/oasis-island/buildings/' || r->>'id'
  ) then raise exception 'Oasis public records failed the publication boundary.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_records) r
    where exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(r->'aliases') = 'array' then r->'aliases' else '[]'::jsonb end) alias_value
      where jsonb_typeof(alias_value) <> 'string'
        or coalesce(btrim(alias_value#>>'{}'), '') = ''
        or alias_value#>>'{}' <> btrim(alias_value#>>'{}')
    ) or (
      select count(*) <> count(distinct alias_value#>>'{}')
      from jsonb_array_elements(case when jsonb_typeof(r->'aliases') = 'array' then r->'aliases' else '[]'::jsonb end) alias_value
    )
  ) then raise exception 'Oasis aliases must contain unique non-empty trimmed strings.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_records) r
    where jsonb_typeof(r->'footprint') = 'object' and (
      not (r->'footprint' ?& allowed_footprint_keys)
      or exists (select 1 from jsonb_object_keys(r->'footprint') key where not key = any(allowed_footprint_keys))
      or jsonb_typeof(r#>'{footprint,width}') not in ('number', 'null')
      or (case when jsonb_typeof(r#>'{footprint,width}') = 'number' then (r#>>'{footprint,width}')::numeric < 1 or (r#>>'{footprint,width}')::numeric <> trunc((r#>>'{footprint,width}')::numeric) else false end)
      or jsonb_typeof(r#>'{footprint,height}') not in ('number', 'null')
      or (case when jsonb_typeof(r#>'{footprint,height}') = 'number' then (r#>>'{footprint,height}')::numeric < 1 or (r#>>'{footprint,height}')::numeric <> trunc((r#>>'{footprint,height}')::numeric) else false end)
      or jsonb_typeof(r#>'{footprint,display}') not in ('string', 'null')
      or (jsonb_typeof(r#>'{footprint,display}') = 'string' and (coalesce(btrim(r#>>'{footprint,display}'), '') = '' or r#>>'{footprint,display}' <> btrim(r#>>'{footprint,display}')))
    )
  ) then raise exception 'Oasis footprint values are incomplete or invalid.'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_records) r
    cross join lateral jsonb_array_elements(case when jsonb_typeof(r->'levels') = 'array' then r->'levels' else '[]'::jsonb end) level_value
    where jsonb_typeof(level_value) <> 'object'
      or not (level_value ?& allowed_level_keys)
      or exists (select 1 from jsonb_object_keys(case when jsonb_typeof(level_value) = 'object' then level_value else '{}'::jsonb end) key where not key = any(allowed_level_keys))
      or jsonb_typeof(level_value->'level') not in ('number', 'null')
      or (case when jsonb_typeof(level_value->'level') = 'number' then (level_value->>'level')::numeric < 1 or (level_value->>'level')::numeric <> trunc((level_value->>'level')::numeric) else false end)
      or jsonb_typeof(level_value->'prosperity') not in ('number', 'null')
      or (case when jsonb_typeof(level_value->'prosperity') = 'number' then (level_value->>'prosperity')::numeric < 0 else false end)
      or jsonb_typeof(level_value->'prosperityRequired') not in ('number', 'null')
      or (case when jsonb_typeof(level_value->'prosperityRequired') = 'number' then (level_value->>'prosperityRequired')::numeric < 0 else false end)
      or jsonb_typeof(level_value->'waterEssencePerHour') not in ('number', 'null')
      or (case when jsonb_typeof(level_value->'waterEssencePerHour') = 'number' then (level_value->>'waterEssencePerHour')::numeric < 0 else false end)
      or jsonb_typeof(level_value->'bonuses') <> 'array'
      or jsonb_typeof(level_value->'knownEffects') <> 'array'
      or jsonb_typeof(level_value->'exactOutputKnown') not in ('boolean', 'null')
  ) then raise exception 'Oasis levels are incomplete or invalid.'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_records) r
    cross join lateral jsonb_array_elements(case when jsonb_typeof(r->'levels') = 'array' then r->'levels' else '[]'::jsonb end) level_value
    cross join lateral jsonb_array_elements(case when jsonb_typeof(level_value->'knownEffects') = 'array' then level_value->'knownEffects' else '[]'::jsonb end) effect
    where jsonb_typeof(effect) <> 'string'
      or coalesce(btrim(effect#>>'{}'), '') = ''
      or effect#>>'{}' <> btrim(effect#>>'{}')
  ) then raise exception 'Oasis known effects must contain non-empty trimmed strings.'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_records) r
    cross join lateral jsonb_array_elements(case when jsonb_typeof(r->'levels') = 'array' then r->'levels' else '[]'::jsonb end) level_value
    cross join lateral jsonb_array_elements(case when jsonb_typeof(level_value->'bonuses') = 'array' then level_value->'bonuses' else '[]'::jsonb end) bonus_value
    where jsonb_typeof(bonus_value) <> 'object'
      or not (bonus_value ?& allowed_bonus_keys)
      or exists (select 1 from jsonb_object_keys(case when jsonb_typeof(bonus_value) = 'object' then bonus_value else '{}'::jsonb end) key where not key = any(allowed_bonus_keys))
      or jsonb_typeof(bonus_value->'label') not in ('string', 'null')
      or (jsonb_typeof(bonus_value->'label') = 'string' and (coalesce(btrim(bonus_value->>'label'), '') = '' or bonus_value->>'label' <> btrim(bonus_value->>'label')))
      or jsonb_typeof(bonus_value->'stat') not in ('string', 'null')
      or (jsonb_typeof(bonus_value->'stat') = 'string' and (coalesce(btrim(bonus_value->>'stat'), '') = '' or bonus_value->>'stat' <> btrim(bonus_value->>'stat')))
      or jsonb_typeof(bonus_value->'valuePct') not in ('number', 'null')
      or jsonb_typeof(bonus_value->'effect') not in ('string', 'null')
      or (jsonb_typeof(bonus_value->'effect') = 'string' and (coalesce(btrim(bonus_value->>'effect'), '') = '' or bonus_value->>'effect' <> btrim(bonus_value->>'effect')))
  ) then raise exception 'Oasis level bonuses are incomplete or invalid.'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_records) r
    cross join lateral jsonb_array_elements(case when jsonb_typeof(r->'maxEffects') = 'array' then r->'maxEffects' else '[]'::jsonb end) bonus_value
    where jsonb_typeof(bonus_value) <> 'object'
      or not (bonus_value ?& allowed_bonus_keys)
      or exists (select 1 from jsonb_object_keys(case when jsonb_typeof(bonus_value) = 'object' then bonus_value else '{}'::jsonb end) key where not key = any(allowed_bonus_keys))
      or jsonb_typeof(bonus_value->'label') not in ('string', 'null')
      or (jsonb_typeof(bonus_value->'label') = 'string' and (coalesce(btrim(bonus_value->>'label'), '') = '' or bonus_value->>'label' <> btrim(bonus_value->>'label')))
      or jsonb_typeof(bonus_value->'stat') not in ('string', 'null')
      or (jsonb_typeof(bonus_value->'stat') = 'string' and (coalesce(btrim(bonus_value->>'stat'), '') = '' or bonus_value->>'stat' <> btrim(bonus_value->>'stat')))
      or jsonb_typeof(bonus_value->'valuePct') not in ('number', 'null')
      or jsonb_typeof(bonus_value->'effect') not in ('string', 'null')
      or (jsonb_typeof(bonus_value->'effect') = 'string' and (coalesce(btrim(bonus_value->>'effect'), '') = '' or bonus_value->>'effect' <> btrim(bonus_value->>'effect')))
  ) then raise exception 'Oasis maximum effects are incomplete or invalid.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_records) r
    where jsonb_typeof(r->'unlock') = 'object' and (
      not (r->'unlock' ?& allowed_unlock_keys)
      or exists (select 1 from jsonb_object_keys(r->'unlock') key where not key = any(allowed_unlock_keys))
      or jsonb_typeof(r#>'{unlock,requirement}') not in ('string', 'null')
      or (jsonb_typeof(r#>'{unlock,requirement}') = 'string' and (coalesce(btrim(r#>>'{unlock,requirement}'), '') = '' or r#>>'{unlock,requirement}' <> btrim(r#>>'{unlock,requirement}')))
      or jsonb_typeof(r#>'{unlock,initialBlueprintPurchase}') not in ('string', 'null')
      or (jsonb_typeof(r#>'{unlock,initialBlueprintPurchase}') = 'string' and (coalesce(btrim(r#>>'{unlock,initialBlueprintPurchase}'), '') = '' or r#>>'{unlock,initialBlueprintPurchase}' <> btrim(r#>>'{unlock,initialBlueprintPurchase}')))
    )
  ) then raise exception 'Oasis unlock values are incomplete or invalid.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_records) r
    where jsonb_typeof(r->'upgrade') = 'object' and (
      not (r->'upgrade' ?& allowed_upgrade_keys)
      or exists (select 1 from jsonb_object_keys(r->'upgrade') key where not key = any(allowed_upgrade_keys))
      or jsonb_typeof(r#>'{upgrade,currency}') not in ('string', 'null')
      or (jsonb_typeof(r#>'{upgrade,currency}') = 'string' and (coalesce(btrim(r#>>'{upgrade,currency}'), '') = '' or r#>>'{upgrade,currency}' <> btrim(r#>>'{upgrade,currency}')))
      or jsonb_typeof(r#>'{upgrade,exchange}') not in ('string', 'null')
      or (jsonb_typeof(r#>'{upgrade,exchange}') = 'string' and (coalesce(btrim(r#>>'{upgrade,exchange}'), '') = '' or r#>>'{upgrade,exchange}' <> btrim(r#>>'{upgrade,exchange}')))
      or jsonb_typeof(r#>'{upgrade,generalBlueprintRefresh}') not in ('string', 'null')
      or (jsonb_typeof(r#>'{upgrade,generalBlueprintRefresh}') = 'string' and (coalesce(btrim(r#>>'{upgrade,generalBlueprintRefresh}'), '') = '' or r#>>'{upgrade,generalBlueprintRefresh}' <> btrim(r#>>'{upgrade,generalBlueprintRefresh}')))
      or jsonb_typeof(r#>'{upgrade,officiallyVerified}') not in ('string', 'null')
      or (jsonb_typeof(r#>'{upgrade,officiallyVerified}') = 'string' and (coalesce(btrim(r#>>'{upgrade,officiallyVerified}'), '') = '' or r#>>'{upgrade,officiallyVerified}' <> btrim(r#>>'{upgrade,officiallyVerified}')))
    )
  ) then raise exception 'Oasis upgrade values are incomplete or invalid.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_records) r cross join lateral jsonb_array_elements(r->'media') media
    where jsonb_typeof(media) <> 'object'
      or not (media ?& array['url', 'alt', 'role', 'levelVariant', 'width', 'height'])
      or exists (select 1 from jsonb_object_keys(media) key where not key = any(array['url', 'alt', 'role', 'levelVariant', 'width', 'height']))
      or jsonb_typeof(media->'url') is distinct from 'string'
      or jsonb_typeof(media->'alt') is distinct from 'string'
      or jsonb_typeof(media->'role') is distinct from 'string'
      or coalesce(media->>'alt', '') = '' or media->>'role' not in ('catalogue', 'level', 'placeholder')
      or jsonb_typeof(media->'width') <> 'number' or (media->>'width')::numeric <= 0
      or jsonb_typeof(media->'height') <> 'number' or (media->>'height')::numeric <= 0
      or not (
        (media->>'role' = 'placeholder'
          and media->>'url' = '/' || p_manifest#>>'{placeholder,publicDerivativePath}'
          and media->>'alt' = p_manifest#>>'{placeholder,altText}'
          and jsonb_typeof(media->'levelVariant') = 'null'
          and media->'width' = p_manifest#>'{placeholder,width}'
          and media->'height' = p_manifest#>'{placeholder,height}'
          and (p_manifest->'missingArtworkRecordIds') ? (r->>'id'))
        or exists (
          select 1 from jsonb_array_elements(p_manifest->'entries') entry
          where entry->>'recordId' = r->>'id'
            and media->>'url' = '/' || entry->>'publicDerivativePath'
            and media->>'role' = entry->>'mediaRole'
            and media->>'alt' = entry->>'altText'
            and media->'levelVariant' = entry->'levelVariant'
            and media->'width' = entry->'width' and media->'height' = entry->'height'
        )
      )
  ) then raise exception 'Oasis public media does not match the approved manifest.'; end if;
  if exists (
    select 1
    from jsonb_array_elements_text(p_manifest->'missingArtworkRecordIds') missing(record_id)
    where (
      select count(*)
      from jsonb_array_elements(p_records) r
      cross join lateral jsonb_array_elements(r->'media') media
      where r->>'id' = missing.record_id
    ) <> 1
    or (
      select count(*)
      from jsonb_array_elements(p_records) r
      cross join lateral jsonb_array_elements(r->'media') media
      where r->>'id' = missing.record_id
        and media->>'role' = 'placeholder'
        and media->>'url' = '/' || p_manifest#>>'{placeholder,publicDerivativePath}'
        and media->>'alt' = p_manifest#>>'{placeholder,altText}'
        and jsonb_typeof(media->'levelVariant') = 'null'
        and media->'width' = p_manifest#>'{placeholder,width}'
        and media->'height' = p_manifest#>'{placeholder,height}'
    ) <> 1
  ) then
    raise exception 'Each Oasis missing-artwork record must contain exactly the approved placeholder and no mapped artwork.';
  end if;
  if (select count(*) from jsonb_array_elements(p_records) r cross join lateral jsonb_array_elements(r->'media') media) <> 117
     or exists (
       select 1
       from jsonb_array_elements(p_records) r cross join lateral jsonb_array_elements(r->'media') media
       group by r->>'id', public.oasis_stable_json(media)
       having count(*) > 1
     ) then
    raise exception 'Oasis public media contains missing, extra or duplicate mappings.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_manifest->'entries') entry
    where not exists (
      select 1 from jsonb_array_elements(p_records) r cross join lateral jsonb_array_elements(r->'media') media
      where r->>'id' = entry->>'recordId' and media->>'url' = '/' || entry->>'publicDerivativePath'
    )
  ) then raise exception 'Oasis manifest derivatives are not completely represented by public records.'; end if;
  if exists (
    select 1 from jsonb_array_elements_text(p_manifest->'missingArtworkRecordIds') missing(record_id)
    where not exists (
      select 1 from jsonb_array_elements(p_records) r cross join lateral jsonb_array_elements(r->'media') media
      where r->>'id' = missing.record_id
        and media->>'role' = 'placeholder'
        and media->>'url' = '/' || p_manifest#>>'{placeholder,publicDerivativePath}'
    )
  ) then raise exception 'Every approved missing-artwork record requires the approved placeholder.'; end if;
  if p_manifest_hash !~ '^[0-9a-f]{64}$' or public.oasis_manifest_sha256(p_manifest) <> p_manifest_hash then raise exception 'Oasis manifest hash does not match canonical manifest content.'; end if;
  -- This computes and validates oasis-record-content-sha256-v2 before locking;
  -- oasis_stable_json rejects every out-of-contract number recursively.
  submitted_content_hash := public.oasis_record_content_sha256(p_records);
  perform pg_advisory_xact_lock(hashtext('forge-oasis-publication'));
  select versions.published_at into current_publication_timestamp
    from public.oasis_publication_current current_publication
    join public.oasis_publication_versions versions
      on versions.publication_id = current_publication.publication_id
    where current_publication.singleton = true;
  publication_timestamp := date_trunc('milliseconds', clock_timestamp());
  if current_publication_timestamp is not null and publication_timestamp <= current_publication_timestamp then
    publication_timestamp := current_publication_timestamp + interval '1 millisecond';
  end if;
  publication_timestamp_text := to_char(publication_timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  -- A rollback is a new immutable publication derived from the referenced stored
  -- snapshot. Caller-supplied content is accepted only when it exactly reproduces
  -- that snapshot after removing the four new-publication identity fields.
  if p_rollback_of_publication_id is not null then
    select * into rollback_source
      from public.oasis_publication_versions
      where publication_id = p_rollback_of_publication_id;
    if not found then raise exception 'Rollback source publication does not exist.'; end if;
    if rollback_source.dataset_id <> 'oasis-island' then raise exception 'Rollback source publication belongs to another dataset.'; end if;
    if rollback_source.record_count <> 55
       or (select count(*) from public.oasis_publication_records where publication_id = rollback_source.publication_id) <> 55 then
      raise exception 'Rollback source publication is not a complete immutable snapshot.';
    end if;
    if public.oasis_manifest_sha256(rollback_source.manifest) <> rollback_source.manifest_hash then
      raise exception 'Rollback source manifest integrity failed.';
    end if;
    if public.oasis_record_content_sha256((
         select jsonb_agg(public_record order by record_id)
         from public.oasis_publication_records where publication_id = rollback_source.publication_id
       )) <> rollback_source.record_content_hash then
      raise exception 'Rollback source record-content integrity failed.';
    end if;
    select jsonb_agg(r - array['publicationId', 'publicationVersion', 'publishedAt', 'updatedAt'] order by r->>'id')
      into rollback_candidate_content from jsonb_array_elements(p_records) r;
    select jsonb_agg(public_record - array['publicationId', 'publicationVersion', 'publishedAt', 'updatedAt'] order by record_id)
      into rollback_source_content from public.oasis_publication_records
      where publication_id = rollback_source.publication_id;
    if p_schema_version <> rollback_source.schema_version
       or p_source_fingerprint <> rollback_source.source_fingerprint
       or p_manifest_hash <> rollback_source.manifest_hash
       or submitted_content_hash <> rollback_source.record_content_hash
       or p_manifest <> rollback_source.manifest
       or rollback_candidate_content <> rollback_source_content then
      raise exception 'Rollback candidate does not match the referenced immutable publication.';
    end if;
    select jsonb_agg(
      public_record || jsonb_build_object(
        'publicationId', p_publication_id,
        'publicationVersion', null,
        'publishedAt', null,
        'updatedAt', null
      ) order by record_id
    ) into p_records
      from public.oasis_publication_records
      where publication_id = rollback_source.publication_id;
    p_schema_version := rollback_source.schema_version;
    p_source_fingerprint := rollback_source.source_fingerprint;
    p_manifest := rollback_source.manifest;
    p_manifest_hash := rollback_source.manifest_hash;
    submitted_content_hash := rollback_source.record_content_hash;
  end if;

  select * into existing from public.oasis_publication_versions where idempotency_key = p_idempotency_key;
  if found then
    if existing.publication_id <> p_publication_id or existing.manifest_hash <> p_manifest_hash
       or existing.source_fingerprint <> p_source_fingerprint
       or existing.record_content_hash <> submitted_content_hash
       or existing.rollback_of_publication_id is distinct from p_rollback_of_publication_id then
      raise exception 'Oasis idempotency key conflicts with an existing publication.';
    end if;
    return jsonb_build_object('publicationId', existing.publication_id, 'publicationVersion', existing.publication_version, 'duplicate', true);
  end if;
  select publication_id into previous_id from public.oasis_publication_current where singleton = true for update;
  insert into public.oasis_publication_versions(
    publication_id, dataset_id, schema_version, status, source_fingerprint, manifest, manifest_hash,
    record_content_hash, record_count, media_count, actor_id, publication_reason, idempotency_key,
    rollback_of_publication_id, published_at, updated_at
  ) values (
    p_publication_id, 'oasis-island', p_schema_version, 'published', p_source_fingerprint, p_manifest,
    p_manifest_hash, submitted_content_hash, 55, 111, p_actor_id, p_reason, p_idempotency_key,
    p_rollback_of_publication_id, publication_timestamp, publication_timestamp
  ) returning publication_version into version_value;
  insert into public.oasis_publication_records(publication_id, record_id, public_record)
    select p_publication_id, r->>'id', r || jsonb_build_object(
      'publicationId', p_publication_id, 'publicationVersion', version_value,
      'publishedAt', publication_timestamp_text, 'updatedAt', publication_timestamp_text
    )
    from jsonb_array_elements(p_records) r;
  insert into public.oasis_publication_search_refreshes(publication_id, status, requested_at, updated_at)
    values (p_publication_id, 'pending', publication_timestamp, publication_timestamp);
  insert into public.oasis_publication_audits(publication_id, action, actor_id, reason, previous_publication_id, manifest_hash, occurred_at, evidence)
    values (p_publication_id, case when p_rollback_of_publication_id is null then 'published' else 'rollback_published' end,
      p_actor_id, p_reason, previous_id, p_manifest_hash, publication_timestamp,
      jsonb_build_object('recordCount', 55, 'mediaCount', 111, 'sourceFingerprint', p_source_fingerprint,
        'recordContentHash', submitted_content_hash,
        'rollbackOf', p_rollback_of_publication_id, 'rollbackSourceManifestHash',
        case when p_rollback_of_publication_id is null then null else rollback_source.manifest_hash end,
        'rollbackSourceFingerprint', case when p_rollback_of_publication_id is null then null else rollback_source.source_fingerprint end,
        'rollbackSourceRecordContentHash', case when p_rollback_of_publication_id is null then null else rollback_source.record_content_hash end));
  insert into public.oasis_publication_current(singleton, publication_id, activated_at, activated_by)
    values (true, p_publication_id, publication_timestamp, p_actor_id)
    on conflict (singleton) do update set publication_id = excluded.publication_id, activated_at = excluded.activated_at, activated_by = excluded.activated_by;
  return jsonb_build_object('publicationId', p_publication_id, 'publicationVersion', version_value, 'duplicate', false, 'previousPublicationId', previous_id);
end;
$$;
revoke all on function public.publish_oasis_catalogue(text, text, text, jsonb, text, jsonb, text, text, text, text) from public, anon, authenticated;
grant execute on function public.publish_oasis_catalogue(text, text, text, jsonb, text, jsonb, text, text, text, text) to service_role;

comment on table public.oasis_publication_versions is 'OASIS-001A-PUB immutable publication history. Applying this migration does not publish a catalogue.';
comment on function public.publish_oasis_catalogue(text, text, text, jsonb, text, jsonb, text, text, text, text) is 'Creates and atomically activates a validated immutable Oasis publication. EXECUTE is revoked from PUBLIC, anon and authenticated and granted only to service_role; this grant is the caller boundary because current_user inside SECURITY DEFINER is the function owner. Candidate records bind publicationId but leave publicationVersion, publishedAt and updatedAt null. The GENERATED ALWAYS identity and one post-lock clock timestamp are database-owned and are stamped into stored records. Record-content identity excludes only publication ID, version and timestamps. Rollback validates source fingerprint, manifest and record-content hashes against immutable history, derives a new forward-only candidate, and never mutates history.';

commit;
