# PETS-001A — Pet Companion & Progression Foundation

Status: implementation candidate

## Objective

Create a first-class Kingshot Forge Pet Companion using the owner-supplied `Kingshot Pets.docx` research source and the owner-cleared Pet artwork supplied in `pets images.zip`.

## Source boundary

The PETS-001A public dataset preserves the terminology and progression values supplied in `Kingshot Pets.docx`.

- 14 Pet identities across Generations 1–7.
- Max levels from 50 to 100.
- Per-Pet skills and skill progression.
- Five shared level-progression curves covering Lv.50, Lv.60, Lv.70, Lv.80 and Lv.100 Pets.
- Exact Lv.2→max Pet Food rows and milestone Growth Manual, Nutrient Potion and Promotion Medallion requirements.
- Supplied refinement rarity thresholds only where the source contains them.
- Supplied F2P / spender priority lists retained as strategy guidance.

Approximate unlock timing remains `community_observation`. Strategy and refinement recommendations remain `community_guidance`. PETS-001A does not convert those values into official game rules.

The source contains a spelling inconsistency in the F2P priority prose (`Might Bison`). The governed Pet identity elsewhere in the same source is `Mighty Bison`; the public dataset uses that canonical identity while preserving the ranking position.

## Media boundary

The owner supplied 13 Pet PNG captures and stated that they are cleared for Kingshot Forge use.

PETS-001A converts those captures into one lightweight 4×4 WebP delivery sprite without changing the gameplay subject matter. Each governed Pet record stores its explicit sprite coordinate and original source filename.

Available artwork:

- Gray Wolf
- Lynx
- Bison
- Cheetah
- Moose
- Lion
- Grizzly Bear
- Giant Rhino
- Mighty Bison
- Great Moose
- Alpha Black Panther
- Regal White Lion
- Ironclad War Elephant

`Ironclad War Bear` is intentionally published with a no-media placeholder until cleared artwork is supplied. Its media path, filename, original filename, rights text and sprite coordinate remain null.

## Public experience

Routes:

- `/companion/pets`
- `/companion/pets/:petKey`

The catalogue provides Pet artwork or an honest pending-media state, generation, max level, unlock observation, named skill and effect.

The detail view provides:

- Pet artwork and identity.
- Skill description, cooldown and progression.
- Advancement milestones.
- Full level-by-level progression table.
- Supplied refinement threshold coverage where available.
- Explicit source/trust boundaries.
- Links back to the Pet System guide, KvK Prep scoring and Companion Items.

The Companion landing page links to the Pet Companion as a first-class published family.

## Data contract

PETS-001A uses a normalized split public contract so the five shared progression curves are governed once instead of being duplicated across Pet records.

Canonical public files:

- `public/data/pets/meta.json` — source, media, coverage, refinement and strategy metadata plus governed curve paths.
- `public/data/pets/pets.json` — 14 Pet identities, skills, trust labels, media mappings and curve references.
- `public/data/pets/max-50.json`
- `public/data/pets/max-60.json`
- `public/data/pets/max-70.json`
- `public/data/pets/max-80.json`
- `public/data/pets/max-100.json`
- `public/data/pets/schema.json` — structural schema for Pet/media/row records.
- `public/media/pets/pets-sprite.webp` — governed delivery artwork for the 13 available Pet captures.

This split contract supersedes the earlier implementation-candidate path sketch that referred to aggregate `public/data/pets.json` and `public/data/pets.schema.json` files. No gameplay value or trust classification is changed by the storage normalization.

The player-facing loader resolves only these governed files and fails closed when required primitive types, supported generations/max levels, curve relationships, media states or unique identities/sprite coordinates are invalid.

## Validation contract

`scripts/test-pets-001a.mjs` requires:

- all governed split data files and the WebP sprite to exist;
- the delivery asset to have a WebP/RIFF signature;
- exactly 14 unique Pet keys and names;
- generations 1–7 only, with all seven generations represented;
- each Pet to resolve to the progression curve matching its max level;
- complete sequential Lv.2→max progression rows for every shared curve;
- sequential skill progression through the expected max skill level;
- exactly 13 unique available sprite coordinates;
- only Ironclad War Bear to be media-pending, with no invented media fields;
- approximate unlocks to remain `community_observation`;
- refinement and strategy guidance to remain explicitly non-official;
- both public routes and the Companion landing-page link to remain wired;
- the player-facing page to consume the governed split loader rather than an ungoverned aggregate path.

The existing `.github/workflows/companion-index-check.yml` runs this focused validator alongside the established Companion validation, lint and production build when PETS-owned data, media, page, route, loader or validation paths change in a pull request.

## Non-goals

PETS-001A does not:

- create Supabase tables or migrations;
- persist a player's owned Pet levels;
- create a Pet progression calculator;
- invent missing Ironclad War Bear artwork;
- extrapolate missing Gen 5–7 refinement thresholds;
- promote approximate unlock timing into an official schedule;
- publish an aggregate compatibility copy of the split dataset;
- alter the existing Pet System editorial guide.

Those progression/persistence capabilities belong to PETS-001B or later.

## Release gate

Before a pull request is opened or promoted, review the exact `main` → PETS branch diff and confirm that it remains limited to the governed PETS dataset/media, Pet Companion experience, minimal route/navigation wiring, focused validation and this release contract.

Before merge, the pull-request exact head must pass the Companion Index workflow, including PETS-001A validation, lint and production build. Full repository validation remains required by the normal Forge release process and is not replaced by the focused PETS gate.
