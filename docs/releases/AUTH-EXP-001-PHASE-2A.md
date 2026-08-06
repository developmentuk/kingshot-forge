# AUTH-EXP-001 — Phase 2A Authentication Foundation

Status: implementation candidate for owner review  
Scope: PKCE, callback and redirect-security foundation only  
Production configuration: unchanged

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

## Production sequencing dependency

Production Site URL and redirect allow-list changes are explicitly deferred. Once Preview is accepted:

1. Deploy callback-compatible code to production while retaining any old redirect destinations needed by the current build.
2. Change the Site URL to `https://ksforge.app/` in a controlled owner-authorised operation.
3. Add the exact production `/auth/callback` entry.
4. Verify Google PKCE acceptance and the existing production user/profile/role flow.
5. Remove obsolete and broad wildcard entries only after acceptance.
6. Retain rollback destinations until the rollback window closes.

## Rollback

Rollback is a code deployment to the last accepted build, with the old redirect destinations retained until the rollback window ends. Do not remove callback allow-list entries or change provider settings during an incident without a separately authorised configuration change. If callback exchange fails, the UI returns safely to Forge; it does not retry in a loop or expose callback values.

## Free-plan and operational limitations

Supabase plan limits, provider configuration, redirect allow-list state, email/password policy and owner-authenticated Preview access remain external acceptance dependencies. This implementation does not claim production provider configuration or authenticated Preview acceptance. Email/password and connected-account work remain separate future phases.

## Validation record

The implementation branch must record the exact starting `origin/main` SHA, changed files, focused tests, type-check, lint and build results, Preview deployment and acceptance evidence if a Preview is authorised and created. Merge, production deployment, Supabase dashboard mutation and production configuration changes remain outside Phase 2A authority.
