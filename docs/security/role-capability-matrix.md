# Role-capability matrix — Release 0.8.0 baseline

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
| User read/manage | owner policy | explicit capability | no | no | no | no |
| Roles and permissions | Owner-only policy | explicit restricted policy; never Owner by default | no | no | no | no |
| System settings and feature gates | Owner-only policy | read or explicit capability | no | no | no | no |

“mapped” means the existing database mapping is the source of truth and must
be verified in the target environment. This document does not invent grants or
claim that every role currently has every listed capability.

Management invariants: no self-escalation, no Admin-to-Owner grant, no removal
of the final Owner, no suspension of the Owner by an Admin, reason required for
privileged changes, and append-only audit records for material mutations.
