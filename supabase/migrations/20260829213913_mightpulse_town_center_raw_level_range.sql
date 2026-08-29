begin;

alter table public.player_accounts
  drop constraint if exists player_accounts_town_center_level_range;

alter table public.player_accounts
  add constraint player_accounts_town_center_level_range
  check (
    town_center_level is null
    or town_center_level between 1 and 84
  );

alter table public.player_progression_snapshots
  drop constraint if exists player_progression_town_center_range;

alter table public.player_progression_snapshots
  add constraint player_progression_town_center_range
  check (
    town_center_level is null
    or town_center_level between 1 and 84
  );

comment on column public.player_accounts.town_center_level is
  'Explicit Kingshot raw Town Center level code (1-84); never inferred from generic player_level.';

commit;
