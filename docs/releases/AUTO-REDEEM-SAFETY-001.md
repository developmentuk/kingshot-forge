# AUTO-REDEEM-SAFETY-001 — Auto Redeem Safety Phase 1

Status: containment implemented for owner review; Auto Redeem remains disabled.

## Purpose

Phase 1 closes unsafe activation paths in the 0.7.5 Auto Redeem foundation. It
does not recover the changed provider protocol, create a production queue,
activate Auto Redeem or make a production-readiness claim.

## Containment controls

- Provider execution requires all four canonical server-only gates:
  `GIFTCODE_REDEMPTION_ENABLED`, `GIFTCODE_OFFICIAL_PROVIDER_ENABLED`,
  `GIFTCODE_PROVIDER_ENVIRONMENT_APPROVED` and
  `GIFTCODE_QUEUE_PROCESSING_ENABLED`.
- Every example gate defaults to `false`. The obsolete
  `KINGSHOT_REDEMPTION_ENABLED` flag is not an activation boundary.
- Database provider configuration must be enabled, the circuit must be closed
  and production provider health must be `healthy`. These conditions are
  reasserted immediately before run creation and before each provider call.
- Administrative enablement fails closed until all four environment gates pass.
- The provider reads transport configuration only; it owns no separate enabled
  flag. Provider composition uses the same injected environment for gates and
  transport configuration.

## Ownership, consent and account safety

Consent policy `giftcode-redemption-v2` replaces v1. Existing v1 consent is
preserved as historical evidence but does not qualify as current consent and is
not revoked by a v2 withdrawal. New consent records evidence version
`auto-redeem-safety-001`.

Only a Governor with `verification_status=officially_verified` may consent or
redeem. A public Kingshot Player ID lookup confirms existence only; public
lookup and community verification do not prove account ownership.

Redemption starts only when the player explicitly selects **Redeem available
codes**. The `auto-run` API action and login/session-restoration request have
been removed. All authenticated Gift Centre actions require an active Forge
account; restricted, suspended and deactivated accounts receive HTTP 403.

## Activation status and remaining NO-GO blockers

Auto Redeem remains disabled. Activation is blocked until all of the following
are completed and owner-approved:

1. Recover and validate the official provider protocol changed on 21 July 2026.
2. Replace synchronous in-request processing with a genuine asynchronous queue
   and independently operated worker.
3. Complete production audit-event coverage for consent, activation, runs,
   attempts, failures and administrative state changes.
4. Add stronger end-to-end provider integration tests beyond fixtures and
   source-contract checks.
5. Complete controlled deployment and authenticated acceptance only after the
   owner separately authorises activation work.

## Explicit non-actions

This containment release does not change Vercel environment variables, mutate
Supabase schema or data, revoke historical consent manually, close the provider
circuit, contact the live redemption provider, deploy, merge or tag a release.
