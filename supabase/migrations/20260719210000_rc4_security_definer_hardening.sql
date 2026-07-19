begin;

-- The feedback trigger does not need caller-controlled name resolution.
alter function public.set_feedback_report_updated_at()
  set search_path = public;

-- Legacy public SECURITY DEFINER functions are either trigger-only helpers or
-- internal authorization helpers. Remove Data API execution by default.
revoke all on function public.approve_alliance_membership(
  uuid, public.alliance_member_role, text
) from public, anon, authenticated;
revoke all on function public.assign_forge_id() from public, anon, authenticated;
revoke all on function public.can_manage_alliance(uuid)
  from public, anon, authenticated;
revoke all on function public.can_manage_alliance_members(uuid)
  from public, anon, authenticated;
revoke all on function public.can_manage_transfer_window(uuid)
  from public, anon, authenticated;
revoke all on function public.cancel_alliance_membership_request(uuid)
  from public, anon, authenticated;
revoke all on function public.current_user_role()
  from public, anon, authenticated;
revoke all on function public.generate_forge_id()
  from public, anon, authenticated;
revoke all on function public.leave_current_alliance()
  from public, anon, authenticated;
revoke all on function public.log_transfer_application_status()
  from public, anon, authenticated;
revoke all on function public.reject_alliance_membership(uuid, text)
  from public, anon, authenticated;
revoke all on function public.request_alliance_membership(uuid, text)
  from public, anon, authenticated;
revoke all on function public.sync_player_kingdom_membership()
  from public, anon, authenticated;

-- These are intentional authenticated application commands. Their function
-- bodies still require auth.uid() and enforce ownership/capability checks.
grant execute on function public.approve_alliance_membership(
  uuid, public.alliance_member_role, text
) to authenticated;
grant execute on function public.cancel_alliance_membership_request(uuid)
  to authenticated;
grant execute on function public.leave_current_alliance() to authenticated;
grant execute on function public.reject_alliance_membership(uuid, text)
  to authenticated;
grant execute on function public.request_alliance_membership(uuid, text)
  to authenticated;

-- These helpers are the existing browser role/access contract. Keep them
-- authenticated-only and never expose them to anonymous clients.
grant execute on function public.current_forge_role() to authenticated;
grant execute on function public.get_my_forge_access() to authenticated;
grant execute on function public.has_forge_permission(text) to authenticated;

commit;
