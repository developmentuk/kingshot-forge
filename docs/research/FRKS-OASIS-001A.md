# FRKS-OASIS-001A — Oasis Island catalogue foundation

## Decision record

Oasis Island is introduced as a new Companion/Oasis workstream using the current Forge Data Engine boundary. The initial implementation is source-staged and read-only from the public product’s perspective. It does not create a player-owned Oasis domain or a second React-owned canonical dataset.

## Source package

The approved source package contains:

- `Kingshot_Forge_Oasis_Island_Player_Guide.docx`
- `Oasis Island.docx`
- `kingshot_oasis_island_buildings.json`
- `images/` with 111 PNG files

The repository preserves the machine-readable source as `server/data-engine/sources/kingshot_oasis_island_buildings.json` and serves the approved PNG set from `public/assets/oasis-island`.

## Canonical ownership

The JSON is the primary structured Oasis dataset for this slice. Clark manually checked every non-null game value directly in the live Kingshot game. The Data Engine loader preserves those values, creates a deterministic source-staging projection with a payload hash, and marks the supplied values as `owner_direct_ingame_verified`. Null or absent fields remain unknown; they are not filled from community claims. The projection is not an editorial publication, not a Supabase read model, and not an authorization source. A later publication slice must define the canonical database schema, migration, import run, validation, publication manifest and Search refresh together.

## Source priority correction

For Oasis building, stat and progression values, the priority is: Clark's direct in-game JSON values; other direct in-game Forge evidence; official Century Games mechanics where they add information; then clearly labelled secondary/community research for gaps only. The raw JSON remains unchanged as evidence.

## Entity and Search posture

Oasis records use stable source IDs in the source-staged projection and receive a future `oasis-island` dataset destination mapping. Search can resolve a published record to the Oasis detail route when the Search projection contains it. This slice does not fabricate Search rows or relationships, because Search is a derived published-only projection.

## Explicit non-goals

My Island, player-owned Oasis progression, player Oasis tables, automatic account buffs, calculator buff injection, OCR/Vision, upgrade recommendations, layout design, alliance/shared state and public player Island showcases remain out of scope.

## Owner review boundary

Local review may inspect the hub, filters, detail records, guide wording, source labels, image mapping and the existing chest-route link. No merge, deploy, Supabase mutation, migration application, Vercel Preview or production data action is part of OASIS-001A.

## Owner visual gate

The Product Owner passed the OASIS-001A local desktop and approximately 390px mobile visual gate on 7 August 2026. The accepted review covered the public hub, catalogue artwork, Sleeping Drakethrone, Fountain of Life, Golden Sunset, long progression, contrast/readability, responsive metadata cards and bottom mobile navigation. The implementation is authorized for Draft PR audit only; My Island, player-owned progression, calculator integration, OCR/Vision, upgrade planning and Layout Studio remain later phases.
