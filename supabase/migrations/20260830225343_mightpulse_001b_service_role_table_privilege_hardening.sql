begin;

revoke all on table public.player_intelligence_observations from service_role;
grant select, insert on table public.player_intelligence_observations to service_role;

revoke all on table public.player_alliance_provider_state from service_role;
grant select, insert, update on table public.player_alliance_provider_state
  to service_role;

revoke all on table public.alliance_provider_authority_overrides from service_role;
grant select, insert, update on table public.alliance_provider_authority_overrides
  to service_role;

commit;
