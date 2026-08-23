begin;

-- CASTLE-COMMAND-001F release hardening.
-- F14 closes the cascade-compatible lock-order defect found by fresh exact-head
-- review after F13. Participant READY/SENT must acquire the concrete assignment
-- authority before locking acknowledgement state, matching the natural
-- assignment -> acknowledgement order of FK cascade deletion.
--
-- Final participant order:
--   session -> membership + assignment authority -> acknowledgement state
--
-- The F13 acknowledgement write trigger re-checks the same participant helper
-- after the row write begins. Re-locking rows already owned by the same
-- transaction is harmless; the critical point is that the RPC owns assignment
-- authority before it ever attempts the acknowledgement-row lock.

create or replace function public.set_castle_command_acknowledgement(
  target_session_id uuid,
  target_player_account_id uuid,
  target_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
  existing_status text;
  ready_timestamp timestamptz;
begin
  if target_status not in ('ready', 'sent') then
    raise exception 'Invalid Castle Command acknowledgement' using errcode = '22023';
  end if;

  select * into command_session
  from public.castle_command_sessions
  where id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Castle Command session is closed' using errcode = '22023';
  end if;

  -- F14: lock/revalidate the exact participant authority before touching the
  -- acknowledgement row. This helper locks both current membership and the
  -- concrete assignment (F13), so a null-auth assignment delete/cascade either
  -- commits first and makes this check fail, or waits until this already-
  -- authorised acknowledgement transaction commits.
  if not public.lock_castle_command_participant_authority(
    command_session.id,
    target_player_account_id,
    command_session.alliance_id
  ) then
    raise exception 'Castle Command participant access denied' using errcode = '42501';
  end if;

  select acknowledgement.status, acknowledgement.ready_at
    into existing_status, ready_timestamp
  from public.castle_command_session_acknowledgements acknowledgement
  where acknowledgement.session_id = target_session_id
    and acknowledgement.player_account_id = target_player_account_id
  for update;

  if target_status = 'ready' then
    if existing_status = 'sent' then
      raise exception 'Sent acknowledgement cannot be moved backwards' using errcode = '22023';
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
      'ready',
      coalesce(ready_timestamp, now()),
      null,
      auth.uid()
    )
    on conflict (session_id, player_account_id) do update set
      status = 'ready',
      ready_at = coalesce(public.castle_command_session_acknowledgements.ready_at, excluded.ready_at),
      sent_at = null,
      last_changed_by = excluded.last_changed_by,
      updated_at = now();
  else
    if command_session.status <> 'active' then
      raise exception 'Castle Command session must be active before marking sent' using errcode = '22023';
    end if;

    if existing_status <> 'ready' then
      raise exception 'Player must be ready before marking sent' using errcode = '22023';
    end if;

    update public.castle_command_session_acknowledgements
    set
      status = 'sent',
      sent_at = now(),
      last_changed_by = auth.uid(),
      updated_at = now()
    where session_id = target_session_id
      and player_account_id = target_player_account_id;
  end if;

  return target_status;
end;
$$;

revoke all on function public.set_castle_command_acknowledgement(uuid, uuid, text) from public;
grant execute on function public.set_castle_command_acknowledgement(uuid, uuid, text) to authenticated;

comment on function public.set_castle_command_acknowledgement(uuid, uuid, text) is
  'Transitions participant READY/SENT with cascade-compatible session -> participant membership/assignment -> acknowledgement lock order.';

commit;
