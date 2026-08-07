# FRKS-OASIS-001A — Oasis Island catalogue foundation

## Decision record

Oasis Island is introduced as a new Companion/Oasis workstream using the current Forge Data Engine boundary. The implementation is source-staged evidence only. Aegis audit correction removed the source-staged dataset from the public published-dataset set because ADR-008 requires public route, API, Search and media resolution to consume published projections only.

## Source package

The approved source package contains:

- `Kingshot_Forge_Oasis_Island_Player_Guide.docx`
- `Oasis Island.docx`
- `kingshot_oasis_island_buildings.json`
- `images/` with 111 PNG files

The repository preserves the machine-readable source as `server/data-engine/sources/kingshot_oasis_island_buildings.json` and serves the approved PNG set from `public/assets/oasis-island`.

## Canonical ownership

The JSON is the primary structured Oasis evidence package for this slice. The loader preserves all source fields, rich image metadata, deterministic resolved URLs, raw verification history and a separate current verification overlay. Null or absent fields remain unknown; they are not filled from community claims. The projection is not an editorial publication, not a Supabase read model, and not an authorization source. A later publication slice must define the canonical database schema, migration, import run, validation, publication manifest, approved media projection and Search refresh together.

## Source priority correction

For Oasis building, stat and progression values, the priority is: Clark's direct in-game JSON values; other direct in-game Forge evidence; official Century Games mechanics where they add information; then clearly labelled secondary/community research for gaps only. The raw JSON remains unchanged as evidence.

## Entity and Search posture

Oasis records retain stable source IDs internally. Public Search readiness is missing, not implemented: there is no published Oasis dataset key, public API, Search provider, relationship projection or published detail resolution. This slice does not fabricate Search rows or relationships.

## Explicit non-goals

My Island, player-owned Oasis progression, player Oasis tables, automatic account buffs, calculator buff injection, OCR/Vision, upgrade recommendations, layout design, alliance/shared state and public player Island showcases remain out of scope.

## Owner review boundary

Local review may inspect the hub, filters, detail records, guide wording, source labels, image mapping and the existing chest-route link. No merge, deploy, Supabase mutation, migration application, Vercel Preview or production data action is part of OASIS-001A.

## Owner visual gate

The Product Owner passed the OASIS-001A local desktop and approximately 390px mobile visual gate on 7 August 2026 for the pre-audit visual implementation. The Aegis correction supersedes its public data path: the current route deliberately reports publication pending until an approved projection exists. No production publication, Search implementation, migration application, merge, deploy or Preview is claimed.
