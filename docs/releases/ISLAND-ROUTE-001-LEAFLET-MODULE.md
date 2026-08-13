# ISLAND-ROUTE-001 — Leaflet Oasis Island Route Optimizer Module

Date: 2026-08-06  
Branch: `feature/island-route-optimizer`  
Issue: #47  
Status: Merged and production-line accepted

Merged through PR #50 at `effd8a35fbc5c3df5a839b04496fd28ead8d3220` after owner approval and authenticated progress smoke acceptance against `eec6c608fc6b307230fcc79ecb236dcba8734df4`.

## Summary

ISLAND-ROUTE-001 adds a player-facing Oasis Island Chest Route Optimizer module to Kingshot Forge.

The module is intentionally isolated under `src/features/island-route-optimizer/` and exposed through the player workspace at `/calculators/island-chest-route-optimizer`.

## Implemented

- Public route page registered in the main app router.
- Player workspace navigation entry under Kingshot Companion.
- Homepage discovery card.
- Reviewable 60×60 coordinate dataset containing 55 chest nodes.
- Dataset validation for count, duplicate IDs, duplicate coordinates and bounds.
- Deterministic Manhattan-distance route engine.
- Single Reservoir plan with 55 steps.
- Double Reservoir plan with 28 rounds.
- Leaflet `CRS.Simple` interactive map renderer.
- Forge-owned isometric coordinate-board background: an ocean-tone map surface outside a filled diamond board with a muted tile/grid treatment inside.
- Owner review rejected the scenic island image as the default because some chest markers appeared to sit in the sea, which could make correct route data look wrong to players.
- Owner screenshot review showed the reference map is isometric/diamond-shaped; the display now uses a display-only isometric projection for the grid, markers and route lines.
- Subtle Forge coordinate grid and readable vector route layers above the board instead of copied game-map artwork.
- Responsive board framing after owner screenshot review: desktop empty ocean reduced, mobile clipping addressed, and the board refits after map-container resize.
- Owner-provided Oasis Island header image added to the page, with a tag-ready content panel for future relationship linking.
- Page wording simplified into shorter, plain-English guidance for route use, progress saving and board limitations.
- Logged-in progress sync added through the owner-scoped `user_tool_progress` table; signed-out users remain browser-only.
- Map markers, route lines, current-round state, collected state and tooltips.
- Device-local progress persistence via `localStorage` only.
- Accessible complete route list fallback.
- Focused `npm run test:island-route` validation script.
- `npm run check` wiring for the focused route test.

## Leaflet integration

The module uses Leaflet 1.9.4 through the official hosted release with Subresource Integrity hashes. This avoids package-lock churn in this branch while still using Leaflet for the interactive grid map.

A future hardening step may vendor Leaflet locally or add it through npm with a regenerated lockfile if owner-approved.

The scenic background image remains a temporary, non-production review asset in
the repository, but it is removed from the default rendered map. The Forge
board prioritises route clarity and keeps the projected chest markers on a
single visible land surface. Final visual acceptance is still required.
No route logic, coordinate data or mode behaviour changed. The isometric
projection is display-only and the canonical route space remains 60×60.
The initial viewport fits the projected board with 14px desktop padding and
6px mobile padding, while a small buffered view bound permits limited panning
without forcing the map into a larger ocean rectangle. Final visual acceptance
is still required on both desktop and mobile.
The header image and content panel are presentation-only; route logic,
coordinate data, persistence and the accessible route fallback remain
unchanged.
ISLAND-ROUTE-001G adds the repository migration and RLS policies for minimal
account progress. The migration has not been applied to production; owner
release approval is still required.

## Data status

The coordinate dataset is a community-reference planning dataset, not yet a canonical Forge publication.

The public optimiser confirms:

- 55 chest locations;
- 60×60 map bounds;
- single and double route modes;
- Manhattan-distance route planning;
- a Prim-style route calculation.

The full coordinate table remains community-reference planning data. A separate governed-data decision is required before it may be described as canonical Forge data.

## Safety

- No Supabase migration.
- No Supabase write.
- No auth, Player Identity, Companion Admin, Art Studio or provider changes.
- No copied third-party game artwork.
- No external provider mutation.
- Route progress remains isolated by account and route mode.

## Accepted validation

The focused route gate, full Forge check, production build, desktop/mobile owner review and authenticated progress smoke passed before merge. Leaflet remains a pinned hosted dependency with Subresource Integrity; moving it into the npm bundle is a future hardening decision rather than an unrecorded release blocker.
