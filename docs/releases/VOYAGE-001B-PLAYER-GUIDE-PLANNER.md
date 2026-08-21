# VOYAGE-001B — Voyage of Light Player Guide & Planner

Status: implementation candidate

## Objective

Turn the governed VOYAGE-001A public dataset into a player-facing Forge guide and lightweight milestone planner without introducing account persistence, new game claims or disputed mechanics.

## Canonical baseline

- Base `main`: `25b4915a52c0423bb793ee7cd3b5d16eb7a758ef`
- Source contract: `public/data/voyage-of-light/*`
- Source governance: `docs/releases/VOYAGE-001A-VOYAGE-OF-LIGHT-FOUNDATION.md`

## Player surface

The guide is published through the existing generic guide route:

`/guides/kingshot-voyage-of-light-guide`

It is discoverable from the Guides library and loads the governed public event, metadata and strategy documents at runtime.

The page presents:

- active and collection phase context;
- eight-hour voyage timing;
- four Voyager Teams and their source-confidence states;
- all seven milestone thresholds and rewards;
- Compass mechanics and source-listed Compass bundle counts;
- Common → Premium treasure merging;
- the unresolved Premium merge outcome as a visible verification warning;
- community guidance separated from mechanics;
- the three open VOYAGE verification issues.

## Planner contract

The planner accepts:

- current completed voyages;
- target milestone;
- active Voyager Team count;
- available Compasses.

It derives:

- voyages remaining;
- ideal dispatch rounds (`ceil(remaining / activeTeams)`);
- ideal baseline elapsed time (`dispatchRounds × 8 hours`);
- total voyage-hours covered by the available Compasses;
- fully accelerated eight-hour voyages plus any partial voyage-hour reduction;
- Compasses required to remove all fresh target-voyage timer hours.

The page explicitly labels the elapsed-time figure as an idealised planning estimate. It assumes selected teams remain continuously available and are dispatched together with no downtime. Compass coverage is shown as voyage-hours rather than falsely claiming a guaranteed real-world completion time.

## Runtime data boundary

`src/features/guides/voyageGuideData.ts` is the shared fail-closed boundary between the public JSON and React rendering. The page does not cast unvalidated JSON directly into UI types.

Before data reaches the page it validates the nested fields the UI consumes, including phase/timing primitives, four ordered team rows and unlock values, treasure tiers, both merge rules, all seven ordered milestones and their reward rows, Compass bundles, metadata trust fields and verification issues, strategy principles, player profiles and daily-routine strings.

Malformed nested rows therefore fail into the page’s governed unavailable state rather than reaching rendering code and causing a runtime exception.

## Trust boundary

VOYAGE-001B does not change any VOYAGE-001A source classifications.

In particular:

- one Compass remains exactly one hour of voyage reduction;
- Team 2–4 unlock prices remain `source_claimed_unverified`;
- strategy remains `community_guidance`;
- the Premium → Exquisite/Majestic outcome remains `null/conflicted`;
- the disputed 75% / 25% probability is not published on the player page;
- no Auto-Voyage or normal-speedup interaction is introduced.

The player loader fails closed if the governed eight-hour voyage, one-hour Compass rule, four-team coverage, seven milestones, conflicted Premium rule, dataset identity, metadata trust boundary, nested player-visible values or strategy classification change unexpectedly.

## Validation

`scripts/test-voyage-001b.mjs` verifies:

- milestone-planner arithmetic for one-team and four-team plans;
- already-completed targets collapse to zero remaining work;
- unsafe/negative planner inputs are sanitised;
- the actual three governed public documents pass the shared runtime parser;
- malformed nested team unlocks, milestone rewards and treasure tiers are rejected;
- unexpected Premium canonicalisation is rejected;
- malformed verification metadata and strategy guidance are rejected;
- the guide loads all three governed public documents through the shared parser;
- the disputed `75%` claim is absent from the player page;
- the planning-assumption disclosure remains present;
- the generic guide route resolves the Voyage page;
- the Guides library publishes and searches the Voyage entry.

The existing dependency-free Voyage workflow runs both VOYAGE-001A and VOYAGE-001B focused checks without installing dependencies. The normal repository integration gate remains responsible for lint, TypeScript and production build coverage.

## Non-goals

VOYAGE-001B does not:

- store a player’s event progress;
- add Supabase tables or migrations;
- alter authentication or permissions;
- add paid-pack purchasing or pricing logic;
- infer disputed treasure outcomes;
- publish Auto-Voyage/normal-speedup mechanics;
- alter Vercel configuration or production data.

## Release gate

Before merge:

1. focused VOYAGE-001A and VOYAGE-001B checks must pass on the exact candidate head;
2. repository integration checks must pass;
3. `git diff --check` and full AEGIS `npm run check` must pass once on the final exact head;
4. scope and review-thread state must remain clean;
5. no merge occurs without explicit owner authorisation.
