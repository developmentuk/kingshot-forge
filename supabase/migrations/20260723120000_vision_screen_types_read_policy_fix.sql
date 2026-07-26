begin;

drop policy if exists vision_screen_types_read
on public.vision_screen_types;

create policy vision_screen_types_read
on public.vision_screen_types
for select
to authenticated
using (
  public.has_forge_permission('vision.admin.read')
  or (
    vision_screen_types.is_enabled
    and exists (
      select 1
      from public.vision_mapping_versions v
      where v.screen_type_id = vision_screen_types.id
        and v.status = 'published'
    )
  )
);

commit;
