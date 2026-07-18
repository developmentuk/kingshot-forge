# Contributor application security

The public role catalogue is enabled; application submission and Operations review are intentionally deferred because the branch has no recruitment persistence, server workflow or RLS contract yet.

Before enabling applications, implement server-authoritative create/read/update operations, forced RLS, browser grant inspection, applicant/internal-note separation, immutable application events, reasoned status transitions, safe URL validation, signed-out read-only access, applicant ownership checks and capability-gated review actions.

Acceptance must remain separate from platform role assignment. Community Moderator, Administrator, Owner, publishing and production access must require separate protected operations.
