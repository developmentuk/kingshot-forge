# SENTRY-OBSERVABILITY-001 — Review Scope

Review only the focused observability foundation. This change must not alter Supabase schema or data, authentication, roles, permissions, canonical datasets, Search projections, Companion publication, Forge Vision evidence or production configuration.

The implementation intentionally starts with the root React boundary and unexpected Player Account API exceptions. Broader API instrumentation is deferred until this pattern is accepted.
