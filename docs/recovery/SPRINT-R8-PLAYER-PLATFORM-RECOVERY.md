# Sprint R8B — Player Platform Completion & Preview Acceptance

Status: **Blocked on external owner-authenticated preview acceptance**
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

## R8B implementation outcome

### Persistent Favourites

The existing zero-row `public.favourites` table is now the canonical persistence
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

The approved migration was applied to project `hrvdhjscwitqpwjhnjkm` and
verified with live schema/policy queries. No fixture rows were created, no
provider transport was used, and no production promotion was performed.

## Validation evidence

Passed locally on the final implementation head `a73be97a4378a2675ce35c704693af43f4148f28`:

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
- `npm run test:favourites`
- `npm run check`
- `git diff --check`

The build completed successfully with the existing Vite bundle-size warning.
Local responsive smoke checks at 390, 768 and 1280 CSS px reported no
horizontal overflow. The exact preview deployed successfully and unauthenticated
route refreshes rendered the expected shell/sign-in states without a blank
screen; authenticated favourite add/remove, persistence, account isolation,
content-type and RLS runtime acceptance remain blocked because this exact
preview hostname has no restored owner session.

## Exact preview evidence

- Candidate commit deployed: `a73be97a4378a2675ce35c704693af43f4148f28`
- Deployment: `dpl_8tmBUZpNxRmk4HkGW3dGPkTcpNdd`
- Preview: <https://kingshot-forge-dvwfiw86r-clarksim-7474s-projects.vercel.app>
- Deployment state: `READY`, target `preview`; remote `npm run build` passed.
- Preview environment binding names were present for Supabase URL and
  publishable key; values were not exposed.
- Existing Chrome session was authenticated on a different historical preview
  hostname, but the exact R8B hostname rendered signed out. No credentials,
  OTPs or provider login data were entered.

## Owner action required

The remaining action is external owner authentication on the exact preview
hostname above, followed by the requested reversible favourite and privacy
acceptance checks. The implementation and database work do not require another
governance decision. Saved Progression Plans remain intentionally deferred by
ADR-0114.

Recommended R9: resolve that governance decision first, then implement only
the approved contracts with focused privacy tests and a controlled preview
fixture plan. Do not add client-only favourites or mutable progression plans as
an interim substitute.

## Repository state

The branch remains clean after the implementation commit and this evidence
closure. No push, merge, tag or promotion was performed.
