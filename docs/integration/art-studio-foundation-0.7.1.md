# Art Studio foundation 0.7.1 integration

**Status:** Local integration branch prepared for Clark and Aegis review. No
remote merge, push, deployment, migration application or Supabase operation
occurred.

## Base, source and scope

- **Starting source:** `feature/art-studio-community` at
  `cc9946ca999767138eeb9ec15b26c5ab91e9c091`.
- **Initial worktree state:** not clean because an uncommitted later Art Studio
  vertical slice was present. It was preserved outside this integration as
  `stash@{0}` with message
  `excluded Sprint 9.3 vertical slice before foundation integration`.
- **Verified target:** `origin/integration/gift-foundation-0.7.1` at
  `7b30a7c6ac830bbe9fd22148b4616b70f917dbc7` after fetching remote refs.
- **Local branch:** `integration/art-studio-foundation-0.7.1`.
- **Method:** ordered cherry-pick of the four completed foundation commits,
  followed by the narrowly scoped Player attribution compatibility adapter.

## Commit mapping

| Source | Integrated | Subject |
| --- | --- | --- |
| `2980d5b` | `0362cc2` | `docs(art-studio): audit community artwork workflows` |
| `7afb6be` | `a250abd` | `feat(art-studio): add community security foundation` |
| `7c92533` | `baeeb8f` | `test(art-studio): validate community foundation` |
| `cc9946c` | `2f403c0` | `docs(art-studio): record community foundation` |

The later uncommitted Sprint 9.3 vertical slice was deliberately excluded. No
later product-development commit was integrated.

## Conflicts and manual integration changes

- `package.json` was the only cherry-pick conflict. The additive resolution
  retains all target Hero Skills, Verification Centre, Editorial and Player
  Identity commands, adds the focused Art Studio commands, and keeps all groups
  in the aggregate `check` command.
- `scripts/validate-art-studio-foundation.mjs` now normalizes CRLF to LF before
  multiline SQL checks. This is checkout compatibility only; the proposed SQL
  is unchanged.
- `server/art-studio/playerAttributionAdapter.ts` is Art Studio-owned and
  accepts only Player Identity's gated `PublicPlayerProjection` reader. Its
  output is limited to public alias, creator label, avatar URL, kingdom label
  and alliance label. Art Studio owns its formatting and reason codes.
- `scripts/test-art-studio-player-attribution.mjs` verifies default-disabled
  behavior, public-profile and alias-only formatting, unavailable behavior and
  exclusion of internal IDs, provider identifiers, verification evidence,
  support/dispute data, hidden aliases and visibility metadata.
- No Player Identity, Gift Centre, Hero Skills, Editorial or Verification
  Centre domain logic was changed.

## Feature and migration assessment

- The foundation adds no runtime UI, submission, like, report, moderation,
  persistence or publication composition. Those Art Studio capabilities remain
  unreachable.
- The attribution adapter defaults disabled and does not call Player Identity
  while disabled. Player Identity's Art integration also remains exact-value
  gated and default OFF.
- No public route was added or enabled. The pre-existing static Art Studio route
  is unchanged; the community gallery and publishing projection are inactive.
- The proposed migration
  `20260717130232_art_studio_community_foundation.sql` was preserved unchanged
  and was not applied. Its timestamp is unique and orders before the existing
  `20260717130617` Hero Skills governance and `20260717133243` Gift workflow
  migrations; no ordering collision was found.
- No production RLS, grant or capability changed because no migration or remote
  persistence operation ran.

## Validation

- `npm run validate:nodenext` — passed.
- `npm run validate:art-studio` — passed after line-ending compatibility fix.
- `npm run test:art-studio` — passed, including attribution boundary coverage.
- `npm run test:player-identity` — both focused and vertical-slice suites passed.
- `npx tsc -p tsconfig.server.json --noEmit` — passed.
- `npm run lint` — passed with the seven pre-existing React/data-hook warnings.
- `npm run build` — passed.
- `git diff --check` — passed.
- Credential scan — passed; no credential material found.
- Runtime external-transport scan — passed; no transport implementation exists.
  The only URL in focused tests is the non-routable `example.invalid` fixture.

## Remaining blockers

Clark and Aegis must review the local integration branch. Separate explicit
approval remains required before applying the migration, enabling persistence,
granting production capabilities, activating the community gallery, publishing
artwork or enabling moderation. The excluded vertical-slice stash is not part
of this review and must not be applied to this branch.
