begin;

-- VISION-001D1A2 preparation only. Unapplied forward correction for the
-- server adapter's byte-verification contract. It creates no storage state.
alter table public.vision_evidence_images
  add column byte_length bigint,
  add constraint vision_evidence_byte_length_bounded
    check (byte_length is null or (byte_length > 0 and byte_length <= 16777216));

comment on column public.vision_evidence_images.byte_length is
  'Exact byte length computed from the private object bytes before verification.';

commit;
