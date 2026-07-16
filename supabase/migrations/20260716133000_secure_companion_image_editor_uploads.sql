-- Permit authenticated Forge editorial roles to manage Companion images.
-- Public reads are handled by the public bucket; write access remains role-gated.

drop policy if exists "Forge editors can upload companion images" on storage.objects;
drop policy if exists "Forge editors can update companion images" on storage.objects;
drop policy if exists "Forge editors can delete companion images" on storage.objects;

create policy "Forge editors can upload companion images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'companion-images'
  and exists (
    select 1
    from public.forge_user_roles fur
    where fur.user_id = auth.uid()
      and fur.role::text in ('owner', 'admin', 'moderator', 'content_creator')
  )
);

create policy "Forge editors can update companion images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'companion-images'
  and exists (
    select 1
    from public.forge_user_roles fur
    where fur.user_id = auth.uid()
      and fur.role::text in ('owner', 'admin', 'moderator', 'content_creator')
  )
)
with check (
  bucket_id = 'companion-images'
  and exists (
    select 1
    from public.forge_user_roles fur
    where fur.user_id = auth.uid()
      and fur.role::text in ('owner', 'admin', 'moderator', 'content_creator')
  )
);

create policy "Forge editors can delete companion images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'companion-images'
  and exists (
    select 1
    from public.forge_user_roles fur
    where fur.user_id = auth.uid()
      and fur.role::text in ('owner', 'admin', 'moderator', 'content_creator')
  )
);
