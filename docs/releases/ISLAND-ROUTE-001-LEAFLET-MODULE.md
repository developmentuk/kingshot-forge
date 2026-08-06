# ISLAND-ROUTE-001 — Leaflet Oasis Island Route Optimizer Module

Date: 2026-08-06  
Branch: `feature/island-route-optimizer`  
Issue: #47  
Status: Draft implementation — not production accepted

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
- Temporary owner-provided Island Route review image as the Leaflet background layer, stretched to the existing 60×60 bounds.
- Subtle neutral Forge grid overlay above the background instead of copied game-map artwork.
- Map markers, route lines, current-round state, collected state and tooltips.
- Device-local progress persistence via `localStorage` only.
- Accessible complete route list fallback.
- Focused `npm run test:island-route` validation script.
- `npm run check` wiring for the focused route test.

## Leaflet integration

The module uses Leaflet 1.9.4 through the official hosted release with Subresource Integrity hashes. This avoids package-lock churn in this branch while still using Leaflet for the interactive grid map.

A future hardening step may vendor Leaflet locally or add it through npm with a regenerated lockfile if owner-approved.

The background image is a temporary owner-provided review asset. No route logic,
coordinate data or mode behaviour changed for this visual pass. Final asset
selection and map-art alignment still require owner acceptance.

## Data status

The coordinate dataset is a community-reference planning dataset, not yet a canonical Forge publication.

The public optimiser confirms:

- 55 chest locations;
- 60×60 map bounds;
- single and double route modes;
- Manhattan-distance route planning;
- a Prim-style route calculation.

The full coordinate table should still receive owner/community visual review before it is promoted into a governed canonical dataset.

## Safety

- No Supabase migration.
- No Supabase write.
- No auth, Player Identity, Companion Admin, Art Studio or provider changes.
- No copied third-party game artwork.
- No production deployment.
- Draft PR required before merge.

## Acceptance required

Before production acceptance:

1. Run `npm run test:island-route`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Optionally run full `npm run check` if environment/time permits.
5. Browser-review `/calculators/island-chest-route-optimizer` on mobile and desktop.
6. Owner-review the 55 coordinate markers against the reference map.
7. Confirm whether to keep CDN Leaflet or vendor/install it locally before merge.
