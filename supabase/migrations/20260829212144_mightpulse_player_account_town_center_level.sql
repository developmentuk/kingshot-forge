begin;

alter table public.player_accounts
  add column if not exists town_center_level integer;

alter table public.player_accounts
  drop constraint if exists player_accounts_town_center_level_range;

alter table public.player_accounts
  add constraint player_accounts_town_center_level_range
  check (
    town_center_level is null
    or town_center_level between 1 and 30
  );

comment on column public.player_accounts.town_center_level is
  'Explicit Kingshot Town Center level when available; never inferred from generic player_level.';

commit;
