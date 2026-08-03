begin;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'building_editorial_overrides_image_permission'
      and conrelid = 'public.building_editorial_overrides'::regclass
  ) then
    alter table public.building_editorial_overrides
      add constraint building_editorial_overrides_image_permission
      check (
        nullif(trim(values->>'image_url'), '') is null
        or nullif(trim(values->>'image_license'), '') is not null
      ) not valid;
  end if;
end;
$$;

comment on constraint building_editorial_overrides_image_permission
  on public.building_editorial_overrides
  is 'New or updated building image projections require a recorded licence, ownership or permission basis. Existing historical rows remain readable until republished through the governed workflow.';

commit;
