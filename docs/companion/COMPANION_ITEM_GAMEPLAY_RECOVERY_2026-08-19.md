# Companion Item Gameplay Recovery — 2026-08-19

## Purpose

This document persists the second recovery pass for Companion item gameplay knowledge so the evidence does not remain trapped in chat history.

The project owner asked Forge to recover information they had previously supplied and personally verified in-game. This pass therefore uses the supplied project material as the governing basis. It does not infer mechanics from artwork filenames and it does not replace the supplied material with community or web claims.

## Recovery boundary

The canonical Companion projection remains 75 item identities. The first recovery pass published gameplay content for 38 identities. This second pass promotes a further 11 identities only where the supplied material or an existing governed Forge derivative contains a traceable gameplay fact.

Items for which the recoverable material still provides only an identity or artwork filename remain `research_needed`.

## Recovered identities

### `fortune-token`

Source basis:

- owner-supplied `Kingshot Mystic Divination Event Guide.docx`;
- governed Forge derivative: `src/features/guides/articles/mysticDivination.tsx`.

Supported facts:

- Fortune Tokens are the spend currency used by Mystic Divination flips.
- The supplied guide states that unused Fortune Tokens persist across event runs.
- The guide describes free daily/Daily Mission acquisition and paid-pack acquisition, while event-specific quantities are treated as source-version details rather than permanent constants.
- The supplied strategy recommends hoarding persistent tokens when a player cannot efficiently complete the desired board/reset cycle.

### `truegold-dust`

Source basis:

- owner-supplied structured dataset `war-academy(1).json`;
- SHA-256: `702af1a282a0932c7674e85e0b83814a5043274fe976fd379e452145cac6393a`;
- dataset id: `kingshot-war-academy`;
- dataset title: `Kingshot War Academy (Research) Costs`;
- source metadata: kingshot.net War Academy database, accuracy score 78, verified 2026-06-18, updated 2026-06-14;
- strategy corroboration: governed Forge Kingdom of Power / Alliance Brawl material.

Supported facts:

- The structured dataset explicitly records `truegoldDust` as a War Academy research cost.
- Truegold Dust appears across all 30 technology records in the supplied dataset; individual levels carry different costs.
- The dataset therefore supports the item role as a War Academy research material, but not a universal flat cost.
- Forge event guidance treats Truegold-related progression resources as materials whose spending can be timed around useful progression/event windows.

### `advanced-teleporter`

Source basis:

- owner-supplied `Kingshot Swordland.docx`;
- governed Forge derivative: `src/features/guides/articles/swordland.tsx`.

Supported facts:

- The supplied Swordland preparation checklist explicitly tells players to save Advanced Teleports for Swordland.
- Teleporting is part of Swordland battlefield mobility/repositioning.
- The source does not provide a complete item-level teleport rule set, so the record does not invent destination-selection, cooldown or acquisition rules.

### `random-teleporter`

Source basis:

- owner-supplied Kingdom of Power / KvK guide material;
- governed Forge derivative: `src/features/guides/articles/kingdomOfPower.tsx`.

Supported facts:

- The supplied KvK strategy describes Random Teleport as an emergency city-repositioning safeguard when a city cannot be saved from being zeroed.
- The source supports the emergency defensive use, but does not define the item's random-location algorithm or complete acquisition rules.

### `gold-key`

Source basis:

- owner-supplied Champagne Fair guide material;
- governed Forge derivative: `src/features/guides/articles/champagneFair.tsx`.

Supported facts:

- Gold Keys are used in the hero recruitment/pull loop described by the supplied guide.
- The guide identifies Gold Key pulls as a source of hero duplicates/shards for several heroes.
- The supplied Champagne Fair strategy recommends considering stored recruitment Keys before the final exchange calculation because pulls can create additional surplus shards from already-maxed heroes.

### `lucky-hero-gear-chest`

Source basis:

- owner-supplied Twin Star Adventure guide material;
- governed Forge derivative: `src/features/guides/articles/twinStarAdventure.tsx`.

Supported facts:

- Lucky Hero Gear Chest is recorded as a Twin Star Adventure / Ice Megalodon damage-milestone reward.
- The source supports its acquisition as a Hero Gear reward chest; it does not provide a governed item-content probability table, so no contents or odds are invented here.

### `bread`, `wood`, `stone`, `iron`

Source basis:

- owner-supplied structured dataset `buildings(1).json`;
- SHA-256: `d8b0fe69e611783a665fe2cf9f2d36499753a186ad3254a70f65b1fbc3aa449f`;
- dataset id: `kingshot-buildings`;
- dataset title: `Kingshot Building Upgrade Costs`;
- source metadata: kingshot.net Buildings database, accuracy score 78, verified 2026-06-18, updated 2026-06-14;
- owner-supplied Oasis Island material and governed Forge Oasis guide.

Supported facts:

- The structured Buildings dataset records Bread, Wood, Stone and Iron as core resource costs across building progression rows.
- Costs depend on building and level; no flat upgrade cost is implied.
- The supplied Oasis material independently connects each resource to a dedicated gathering/mining-speed building effect: Deluxe Restaurant (Bread), Conservatory (Wood), Ore Stow (Stone), and Blacksmith (Iron).
- Existing Forge building knowledge also treats these as settlement resources subject to Storehouse protection rules when held as opened city resources.

### `arena-token`

Source basis:

- owner-supplied verified Masters workbook/material;
- governed Forge derivative: `src/features/guides/articles/masters.tsx`.

Supported facts:

- Arena Tokens are part of the Arena progression/reward economy.
- The verified Masters material records Roman skills that affect Arena token income and Arena shop efficiency.
- The source does not establish a universal earning amount or complete shop catalogue, so those values are not published here.

## Second-pass result

- Canonical item identities: 75
- First-pass enriched identities: 38
- Second-pass recovered identities: 11
- Combined enriched identities after this pass: 49
- Remaining `research_needed` identities: 26

## Remaining evidence boundary

The following identities were not promoted in this pass because the currently recoverable owner-supplied/project material does not contain enough gameplay evidence beyond identity/media naming:

- `alliance-teleporter`
- `ceasers-aid-chest`
- `champion-token`
- `compass`
- `copper-horn`
- `corsair-key`
- `custom-mythic-hero-gear-chest`
- `elite-spices`
- `governor-gear-materials-chest`
- `governor-rename-card`
- `growth-manual`
- `hunting-arrow`
- `league-token`
- `lesser-truegold`
- `mark-of-valor-noble`
- `mystery-badge`
- `mythic-general-decoration-component`
- `nutrient-potion`
- `pearl-of-enigma`
- `platinum-key`
- `promotion-medallion`
- `silver-goblet`
- `soldiers-medallion`
- `transfer-pass`
- `trial-crystal`
- `weapon-scraps`

These records must remain visible and honestly marked `research_needed` until an approved source can be traced. Artwork, filename semantics or model knowledge alone are not sufficient evidence for promotion.
