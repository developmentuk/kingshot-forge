# OASIS-001A — Oasis Island catalogue foundation

## Status

Local implementation on `feature/oasis-001a-catalogue-foundation`. This slice remains Draft PR audit work. It is not merged, deployed, or published to Supabase.

## Owner visual acceptance

On 7 August 2026, the Product Owner completed local desktop and approximately 390px mobile review and recorded:

**OASIS-001A OWNER VISUAL GATE: PASS**

The review covered the public hub, catalogue cards and artwork, Sleeping Drakethrone, Fountain of Life, Golden Sunset, long level progression, contrast/readability, responsive metadata cards and bottom mobile navigation interaction. This authorizes Draft PR audit only; it does not authorize Preview, merge, deployment, production data changes or migrations.

## Scope delivered

- `/oasis-island` route with an explicit not-yet-published state; source staging is not consumed by public pages.
- Building detail routes at `/oasis-island/buildings/:buildingId`.
- 55 structure records from the approved Oasis source package, with non-null game values manually checked by the Product Owner.
- 111 supplied PNG assets copied into the repository’s public media path.
- Plain-English guidance covering unlock, Water Essence, Prosperity, Reservoirs, chests, priorities and known limits.
- Direct link to the existing `/calculators/island-chest-route-optimizer`.
- Discovery through the home hub, Companion Index and Player View navigation.
- Search readiness is missing until a published projection and approved Search refresh exist.

## Owner local review

Forge's existing local setup runs the Vite app and Vercel Functions as two local processes. Use two terminals from the repository root:

```text
Terminal 1: npm run dev
Terminal 2: vercel dev --listen 3000
```

Open the Vite URL shown in Terminal 1. Vite already proxies `/api` requests to the Vercel process on port 3000, which is the same API mechanism used by other API-backed Forge pages. `npm run dev` alone cannot serve those `/api` functions because it starts Vite only; Oasis does not require a unique launch path.

## Canonical data boundary

The supplied JSON is the primary structured Oasis dataset at `server/data-engine/sources/kingshot_oasis_island_buildings.json`. The React page consumes the existing Data Engine API contract and does not embed a second editable JSON truth. The loader preserves source values, source evidence and the source payload hash, while marking non-null supplied game values as `owner_direct_ingame_verified`. Null or absent fields remain unknown and are not replaced by community claims.

The current projection is explicitly labelled `source-staging; not a Supabase publication`. Under `docs/AEGIS.md` and ADR-008, staged evidence must not be consumed by public route, API, Search or media resolution. No existing immutable published Oasis projection was found, so the public route now stops with a clear publication-pending message. A future publication slice must define canonical persistence, immutable versions, audit history, a published projection, media approval and Search refresh after separate owner approval. No migration was created or applied.

## Evidence boundaries

- Owner-recorded non-null game values are treated as direct in-game facts.
- Community-only strategy remains labelled as community guidance.
- Unknown or unrecorded fields remain unavailable or qualified without making the whole building uncertain.
- Fixed “300 Water Essence per help” guidance is not presented as canonical.
- No player-owned Island state, progression, buff injection, layout editor, OCR/Vision or public player showcase is included.

## Validation

- `npm run test:oasis-001a`
- `npm run build`
- `npm run lint`
- `npm run check` (includes `test:oasis-001a` through the Island Route check)
- `git diff --check`

The full application build and focused contract checks are local readiness evidence only; they do not prove production publication or owner acceptance.
