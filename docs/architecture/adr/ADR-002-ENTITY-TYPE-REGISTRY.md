# ADR-002 — Entity-Type Registry

**Status:** Accepted for future implementation

Forge uses a governed registry keyed by `entity_type`. Each entry supplies resolver, canonical source, published-state test, route builder, Search adapter, capability policy, relationship/media/tag/progression eligibility, audit and archive behavior.

Unknown types fail closed and never receive generic routes or permissions. The registry is the safety boundary that keeps future domains from inventing inconsistent identity, publication or authorization rules.
