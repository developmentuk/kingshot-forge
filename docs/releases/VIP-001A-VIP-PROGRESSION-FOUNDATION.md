# VIP-001A — VIP Progression, Benefits & Special Packs Foundation

Status: implementation candidate

## Objective

Create a governed public VIP dataset for Kingshot Forge covering VIP Levels 1–12, progression requirements, passive/active benefits, daily free bundles and one-time Special Pack contents.

## Source boundary

Primary source: owner-supplied `VIP dataset.docx`, received 21 August 2026.

Supporting progression source: existing `vip(1).json` (`kingshot-vip`), whose embedded provenance references the Kingshot VIP calculator and prior cross-checking. VIP-001A uses this supporting dataset for the structured `xpToReach`/Gem-equivalent baseline and the owner document for benefits/bundles/packs.

The owner document's F2P timing estimates remain `community_guidance`. Currency is not inferred where the detailed pack rows give only an amount.

## Public contract

- `public/data/vip/meta.json` — provenance, trust boundary and explicit verification issues.
- `public/data/vip/levels.json` — 12 sequential VIP records.
- `public/data/vip/schema.json` — closed structural contract for metadata and level documents.

`levels.json` intentionally does not publish a cumulative VIP XP total because the supplied sources disagree about the meaning of the 2,400,000 VIP 12 figure.

## Reconciliation decisions

### VIP 8 Special Pack price

The detailed VIP 8 pack row says `49.99`; later prose says approximately `$4.99`. `priceAmount` remains `null` until independently verified.

### VIP 12 Attack and Health

The detailed benefit list says Attack +16% and Health +16%; the later VIP 12 summary says Attack +12% and Health +14%. Those two fields remain `null` with status `conflicted`. Lethality +16% is retained because both sections agree. Defence +16% is retained from the detailed list because no competing Defence value is supplied.

### VIP 12 cumulative XP wording

The existing structured dataset models 2,400,000 as the XP requirement for VIP 12. The owner document later calls the same number a cumulative total. VIP-001A therefore publishes per-level `xpToReach` only and does not manufacture a cumulative field.

### Amadeus aggregate shard prose

The detailed VIP 7–12 pack rows total 975 Amadeus Shards. Later prose states 1,105 total and also says VIP 11–12 contain 580, while their detailed rows total 450. VIP-001A preserves the individual detailed rows but publishes no aggregate Amadeus total.

## Validation contract

`scripts/test-vip-001a.mjs` verifies:

- exactly 12 sequential VIP levels;
- the existing structured XP baseline for VIP 1–12;
- Gem equivalents remain exactly 2× VIP XP;
- Helga is the Special Pack shard hero for VIP 1–6 and Amadeus for VIP 7–12;
- detailed Helga shard rows total 1,055;
- detailed Amadeus shard rows total 975 while the conflicting aggregate prose remains only a verification issue;
- VIP 8 price remains unresolved/null;
- VIP 12 Attack and Health remain unresolved/conflicted;
- source-unknown Saving/Top-up values remain null rather than guessed;
- all schema root references resolve and the level document pins Levels 1–12 sequentially.

## Non-goals

VIP-001A does not:

- create a player-owned VIP tracker;
- publish a VIP calculator;
- resolve the open source contradictions by inference;
- infer pack currency;
- publish the Prestige system as a verified mechanic;
- alter authentication, Supabase, Vercel or production data.

## Release gate

Before merge, run the focused VIP validator, `git diff --check`, and the full AEGIS `npm run check` on the exact candidate head. Any unresolved source conflict must remain explicitly non-canonical or block publication of the affected field.
