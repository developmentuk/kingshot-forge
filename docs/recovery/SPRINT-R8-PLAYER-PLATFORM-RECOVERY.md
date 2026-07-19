# Sprint R8 — Player Platform & Progression Recovery

Status: **Blocked — owner/governance action required**  
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `1c09e24329879b36c059f02120555992ac2a049d`  
Supabase project: `hrvdhjscwitqpwjhnjkm`

## Outcome

The existing Player Platform foundation was audited from the required clean
head. The canonical identity, profile, progression snapshot, Hero Showcase,
Kingdom, Alliance and Transfer surfaces are present and locally deployable.
R8 cannot be accepted because two requested capabilities are not recovered in
this branch: persistent player favourites and saved progression plans.

This is an intentional architecture/governance boundary, not a missing UI
hook that can be safely repaired inside R8. `docs/ADR/ADR-0114-player-planning-
extension-boundary.md` remains Proposed and explicitly keeps Player Planning
blocked; it also prohibits beginning Planning product code, API, schema or
migration work in the identity milestone. `docs/PLAYER_DOMAIN_ARCHITECTURE.md`
likewise records the Player Planning domain as proposed and requiring separate
schema, authority, privacy and audit approval.

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

### Player favourites

The Kingdom and Alliance member cards render disabled favourite controls with
the messages “Favourites will be enabled later in this sprint” and “Player
favourites are coming later.” There is no Player-domain favourite service,
table, migration or privacy contract. Existing Name Studio and Art Studio
favourites are browser-local and are not player favourites.

### Saved progression plans

The progression surface records immutable snapshots only. There is no saved
plan/roadmap entity, service, route, API, migration or RLS contract. Adding one
would be new product and persistence design, contrary to ADR-0114 without an
owner-approved extension of scope.

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
