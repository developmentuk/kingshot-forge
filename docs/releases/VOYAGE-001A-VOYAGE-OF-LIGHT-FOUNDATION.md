# VOYAGE-001A — Voyage of Light Event & Strategy Foundation

Status: implementation candidate

## Objective

Create a governed Voyage of Light foundation for Kingshot Forge covering event timing, Voyager Teams, Compass mechanics, Tidal Treasure tiers, voyage-count milestones, known Compass bundle counts, and clearly separated community strategy guidance.

## Source boundary

Primary source: owner-supplied `Voyage of Light Guide.docx`, received 21 August 2026.

The document contains both mechanic statements and strategy/editorial guidance. VOYAGE-001A keeps those trust classes separate:

- repeatable event mechanics and reward tables are published as source-governed data;
- Team 2/3/4 unlock prices are retained as `source_claimed_unverified` because the guide itself advises checking exact in-game prices;
- strategy remains `community_guidance`;
- contradictory mechanics are not silently canonicalised.

A durable extracted claim map is preserved at `server/data-engine/source-assets/voyage-of-light/source-evidence.json`.

## Public contract

- `public/data/voyage-of-light/meta.json` — provenance, trust boundary and verification issues.
- `public/data/voyage-of-light/event.json` — governed mechanics, teams, treasure tiers, milestones and Compass bundle counts.
- `public/data/voyage-of-light/strategy.json` — community-guidance principles, player profiles and daily routine.
- `public/data/voyage-of-light/schema.json` — closed split contract for the three public documents.

## Governed mechanics

The source consistently supports:

- about five active voyaging days;
- one collection day after active dispatching ends;
- eight-hour standard voyages;
- one Tidal Treasure per completed voyage;
- four Voyager Teams with Team 1 free;
- one Compass reducing a voyage by exactly one hour;
- Complete All consuming enough Compasses to finish ongoing voyages;
- three Common Tidal Treasures merging into one Premium;
- milestones at 1 / 5 / 20 / 60 / 120 / 200 / 350 voyages;
- Compass bundle counts of 100 / 160 / 300 / 600 and 60 for the Team 4 Backpack.

## Explicit verification issues

### Premium treasure merge outcome

The source gives incompatible mechanics:

1. page 1 describes 3 Premium treasures as a random roll: 75% Exquisite / 25% Majestic;
2. pages 9–10 say the player chooses Exquisite or Majestic.

VOYAGE-001A therefore publishes the Premium merge input (`3 Premium`) but leaves the outcome `null` and marks it `conflicted`. No probability or player-choice mechanic is made canonical.

### Daily free Compass wording

One strategy section says to grab a free daily Compass “to bypass an 8-hour dispatch wait”, while the detailed Compass sections repeatedly state that one Compass removes exactly one hour.

VOYAGE-001A publishes only the one-hour mechanic. It does not publish a free-daily-Compass quantity/effect claim.

### Auto-Voyage / normal speedups

One strategy section says banked speedups can be used with Auto-Voyage. The detailed event-mechanic sections instead define Compasses as the timer-reduction resource and do not establish a normal-speedup interaction.

VOYAGE-001A does not publish an Auto-Voyage or standard-speedup mechanic.

## Milestone contract

- 1 voyage — Gear Boost Custom Chest ×1
- 5 voyages — Forgehammer ×12
- 20 voyages — Forgehammer ×24
- 60 voyages — Gear Boost Custom Chest ×2
- 120 voyages — Gear Boost Custom Chest ×5
- 200 voyages — Gear Boost Custom Chest ×6
- 350 voyages — Gear Boost Custom Chest ×10

## Strategy boundary

`strategy.json` is explicitly `community_guidance`. It keeps the useful source framing—team uptime, milestone-aware Compass use, merge flexibility, final-window discipline and spender-profile guidance—without promoting subjective recommendations to verified game mechanics.

## Validation contract

`scripts/test-voyage-001a.mjs` verifies:

- exact metadata/source/trust boundaries;
- exact event phases, voyage timing and Compass mechanics;
- four governed team records and their confidence states;
- exact treasure-tier ordering and terminal states;
- Common → Premium merge rule;
- Premium outcome remains unresolved/conflicted;
- exact milestone thresholds and reward rows;
- exact Compass bundle counts;
- strategy remains community guidance;
- extracted source evidence retains the key source claims;
- public schema root references, closed object contracts and pinned team/milestone positions;
- negative mutations reject an eight-hour Compass interpretation, canonicalised Premium outcome, ungoverned trust value, extra fields and promoted strategy confidence.

## Cost-control / release gate

Draft iteration uses the dependency-free focused validator only. No Codex review is required for source reconciliation or data-contract review.

Before merge:

1. exact-head focused VOYAGE validator must pass;
2. `git diff --check` must pass;
3. full AEGIS `npm run check` must pass once on the final exact candidate head;
4. final base/head/scope/review-thread state must remain clean;
5. no merge occurs without explicit owner authorisation.

## Non-goals

VOYAGE-001A does not:

- build the Voyage of Light player-facing planner yet;
- publish disputed Premium merge probabilities/choice mechanics;
- infer unverified pack contents or prices beyond source claims;
- publish Auto-Voyage or standard-speedup interactions;
- alter Supabase, authentication, Vercel configuration or production data.
