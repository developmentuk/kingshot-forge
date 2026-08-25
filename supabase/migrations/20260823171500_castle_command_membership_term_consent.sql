begin;

-- CASTLE-COMMAND-001F release hardening — F20/P2.
--
-- Alliance timing consent belongs to one current membership term. Leaving the
-- selected alliance must disarm that consent so a later rejoin cannot silently
-- reactivate old Castle timing sharing.
--
-- Lock order remains membership -> Castle profile. Membership UPDATE/DELETE
-- already owns the membership row before this trigger touches the profile, which
-- matches the explicit save RPC's membership -> profile order.

create or replace function public.clear_castle_command_sharing_for_membership_term(
  target_user_id uuid,
  target_alliance_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.castle_command_profiles profile
  set
    share_with_alliance = false,
    shared_alliance_id = null,
    updated_at = now()
  where profile.user_id = target_user_id
    and profile.share_with_alliance = true
    and profile.shared_alliance_id = target_alliance_id;
end;
$$;

revoke all on function public.clear_castle_command_sharing_for_membership_term(uuid, uuid) from public;

create or replace function public.revoke_castle_command_sharing_on_membership_end()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'current'::public.alliance_membership_status then
      perform public.clear_castle_command_sharing_for_membership_term(
        old.user_id,
        old.alliance_id
      );
    end if;
    return old;
  end if;

  if old.status = 'current'::public.alliance_membership_status
    and (
      new.status is distinct from 'current'::public.alliance_membership_status
      or new.user_id is distinct from old.user_id
      or new.alliance_id is distinct from old.alliance_id
    ) then
    perform public.clear_castle_command_sharing_for_membership_term(
      old.user_id,
      old.alliance_id
    );
  end if;

  return new;
end;
$$;

revoke all on function public.revoke_castle_command_sharing_on_membership_end() from public;

drop trigger if exists castle_command_revoke_sharing_on_membership_update
  on public.alliance_memberships;
create trigger castle_command_revoke_sharing_on_membership_update
after update of status, user_id, alliance_id on public.alliance_memberships
for each row execute function public.revoke_castle_command_sharing_on_membership_end();

drop trigger if exists castle_command_revoke_sharing_on_membership_delete
  on public.alliance_memberships;
create trigger castle_command_revoke_sharing_on_membership_delete
after delete on public.alliance_memberships
for each row execute function public.revoke_castle_command_sharing_on_membership_end();

-- Defensive activation cleanup. If an interrupted/test activation already left
-- a scoped opt-in whose membership is no longer current, disarm it rather than
-- carrying consent into a future membership term.
update public.castle_command_profiles profile
set
  share_with_alliance = false,
  shared_alliance_id = null,
  updated_at = now()
where profile.share_with_alliance = true
  and not exists (
    select 1
    from public.alliance_memberships membership
    where membership.user_id = profile.user_id
      and membership.alliance_id = profile.shared_alliance_id
      and membership.status = 'current'::public.alliance_membership_status
  );

comment on function public.clear_castle_command_sharing_for_membership_term(uuid, uuid) is
  'Internal Castle consent cleanup: disarms timing sharing for the exact alliance membership term that ended.';
comment on function public.revoke_castle_command_sharing_on_membership_end() is
  'Membership lifecycle trigger: Castle timing consent expires when the selected current membership ends, preventing silent consent resurrection on rejoin.';

commit;
