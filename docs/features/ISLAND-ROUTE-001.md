# ISLAND-ROUTE-001 — Oasis Island Chest Route Optimizer

## Status

Implementation candidate on `feature/island-route-optimizer`.

This document records the player-facing module, algorithm, data confidence, safety boundaries and acceptance requirements. It does not claim production release or owner acceptance.

## Player outcome

The module helps a player place reservoirs across Oasis Island and clear all 55 community-mapped chest positions through a deterministic, inspectable route.

Public route:

- `/calculators/island-chest-route-optimizer`

Player capabilities:

- one-reservoir route with 55 sequential steps;
- two-reservoir route with 28 parallel rounds;
- interactive zoomable and pannable coordinate map;
- current-step instructions and route-distance summary;
- completed-chest tracking stored locally on the current device;
- direct marker-to-round navigation;
- full-route display and accessible text fallback;
- explicit source, confidence and limitation language.

## Module boundary

Implementation lives under:

```text
src/features/island-route-optimizer/
```

The module owns:

- coordinate data and provenance;
- deterministic route calculation;
- Leaflet loading and map rendering;
- player controls and local progress;
- responsive module styles.

The Forge shell owns only the compatibility entry points:

- route registration in `src/App.tsx`;
- Player View navigation in `src/navigation/workspaceRegistry.ts`.

No platform module registry is introduced. This avoids pre-empting the unmerged modular-platform architecture proposal in draft PR #43.

## Data contract

`islandRouteData.ts` defines:

- a 60 × 60 neutral coordinate space;
- HQ at `(0, 0)`;
- 55 stable chest identities;
- whole-number `x` and `y` coordinates;
- original community reference grouping and sequence;
- dataset provenance, confidence and validation.

Validation fails closed when:

- the record count is not 55;
- an ID or coordinate is duplicated;
- a coordinate is not a whole number;
- a coordinate falls outside the 60 × 60 bounds.

### Provenance and confidence

Primary public reference:

- `https://www.kingshotapp.com/apps/island-chest-route-optimizer`

Underlying community route document referenced by that implementation:

- `https://docs.google.com/document/d/1Z4z0h8fescy-DmEhBXn_ONKdTddibQT1MEoXs9REvsk/edit?tab=t.0`

Retrieval date: 6 August 2026.

Confidence: **75 — Likely**.

Rationale:

- all 55 coordinates were recoverable from the published community route visualisation;
- the two route groups contain 27 and 28 distinct points;
- all coordinates are unique and inside the stated 60 × 60 bounds;
- the coordinates have not yet been independently confirmed in-game by Forge;
- the route calculations are Forge-owned and do not copy the source site's generated route.

The module uses no copied game-map or third-party site artwork. The player sees a Forge-owned neutral coordinate grid.

## Route engine

### Distance

The engine uses Manhattan distance:

```text
|x1 - x2| + |y1 - y2|
```

This matches grid-aligned expansion and remains easy to explain and test.

### One-reservoir mode

One-reservoir mode uses deterministic Prim-style expansion:

1. Start with HQ as the cleared frontier.
2. Compare every unopened chest to every cleared point.
3. Choose the minimum-distance edge.
4. Add that chest to the cleared frontier.
5. Repeat until all 55 chests are included.

Tie-break order is stable: distance, target X, target Y, target ID, source X, source Y and source ID.

Expected result:

- 55 steps;
- 55 unique placements;
- total Manhattan tree distance: **478**.

### Two-reservoir mode

Two-reservoir mode performs parallel frontier expansion:

1. Snapshot the cleared frontier at the start of the round.
2. Select the best candidate edge.
3. Select the next best edge to a different target from the same snapshot.
4. Add both selected targets only after the round has been formed.
5. Repeat until all chests are included.

This prevents the second placement in a round from depending on a chest that has not yet been cleared within that same round.

Expected result:

- 28 rounds;
- 27 two-placement rounds and one final single-placement round;
- 55 unique placements;
- total Manhattan tree distance: **504**.

## Leaflet integration

The map uses Leaflet `1.9.4` with `CRS.Simple`.

The module loads the official hosted assets from `unpkg.com` using the integrity values published on Leaflet's official download page. The loader:

- pins the exact version;
- verifies CSS and JavaScript with Subresource Integrity;
- uses anonymous CORS mode;
- caches one load promise;
- times out safely;
- removes a failed script before retry;
- reports an accessible failure message.

Leaflet is presentation only. The route engine and coordinate dataset do not depend on Leaflet and remain fully testable without a browser map.

The accessible complete route list remains available when Leaflet, the CDN or JavaScript map initialisation fails.

## Persistence and privacy

Completed chest IDs are stored in browser `localStorage` under a versioned Forge key.

The module does not:

- require sign-in;
- create or change a Supabase record;
- send route progress to Forge APIs;
- store Player ID, identity, alliance or kingdom information;
- mutate canonical Kingshot datasets.

Query parameters preserve only route mode and current round.

## Accessibility and responsive behaviour

Required states include:

- keyboard-operable buttons, range control and map markers;
- visible focus states;
- text labels that do not depend on route colour;
- reduced-motion handling for active-marker animation;
- a complete semantic route list;
- live map status messaging;
- one-column mobile layout;
- sticky desktop instruction card that becomes static on smaller screens;
- touch-friendly controls and a mobile-height map.

## Focused validation

Command:

```bash
npm run test:island-route
```

The focused test verifies:

- dataset count, identity, uniqueness and bounds;
- Manhattan distance behaviour;
- exact one-reservoir totals;
- exact two-reservoir totals;
- no duplicate placements;
- every connection starts from a point cleared before the round;
- deterministic repeated output;
- public route and navigation registration.

The test is included in `npm run check`.

## Known limitations

- Coordinates remain community reference data pending Forge in-game verification.
- Manhattan distance does not model obstacles, terrain, construction duration or movement animation.
- The result is a placement tree, not a turn-by-turn character path.
- Two-reservoir mode optimises each parallel round greedily; it is deterministic but is not claimed to be a proven global optimum for all possible two-builder schedules.
- Local progress does not synchronise across devices.
- A third-party CDN is required for the enhanced interactive map; the route controls and accessible list remain available without it.

## Release gates

Before merge or production promotion:

1. `npm run test:island-route` passes.
2. `npm run lint` passes without new blocking warnings.
3. `npm run build` passes.
4. Full `npm run check` passes or any unrelated environmental blocker is recorded honestly.
5. Preview is tested at phone and desktop widths.
6. Leaflet success and blocked-CDN fallback are both tested.
7. All 55 markers and both route modes are visually inspected.
8. Product Owner confirms the coordinate interpretation and player wording.
9. Exact-head Preview acceptance is recorded.
10. Merge, production deployment and smoke testing occur only after explicit owner approval.

## Safety record

This implementation introduces:

- no migration;
- no Supabase write;
- no Auth or provider change;
- no Player Identity change;
- no Companion Admin change;
- no production deployment;
- no paid infrastructure;
- no copied third-party map artwork.
