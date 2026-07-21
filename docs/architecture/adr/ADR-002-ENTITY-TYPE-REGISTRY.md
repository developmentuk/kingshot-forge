# ADR-002 — Entity-Type Registry

**Status:** Accepted and implemented for the Sprint 1.1.1 foundation

The live registry contains 22 rows with forced RLS. Public route policy is
empty for registered domains without an implemented public page; their
resolvers return no route and never guess one. Registered-only types remain
safe metadata and fail closed when no published canonical record exists.

Forge uses a governed registry keyed by `entity_type`. Each entry supplies resolver, canonical source, published-state test, route builder, Search adapter, capability policy, relationship/media/tag/progression eligibility, audit and archive behavior.

Unknown types fail closed and never receive generic routes or permissions. The registry is the safety boundary that keeps future domains from inventing inconsistent identity, publication or authorization rules.
