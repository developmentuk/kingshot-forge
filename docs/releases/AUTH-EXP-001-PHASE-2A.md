# AUTH-EXP-001 — Phase 2A Authentication Foundation

Status: released
Scope: PKCE, callback and redirect-security foundation only  
Production configuration: production Site URL and exact callback enabled; existing redirect entries retained

## Architecture

The browser Supabase client is a singleton configured with `flowType: 'pkce'`, persistent session storage, automatic refresh and an explicit storage fallback for restricted or non-browser contexts. `detectSessionInUrl` is deliberately `false` because callback exchange belongs exclusively to `src/pages/AuthCallbackPage.tsx` through `exchangeCodeForSession(code)`. This prevents Supabase's automatic URL detector and the callback route from exchanging one code twice.

The provider-neutral boundary is `src/services/authService.ts`. It owns session and user reads, auth-state observation, OAuth start, sign-out, safe callback URL construction, destination resolution and code exchange. Existing consumers retain the `AuthContext` contract and `signInWithGoogle` compatibility wrapper. Google remains the only available provider.

`/auth/callback` is outside the normal application layout. It captures callback state, immediately replaces the visible URL with `/auth/callback`, then checks an existing session or performs the one explicit exchange. It never renders or logs codes, tokens, cookies, provider identifiers or raw Supabase errors. Callback analytics is emitted only after the URL is scrubbed and contains bounded, allow-listed properties.

## Redirect contract

`resolveInternalDestination` accepts only a same-application path beginning with one `/`. It preserves safe path, query and fragment data and falls back to `/my-forge` for invalid input. It rejects protocol-relative and absolute URLs, schemes, backslashes, control characters, malformed or repeatedly encoded external destinations, nested external redirect parameters and inputs over 2048 characters. Entry points validate before constructing the callback URL; the callback validates again before navigation.

## Availability and deferred work

The explicit application configuration boundary currently exposes Google only. Email/password, Discord, Facebook, Apple and connected-account linking are unavailable and cannot initiate authentication. This phase does not add registration, password recovery, identity linking, a second identity model, migrations or provider credentials.

## Privacy and logging

Provider access and refresh tokens remain inside the Supabase session boundary. They are not copied to Forge storage, application tables, analytics, logs or API payloads. Callback query data is scrubbed before navigation and callback-specific analytics. Route analytics records pathnames only; it must not be changed to include query strings on the callback route.

## Preview acceptance procedure

After build, type-check, lint and focused tests pass, deploy only the exact isolated commit to a disposable Preview. Use an owner-approved disposable Google session. Verify that Google returns to `/auth/callback` with a code, one exchange establishes one session, the URL is scrubbed, valid destinations are preserved, invalid destinations fall back to `/my-forge`, refresh restores the session, profile/role/capability resolution remains intact, and no callback secret appears in browser storage outside Supabase, logs, analytics or Forge API payloads. Exercise cancellation, missing code, expired/reused code, missing verifier and exchange/network failure states with accessible recovery controls.

No production session should be signed out or mutated during this work.

## Production rollout record

Phase 2A production rollout completed after Preview acceptance and a read-only configuration preflight:

1. PR #44 merged with a guarded merge commit on 2026-08-06.
2. Resulting main commit: `db9fcdf9060db7ee57c60640732e06e7a513f283`.
3. Production deployment: `dpl_Emre7Mme31yZWUkCLnCRZW4tpp2V`, READY, sourced from that main commit.
4. Supabase Auth URL configuration changed only in `site_url` and `uri_allow_list`: the Site URL changed to `https://ksforge.app/` and one exact `https://ksforge.app/auth/callback` entry was appended. Fourteen prior redirects were preserved; no redirect was removed.
5. Google remained enabled. Email/password, other providers, identity linking and unrelated Auth settings were not changed.
6. Production callback, cancellation, malformed-input, redirect-security, session-restoration, responsive and accessibility acceptance passed.
7. The exact completed exchange was not live-instrumented before the exchange; source architecture and focused no-double-exchange tests remain the exact-once evidence, and no competing exchange was observed during post-auth navigation.
8. Obsolete and broad wildcard entries remain intentionally. Cleanup is deferred to a separately authorised hardening phase.

## Rollback

Rollback is a code deployment to the last accepted build, with the old redirect destinations retained until the rollback window ends. Do not remove callback allow-list entries or change provider settings during an incident without a separately authorised configuration change. If callback exchange fails, the UI returns safely to Forge; it does not retry in a loop or expose callback values.

## Free-plan and operational limitations

Supabase plan limits, provider configuration, redirect allow-list state and email/password policy remain external operational dependencies. The production configuration and approved secondary OAuth acceptance are recorded above. Email/password and connected-account work remain separate future phases.

## Validation record

The accepted AUTH head was `f18dd3cccd28a4c13bd6673161ca26a60893a869`, based on `12b9f14011280c7d54e94962a69520dc3ddd625a`. Focused AUTH, Player Identity, Player Identity resilience, player-state-linking, Forge Vision/OCR, TypeScript, lint, build and full `npm run check` gates passed. The accepted Preview was `dpl_HKDGvma4Eo5BmnqHC4MqaErr3jYj`; the production deployment is recorded above. No callback secret, provider identifier, credential, token or user information is recorded here.
