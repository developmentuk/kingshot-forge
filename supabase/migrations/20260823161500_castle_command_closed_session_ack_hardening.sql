begin;

-- CASTLE-COMMAND-001F release hardening.
-- Closed battle coordination history is immutable, including READY/SENT state.

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

  if not public.can_manage_castle_command_session(target_session_id) then
    raise exception 'Castle Command live-session access denied' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.castle_command_session_assignments assignment
    where assignment.session_id = target_session_id
      and assignment.player_account_id = target_player_account_id
  ) then
    raise exception 'Castle Command assignment not found' using errcode = 'P0002';
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
  'Resets an assignment acknowledgement only while the Castle Command session remains open.';

commit;
