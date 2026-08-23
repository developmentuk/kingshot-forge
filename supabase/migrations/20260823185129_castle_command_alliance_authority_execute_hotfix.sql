begin;

-- CASTLE-COMMAND-001F production activation hotfix.
-- Existing authenticated alliance RLS policies call these boolean SECURITY DEFINER
-- authority helpers, so authenticated must be able to execute them. Anonymous
-- execution remains denied.

revoke all on function public.can_manage_alliance(uuid) from public;
revoke all on function public.can_manage_alliance_members(uuid) from public;

grant execute on function public.can_manage_alliance(uuid) to authenticated;
grant execute on function public.can_manage_alliance_members(uuid) to authenticated;

commit;
