begin;

-- VISION-001D1 preparation only. This corrective migration is unapplied and
-- must follow the frozen bucket migration in a separately approved activation.
-- It adds lifecycle state and database constraints; it does not create a
-- bucket, storage policy, object or evidence record by itself.

create table public.vision_evidence_upload_intents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  purpose text not null check (purpose in ('mapping_reference','test_case','scan_source','evidence_crop')),
  upload_purpose text not null check (char_length(btrim(upload_purpose)) between 1 and 240),
  storage_bucket text not null default 'vision-evidence' check (storage_bucket = 'vision-evidence'),
  storage_path text not null check (storage_path ~ '^[0-9a-f-]{36}/(mapping_reference|test_case|scan_source|evidence_crop)/[0-9a-f-]{36}\.(png|jpg|webp|tiff)$'),
  expected_mime_type text not null check (expected_mime_type in ('image/png','image/jpeg','image/webp','image/tiff')),
  expected_bytes bigint not null check (expected_bytes > 0 and expected_bytes <= 16777216),
  consent_recorded_at timestamptz,
  status text not null default 'created' check (status in ('created','completed','abandoned','expired')),
  expires_at timestamptz not null,
  completed_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz not null default now(),
  check (purpose <> 'scan_source' or consent_recorded_at is not null),
  check ((status = 'completed' and completed_at is not null) or status <> 'completed'),
  check ((status = 'abandoned' and abandoned_at is not null) or status <> 'abandoned'),
  unique (storage_bucket, storage_path)
);

alter table public.vision_evidence_images
  add column upload_intent_id uuid references public.vision_evidence_upload_intents(id) on delete restrict,
  add column verified_at timestamptz,
  add column legal_hold boolean not null default false,
  add column deletion_reason text,
  add constraint vision_evidence_scan_owner_required
    check (purpose <> 'scan_source' or owner_user_id is not null),
  add constraint vision_evidence_storage_bucket_fixed
    check (storage_bucket = 'vision-evidence'),
  add constraint vision_evidence_deletion_reason_bounded
    check (deletion_reason is null or char_length(btrim(deletion_reason)) between 1 and 240);

create unique index vision_evidence_active_hash_idx
  on public.vision_evidence_images(sha256)
  where deleted_at is null;

alter table public.vision_evidence_upload_intents enable row level security;
alter table public.vision_evidence_upload_intents force row level security;

revoke all on public.vision_evidence_upload_intents from anon, authenticated;
grant select on public.vision_evidence_upload_intents to authenticated;

create policy vision_evidence_upload_intents_read
on public.vision_evidence_upload_intents
for select
to authenticated
using (owner_user_id = auth.uid() or public.has_forge_permission('vision.evidence.review'));

comment on table public.vision_evidence_upload_intents is
  'Server-created, short-lived reservation for one exact private Vision evidence object.';
comment on column public.vision_evidence_images.verified_at is
  'Set only after server-side object HEAD metadata and SHA-256 verification.';
comment on column public.vision_evidence_images.legal_hold is
  'Retention deletion is blocked while this hold is true.';

commit;
