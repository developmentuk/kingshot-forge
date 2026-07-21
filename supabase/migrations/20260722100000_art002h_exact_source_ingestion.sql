-- ART-002H: distinguish exact uploaded bytes from browser-received text.
alter table public.community_art_submissions
  add column if not exists ingestion_mode text not null default 'legacy_import',
  add column if not exists original_filename text,
  add column if not exists original_mime_type text,
  add column if not exists raw_bytes bytea,
  add column if not exists decoded_text text,
  add column if not exists decoded_text_sha256 text,
  add column if not exists detected_line_ending text,
  add column if not exists crlf_count integer,
  add column if not exists lf_count integer,
  add column if not exists trailing_newline boolean,
  add column if not exists bom_present boolean,
  add column if not exists browser_received_text text,
  add column if not exists browser_text_sha256 text,
  add column if not exists normalisation_operations jsonb not null default '[]'::jsonb;

alter table public.community_art_submissions
  drop constraint if exists community_art_submissions_ingestion_mode_check;
alter table public.community_art_submissions
  add constraint community_art_submissions_ingestion_mode_check
  check (ingestion_mode in ('file_upload', 'text_paste', 'manual_entry', 'legacy_import'));

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
  p_line_count integer,
  p_ingestion_mode text,
  p_original_filename text,
  p_original_mime_type text,
  p_raw_bytes_base64 text,
  p_browser_received_text text,
  p_normalisation_operations jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  inserted_submission public.community_art_submissions;
  existing_submission public.community_art_submissions;
  source_bytes bytea := decode(coalesce(p_raw_bytes_base64, ''), 'base64');
  decoded_text_value text;
  raw_hash text;
  decoded_hash text;
  browser_hash text;
  line_crlf integer;
  line_lf integer;
  has_bom boolean;
  has_trailing_newline boolean;
  line_ending text;
  source_text text := coalesce(p_submission->>'artworkText', '');
begin
  if p_request_id is null or p_user_id is null or source_text = '' then
    raise exception 'invalid community art submission command' using errcode = '22023';
  end if;
  if p_ingestion_mode not in ('file_upload', 'text_paste', 'manual_entry') then
    raise exception 'invalid community art ingestion mode' using errcode = '22023';
  end if;
  if octet_length(source_bytes) = 0 then
    raise exception 'empty community art source' using errcode = '22023';
  end if;

  select * into existing_submission
  from public.community_art_submissions
  where user_id = p_user_id and submission_request_id = p_request_id;
  if found then
    return jsonb_build_object('created', false, 'submission', to_jsonb(existing_submission));
  end if;

  decoded_text_value := convert_from(source_bytes, 'UTF8');
  if decoded_text_value <> source_text then
    raise exception 'decoded source does not match submitted artwork text' using errcode = '22023';
  end if;
  if p_ingestion_mode = 'file_upload' and (p_original_filename is null or lower(p_original_filename) not like '%.txt' or p_original_mime_type not in ('text/plain', '')) then
    raise exception 'unsupported community art file metadata' using errcode = '22023';
  end if;

  raw_hash := encode(extensions.digest(source_bytes, 'sha256'), 'hex');
  decoded_hash := encode(extensions.digest(convert_to(decoded_text_value, 'UTF8'), 'sha256'), 'hex');
  browser_hash := case when p_browser_received_text is null then null else encode(extensions.digest(convert_to(p_browser_received_text, 'UTF8'), 'sha256'), 'hex') end;
  line_crlf := length(decoded_text_value) - length(replace(decoded_text_value, chr(13) || chr(10), ''));
  line_lf := length(replace(decoded_text_value, chr(13) || chr(10), '')) - length(replace(replace(decoded_text_value, chr(13) || chr(10), ''), chr(10), ''));
  has_bom := left(decoded_text_value, 1) = chr(65279) or left(encode(source_bytes, 'hex'), 6) = 'efbbbf';
  has_trailing_newline := right(decoded_text_value, 1) = chr(10) or right(decoded_text_value, 1) = chr(13);
  line_ending := case when line_crlf > 0 and line_lf > 0 then 'mixed' when line_crlf > 0 then 'crlf' when line_lf > 0 then 'lf' else 'none' end;

  insert into public.community_art_submissions (
    user_id, submission_request_id, title, description, category, tags,
    artwork_text, raw_source_text, raw_source_sha256, raw_source_byte_length,
    normalised_text, rendered_preview_payload, compatibility_profile,
    repair_operations, source_hash, attribution_type, attribution_name,
    ownership_confirmed, guidelines_confirmed, status, compatibility_status,
    ingestion_mode, original_filename, original_mime_type, raw_bytes,
    decoded_text, decoded_text_sha256, detected_line_ending, crlf_count, lf_count,
    trailing_newline, bom_present, browser_received_text, browser_text_sha256,
    normalisation_operations
  ) values (
    p_user_id, p_request_id, p_submission->>'title', coalesce(p_submission->>'description', ''),
    p_submission->>'category', coalesce(array(select jsonb_array_elements_text(coalesce(p_submission->'tags', '[]'::jsonb))), '{}'),
    decoded_text_value, decoded_text_value, raw_hash, octet_length(source_bytes),
    p_normalised_text, p_rendered_preview_payload, p_compatibility_profile,
    coalesce(p_repair_operations, '[]'::jsonb), raw_hash,
    p_submission->>'attributionType', nullif(p_submission->>'attributionName', ''),
    true, true, 'pending', p_compatibility_status,
    p_ingestion_mode, nullif(p_original_filename, ''), nullif(p_original_mime_type, ''), source_bytes,
    decoded_text_value, decoded_hash, line_ending, line_crlf, line_lf,
    has_trailing_newline, has_bom, p_browser_received_text, browser_hash,
    coalesce(p_normalisation_operations, '[]'::jsonb)
  )
  on conflict (user_id, submission_request_id) do nothing
  returning * into inserted_submission;

  if inserted_submission.id is null then
    select * into existing_submission from public.community_art_submissions where user_id = p_user_id and submission_request_id = p_request_id;
    return jsonb_build_object('created', false, 'submission', to_jsonb(existing_submission));
  end if;

  insert into public.community_art_submission_audit_events (submission_id, actor_user_id, action, request_id, metadata)
  values (inserted_submission.id, p_user_id, 'submitted', p_request_id, jsonb_build_object('status', 'pending', 'source_sha256', raw_hash, 'ingestion_mode', p_ingestion_mode));

  return jsonb_build_object('created', true, 'submission', to_jsonb(inserted_submission));
end;
$$;

revoke all on function public.submit_community_art_submission(uuid, uuid, jsonb, text, text, text, jsonb, text, integer, integer, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_community_art_submission(uuid, uuid, jsonb, text, text, text, jsonb, text, integer, integer, text, text, text, text, text, jsonb) to service_role;
