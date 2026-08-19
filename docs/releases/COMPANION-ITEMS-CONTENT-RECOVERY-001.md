# COMPANION-ITEMS-CONTENT-RECOVERY-001

## Status

Candidate correction on `fix/companion-items-resources-content-recovery`.

Current recovery state:

- canonical item identities: 75;
- gameplay-enriched identities: 75;
- gameplay identities still missing structured content: 0;
- Phase 3 newly owner-verifies the final 26 previously unresolved identities;
- Phase 3 also replaces the earlier provisional Advanced Teleporter description with the owner's verified manual-destination rule;
- canonical identity invariant: `item.mithril` exists and `item.mythril` is forbidden.

## Problem

The published `/companion` item catalogue retained the governed canonical identities and media intake, but most media-derived records were still generated with a placeholder gameplay state:

- category derived from media role rather than gameplay role;
- generic summary saying gameplay research was required;
- no mechanics, acquisition, usage or strategy fields;
- no way for the item detail UI to preserve or render richer approved gameplay knowledge.

This meant a catalogue could contain all 75 canonical records while presenting many of them as effectively media-only records even after Forge had gained governed gameplay knowledge.

No hidden corrective item dataset existed in the editorial database, so the missing knowledge was not recoverable by simply switching the UI to a different persisted source.

## Correction

A dedicated gameplay-content catalogue now enriches canonical Companion item identities without replacing their governed identity or media ownership boundary.

The catalogue is split into traceable recovery phases rather than rewriting earlier evidence in place:

- Phase 1: 38 identities recovered from existing governed Forge guides/datasets and the original Companion intake.
- Phase 2: 11 additional identities recovered from owner-supplied material that could be traced to permanent Forge derivatives or persisted recovery evidence.
- Phase 3: 27 owner-verified entries supplied on 19 August 2026: the final 26 previously unresolved identities plus a verified correction to Advanced Teleporter.
- Combined published state: all 75 canonical identities now have structured gameplay content.

The gameplay catalogue can publish:

- corrected player-facing name where necessary;
- compatibility aliases;
- corrected gameplay category/label;
- source-backed summary;
- trust state and verification note;
- mechanics;
- acquisition information;
- usage guidance;
- strategy guidance;
- explicit gameplay source references;
- search tags.

The published `items` dataset merges the combined gameplay catalogue at load time.

## Merge-readiness correction

The merge-readiness review identified one internal contract inconsistency before merge: gameplay enrichment updated the public `trust_state` and confidence label but initially left the original machine-readable `confidence` value unchanged. Media-derived records could therefore have published `trust_state: verified` while still carrying `confidence: experimental`.

The loader now derives machine confidence consistently from the effective gameplay trust state:

- `verified` and `confirmed` → `dataset_verified`;
- `provisional` → `relationship_derived`;
- `research_needed` → `experimental`.

The regression suite locks this agreement for every enriched item. It also now requires every one of the 75 enriched identities to publish at least one substantive fact across Mechanics, Acquisition, Usage or Strategy; a summary/source pointer alone cannot satisfy gameplay coverage.

## Phase 3 owner verification

The final owner-verification source is persisted at:

`docs/companion/COMPANION_ITEM_GAMEPLAY_OWNER_VERIFICATION_2026-08-19.md`

It records in-game and online owner verification for:

- Alliance Teleporter
- Cesare's Aid Chest
- Champion Token
- Compass
- Copper Horn
- Corsair Key
- Custom Mythic Hero Gear Chest
- Elite Spices
- Governor Gear Materials Chest
- Governor Rename Card
- Growth Manual
- Hunting Arrow
- League Token
- Lesser Truegold
- Mark of Valor
- Mystery Badge
- Mythic General Decoration Component
- Nutrient Potion
- Pearl of Enigma
- Platinum Key
- Promotion Medallion
- Silver Goblet
- Soldier's Medallion
- Transfer Pass
- Trial Crystal
- Weapon Scraps

The same source corrects the previously provisional Advanced Teleporter record: Advanced Teleporter allows manual destination selection; Alliance Teleporter instead moves the city close to the Alliance Leader (R5).

## Mark of Valor identity correction

The supplied media archive originally generated the stable key and media provenance name `item.mark-of-valor-noble` / `Mark Of Valor Noble`.

Owner verification establishes that the actual player-facing item is **Mark of Valor** and that `Noble` is unrelated naming from other game concepts.

To avoid an identity-breaking migration:

- the stable key remains `item.mark-of-valor-noble`;
- the published player-facing name becomes `Mark of Valor`;
- `Mark Of Valor Noble` remains only as a compatibility alias;
- the generated media manifest is not hand-edited because it remains provenance for the original supplied archive entry.

## Media verification

The existing generated Companion media manifest already contains governed media for all 26 previously unresolved identities.

No new images are required for this recovery. The Phase 3 regression test requires every newly recovered identity to retain a non-null published Companion image and `published_preview_candidate` media state.

## UI correction

`/companion` searches gameplay facts as well as names, aliases and summaries. Item cards identify when structured gameplay facts are available.

`/companion/items/:itemKey` has dedicated sections for:

- Mechanics
- How to get it
- How to use it
- Strategy

The item page continues to show a truth boundary. Time-sensitive live-service values can be updated editorially when the game changes rather than being inferred from filenames or artwork.

## Identity and media invariants

This change does not expand or renumber the existing media-derived identity set.

- Canonical item projection remains exactly 75 records.
- `item.mithril` remains the canonical identity.
- `item.mythril` is forbidden.
- Existing approved media/checksum mappings are not replaced.
- Records keep their existing media/no-media state; Phase 3 specifically confirms media for all 26 identities it adds.
- All 75 records remain visible.
- Gameplay completion does not imply that every earlier Phase 1/2 fact has the same trust label; each record retains the trust state supported by its source.

## Recovery sources

The combined recovery uses owner-supplied or governed Forge material including:

- Governor Gear progression guide/data
- Governor Charms progression guide/data
- Truegold & Tempered Truegold progression guide/data
- War Academy research data
- Buildings progression data
- Kingdom of Power / KvK guide
- Swordland guide
- Champagne Fair guide
- Fishing Tournament guide
- Mystic Divination guide
- Twin Star Adventure guide
- Oasis Island guide/data
- verified Masters / Master Academy material
- original Companion item asset intake
- the 19 August 2026 owner-verified final item research record

This remains a governed recovery/integration change. Phase 3 facts are explicitly attributed to the project owner's in-game and online verification rather than silently presented as independently researched by Forge.

## Acceptance controls

`scripts/test-companion-gameplay-content.mjs` verifies that:

- all gameplay keys map to existing canonical Companion identities;
- Phase 1 remains exactly 38 entries;
- Phase 2 remains exactly 11 entries;
- Phase 3 remains exactly 27 entries;
- the only deliberate Phase 3 overlap is `advanced-teleporter`;
- Phase 3 contributes exactly 26 new canonical identities;
- the combined gameplay catalogue is exactly 75 identities;
- the projection remains exactly 75 records;
- every canonical record publishes structured gameplay/source fields;
- every enriched identity publishes at least one substantive Mechanics, Acquisition, Usage or Strategy fact;
- each record's machine-readable `confidence` agrees with its effective published trust state;
- no record retains the media-only placeholder summary;
- all 26 newly owner-verified records publish with `verified` trust state, `dataset_verified` machine confidence and existing governed media;
- the Advanced/Alliance Teleporter distinction is locked;
- Cesare's Aid Chest limits/reward facts are locked;
- Mark of Valor keeps its stable Forge ID while publishing the corrected player-facing name;
- Pearl of Enigma, Transfer Pass, Trial Crystal and Weapon Scraps representative rules are locked;
- there are zero unenriched canonical identities;
- `mithril` exists and `mythril` does not.

The Companion Index workflow runs this recovery test alongside the existing projection, media, entity, Search, workspace, lint and production-build checks. The broader Forge integration gate remains required before merge readiness.

## Residual work

There is no remaining gameplay-content coverage gap in the current 75-item Companion catalogue.

Future work is normal live-service editorial maintenance: shop costs, event caps, sources, reward tables and game mechanics may change and should be updated from new governed evidence without changing stable identities unnecessarily.
