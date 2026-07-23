# RoeBot Kingshot JavaDocs Review

- **Reviewed:** 2026-07-23
- **Source:** `https://javadocs.roebot.net/com/lssbot/core/api/game/kingshot/package-summary.html`
- **Status:** Internal, non-canonical reference
- **Publication:** Not permitted without separate editorial verification

## Executive finding

The RoeBot Kingshot JavaDocs describe a screen-automation and recognition domain model. They are not an official Kingshot API and do not provide a dependable source of live numerical game data.

The source is useful for:

- discovering terminology used by RoeBot;
- identifying building and navigation concepts for comparison;
- understanding how a third party models Kingshot screens, searches and marches;
- finding possible aliases or coverage gaps in Forge datasets.

The source is not sufficient for:

- hero rosters or hero identifiers;
- item identifiers;
- research costs;
- building costs;
- troop statistics;
- event schedules;
- battle formulas;
- canonical publication without further evidence.

## Observed package areas

- Root UI and image support
- Building recognition and upgrade screens
- March screens and formation slots
- Message boxes, tooltips and tap-anywhere handling
- Resource replenishment
- World search
- Side navigation
- Speed-up interfaces

## Extracted terminology

### Buildings

RoeBot exposes labels including:

`ACADEMY`, `ARENA`, `BARRACKS`, `BARRICADE`, `CLINIC`, `COMMAND_CENTER`, `CONQUERORS_CAMP`, `COURT_OF_JUSTICE`, `DEFENSE_TOWER`, `EMBASSY`, `ENLISTMENT_OFFICE`, `GUARD_STATION`, `HERO_HALL`, `HOUSE`, `INFIRMARY`, `IRON_MINE`, `KITCHEN`, `MILL`, `MONUMENT`, `OCEANA`, `QUARRY`, `RANGE`, `SAWMILL`, `STABLE`, `STOREHOUSE`, `SUGGESTION_BOX`, `TOWN_CENTER`, `WATCHTOWER`.

These labels establish only that RoeBot models or recognises them. They do not establish current canonical Forge terminology or live-game status.

### Side-navigation targets

- Advanced Recruitment
- Alliance Contribution
- Archer
- Cavalry
- Epic Recruitment
- Infantry
- Online Rewards
- Tech Research

### Search entities

- Beasts
- Bread
- Iron
- Stone
- Terror
- Wood

### Qualitative march states

- Caution
- Certain to Fail
- Not Likely
- Quite Likely

No underlying battle formula was exposed in the reviewed material.

## Forge terminology implications

Potential aliases requiring editorial review include:

- `ACADEMY` → War Academy
- `CLINIC` or `HOSPITAL` → Infirmary
- `BREAD` → Food
- `ARCHER` → Marksman or archer, depending on the governed context

These are comparison candidates only and must not be applied automatically.

## Recommended use

1. Store the extraction as a non-canonical FRKS reference.
2. Compare each building label with the governed Buildings dataset.
3. Record aliases and conflicts in the terminology registry.
4. Preserve RoeBot as the source and retain the review date.
5. Route any proposed canonical addition through normal evidence, review, confidence and publication workflows.

## Prohibited use

Forge should not use this material to implement automated clicking, upgrades, searches, troop deployment, reward collection or other gameplay automation. It should not copy private implementation details or presume rights over image-template assets.

## Superseded expectations

Earlier discussion suggested that the JavaDocs might reveal hidden game IDs, complete research trees, hero data, item data and internal game mechanics. The completed review did not support those claims. They are not findings and should not be repeated as verified knowledge.
