# COMPANION-ITEMS-CONTENT-RECOVERY-001

## Status

Candidate correction on `fix/companion-items-resources-content-recovery`.

## Problem

The published `/companion` item catalogue retained the governed canonical identities and media intake, but most media-derived records were still generated with a placeholder gameplay state:

- category derived from media role rather than gameplay role;
- generic summary saying gameplay research was required;
- no mechanics, acquisition, usage or strategy fields;
- no way for the item detail UI to preserve or render richer approved gameplay knowledge.

This meant a catalogue could still contain all 75 canonical records while presenting many of them as effectively media-only records even after Forge had gained governed gameplay knowledge in later guides and datasets.

No hidden corrective item dataset existed in the editorial database, so the missing knowledge was not recoverable by simply switching the UI to a different persisted source.

## Correction

A dedicated gameplay-content overlay now enriches canonical Companion item identities from governed Forge sources without changing their identity or media ownership boundary.

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

The published `items` dataset merges this gameplay layer at load time. Records with no supported recovered gameplay content continue to retain the existing `research_needed` state instead of receiving inferred facts.

## UI correction

`/companion` now searches the recovered gameplay facts as well as names, aliases and summaries. Item cards identify when published gameplay facts are available.

`/companion/items/:itemKey` now has dedicated sections for:

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

The initial recovery uses gameplay knowledge already present in governed Forge material, including:

- Governor Gear progression guide/data
- Governor Charms progression guide/data
- Truegold & Tempered Truegold progression guide/data
- Kingdom of Power / KvK guide
- Champagne Fair guide
- Fishing Tournament guide
- verified Masters / Master Academy guide
- original Companion item asset intake for its already-governed core relationships

This is a recovery/integration change, not a fresh web-research pass.

## Acceptance controls

A new `scripts/test-companion-gameplay-content.mjs` test verifies that:

- all enrichment keys map to existing canonical Companion identities;
- the projection remains 75 records;
- enriched records publish structured gameplay/source fields;
- enriched records do not retain the media-only placeholder summary;
- representative Fishing, Masters and Pet/KvK records contain their governed facts;
- an intentionally unresolved record still remains `research_needed`;
- `mithril` exists and `mythril` does not.

The Companion Index workflow runs the new recovery test alongside the existing projection, media, entity, Search, workspace, lint and build checks.

## Residual recovery work

The original later item-by-item enrichment/approval material was not persisted as a canonical repository or editorial dataset. Therefore this correction only publishes facts that can currently be recovered from governed Forge sources.

Any remaining media-only records must be enriched when their approved source material can be traced. They must not be completed from item artwork, filename semantics or unverified assumptions.
