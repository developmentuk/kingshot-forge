-- ART-002G follow-up: character_count and line_count are generated columns in
-- the live ART-002 schema. Keep the RPC contract stable, but let PostgreSQL
-- calculate both values instead of inserting explicit values.
create or replace function public.submit_community_art_submission(
  p_request_id uuid,
  p_user_id uuid,
  p_submission jsonb,
  p_normalised_text text,
  p_rendered_preview_payload text,
  p_compatibility_profile text,
  p_repair_operations jsonb,
  p_compatibility_status text,
  p_character_count integer,
  p_line_count integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  inserted_submission public.community_art_submissions;
  existing_submission public.community_art_submissions;
  source_text text := coalesce(p_submission->>'artworkText', '');
begin
  if p_request_id is null or p_user_id is null or source_text = '' then
    raise exception 'invalid community art submission command' using errcode = '22023';
  end if;

  select * into existing_submission
  from public.community_art_submissions
  where user_id = p_user_id and submission_request_id = p_request_id;
  if found then
    return jsonb_build_object('created', false, 'submission', to_jsonb(existing_submission));
  end if;

  insert into public.community_art_submissions (
    user_id, submission_request_id, title, description, category, tags,
    artwork_text, raw_source_text, raw_source_sha256, raw_source_byte_length,
    normalised_text, rendered_preview_payload, compatibility_profile,
    repair_operations, source_hash, attribution_type, attribution_name,
    ownership_confirmed, guidelines_confirmed, status, compatibility_status
  ) values (
    p_user_id, p_request_id, p_submission->>'title', coalesce(p_submission->>'description', ''),
    p_submission->>'category', coalesce(array(select jsonb_array_elements_text(coalesce(p_submission->'tags', '[]'::jsonb))), '{}'),
    source_text, source_text, encode(digest(convert_to(source_text, 'UTF8'), 'sha256'), 'hex'),
    octet_length(source_text), p_normalised_text, p_rendered_preview_payload,
    p_compatibility_profile, coalesce(p_repair_operations, '[]'::jsonb),
    encode(digest(convert_to(source_text, 'UTF8'), 'sha256'), 'hex'),
    p_submission->>'attributionType', nullif(p_submission->>'attributionName', ''),
    true, true, 'pending', p_compatibility_status
  )
  on conflict (user_id, submission_request_id) do nothing
  returning * into inserted_submission;

  if inserted_submission.id is null then
    select * into existing_submission from public.community_art_submissions where user_id = p_user_id and submission_request_id = p_request_id;
    return jsonb_build_object('created', false, 'submission', to_jsonb(existing_submission));
  end if;

  insert into public.community_art_submission_audit_events (submission_id, actor_user_id, action, request_id, metadata)
  values (inserted_submission.id, p_user_id, 'submitted', p_request_id, jsonb_build_object('status', 'pending', 'source_sha256', inserted_submission.raw_source_sha256));

  return jsonb_build_object('created', true, 'submission', to_jsonb(inserted_submission));
end;
$$;

revoke all on function public.submit_community_art_submission(uuid, uuid, jsonb, text, text, text, jsonb, text, integer, integer) from public, anon, authenticated;
grant execute on function public.submit_community_art_submission(uuid, uuid, jsonb, text, text, text, jsonb, text, integer, integer) to service_role;
