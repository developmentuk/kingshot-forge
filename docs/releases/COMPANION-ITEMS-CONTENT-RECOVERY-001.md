# COMPANION-ITEMS-CONTENT-RECOVERY-001

## Status

Candidate correction on `fix/companion-items-resources-content-recovery`.

Current recovery state:

- canonical item identities: 75;
- gameplay-enriched identities: 49;
- identities still honestly marked `research_needed`: 26;
- canonical identity invariant: `item.mithril` exists and `item.mythril` is forbidden.

## Problem

The published `/companion` item catalogue retained the governed canonical identities and media intake, but most media-derived records were still generated with a placeholder gameplay state:

- category derived from media role rather than gameplay role;
- generic summary saying gameplay research was required;
- no mechanics, acquisition, usage or strategy fields;
- no way for the item detail UI to preserve or render richer approved gameplay knowledge.

This meant a catalogue could still contain all 75 canonical records while presenting many of them as effectively media-only records even after Forge had gained governed gameplay knowledge in later guides and datasets.

No hidden corrective item dataset existed in the editorial database, so the missing knowledge was not recoverable by simply switching the UI to a different persisted source.

## Correction

A dedicated gameplay-content catalogue now enriches canonical Companion item identities from governed Forge sources without changing their identity or media ownership boundary.

The catalogue is split into traceable recovery phases rather than rewriting the original recovery in place:

- Phase 1: 38 identities recovered from existing governed Forge guides/datasets and the original Companion intake.
- Phase 2: 11 additional identities recovered from owner-supplied material that could be traced to permanent Forge derivatives or persisted recovery evidence.
- Combined published state: 49 of 75 canonical identities enriched.

The overlay can publish:

- corrected gameplay category/label;
- source-backed summary;
- trust state and verification note;
- mechanics;
- acquisition information;
- usage guidance;
- strategy guidance;
- explicit gameplay source references;
- search tags.

The published `items` dataset merges the combined gameplay catalogue at load time. Records with no supported recovered gameplay content continue to retain the existing `research_needed` state instead of receiving inferred facts.

## Phase 2 recovery

The second pass adds governed gameplay content for:

- Fortune Token
- Truegold Dust
- Advanced Teleporter
- Random Teleporter
- Gold Key
- Lucky Hero Gear Chest
- Bread
- Wood
- Stone
- Iron
- Arena Token

The detailed evidence boundary, source filenames, dataset hashes and supported facts are persisted in:

`docs/companion/COMPANION_ITEM_GAMEPLAY_RECOVERY_2026-08-19.md`

This pass deliberately did not promote the remaining 26 media-only identities from artwork or filename semantics.

## UI correction

`/companion` searches the recovered gameplay facts as well as names, aliases and summaries. Item cards identify when published gameplay facts are available.

`/companion/items/:itemKey` has dedicated sections for:

- Mechanics
- How to get it
- How to use it
- Strategy

The item page continues to show a truth boundary. Unsupported drop rates, pack values, unlock dates, costs or strategy claims are omitted until a governed source supports them.

## Identity and media invariants

This change does not expand or renumber the existing media-derived identity set.

- Canonical item projection remains exactly 75 records.
- `item.mithril` remains the canonical identity.
- `item.mythril` is forbidden.
- Existing approved media/checksum mappings are not replaced.
- Records without recovered gameplay evidence remain visible rather than being deleted.

## Recovery sources

The combined recovery uses gameplay knowledge already present in owner-supplied or governed Forge material, including:

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
- verified Masters / Master Academy guide
- original Companion item asset intake for its already-governed core relationships

This is a recovery/integration change, not a fresh web-research pass.

## Acceptance controls

`scripts/test-companion-gameplay-content.mjs` now verifies that:

- all enrichment keys map to existing canonical Companion identities;
- Phase 1 remains exactly 38 identities;
- Phase 2 remains exactly 11 identities;
- the two recovery phases do not duplicate keys;
- the combined gameplay catalogue is exactly 49 identities;
- the projection remains exactly 75 records;
- all enriched records publish structured gameplay/source fields;
- enriched records do not retain the media-only placeholder summary;
- representative Phase 1 and Phase 2 items contain their governed facts;
- exactly 26 identities remain unenriched and `research_needed`;
- `mithril` exists and `mythril` does not.

The Companion Index workflow runs this recovery test alongside the existing projection, media, entity, Search, workspace, lint and build checks.

## Residual recovery work

The original later item-by-item enrichment/approval material was not persisted as a canonical repository or editorial dataset. The second recovery pass therefore publishes only facts that can currently be traced to owner-supplied or governed Forge sources.

The remaining 26 records must stay `research_needed` until approved gameplay evidence can be traced. They must not be completed from item artwork, filename semantics or unverified assumptions.
