begin;
create or replace function forge_private.rel003_clean_numeric(p_value text)
returns numeric language sql immutable as $$
  select nullif(replace(trim(coalesce(p_value, '')), ',', ''), '')::numeric;
$$;
do $$
declare function_sql text;
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
commit;
