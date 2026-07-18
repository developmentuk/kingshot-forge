# Forge Identity architecture — Release 0.8.0

Forge Identity is the platform-user projection used by Operations. Supabase
Auth remains the authentication authority: the canonical user key is
`auth.users.id`. `auth.users` is read only by the server through
`auth.admin.listUsers`; it is never queried from browser code.

The browser receives only `UserListItem` and `UserDetail` projections. These
contain display name, masked email unless the server actor has
`users.read_sensitive`, safe timestamps, role/capability summaries, account
status, masked Player Account identifiers and the Auto Redeem consent state.
Passwords, tokens, raw metadata, provider payloads and internal support fields
are excluded.

Profiles remain the display-name and avatar source where present, with Auth
email and server-only provider data used only for enrichment. Player Identity
remains the owner of verified player fields and linkage. User Management may
read a safe linked-player summary but cannot mutate protected Player Identity
columns.

Roles are capability-backed. `forge_user_role_assignments` is the new active
multi-role history; `forge_user_roles` remains a compatibility fallback.
`forge_permissions` and `forge_role_permissions` remain the capability
authority. Workspaces are derived from capabilities and cannot grant access.

Account status and workspace preference are Forge-owned records. Status is
checked by the server actor resolver. The current workspace preference is
validated against the current accessible workspace set; an old local value can
never grant a workspace.

The 8.0B migration is additive and backfills legacy roles, active status and
empty preferences. New identity tables use forced RLS, revoke browser table
grants and are accessed by the server service role only. The RPC used by the
browser is explicitly limited to authenticated callers and returns role and
permission keys only.

Known follow-up: list filtering currently bounds the server-side Auth list to
1,000 users before applying pagination. A database-backed identity index is
the appropriate scale improvement for 8.0C.
