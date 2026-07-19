# Sprint R8B — Player Platform Completion & Preview Acceptance

Status: **In progress — approved continuation sprint**
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `5596a9e8316e026595f6c02b3c16cb45ab19dd7d`
Supabase project: `hrvdhjscwitqpwjhnjkm`

## Outcome

The existing Player Platform foundation is preserved from the required clean
head. The canonical identity, profile, progression snapshot, Hero Showcase,
Kingdom, Alliance and Transfer surfaces remain in scope. R8B completes the
approved Persistent Favourites capability and closes its preview evidence.

Saved Progression Plans are removed from R8 acceptance by owner decision.
`docs/ADR/ADR-0114-player-planning-extension-boundary.md` remains Proposed and
in force: Planning is a separate post-v1.0 epic and no planning product code,
API, schema or migration is part of R8B.

## Recovered and verified locally

- Canonical routes remain declared for `/my-forge`, profile, progression,
  heroes, Hero Showcase, Transfer Profile, Transfer Hub, public profiles,
  Kingdoms and Alliances.
- `PlayerIdentityContext` remains the browser source of truth for the linked
  `player_accounts` row; no second identity system was introduced.
- Public profile reads require both `player_profiles.is_public` and
  `player_accounts.is_public`. Public Hero Showcase reads require the same
  profile/account visibility boundary.
- Progression is represented by immutable
  `player_progression_snapshots`; no editable saved-plan model exists.
- Hero ownership, showcase selection, widget/gear state and private editing
  remain on the existing `player_heroes`/gear path.
- Transfer Hub exposes only public profiles with `status = 'looking'`.

## Explicit gaps blocking acceptance

### Persistent Favourites

The existing zero-row `public.favourites` table is the canonical persistence
boundary. R8B reconciles its legacy `item_type`/`item_id` names to
`entity_type`/`entity_id`, validates supported entity types, retains the
unique user/entity key, adds lookup indexes and preserves authenticated
own-row RLS. The shared client service is the only Player Platform access
layer; browser-local Name Studio and Art Studio favourites remain separate
legacy convenience features and are not authoritative Player favourites.

### Saved Progression Plans

The progression surface continues to record immutable snapshots only. There is
no saved plan/roadmap entity, service, route, API, migration or RLS contract.
This absence is intentional R8B scope, not an incomplete defect.

## Privacy and permission evidence

Read-only inspection of the live Supabase project confirmed RLS enabled on
`player_accounts`, `player_profiles`, `player_progression_snapshots`,
`player_heroes`, `transfer_profiles`, `kingdoms`, `alliances` and
`alliance_memberships`. Policies observed:

- public profile and progression reads require published/public flags;
- public showcased heroes require both a public player account and public
  profile;
- hero inserts/updates/deletes are linked-account owner checks;
- progression inserts and reads are linked-account owner checks, with a
  separate public shared-progression policy;
- transfer-profile writes and private reads are `auth.uid()` owner checks;
- public transfer discovery is limited to public `looking` profiles.

No Supabase write, migration, fixture, provider transport or production
change was performed.

## Validation evidence

Passed on the starting head:

- `npm run validate:player-identity`
- `npm run test:player-identity`
- `npm run test:forge-identity`
- `npm run test:workspaces`
- `npm run validate:hero-skills`
- `npm run test:hero-skills-governance`
- `npm run validate:nodenext`
- `npm run build`
- `npm run lint` (pre-existing warnings only: Fast Refresh exports,
  `useDataset` hook dependencies)

The build completed successfully with the existing Vite bundle-size warning.
No current R8 owner-authenticated preview URL or approved browser session was
provided in the brief, so deployed route, responsive, console, network,
status-code and content-type evidence could not be truthfully collected. The
previous R7 preview is not treated as R8 evidence.

## Owner action required

Choose one of the following before R8 can be reopened:

1. Approve a new Player-domain contract for persistent favourites and saved
   progression plans, including schema, server authority, RLS, privacy,
   retention and audit decisions; or
2. Remove those capabilities from the R8 acceptance gate and provide the
   current R8 preview URL plus an approved owner-authenticated browser session
   for the remaining runtime checks.

Recommended R9: resolve that governance decision first, then implement only
the approved contracts with focused privacy tests and a controlled preview
fixture plan. Do not add client-only favourites or mutable progression plans as
an interim substitute.

## Repository state

R8 documentation and the Recovery Matrix are the only intended changes. No
deployment was created. The branch remains clean after the documentation
commit.
