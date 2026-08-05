# SENTRY-OBSERVABILITY-001 — Protected Error Monitoring Foundation

## Status

Implementation candidate on `feature/sentry-observability-001`.

This release record does not claim production acceptance. Merge, production promotion and final Sentry event confirmation remain separate gates.

## Objective

Connect the existing Vercel Marketplace Sentry installation to Kingshot Forge without exposing secrets, duplicating analytics, recording unnecessary personal data or changing canonical application behaviour.

## Delivered scope

### Browser monitoring

- Sentry initialises before the React root is mounted.
- A root React error boundary records unhandled render failures and presents an accessible recovery state.
- Browser tracing is enabled at a bounded five-percent sample rate in Preview and Production only.
- Session Replay is disabled.
- Local development does not send events.
- Only the authenticated Forge user UUID is attached to Sentry; email, display name, Player ID and Supabase metadata are excluded.

### Server monitoring

- A shared server-side Sentry adapter records unexpected Vercel Function exceptions.
- The Player Account API is the first explicitly instrumented critical route.
- Expected authentication and typed Player Identity failures retain their existing responses and are not reported as application defects.
- Request bodies, credentials and Player values are not added to the server event context.

### Privacy and redaction

- `sendDefaultPii` is disabled in browser and server SDKs.
- Authorization, cookies, passwords, tokens, API keys, service-role values, sessions and credential-shaped fields are redacted.
- Sensitive query-string and fragment values are filtered.
- User context is reduced to the internal Forge UUID.
- No Sentry secret is exposed through the Vite browser environment.

### Releases and source maps

- Browser and server events use `kingshot-forge@<VERCEL_GIT_COMMIT_SHA>` as the release identifier.
- Deployment environment and commit SHA are attached consistently.
- Hidden browser source maps are produced only when the complete Sentry build configuration is available.
- Source maps are uploaded by the Sentry Vite plugin and deleted from `dist` after upload.
- `SENTRY_AUTH_TOKEN`, organisation and project values remain build-time/server-only variables.
- Only `SENTRY_DSN` is deliberately embedded into the browser bundle.

## Environment contract

The Vercel integration supplies these variables:

- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_PUBLIC_KEY`
- `SENTRY_VERCEL_LOG_DRAIN_URL`
- `SENTRY_OTLP_TRACES_URL`

Forge code reads only the variables required by its SDK and source-map path. Values must never be committed or copied into documentation.

## Validation

Required before merge:

```bash
npm run test:observability
npm run validate:nodenext
npm run lint
npm run build
```

The exact final commit must also:

1. Produce a READY Vercel Preview deployment.
2. Show a successful Sentry source-map upload in the build log without exposing credentials.
3. Load the public application and representative API routes without a regression.
4. Send one controlled Preview-only browser test exception.
5. Confirm that the issue resolves to readable TypeScript/React source and is labelled `preview` with the exact release SHA.
6. Confirm the event contains no email, Player ID, authorization header, cookie or Supabase token.

The controlled exception is verification evidence only and must not be left as a public test button or permanent failure route.

## Alert posture

Initial alerts should cover new unhandled Production errors, material regression spikes and repeated unexpected server exceptions. Expected 4xx domain outcomes and governed upstream 502/503/504 availability states should not generate defect alerts unless Forge itself mishandles them.

## Exclusions

- Session Replay.
- User email, name, Player ID or profile metadata capture.
- Broad instrumentation of every API route in one change.
- New database tables, migrations or Supabase writes.
- Changes to Vercel Firewall, authentication, roles or permissions.
- Automatic production deployment or merge.

## Rollback

Revert the Sentry integration commit and redeploy the previous accepted `main` commit. The Vercel Marketplace integration and environment variables may remain installed while the SDK is disabled; without browser/server initialisation, Forge will not send SDK events.
