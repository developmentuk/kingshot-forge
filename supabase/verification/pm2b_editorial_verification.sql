select
  to_regclass(
    'public.editorial_record_versions'
  ) is not null as editorial_record_versions,
  to_regclass(
    'public.editorial_record_heads'
  ) is not null as editorial_record_heads,
  to_regclass(
    'public.editorial_audit_events'
  ) is not null as editorial_audit_events,
  to_regclass(
    'public.publication_queue'
  ) is not null as publication_queue,
  to_regclass(
    'public.scheduled_publications'
  ) is not null as scheduled_publications,
  to_regprocedure(
    'public.commit_editorial_version(jsonb,jsonb,jsonb,integer)'
  ) is not null as commit_editorial_version;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n
  on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'editorial_record_versions',
    'editorial_record_heads',
    'editorial_audit_events',
    'publication_queue',
    'scheduled_publications'
  )
order by c.relname;

select
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'publication_queue_active_version_idx',
    'scheduled_publications_active_version_idx'
  )
order by indexname;
