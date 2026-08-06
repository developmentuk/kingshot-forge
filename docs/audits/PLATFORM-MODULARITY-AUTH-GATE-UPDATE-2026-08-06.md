# Platform Modularity Audit — Authentication Gate Update

**Date:** 6 August 2026  
**Programme:** Forge Modular Platform  
**Original audit:** `docs/audits/PLATFORM-MODULARITY-AUDIT-2026-08-05.md`  
**Canonical repository:** `developmentuk/kingshot-forge`

## Purpose

This update records the closure of the authentication dependency identified by the 5 August 2026 platform modularity audit.

The original audit was correct at its evidence date: production PKCE behaviour, callback ownership and redirect posture had not yet been accepted as the canonical platform contract. That gate is now closed through `AUTH-EXP-001` Phase 2A.

## Released authentication baseline

- canonical `origin/main`: `065b34e6079bed2f40e44105ef7184c13c8067c6`;
- production deployment: `dpl_Ca2dAnBNLsgtQff3d8bGuvyRraLE`;
- production state: READY;
- production Site URL: `https://ksforge.app/`;
- production callback: `https://ksforge.app/auth/callback`;
- rollback baseline: `12b9f14011280c7d54e94962a69520dc3ddd625a`.

The released foundation provides:

- explicit Supabase PKCE configuration;
- callback exchange owned by `/auth/callback`;
- callback URL scrubbing;
- safe success, cancellation and failure states;
- same-origin return-destination validation;
- provider-neutral authentication services;
- production Google OAuth;
- session restoration after redirect and refresh;
- preserved Player Passport and Forge Vision/OCR availability.

The completed OAuth exchange was not instrumented before it occurred. Exact-once live request counting therefore remains an accepted evidence limitation. The route-owned exchange architecture, focused no-double-exchange tests and absence of an observed competing exchange are the accepted evidence and must not be overstated.

## Effect on the modularity decision

The authentication dependency changes from **blocking** to **satisfied with protected boundaries**.

`MOD-FOUND-001` may proceed after owner acceptance of ADR-014 and the modular documentation. It must consume the released Auth facade without modifying or reopening:

- explicit PKCE configuration;
- `/auth/callback` exchange ownership;
- URL scrubbing and redirect validation;
- session restoration behaviour;
- provider-neutral service boundaries;
- Supabase Auth configuration;
- provider settings and secrets;
- identity-linking and duplicate-account recovery behaviour.

Email/password, additional providers, connected-account linking and redirect-list cleanup remain separate future Auth workstreams.

## Updated readiness decision

| Area | Decision | Current reason |
|---|---|---|
| Architecture documentation | GO | Required governance record is present |
| ADR-014 owner acceptance | GO for review | Auth contract is now available |
| `MOD-FOUND-001` read-only collision audit | GO | Begin from latest clean `origin/main` |
| `MOD-FOUND-001` implementation | Separate owner gate | Authorise only after read-only ownership report |
| Auth implementation changes inside modularisation | NO-GO | Released Phase 2A boundary is protected |
| Reference module proof | Later GO gate | Begins only after foundation acceptance |
| Runtime plugins or microfrontends | NO-GO | Original audit judgement unchanged |
| Separate product databases | NO-GO | Original audit judgement unchanged |

## Immediate next action

Review and accept the documentation-only modular architecture PR, then start `MOD-FOUND-001` in read-only mode using the prompt in `docs/plans/MODULAR-PLATFORM-WORKING-PLAN.md`.

The first `MOD-FOUND-001` output must be a collision audit and exact file ownership map. It must stop before implementation and await explicit owner authorisation.
