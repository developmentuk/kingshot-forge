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

## Live Supabase findings — 2026-07-18

- Project `hrvdhjscwitqpwjhnjkm` contains 4 Auth users, 3 active role
  assignments and 4 active account-status rows after the foundation migration.
- `forge_user_role_assignments` supports multiple active roles per user and
  preserves grant/revoke reasons. The legacy `forge_user_roles` rows were
  backfilled into it for compatibility.
- `forge_user_account_status`, `forge_user_preferences` and
  `forge_identity_audit_events` have RLS enabled and forced. Browser roles have
  no table grants; only `service_role` is granted table access.
- The new capability vocabulary is registered in the existing permission
  authority. Owner has the full identity set; Admin has read/status/role/audit
  capabilities but not sensitive reads or Owner assignment.

## Findings

- The UI supports capability checks such as `cms.view`, `cms.publish`,
  `cms.import.run`, `cms.history.view`, `moderation.manage`,
  `platform.users.manage` and `contributions.submit`.
- Server authorization is the required authority for mutations and provider
  operations; hiding a link is not sufficient.
- `RoleContext` now consumes the server-safe `get_my_forge_access()` RPC and
  resolves multiple active roles and capabilities.
- `requireForgeActor` resolves active assignments first and retains the legacy
  row only as a compatibility fallback.
- `/admin/player-identity` is declared without `ProtectedRoute`, unlike the
  neighboring Admin routes. Its component and server calls require a focused
  authorization review before it is exposed through Operations.
- User Management now provides a safe server projection, paginated list,
  detail view, audited role/status mutations and masked linked Player Accounts.
- Owner-only protection, final-owner safeguards, self-lockout prevention and
  mandatory reasons are enforced in the server service, not by the UI.

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

Status: **8.0B foundation implemented; authenticated runtime and scale testing
remain release follow-up work**.
