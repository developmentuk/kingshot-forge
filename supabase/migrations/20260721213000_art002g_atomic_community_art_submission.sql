begin;

-- ART-002G: the player submission boundary is service-authoritative and atomic.
alter table public.community_art_submissions
  add column if not exists submission_request_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'community_art_submissions_user_request_key') then
    alter table public.community_art_submissions add constraint community_art_submissions_user_request_key unique (user_id, submission_request_id);
  end if;
end;
$$;

create table if not exists public.community_art_submission_audit_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.community_art_submissions(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('submitted')),
  request_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (submission_id, action)
);

alter table public.community_art_submission_audit_events enable row level security;
alter table public.community_art_submission_audit_events force row level security;
revoke all on table public.community_art_submission_audit_events from anon, authenticated;
grant all on table public.community_art_submission_audit_events to service_role;

create policy community_art_submission_audit_owner_or_moderator
on public.community_art_submission_audit_events
for select to authenticated
using (
  exists (select 1 from public.community_art_submissions s where s.id = submission_id and s.user_id = (select auth.uid()))
  or (select public.has_forge_permission('community_art.moderate'))
);
grant select on table public.community_art_submission_audit_events to authenticated;

create or replace function public.prevent_community_art_submission_audit_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'community art submission audit is append-only' using errcode = 'integrity_constraint_violation';
end;
$$;

create trigger community_art_submission_audit_append_only
before update or delete on public.community_art_submission_audit_events
for each row execute function public.prevent_community_art_submission_audit_mutation();

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
set search_path = public, pg_temp
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
    ownership_confirmed, guidelines_confirmed, status, compatibility_status,
    character_count, line_count
  ) values (
    p_user_id, p_request_id, p_submission->>'title', coalesce(p_submission->>'description', ''),
    p_submission->>'category', coalesce(array(select jsonb_array_elements_text(coalesce(p_submission->'tags', '[]'::jsonb))), '{}'),
    source_text, source_text, encode(digest(convert_to(source_text, 'UTF8'), 'sha256'), 'hex'),
    octet_length(source_text), p_normalised_text, p_rendered_preview_payload,
    p_compatibility_profile, coalesce(p_repair_operations, '[]'::jsonb),
    encode(digest(convert_to(source_text, 'UTF8'), 'sha256'), 'hex'),
    p_submission->>'attributionType', nullif(p_submission->>'attributionName', ''),
    true, true, 'pending', p_compatibility_status, p_character_count, p_line_count
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

commit;
