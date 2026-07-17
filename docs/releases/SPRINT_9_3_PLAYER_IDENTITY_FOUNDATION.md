# Release 0.7.1 — Sprint 9.3 Player Identity Contract & Discovery Foundation

**Status:** Complete locally; ready for architectural review
**Date:** 17 July 2026
**Branch:** `feature/player-planning-foundation`

## Outcome

Sprint 9.3 establishes an additive, framework-independent Player Identity contract boundary. It separates Forge User, Game Character, Character Link and Character Ownership Verification; adds pure Primary, visibility and configurable-limit policies; and provides server-only actor and explicit Active Character resolver factories through injected ports.

The milestone contains no product route, React surface, Supabase adapter, production persistence, migration, provider, Alliance authority or Player Planning workflow.

## Implemented locally

- branded identity, character, link, public-alias, Kingdom, Alliance, verification, event and revision identifiers;
- link lifecycle and provider-neutral verification contracts;
- explicit Primary versus request-bound Active Character semantics;
- deterministic server resolver outcomes and stable domain result codes;
- finite configurable character-limit policy with entitlement/Alliance/subscription inputs and bounded administrative override contract;
- owner-only private, allowlisted public, Gift eligibility, Art attribution and Hero Showcase boundary contracts;
- default-deny visibility evaluation and internal-field rejection;
- capability-neutral repositories, projection ports, actor resolver, audit port and clock;
- immutable event contracts with secret/evidence metadata rejection and positive verification disabled outside clearly marked synthetic tests;
- Unicode-safe display-name, opaque ID, alias, revision, visibility, timestamp and limit validation;
- focused local fixture tests and structural boundary validation.

## Discovery result

Read-only Supabase discovery confirms a legacy one-user/one-player aggregate, whole-row public exposure risks, broad grants, security-definer execution warnings, policy/index diagnostics and live/repository migration drift. The complete evidence summary is in [Player Identity Read-Only Schema Discovery](../reference/player-identity-schema-discovery.md).

## Deferred and blocked

- Every Player ADR remains **Proposed**.
- No provider or proof method is approved; no live character can be called verified.
- Physical data model, compatibility adapter, migration recovery and production persistence require a separate approval.
- Public API/UI release requires alias, visibility, grant/RLS, rate/cache and privacy approval.
- Alliance capability resolution, Gift consent/provider work and Player Planning remain outside this milestone.
- Clark and Aegis review is required before any executable Player workflow proceeds.

## Rollback

The foundation is additive and unused by production paths. Rollback removes the new Player Identity shared/server modules, local scripts and documentation. There is no data rollback because no migration or database write occurred.

## Validation snapshot

- `npm run check`: passed, including NodeNext, existing PM2B/Hero validations, Player Identity structural validation, focused tests, lint, TypeScript and Vite production build.
- Lint: passed with seven pre-existing React hook/Fast Refresh warnings outside the changed Player Identity paths.
- `git diff --check`: passed.
- `npm audit --omit=dev`: zero production dependency vulnerabilities.
- Full `npm audit`: 4 moderate and 6 high development-tooling advisories, centred on direct `@vercel/node` and its transitive graph. The offered remediation is a semver-major downgrade, so no dependency mutation was made in this milestone.

## Licence boundary

The contributed planner remained behavioural reference only. No external source, schema, migration, identifier, API contract, file structure or distinctive implementation structure was copied or adapted.
