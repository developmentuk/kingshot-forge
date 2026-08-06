# FRKS — AUTH-EXP-001 Phase 2A

## Decision

Forge uses explicit PKCE with callback exchange owned by `/auth/callback`. The browser client disables automatic URL detection so one authorization code has one owner and one exchange attempt.

## Rationale

The current product is a Vite React SPA with an existing shared Supabase client and no dedicated callback route. A provider-neutral service keeps provider availability, destination validation and error handling out of feature components while preserving the existing `AuthContext` consumer contract. A dedicated route makes URL scrubbing, accessible failure states and retry behaviour testable without coupling OAuth to the initiating page.

## Production outcome

The Phase 2A foundation was merged after the production Auth URL configuration was prepared. The production Site URL is `https://ksforge.app/`, and the exact callback `https://ksforge.app/auth/callback` is permitted. Existing legacy, Preview and rollback redirect entries were retained; redirect cleanup is deferred.

Production deployment `dpl_Emre7Mme31yZWUkCLnCRZW4tpp2V` was READY from main commit `db9fcdf9060db7ee57c60640732e06e7a513f283`. Production acceptance covered callback failure states, URL scrubbing, same-origin redirect fallback, session restoration, Player Passport availability, responsive containment, accessibility and public route smoke.

The completed OAuth exchange was not live-instrumented before it occurred, so exact-once live request counting remains an evidence limitation. The route-owned exchange architecture and focused no-double-exchange tests passed, and no competing exchange was observed during subsequent authenticated navigation.

## Boundaries

This decision does not activate email/password, additional providers, manual linking, migrations or unrelated database work. Player Account linkage remains a separate domain relationship and is not an authentication identity model. Redirect-list cleanup and AUTH Phase 2B remain separate authorised workstreams.
