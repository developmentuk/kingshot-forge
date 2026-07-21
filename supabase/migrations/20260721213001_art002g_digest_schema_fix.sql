-- ART-002G follow-up: pgcrypto is installed in the extensions schema on the
-- target Supabase project. Keep the RPC locked down while allowing its
-- server-side digest() call to resolve deterministically.
alter function public.submit_community_art_submission(
  uuid, uuid, jsonb, text, text, text, jsonb, text, integer, integer
) set search_path = public, extensions, pg_temp;
