# Contributor recruitment capability note

Recruitment capabilities are not active in Sprint 8.0C’s public catalogue. When implemented, they must be mapped conservatively to authorised Operations actors. Application acceptance must never imply platform-role assignment; Moderator, Administrator, Owner, publishing and production access remain separately protected.

# Role-capability matrix — Release 0.8.0

The matrix is intentionally conservative. A role grants only capabilities
explicitly present in `forge_role_permissions`; workspace labels do not grant
access.

| Capability family | Owner | Admin | Moderator | Content creator | Contributor | Viewer |
| --- | --- | --- | --- | --- | --- | --- |
| Player View | yes | yes | yes | yes | yes | yes |
| CMS view | mapped | mapped | mapped only if stored | mapped only if stored | mapped only if stored | mapped only if stored |
| CMS edit/import/publish/history | mapped | mapped | no by default | capability-specific | capability-specific | no by default |
| Community moderation | yes | yes | capability-specific | no by default | no by default | no |
| Contributions submit | yes | yes | capability-specific | capability-specific | capability-specific | no by default |
| User read | `users.read` | `users.read` | no | no | no | no |
| Sensitive user fields | `users.read_sensitive` | no | no | no | no | no |
| User status | `users.manage_status` | `users.manage_status` | no | no | no | no |
| User roles | `users.manage_roles`, `roles.*` | `users.manage_roles`, standard/privileged/revoke | no | no | no | no |
| Identity audit | `users.view_audit`, `audit.read` | `users.view_audit`, `audit.read` | no | no | no | no |
| Roles and permissions | Owner-only policy | explicit restricted policy; never Owner by default | no | no | no | no |
| System settings and feature gates | Owner-only policy | read or explicit capability | no | no | no | no |

The canonical mapping is `forge_permissions` plus `forge_role_permissions`.
Active assignments are stored in `forge_user_role_assignments`; the legacy
single-role table is retained as a compatibility fallback and was backfilled.
“mapped” means an existing capability outside the 8.0B identity slice remains
database-defined and must be verified in the target environment.

Management invariants: no self-escalation, no Admin-to-Owner grant, no removal
of the final Owner, no suspension of the Owner by an Admin, reason required for
privileged changes, and append-only audit records for material mutations.
