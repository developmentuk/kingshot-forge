begin;

-- ART-002L: preserve source and make every payload change explicit.
alter table public.community_art_submissions
  add column if not exists preservation_policy_version text not null default 'ART-002L',
  add column if not exists approved_payload_source text not null default 'not_approved',
  add column if not exists stage_equality_audit jsonb not null default '{}'::jsonb;

-- Retain the existing service-authorized boundary explicitly: no new public
-- grants are introduced by this candidate, and both RLS modes remain enforced.
alter table public.community_art_submissions enable row level security;
alter table public.community_art_submissions force row level security;

alter table public.community_art_submissions
  drop constraint if exists community_art_approved_payload_source_check;
alter table public.community_art_submissions
  add constraint community_art_approved_payload_source_check
  check (approved_payload_source in ('not_approved', 'submitted_source', 'moderator_confirmed_edit'));

create or replace function public.enforce_community_art_payload_preservation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  has_confirmed_edit boolean;
begin
  if new.raw_source_text is distinct from old.raw_source_text then
    raise exception 'raw_source_text is immutable';
  end if;
  if new.approved_copy_payload is distinct from old.approved_copy_payload then
    has_confirmed_edit := exists (
      select 1 from jsonb_array_elements(coalesce(new.repair_operations, '[]'::jsonb)) operation
      where operation->>'kind' = 'moderator-confirmed'
        and coalesce(operation->>'userApproved', 'false') = 'true'
    );
    if new.approved_copy_payload is distinct from new.raw_source_text and not has_confirmed_edit then
      raise exception 'approved payload changes require a moderator-confirmed audit operation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists community_art_payload_preservation on public.community_art_submissions;
create trigger community_art_payload_preservation
before update on public.community_art_submissions
for each row execute function public.enforce_community_art_payload_preservation();

comment on column public.community_art_submissions.raw_source_text is 'Exact decoded submitted source; immutable and never normalised or trimmed.';
comment on column public.community_art_submissions.normalised_text is 'Compatibility alias retained for history; ART-002L new submissions store the exact source.';
comment on column public.community_art_submissions.rendered_preview_payload is 'Display/render payload; must not be used as the approval or clipboard source.';
comment on column public.community_art_submissions.stage_equality_audit is 'Hashes and deltas for each ingestion, moderation, publication and clipboard transition.';

commit;
