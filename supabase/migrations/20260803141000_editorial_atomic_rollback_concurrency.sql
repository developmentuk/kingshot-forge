begin;

create or replace function public.rollback_editorial_version_checked(
  p_dataset_id text,
  p_record_id text,
  p_target_version_id text,
  p_actor_id text,
  p_expected_version integer,
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
  current_head public.editorial_record_heads%rowtype;
begin
  if p_expected_version is null or p_expected_version < 1 then
    raise exception 'Expected rollback version must be a positive integer.';
  end if;

  select *
  into current_head
  from public.editorial_record_heads
  where dataset_id = p_dataset_id
    and record_id = p_record_id
  for update;

  if not found then
    raise exception
      'Editorial record "%/%" was not found.',
      p_dataset_id,
      p_record_id;
  end if;

  if current_head.current_version <> p_expected_version then
    raise exception
      'Editorial concurrency conflict: expected %, actual %',
      p_expected_version,
      current_head.current_version;
  end if;

  return public.rollback_editorial_version(
    p_dataset_id,
    p_record_id,
    p_target_version_id,
    p_actor_id,
    p_published_version_id,
    p_audit_event_id,
    p_occurred_at,
    p_note
  );
end;
$$;

revoke all on function public.rollback_editorial_version_checked(
  text,
  text,
  text,
  text,
  integer,
  text,
  text,
  timestamptz,
  text
) from public, anon, authenticated;

grant execute on function public.rollback_editorial_version_checked(
  text,
  text,
  text,
  text,
  integer,
  text,
  text,
  timestamptz,
  text
) to service_role;

comment on function public.rollback_editorial_version_checked(
  text,
  text,
  text,
  text,
  integer,
  text,
  text,
  timestamptz,
  text
) is 'Atomically verifies editorial rollback concurrency before invoking the governed rollback and dataset projection wrapper.';

commit;
