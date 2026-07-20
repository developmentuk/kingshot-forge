begin;
do $$
declare function_sql text;
begin
  select pg_get_functiondef('public.publish_buildings_import_run(uuid,text,text,text,text)'::regprocedure) into function_sql;
  function_sql := replace(
    function_sql,
    'values (''buildings:'' || p_import_run_id::text || '':'' || new_publication_id, ''buildings'', p_import_run_id::text, new_publication_id, 1, p_actor_id,',
    'values (''buildings:'' || p_import_run_id::text || '':'' || new_publication_id, ''buildings'', p_import_run_id::text, (select ''buildings:'' || new_publication_id || '':catalogue:'' || min(record_id) from public.buildings_publication_records where publication_id = new_publication_id and entity_type = ''catalogue''), 1, p_actor_id,'
  );
  execute function_sql;
end;
$$;
commit;
