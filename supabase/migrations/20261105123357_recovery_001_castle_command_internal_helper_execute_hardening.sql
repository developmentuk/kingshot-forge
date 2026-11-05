-- RECOVERY-001: Castle Command internal helper execute hardening
-- Scope: privilege-only. No player data, RLS policy or function-body changes.
-- Production applied as Supabase migration 20261105123357 on 2026-11-05.
-- Must replay AFTER the Castle Command function-creation migrations.
DO $preflight$
DECLARE
  target regprocedure;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    to_regprocedure('public.build_castle_command_assignment_snapshot(uuid)'),
    to_regprocedure('public.clear_castle_command_sharing_for_membership_term(uuid,uuid)')
  ] LOOP
    IF target IS NULL THEN
      RAISE EXCEPTION 'RECOVERY-001: Expected Castle Command helper is missing';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc
      WHERE oid = target::oid AND prosecdef = true AND proowner = 'postgres'::regrole
    ) THEN
      RAISE EXCEPTION 'RECOVERY-001: Unexpected helper owner or execution mode: %', target;
    END IF;
    IF NOT has_function_privilege('service_role',target::oid,'EXECUTE') THEN
      RAISE EXCEPTION 'RECOVERY-001: Expected service_role EXECUTE grant is missing: %', target;
    END IF;
  END LOOP;
END;
$preflight$;

REVOKE EXECUTE ON FUNCTION public.build_castle_command_assignment_snapshot(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_castle_command_sharing_for_membership_term(uuid,uuid)
  FROM PUBLIC, anon, authenticated;

DO $verify$
DECLARE
  target regprocedure;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    to_regprocedure('public.build_castle_command_assignment_snapshot(uuid)'),
    to_regprocedure('public.clear_castle_command_sharing_for_membership_term(uuid,uuid)')
  ] LOOP
    IF has_function_privilege('anon',target::oid,'EXECUTE')
       OR has_function_privilege('authenticated',target::oid,'EXECUTE')
       OR NOT has_function_privilege('service_role',target::oid,'EXECUTE') THEN
      RAISE EXCEPTION 'RECOVERY-001: Post-revocation function privilege check failed: %', target;
    END IF;
  END LOOP;
END;
$verify$;