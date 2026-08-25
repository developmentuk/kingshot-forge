begin;

-- CASTLE-COMMAND-001F release hardening.
-- F15 is a self-found follow-up to F14. Command/deputy acknowledgement reset
-- also writes the acknowledgement row and therefore must serialize with a
-- null-auth assignment delete/cascade using the same parent-before-child order.
--
-- Final reset order:
--   session -> target assignment -> locked manager/deputy authority -> acknowledgement
--
-- Locking the target assignment first prevents its cascade from locking/deleting
-- acknowledgement state underneath the reset. If the reset caller is also the
-- target deputy, assignment is acquired before the deputy grant, matching the
-- assignment -> deputy FK cascade direction too.

create or replace function public.reset_castle_command_acknowledgement(
  target_session_id uuid,
  target_player_account_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
  target_assignment_id uuid;
begin
  select * into command_session
  from public.castle_command_sessions
  where id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Closed Castle Command acknowledgements are immutable' using errcode = '22023';
  end if;

  -- Parent assignment must be owned before any authority child row or
  -- acknowledgement write. A concurrent null-auth delete/cascade therefore
  -- either completes first and this lookup fails, or waits for the reset.
  select assignment.id into target_assignment_id
  from public.castle_command_session_assignments assignment
  where assignment.session_id = target_session_id
    and assignment.player_account_id = target_player_account_id
  for update of assignment;

  if target_assignment_id is null then
    raise exception 'Castle Command assignment not found' using errcode = 'P0002';
  end if;

  if not public.lock_castle_command_event_manager(command_session.alliance_id)
    and not public.lock_castle_command_deputy_authority(
      command_session.id,
      command_session.alliance_id
    ) then
    raise exception 'Castle Command live-session access denied' using errcode = '42501';
  end if;

  insert into public.castle_command_session_acknowledgements (
    session_id,
    player_account_id,
    status,
    ready_at,
    sent_at,
    last_changed_by
  ) values (
    target_session_id,
    target_player_account_id,
    'waiting',
    null,
    null,
    auth.uid()
  )
  on conflict (session_id, player_account_id) do update set
    status = 'waiting',
    ready_at = null,
    sent_at = null,
    last_changed_by = excluded.last_changed_by,
    updated_at = now();

  return 'waiting';
end;
$$;

revoke all on function public.reset_castle_command_acknowledgement(uuid, uuid) from public;
grant execute on function public.reset_castle_command_acknowledgement(uuid, uuid) to authenticated;

comment on function public.reset_castle_command_acknowledgement(uuid, uuid) is
  'Resets open-session acknowledgement state using cascade-compatible session -> target assignment -> locked command authority -> acknowledgement order.';

commit;
