# FRKS — SENTRY-OBSERVABILITY-001

## Knowledge record

Kingshot Forge uses Sentry as the selected error-monitoring platform alongside Vercel runtime logs. Sentry is not a replacement for Forge product analytics, audit history or operational source-of-truth data.

## Architectural decision

- Browser and Vercel Function exceptions use the official Sentry React and Node SDKs.
- Browser source maps are uploaded with the Sentry Vite plugin.
- Sentry is active only in Vercel Preview and Production environments.
- Session Replay is not enabled.
- Forge sends no default PII.
- Authenticated user context is restricted to the internal Forge user UUID.
- Canonical Player ID, email, display name, cookies, authorization headers and Supabase tokens are excluded.
- A shared redaction boundary sanitises event request data, contexts, extras and breadcrumbs.
- Expected typed domain errors remain normal application outcomes rather than Sentry defects.
- The Vercel log drain remains complementary to explicit SDK exception capture.

## Release identity

The canonical Sentry release identity is:

```text
kingshot-forge@<VERCEL_GIT_COMMIT_SHA>
```

This matches browser and server events and allows uploaded source maps to resolve against the exact deployed commit.

## Cost posture

- Performance tracing starts at a five-percent sample rate.
- Session Replay remains disabled to avoid unnecessary privacy and usage cost.
- Explicit API instrumentation begins with critical unexpected failures rather than wrapping every route immediately.
- Expansion requires measured operational value and normal Forge review.

## Verification boundary

A successful build and source-map upload prove build integration only. Final acceptance also requires one controlled Preview exception confirmed in the Sentry project with readable original source and no sensitive data.

## Source of truth

Implementation and release evidence live in:

- `src/observability/`
- `server/observability/`
- `shared/observability/`
- `docs/releases/SENTRY-OBSERVABILITY-001.md`
