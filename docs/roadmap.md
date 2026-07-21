# Kingshot Forge roadmap

## HOTFIX-002 — Player Buildings and Connections

Implementation candidate: repair the published Buildings reader, expose Player
Buildings navigation, correct Truegold troop terminology through TG6, and
restore structured Forge Connections tabs/cards. Production promotion remains
deferred until protected-preview browser acceptance is complete.

## ARCH-001 — Forge Domain Model v1.0

Architecture/documentation sprint complete on the current HOTFIX-002 candidate.
See [`architecture/FORGE-DOMAIN-MODEL.md`](architecture/FORGE-DOMAIN-MODEL.md)
and ADR-001 through ADR-008. This does not mark the Entity Engine, Media
Library, shared tags, authored relationships or Creator integrations complete.

### Recommended next implementation sprint — Stable Entity Identity Foundation

**Gate:** HOTFIX-002 protected-preview acceptance and owner approval of ARCH-001.

Define the fail-closed entity-type registry, validate namespace-qualified Forge
IDs in compatibility adapters, test collisions/aliases/redirects/route
resolution, and produce a shadow identity report. Preserve current database
IDs, routes, Buildings publication tables and Search projections. No migration,
schema alteration, publication mutation or Entity Engine implementation is part
of this sprint.
