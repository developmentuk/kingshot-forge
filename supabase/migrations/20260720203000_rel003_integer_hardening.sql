begin;
create or replace function forge_private.rel003_clean_integer(p_value text)
returns integer language sql immutable as $$
  select nullif(replace(trim(coalesce(p_value, '')), ',', ''), '')::integer;
$$;
do $$
declare function_sql text;
begin
  select pg_get_functiondef('public.publish_buildings_import_run(uuid,text,text,text,text)'::regprocedure) into function_sql;
  function_sql := replace(function_sql, 'nullif(v->>''base_level'','''')::integer', 'forge_private.rel003_clean_integer(v->>''base_level'')');
  function_sql := replace(function_sql, 'nullif(v->>''truegold_tier'','''')::integer', 'forge_private.rel003_clean_integer(v->>''truegold_tier'')');
  function_sql := replace(function_sql, 'nullif(v->>''stage'','''')::integer', 'forge_private.rel003_clean_integer(v->>''stage'')');
  function_sql := replace(function_sql, 'nullif(v->>''max_hero_level'','''')::integer', 'forge_private.rel003_clean_integer(v->>''max_hero_level'')');
  function_sql := replace(function_sql, 'nullif(v->>''training_capacity'','''')::integer', 'forge_private.rel003_clean_integer(v->>''training_capacity'')');
  function_sql := replace(function_sql, 'nullif(v->>''rally_capacity'','''')::integer', 'forge_private.rel003_clean_integer(v->>''rally_capacity'')');
  function_sql := replace(function_sql, 'nullif(v->>''ally_help_count'','''')::integer', 'forge_private.rel003_clean_integer(v->>''ally_help_count'')');
  function_sql := replace(function_sql, 'nullif(v->>''troop_deploy_capacity'','''')::integer', 'forge_private.rel003_clean_integer(v->>''troop_deploy_capacity'')');
  function_sql := replace(function_sql, 'nullif(v->>''reinforcement_capacity'','''')::integer', 'forge_private.rel003_clean_integer(v->>''reinforcement_capacity'')');
  function_sql := replace(function_sql, 'nullif(v->>''original_row'','''')::integer', 'forge_private.rel003_clean_integer(v->>''original_row'')');
  execute function_sql;
end;
$$;
commit;
