# FRKS-OASIS-001A — Oasis Island catalogue foundation

## Decision record

Oasis Island is introduced as a new Companion/Oasis workstream using the current Forge Data Engine boundary. This closeout delivers source evidence, a staging loader, fidelity contracts and an accepted but temporarily unwired UI prototype. Aegis approved the publication architecture in principle and approved Option B: governed publication will be delivered separately as OASIS-001A-PUB.

## Source package

The approved source package contains:

- `Kingshot_Forge_Oasis_Island_Player_Guide.docx`
- `Oasis Island.docx`
- `kingshot_oasis_island_buildings.json`
- `images/` with 111 PNG files

The repository preserves the machine-readable source as `server/data-engine/sources/kingshot_oasis_island_buildings.json` and preserves all 111 source PNGs byte-for-byte under `server/data-engine/source-assets/oasis-island`. They are not publicly served and are not uploaded to Supabase Storage.

## Canonical ownership

The JSON is the primary structured Oasis evidence package for this slice. The loader preserves all source fields, rich image metadata, exact private image filenames and level variants, raw verification history and a separate current verification overlay. `images.files` is authoritative; inventory matching is validation only. Null or absent fields remain unknown; they are not filled from community claims. The staging result is not an editorial publication, not a Supabase read model, and not an authorization source. A later publication slice must define the canonical database schema, migration, import run, validation, publication manifest, approved media projection and Search refresh together.

## Source priority correction

For Oasis building, stat and progression values, the priority is: Clark's direct in-game JSON values; other direct in-game Forge evidence; official Century Games mechanics where they add information; then clearly labelled secondary/community research for gaps only. The raw JSON remains unchanged as evidence.

## Entity and Search posture

Oasis records retain stable source IDs internally. Public Search is intentionally absent: there is no published Oasis dataset key, public API, Search provider, relationship projection or published detail resolution. This slice does not fabricate Search rows or relationships.

## Explicit non-goals

My Island, player-owned Oasis progression, player Oasis tables, automatic account buffs, calculator buff injection, OCR/Vision, upgrade recommendations, layout design, alliance/shared state and public player Island showcases remain out of scope.

## Owner review boundary

Local review may inspect the hub, filters, detail records, guide wording, source labels, image mapping and the existing chest-route link. No merge, deploy, Supabase mutation, migration application, Vercel Preview or production data action is part of OASIS-001A.

## Owner visual gate

The Product Owner accepted the OASIS-001A staging prototype design on 7 August 2026 at desktop and approximately 390px mobile widths. The UI is intentionally unwired from public routing until OASIS-001A-PUB connects it to the governed published projection. Final published-release visual acceptance must be repeated. No production publication, Search implementation, migration application, merge, deploy or Preview is claimed.
