begin;

-- CASTLE-COMMAND-001B
-- Review-gated migration. Do not apply to production until owner-approved.

create or replace function public.current_user_is_alliance_member(target_alliance_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.alliance_memberships membership
    where membership.alliance_id = target_alliance_id
      and membership.user_id = auth.uid()
      and membership.status = 'current'::public.alliance_membership_status
  );
$$;

create or replace function public.users_share_current_alliance(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.alliance_memberships mine
    join public.alliance_memberships theirs
      on theirs.alliance_id = mine.alliance_id
    where mine.user_id = auth.uid()
      and mine.status = 'current'::public.alliance_membership_status
      and theirs.user_id = target_user_id
      and theirs.status = 'current'::public.alliance_membership_status
  );
$$;

create or replace function public.can_manage_castle_command(target_alliance_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_role() in ('admin', 'owner')
    or exists (
      select 1
      from public.alliance_admins administrator
      where administrator.alliance_id = target_alliance_id
        and administrator.user_id = auth.uid()
        and administrator.is_active = true
        and administrator.revoked_at is null
        and administrator.can_manage_events = true
    );
$$;

revoke all on function public.current_user_is_alliance_member(uuid) from public;
revoke all on function public.users_share_current_alliance(uuid) from public;
revoke all on function public.can_manage_castle_command(uuid) from public;
grant execute on function public.current_user_is_alliance_member(uuid) to authenticated;
grant execute on function public.users_share_current_alliance(uuid) to authenticated;
grant execute on function public.can_manage_castle_command(uuid) to authenticated;

create table public.castle_command_profiles (
  id uuid primary key default gen_random_uuid(),
  player_account_id uuid not null unique references public.player_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  howler_skill_level smallint not null default 8 check (howler_skill_level between 1 and 8),
  share_with_alliance boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.castle_command_profile_targets (
  profile_id uuid not null references public.castle_command_profiles(id) on delete cascade,
  target text not null check (target in ('castle', 'north', 'east', 'south', 'west')),
  normal_seconds integer check (normal_seconds between 0 and 86400),
  howler_seconds integer check (howler_seconds between 0 and 86400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, target)
);

create table public.castle_command_sessions (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid not null references public.alliances(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  impact_at timestamptz not null,
  rally_preparation_seconds integer not null default 300 check (rally_preparation_seconds in (60, 180, 300)),
  status text not null default 'planning' check (status in ('planning', 'active', 'closed')),
  created_by uuid not null references auth.users(id) on delete restrict,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'closed' and closed_at is not null) or (status <> 'closed' and closed_at is null))
);

create table public.castle_command_session_assignments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.castle_command_sessions(id) on delete cascade,
  player_account_id uuid not null references public.player_accounts(id) on delete restrict,
  profile_id uuid not null references public.castle_command_profiles(id) on delete restrict,
  player_id_snapshot text not null,
  player_name_snapshot text not null,
  target text not null check (target in ('castle', 'north', 'east', 'south', 'west')),
  use_howler boolean not null default false,
  howler_skill_level_snapshot smallint not null check (howler_skill_level_snapshot between 1 and 8),
  march_seconds integer not null check (march_seconds between 0 and 86400),
  timing_source text not null check (timing_source in ('normal', 'howler-observed', 'normal-fallback')),
  needs_howler_calibration boolean not null default false,
  profile_updated_at_snapshot timestamptz not null,
  added_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, player_account_id),
  check ((timing_source = 'normal-fallback' and needs_howler_calibration = true) or timing_source <> 'normal-fallback'),
  check ((use_howler = true) or (timing_source = 'normal' and needs_howler_calibration = false))
);

create index castle_command_profiles_user_id_idx
  on public.castle_command_profiles(user_id);
create index castle_command_sessions_alliance_status_idx
  on public.castle_command_sessions(alliance_id, status, impact_at);
create index castle_command_assignments_session_idx
  on public.castle_command_session_assignments(session_id);

create trigger castle_command_profiles_set_updated_at
before update on public.castle_command_profiles
for each row execute function public.set_updated_at();

create trigger castle_command_profile_targets_set_updated_at
before update on public.castle_command_profile_targets
for each row execute function public.set_updated_at();

create trigger castle_command_sessions_set_updated_at
before update on public.castle_command_sessions
for each row execute function public.set_updated_at();

create trigger castle_command_assignments_set_updated_at
before update on public.castle_command_session_assignments
for each row execute function public.set_updated_at();

alter table public.castle_command_profiles enable row level security;
alter table public.castle_command_profile_targets enable row level security;
alter table public.castle_command_sessions enable row level security;
alter table public.castle_command_session_assignments enable row level security;

create policy "Players can view owned or explicitly shared Castle Command profiles"
on public.castle_command_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    share_with_alliance = true
    and public.users_share_current_alliance(user_id)
  )
  or public.current_user_role() in ('admin', 'owner')
);

create policy "Players can create their own Castle Command profile"
on public.castle_command_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.player_accounts account
    where account.id = player_account_id
      and account.user_id = auth.uid()
  )
);

create policy "Players can update their own Castle Command profile"
on public.castle_command_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.player_accounts account
    where account.id = player_account_id
      and account.user_id = auth.uid()
  )
);

create policy "Players can delete their own Castle Command profile"
on public.castle_command_profiles
for delete
to authenticated
using (user_id = auth.uid());

create policy "Visible Castle Command profile targets are readable"
on public.castle_command_profile_targets
for select
to authenticated
using (
  exists (
    select 1
    from public.castle_command_profiles profile
    where profile.id = profile_id
      and (
        profile.user_id = auth.uid()
        or (profile.share_with_alliance = true and public.users_share_current_alliance(profile.user_id))
        or public.current_user_role() in ('admin', 'owner')
      )
  )
);

create policy "Players can create targets for their own Castle Command profile"
on public.castle_command_profile_targets
for insert
to authenticated
with check (
  exists (
    select 1 from public.castle_command_profiles profile
    where profile.id = profile_id and profile.user_id = auth.uid()
  )
);

create policy "Players can update targets for their own Castle Command profile"
on public.castle_command_profile_targets
for update
to authenticated
using (
  exists (
    select 1 from public.castle_command_profiles profile
    where profile.id = profile_id and profile.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.castle_command_profiles profile
    where profile.id = profile_id and profile.user_id = auth.uid()
  )
);

create policy "Players can delete targets for their own Castle Command profile"
on public.castle_command_profile_targets
for delete
to authenticated
using (
  exists (
    select 1 from public.castle_command_profiles profile
    where profile.id = profile_id and profile.user_id = auth.uid()
  )
);

create policy "Current alliance members can view Castle Command sessions"
on public.castle_command_sessions
for select
to authenticated
using (
  public.current_user_is_alliance_member(alliance_id)
  or public.can_manage_castle_command(alliance_id)
);

create policy "Castle Command managers can create sessions"
on public.castle_command_sessions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_castle_command(alliance_id)
);

create policy "Castle Command managers can update sessions"
on public.castle_command_sessions
for update
to authenticated
using (public.can_manage_castle_command(alliance_id))
with check (public.can_manage_castle_command(alliance_id));

create policy "Castle Command managers can delete sessions"
on public.castle_command_sessions
for delete
to authenticated
using (public.can_manage_castle_command(alliance_id));

create policy "Current alliance members can view Castle Command assignments"
on public.castle_command_session_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.castle_command_sessions session
    where session.id = session_id
      and (
        public.current_user_is_alliance_member(session.alliance_id)
        or public.can_manage_castle_command(session.alliance_id)
      )
  )
);

grant select, insert, update, delete on public.castle_command_profiles to authenticated;
grant select, insert, update, delete on public.castle_command_profile_targets to authenticated;
grant select, insert, update, delete on public.castle_command_sessions to authenticated;
grant select on public.castle_command_session_assignments to authenticated;

create or replace function public.list_castle_command_alliance_profiles(target_alliance_id uuid)
returns table (
  profile_id uuid,
  player_account_id uuid,
  player_id text,
  player_name text,
  howler_skill_level smallint,
  profile_updated_at timestamptz,
  target text,
  normal_seconds integer,
  howler_seconds integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (
    public.current_user_is_alliance_member(target_alliance_id)
    or public.can_manage_castle_command(target_alliance_id)
  ) then
    raise exception 'Castle Command alliance access denied' using errcode = '42501';
  end if;

  return query
  select
    profile.id,
    profile.player_account_id,
    account.player_id,
    account.player_name,
    profile.howler_skill_level,
    profile.updated_at,
    timing.target,
    timing.normal_seconds,
    timing.howler_seconds
  from public.castle_command_profiles profile
  join public.player_accounts account on account.id = profile.player_account_id
  join public.alliance_memberships membership
    on membership.user_id = profile.user_id
   and membership.alliance_id = target_alliance_id
   and membership.status = 'current'::public.alliance_membership_status
  left join public.castle_command_profile_targets timing on timing.profile_id = profile.id
  where profile.share_with_alliance = true
  order by lower(account.player_name), account.player_id, timing.target;
end;
$$;

revoke all on function public.list_castle_command_alliance_profiles(uuid) from public;
grant execute on function public.list_castle_command_alliance_profiles(uuid) to authenticated;

create or replace function public.set_castle_command_session_assignment(
  target_session_id uuid,
  target_player_account_id uuid,
  target_target text,
  target_use_howler boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
  command_profile public.castle_command_profiles%rowtype;
  timing public.castle_command_profile_targets%rowtype;
  account public.player_accounts%rowtype;
  resolved_seconds integer;
  resolved_source text;
  calibration_required boolean := false;
  assignment_id uuid;
begin
  if target_target not in ('castle', 'north', 'east', 'south', 'west') then
    raise exception 'Invalid Castle Command target' using errcode = '22023';
  end if;

  select * into command_session
  from public.castle_command_sessions
  where id = target_session_id;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Castle Command session is closed' using errcode = '22023';
  end if;

  if not public.can_manage_castle_command(command_session.alliance_id) then
    raise exception 'Castle Command management access denied' using errcode = '42501';
  end if;

  select profile.* into command_profile
  from public.castle_command_profiles profile
  join public.alliance_memberships membership
    on membership.user_id = profile.user_id
   and membership.alliance_id = command_session.alliance_id
   and membership.status = 'current'::public.alliance_membership_status
  where profile.player_account_id = target_player_account_id
    and profile.share_with_alliance = true;

  if command_profile.id is null then
    raise exception 'Player has no shared Castle Command profile in this alliance' using errcode = 'P0002';
  end if;

  select * into timing
  from public.castle_command_profile_targets
  where profile_id = command_profile.id
    and target = target_target;

  if timing.profile_id is null then
    raise exception 'Player has no timing for this target' using errcode = 'P0002';
  end if;

  if target_use_howler and timing.howler_seconds is not null then
    resolved_seconds := timing.howler_seconds;
    resolved_source := 'howler-observed';
  elsif target_use_howler and timing.normal_seconds is not null then
    resolved_seconds := timing.normal_seconds;
    resolved_source := 'normal-fallback';
    calibration_required := true;
  elsif not target_use_howler and timing.normal_seconds is not null then
    resolved_seconds := timing.normal_seconds;
    resolved_source := 'normal';
  else
    raise exception 'Player has no usable observed timing for this target' using errcode = 'P0002';
  end if;

  select * into account
  from public.player_accounts
  where id = target_player_account_id;

  insert into public.castle_command_session_assignments (
    session_id,
    player_account_id,
    profile_id,
    player_id_snapshot,
    player_name_snapshot,
    target,
    use_howler,
    howler_skill_level_snapshot,
    march_seconds,
    timing_source,
    needs_howler_calibration,
    profile_updated_at_snapshot,
    added_by
  ) values (
    command_session.id,
    account.id,
    command_profile.id,
    account.player_id,
    account.player_name,
    target_target,
    target_use_howler,
    command_profile.howler_skill_level,
    resolved_seconds,
    resolved_source,
    calibration_required,
    command_profile.updated_at,
    auth.uid()
  )
  on conflict (session_id, player_account_id) do update set
    profile_id = excluded.profile_id,
    player_id_snapshot = excluded.player_id_snapshot,
    player_name_snapshot = excluded.player_name_snapshot,
    target = excluded.target,
    use_howler = excluded.use_howler,
    howler_skill_level_snapshot = excluded.howler_skill_level_snapshot,
    march_seconds = excluded.march_seconds,
    timing_source = excluded.timing_source,
    needs_howler_calibration = excluded.needs_howler_calibration,
    profile_updated_at_snapshot = excluded.profile_updated_at_snapshot,
    added_by = excluded.added_by,
    updated_at = now()
  returning id into assignment_id;

  return assignment_id;
end;
$$;

create or replace function public.remove_castle_command_session_assignment(target_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_alliance_id uuid;
begin
  select session.alliance_id into target_alliance_id
  from public.castle_command_session_assignments assignment
  join public.castle_command_sessions session on session.id = assignment.session_id
  where assignment.id = target_assignment_id;

  if target_alliance_id is null then
    raise exception 'Castle Command assignment not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_castle_command(target_alliance_id) then
    raise exception 'Castle Command management access denied' using errcode = '42501';
  end if;

  delete from public.castle_command_session_assignments
  where id = target_assignment_id;
end;
$$;

revoke all on function public.set_castle_command_session_assignment(uuid, uuid, text, boolean) from public;
revoke all on function public.remove_castle_command_session_assignment(uuid) from public;
grant execute on function public.set_castle_command_session_assignment(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.remove_castle_command_session_assignment(uuid) to authenticated;

comment on table public.castle_command_profiles is
  'Player-owned observed Castle Command timings. Private by default; alliance sharing is explicit.';
comment on table public.castle_command_sessions is
  'Alliance-owned Castle Command battle sessions. Realtime interaction state is intentionally deferred beyond 001B.';
comment on table public.castle_command_session_assignments is
  'Immutable-at-assignment timing snapshots used to build stable Castle Command launch order.';

commit;