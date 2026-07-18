begin;

-- These SECURITY DEFINER helpers are internal authorization primitives. They
-- must not be callable through the anonymous Data API surface.
revoke all on function public.get_my_forge_access() from public;
revoke all on function public.get_my_forge_access() from anon;
grant execute on function public.get_my_forge_access() to authenticated;

revoke all on function public.current_forge_role() from public;
revoke all on function public.current_forge_role() from anon;
grant execute on function public.current_forge_role() to authenticated;

revoke all on function public.has_forge_permission(text) from public;
revoke all on function public.has_forge_permission(text) from anon;
grant execute on function public.has_forge_permission(text) to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

commit;
