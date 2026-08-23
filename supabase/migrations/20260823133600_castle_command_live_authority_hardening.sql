begin;

-- CASTLE-COMMAND-001C hardening.
-- Live session lifecycle changes are RPC-owned. Session creation remains
-- protected by the existing manager-only INSERT RLS policy.

revoke update, delete on public.castle_command_sessions from authenticated;

create or replace function public.get_castle_command_server_time(target_session_id uuid)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.can_participate_castle_command_session(target_session_id) then
    raise exception 'Castle Command live-room access denied' using errcode = '42501';
  end if;

  return clock_timestamp();
end;
$$;

revoke all on function public.get_castle_command_server_time(uuid) from public;
grant execute on function public.get_castle_command_server_time(uuid) to authenticated;

comment on function public.get_castle_command_server_time(uuid) is
  'Returns a fresh server clock sample for an assigned Castle Command participant or event manager.';

commit;
