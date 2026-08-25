-- CASTLE-COMMAND-001F runtime acceptance hotfix
--
-- Existing authenticated RLS policies call public.current_user_role(), including
-- the final Castle profile/target owner-read policies. The helper is SECURITY
-- DEFINER and returns only the current caller's own Forge role, but an earlier
-- privilege hardening left EXECUTE available only to postgres/service_role.
-- That makes those authenticated policies fail with SQLSTATE 42501 before they
-- can evaluate their boolean role predicate.
--
-- Restore the privilege contract the policies require without exposing the
-- helper to anonymous callers.

grant execute on function public.current_user_role() to authenticated;
revoke execute on function public.current_user_role() from anon;
