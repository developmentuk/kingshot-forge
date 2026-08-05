# FRKS — AUTH-EXP-001 Phase 2A

## Decision

Forge uses explicit PKCE with callback exchange owned by `/auth/callback`. The browser client disables automatic URL detection so one authorization code has one owner and one exchange attempt.

## Rationale

The current product is a Vite React SPA with an existing shared Supabase client and no dedicated callback route. A provider-neutral service keeps provider availability, destination validation and error handling out of feature components while preserving the existing `AuthContext` consumer contract. A dedicated route makes URL scrubbing, accessible failure states and retry behaviour testable without coupling OAuth to the initiating page.

## Boundaries

This decision does not activate email/password, additional providers, manual linking, production redirect configuration, Site URL changes, migrations or production deployment. Player Account linkage remains a separate domain relationship and is not an authentication identity model.
