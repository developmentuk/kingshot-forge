# PETS-001B — Pet Upgrade Planner

## Objective

Extend the existing governed Pet Companion with a player-facing current-level → target-level progression planner using only the PETS-001A published progression rows.

## Canonical base

`9514d4aa8df8919306fc06c42bcdb2680c533ca0`

## Player surface

Existing routes remain unchanged:

- `/companion/pets`
- `/companion/pets/:petKey`

The planner is embedded in each existing pet detail page. No duplicate Pet route or standalone calculator route is introduced.

## Planner contract

Inputs:

- selected Pet progression curve
- current Pet level
- target Pet level

Outputs are derived by summing only governed rows where `row.level > currentLevel && row.level <= targetLevel`:

- Pet Food
- Growth Manuals
- Nutrient Potions
- Promotion Medallions
- number of level requirements crossed
- advancement milestone levels crossed

Levels are safe-integer sanitised and clamped to the selected curve's published max level. A target below the current level collapses to the current level and therefore produces zero upgrade cost.

## Trust boundary

PETS-001B does not alter PETS-001A source data, classifications, unlock observations, skills, refinement thresholds, strategy rankings or media mappings.

The planner:

- does not create a new aggregate source field;
- does not infer missing advancement materials;
- treats null advancement slots as no material requirement for that published row;
- does not extrapolate refinement thresholds for Gen 5–7 pets;
- does not convert approximate unlock observations into official timers;
- does not persist player Pet state.

## Regression anchors

Using the governed `max-50` curve:

- Lv.1 → Lv.20 = 4,933 Pet Food + 45 Growth Manuals.
- Lv.20 → Lv.50 = 24,100 Pet Food + 195 Growth Manuals + 60 Nutrient Potions + 10 Promotion Medallions.
- Lv.50 → Lv.50 = zero materials.

The focused regression also verifies input sanitisation and that the existing Pet Companion detail surface actually consumes the pure planner.

## Release gate

Before merge, the final exact head must pass:

1. `node scripts/test-pets-001a.mjs`
2. `node --experimental-strip-types scripts/test-pets-001b.mjs`
3. repository integration checks
4. `git diff --check`
5. one full `npm run check` on the final exact head
6. review-thread closure
7. explicit owner merge authorisation

Draft pushes run the focused PETS-001A/001B workflow. The expensive Final AEGIS job is gated behind ready-for-review.

## Non-goals

- Supabase or persistence changes
- authentication changes
- Pet dataset edits
- Pet media edits
- new routes
- account-linked Pet progression
- refinement probability modelling
