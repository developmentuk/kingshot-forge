begin;

insert into public.forge_permissions (permission_key, label, description)
select permission_key, label, description
from (values
  ('render_engine.view', 'View Render Engine', 'Open the Render Engine workspace.'),
  ('render_engine.inspect', 'Inspect Render Engine', 'Inspect Unicode, pipeline and prediction diagnostics.'),
  ('render_engine.calibrate', 'Calibrate Render Engine', 'Adjust render calibration values.'),
  ('render_engine.manage_profiles', 'Manage Render Profiles', 'Manage saved calibration profiles.'),
  ('community_art.moderate', 'Moderate Community Art', 'Read the Community Art moderation queue, raw source and private notes.'),
  ('community_art.approve', 'Approve Community Art', 'Approve, reject and publish Community Art submissions.')
) capability(permission_key, label, description)
where not exists (select 1 from public.forge_permissions existing where existing.permission_key = capability.permission_key);

insert into public.forge_role_permissions (role, permission_key)
select mapping.role::public.forge_platform_role, mapping.permission_key
from (values
  ('owner','render_engine.view'),('owner','render_engine.inspect'),('owner','render_engine.calibrate'),('owner','render_engine.manage_profiles'),('owner','community_art.moderate'),('owner','community_art.approve'),
  ('admin','render_engine.view'),('admin','render_engine.inspect'),('admin','render_engine.calibrate'),('admin','render_engine.manage_profiles'),('admin','community_art.moderate'),('admin','community_art.approve'),
  ('moderator','render_engine.view'),('moderator','render_engine.inspect'),('moderator','community_art.moderate'),('moderator','community_art.approve')
) mapping(role, permission_key)
where not exists (select 1 from public.forge_role_permissions existing where existing.role = mapping.role::public.forge_platform_role and existing.permission_key = mapping.permission_key);

drop policy if exists community_art_submissions_select_moderator on public.community_art_submissions;
create policy community_art_submissions_select_moderator
on public.community_art_submissions
for select to authenticated
using ((select public.has_forge_permission('community_art.moderate')));

drop policy if exists community_art_payload_versions_owner_or_moderator on public.community_art_payload_versions;
create policy community_art_payload_versions_owner_or_moderator
on public.community_art_payload_versions
for select to authenticated
using (
  exists (select 1 from public.community_art_submissions s where s.id = artwork_id and s.user_id = (select auth.uid()))
  or (select public.has_forge_permission('community_art.moderate'))
);

commit;
