-- Release 0.7.5 security correction: player account linking is server-authoritative.
-- Browser clients must not create rows that can carry forged identity or
-- verification values. Safe privacy changes remain handled by existing RLS
-- and the narrowly granted update columns from the prior migration.

revoke insert on table public.player_accounts from anon, authenticated;
