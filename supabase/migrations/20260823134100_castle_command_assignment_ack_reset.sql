begin;

-- A READY/SENT acknowledgement applies only to the exact assignment snapshot the
-- player saw. Any material assignment change requires fresh acknowledgement.

create or replace function public.reset_castle_command_ack_on_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.target is distinct from old.target
    or new.use_howler is distinct from old.use_howler
    or new.howler_skill_level_snapshot is distinct from old.howler_skill_level_snapshot
    or new.march_seconds is distinct from old.march_seconds
    or new.timing_source is distinct from old.timing_source
    or new.needs_howler_calibration is distinct from old.needs_howler_calibration
    or new.profile_updated_at_snapshot is distinct from old.profile_updated_at_snapshot then
    delete from public.castle_command_session_acknowledgements acknowledgement
    where acknowledgement.session_id = new.session_id
      and acknowledgement.player_account_id = new.player_account_id;
  end if;

  return null;
end;
$$;

create trigger castle_command_assignment_reset_ack
after update on public.castle_command_session_assignments
for each row execute function public.reset_castle_command_ack_on_assignment_change();

comment on function public.reset_castle_command_ack_on_assignment_change() is
  'Invalidates READY/SENT when a manager materially changes the assignment snapshot.';

commit;
