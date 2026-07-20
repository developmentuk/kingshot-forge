# Contributor application security

The public role catalogue and secure application workflow are enabled. Application tables use forced RLS, browser table grants are revoked, and Vercel API handlers mediate applicant and Operations access with existing Forge Identity actor resolution.

The service implements server-authoritative create/read/update operations, applicant/internal-note separation, immutable application events, reasoned status transitions, safe URL validation, signed-out read-only recruitment pages, applicant ownership checks and capability-gated review actions.

Acceptance must remain separate from platform role assignment. Community Moderator, Administrator, Owner, publishing and production access must require separate protected operations.
