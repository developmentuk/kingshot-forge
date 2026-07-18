# Roles and permissions audit — Release 0.8.0

## Existing model

Forge stores platform roles in `public.forge_user_roles` and maps role names to
capabilities through `public.forge_role_permissions`. The browser
`RoleContext` reads the role and permission mapping with the publishable
Supabase client. Supabase policies and server functions use the same role and
permission tables, including `forge_private.has_permission` for editorial
surfaces. API handlers authenticate with Supabase and resolve a Forge actor
server-side.

Known role values are `owner`, `admin`, `moderator`, `content_creator`,
`beta_tester`, `contributor` and `viewer`. Alliance membership roles are a
separate domain concept and must not grant global Forge operations access.

## Findings

- The UI supports capability checks such as `cms.view`, `cms.publish`,
  `cms.import.run`, `cms.history.view`, `moderation.manage`,
  `platform.users.manage` and `contributions.submit`.
- Server authorization is the required authority for mutations and provider
  operations; hiding a link is not sufficient.
- `RoleContext` uses `maybeSingle()` for `forge_user_roles`. This is compatible
  with the current one-role schema usage but does not satisfy the 0.8.0
  multi-role requirement.
- `requireForgeActor` returns a `roles` array containing only the single role
  it resolved. The shape is ready for extension, but the implementation is not
  yet multi-role.
- `/admin/player-identity` is declared without `ProtectedRoute`, unlike the
  neighboring Admin routes. Its component and server calls require a focused
  authorization review before it is exposed through Operations.
- No safe Admin user projection or role-management mutation surface exists in
  the starting point. The requested User Management work therefore requires a
  new server-authorized vertical slice, not a client-only table.
- Owner-only protection and final-owner safeguards are not represented by a
  0.8.0 management UI yet and must be enforced server-side before controls are
  released.

## Role lifecycle

The repository provides role storage and role-to-permission reads. A complete
grant/revoke lifecycle, reason capture, audit event and access-review surface
is not present in the current UI. Release 0.8.0 must add these as audited
server-authorized operations. Client role refresh may update presentation, but
must not be treated as authorization.

## Required boundary

Workspace visibility is presentation. Direct routes and APIs must independently
enforce capabilities. Admin does not imply Owner; contributor/creator and
moderator capabilities remain narrow; revoked roles must fail after the next
server authorization check. Sensitive auth/provider fields must never enter a
browser projection.

Status: **complete for the starting-state audit; multi-role storage, user
management and mutation validation remain Release 0.8.0 implementation work**.
