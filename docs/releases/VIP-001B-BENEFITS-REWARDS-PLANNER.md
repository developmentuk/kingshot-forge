# VIP-001B — VIP Benefits, Rewards & Planner Upgrade

Status: implementation candidate

## Objective

Upgrade the existing Kingshot Forge VIP 1–12 guide in place so it consumes the governed VIP-001A public contract and lets players compare progression requirements, benefits, daily free bundles and one-time Special Packs without inventing cumulative XP or resolving source conflicts by inference.

## Canonical baseline

- Base `main`: `7d472cdc8802a10de0c46f9c453f136b7aab4081`
- Existing guide URL: `/guides/kingshot-vip-1-12-xp-gem-cost-guide`
- Source contract: `public/data/vip/levels.json` and `public/data/vip/meta.json`
- Source governance: `docs/releases/VIP-001A-VIP-PROGRESSION-FOUNDATION.md`

## Player surface

VIP-001B keeps the existing public URL and upgrades the article rather than creating a duplicate VIP page.

The guide now provides:

- current VIP level and target VIP level selectors;
- a derived sum of published per-level VIP XP requirements between those selections;
- the corresponding derived Gem equivalent using the source-governed 1 VIP point = 2 Gems rule;
- benefit changes between the current and target rows;
- the full active-benefit row for the selected target;
- the target tier’s daily free bundle;
- the target tier’s one-time Special Pack contents;
- source-listed F2P timing where available, labelled `community_guidance`;
- all four open VIP verification issues.

## Derived total boundary

VIP-001B does not create or publish a canonical cumulative VIP XP field.

The planner total is calculated at runtime by summing only the published `xpToReach` rows above the selected current level through the selected target level. The same operation is applied to the published Gem-equivalent rows.

The UI explicitly labels this as a **derived sum of published per-level requirements**. This preserves the VIP-001A decision to leave the source conflict over VIP 12 cumulative wording unresolved.

## Trust boundary

VIP-001B does not change any VIP-001A source classification.

In particular:

- VIP 8 Special Pack `priceAmount` remains `null` because the supplied source conflicts;
- VIP 12 Squad Attack and Squad Health remain `null/conflicted`;
- VIP 12 Defence +16% and Lethality +16% remain source-supported;
- F2P timing remains `community_guidance`;
- Special Pack currency is not inferred where the detailed rows do not state it;
- the Amadeus aggregate shard conflict remains unresolved and no aggregate is published.

## Runtime validation

`src/features/guides/vipGuideData.ts` is the shared fail-closed boundary used by the player UI and focused regression tests.

Before returning typed data it validates:

- exactly 12 sequential VIP rows;
- the exact 1:2 XP/Gem relationship for every row;
- benefit status/value semantics;
- bundle item primitives and nullable rarity;
- positive XP bundle quantities and exact quantity × unit XP totals;
- Helga Special Pack shards for VIP 1–6 and Amadeus for VIP 7–12;
- non-negative speedups and valid Alliance Gift tiers;
- non-inferred pack currency;
- the VIP 8 price conflict and VIP 12 Attack/Health conflicts;
- exact VIP trust classifications and four open verification issue identities.

## Validation

`scripts/test-vip-001b.mjs` verifies:

- the real governed documents parse successfully;
- VIP 1 → 12 derives 4,800,000 VIP XP and 9,600,000 Gem equivalent from the published rows;
- VIP 8 → 10 derives 950,000 VIP XP and 1,900,000 Gem equivalent;
- same/lower targets produce zero progression work;
- benefit comparison exposes target changes and preserves VIP 12 conflicts;
- canonicalising VIP 8 price is rejected;
- canonicalising VIP 12 Attack is rejected;
- invalid bundle quantities and rarities are rejected;
- changing cumulative-XP trust classification is rejected;
- the existing guide embeds the planner and no longer claims benefits are unavailable;
- the UI loads only the governed VIP public documents and does not infer pack currency.

## Non-goals

VIP-001B does not:

- store a player’s VIP level or plan;
- create Supabase tables or migrations;
- publish a canonical cumulative VIP XP field;
- resolve VIP 8, VIP 12 or Amadeus aggregate conflicts;
- infer pack currency;
- add purchasing or payment functionality;
- alter authentication, permissions, Vercel configuration or production data.

## Release gate

Before merge:

1. VIP-001A and VIP-001B focused checks must pass on the exact candidate head;
2. repository integration checks must pass;
3. `git diff --check` and one full AEGIS `npm run check` must pass on the final exact head;
4. review-thread and scope state must remain clean;
5. no merge occurs without explicit owner authorisation.
