# Player Identity 0.7.1 integration preparation

**Status:** Local integration branch prepared for Clark and Aegis review. No remote merge, push, deployment, migration or Supabase operation occurred.

## Base and source

- **Target selected:** local `release/0.7.0-player-domain` at `6106346c3309cf3214dc8abe300205977ec15c8a`.
- **Reason:** `docs/AEGIS.md` names this as the active Release 0.7.1 working branch. The local target is nine commits ahead of `origin/release/0.7.0-player-domain`, so it preserves the current Editorial, Verification Centre and Hero Skills release work.
- **Player source reviewed:** `feature/player-planning-foundation` at `3903518a30c92598d42c9baec2d04f8bf654f25f`.
- **Method:** ordered cherry-pick, preserving the eight logical Player commits where practical.

## Commit mapping

| Source | Integrated commit | Subject |
| --- | --- | --- |
| `05347d7` | `c22e1d0` | Player domain architecture |
| `28d330e` | `e5ea810` | Player ADR framework |
| `12b4874` | `037bf94` | Player glossary |
| `d38d53f` | `8ab1cb3` | Player approval/entry gates |
| `0a14d1b` | `84cb134` | Player governance alignment |
| `955c8b1` | `89022c1` | Player Identity discovery foundation |
| `04d8358` | `6463574` | Disabled Player Identity vertical slice |
| `3903518` | `0138f4e` | Migration recovery package |

## Conflicts and resolution

- `package.json` conflicted twice because the target added Editorial, Verification Centre and Hero Skills scripts while Player added validation and tests. Resolution retains every existing script and adds `validate:player-identity` plus the full Player test command; `check` executes all groups.
- `src/App.tsx` conflicted because both lines added routes and CSS imports. Resolution retains Verification Centre routes/styles and adds the disabled Player Identity routes/styles. No route names collide.
- `src/components/AppLayout.tsx` and `docs/product/platform-roadmap.md` merged automatically. Navigation retains Hero and Player entries.
- No Codex A, B or D domain implementation was modified.

## Receipt compatibility

The schema-discovery receipt was authored over LF-normalized bytes. Git checkout conversion to CRLF made the original byte-level validator report a stale receipt despite unchanged content. `scripts/validate-player-identity.mjs` now normalizes CRLF to LF before hashing. This preserves the existing receipt and is the sole integration compatibility adjustment.

## Validation evidence

- `npm run validate:nodenext` — passed.
- `npm run validate:player-identity` — passed after receipt normalization.
- `npm run test:player-identity` — passed.
- Directly affected target checks: Hero Skills structural/governance and Verification Centre structural/tests — passed.
- `npm run lint` — passed with the pre-existing seven warnings in Auth/Role/legacy Player contexts and data hooks.
- `npm run build` — passed.
- `git diff --check` and changed-file credential scan — passed.

## Safety state

All Player Identity feature flags remain default OFF. Persistence, verification and public profiles remain disabled. The replacement schema stays at `docs/reference/player-identity-replacement-schema-proposal.sql`, outside active migrations, and ends in `ROLLBACK`. No Player Planning, verification provider, real-character verification, Supabase write, migration application, grant/RLS change, remote merge, push or deployment is part of this integration branch.

## Remaining review blockers

Clark and Aegis must approve the integration branch, migration baseline recovery and non-production rehearsal before any persistence work. Separate approval remains required for capability grants, public profile enablement, verification policy/provider, support operations and any future Player Planning work.
