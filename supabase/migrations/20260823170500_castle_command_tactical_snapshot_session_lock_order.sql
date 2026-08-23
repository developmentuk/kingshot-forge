begin;

-- CASTLE-COMMAND-001F release hardening.
-- F17 makes the tactical-version snapshot guard obey the global Castle lock
-- order even for null-auth service/migration inserts:
-- session -> assignments -> snapshot comparison.

create or replace function public.enforce_castle_command_tactical_assignment_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_session_id uuid;
  current_snapshot jsonb;
begin
  -- A BEFORE INSERT trigger runs before the tactical-version session FK check.
  -- Explicitly acquire the parent session first so a direct service insert can
  -- never lock assignments and then wait for a session key-share lock while a
  -- normal Castle mutation holds the session and waits on those assignments.
  select session.id into locked_session_id
  from public.castle_command_sessions session
  where session.id = new.session_id
  for update of session;

  if locked_session_id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  perform assignment.id
  from public.castle_command_session_assignments assignment
  where assignment.session_id = new.session_id
  order by assignment.id
  for update of assignment;

  current_snapshot := public.build_castle_command_assignment_snapshot(new.session_id);

  if current_snapshot is distinct from new.assignment_snapshot then
    raise exception 'Castle Command tactical assignments changed during publication'
      using errcode = '40001';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_castle_command_tactical_assignment_snapshot() from public;

comment on function public.enforce_castle_command_tactical_assignment_snapshot() is
  'Locks the Castle session before deterministic assignment-row locking and snapshot comparison, including null-auth service inserts, preventing assignment->session/session->assignment deadlocks.';

commit;
