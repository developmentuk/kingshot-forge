begin;
create or replace function forge_private.rel003_clean_numeric(p_value text)
returns numeric language sql immutable set search_path = forge_private, pg_catalog as $$
  select nullif(replace(trim(coalesce(p_value, '')), ',', ''), '')::numeric;
$$;
create or replace function forge_private.rel003_clean_integer(p_value text)
returns integer language sql immutable set search_path = forge_private, pg_catalog as $$
  select nullif(replace(trim(coalesce(p_value, '')), ',', ''), '')::integer;
$$;
do $$
declare table_name text;
begin
  foreach table_name in array array['buildings_publication_versions','buildings_publication_records','buildings_publication_prerequisites','buildings_publication_refreshes','forge_warning_decisions','forge_warning_decision_audits'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_deny_public', table_name);
    execute format('create policy %I on public.%I for all to anon, authenticated using (false) with check (false)', table_name || '_deny_public', table_name);
  end loop;
end;
$$;
commit;
