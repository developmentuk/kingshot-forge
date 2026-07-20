begin;
do $$
declare function_sql text;
begin
  select pg_get_functiondef('public.complete_buildings_publication_refreshes(text,text)'::regprocedure) into function_sql;
  function_sql := replace(function_sql, 'null, b.source_fingerprint, now_value', 'null, b.updated_at, now_value');
  execute function_sql;
end;
$$;
commit;
