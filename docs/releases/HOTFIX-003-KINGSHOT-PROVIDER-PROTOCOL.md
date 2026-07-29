# HOTFIX-003 — Kingshot Provider Protocol Recovery

**Date:** 29 July 2026  
**Status:** implementation candidate; production deployment and controlled validation pending  
**Branch:** `hotfix/kingshot-provider-kid-20260729`

## Incident

The Kingshot gift-code provider protocol changed during the week beginning 20 July 2026. Forge's previous transport first called the provider's player lookup endpoint and then submitted the gift code in the same session. The supplied community bot sources consistently report that the old player lookup route was removed and that current redemption calls submit the linked Player ID (`fid`), kingdom ID (`kid`), gift code (`cdk`) and a Unix-seconds timestamp directly to the gift-code endpoint.

Forge production evidence matches the reported change window: the latest successful and already-claimed outcomes were recorded on 20 July 2026, followed by four terminal `invalid_player` outcomes through 25 July 2026.

## Reviewed evidence

The following supplied projects were reviewed as protocol evidence:

- `kingshot-bot-main.zip`
- `kingshot-auto-redeemer-main.zip`
- `ks-giftcode-main.zip`

The projects corroborate the direct redemption payload, alphabetically sorted signing material, required kingdom ID, Unix-seconds timestamp and several current provider result codes. No external source code or embedded credential was copied into Forge. The signing value remains server-only configuration.

## Confirmed implementation changes

1. Remove the retired player-lookup request from the Forge redemption transport.
2. Require the authoritative linked `player_accounts.kingdom_id` as part of the server-created provider request.
3. Sign and submit `cdk`, `fid`, `kid` and `time` directly to the configured gift-code endpoint.
4. Use Unix seconds rather than milliseconds.
5. Fail closed before an external request when the linked Governor has no valid kingdom.
6. Distinguish explicit provider throttling from a wrong or missing kingdom:
   - `40019` is recorded as a retryable rate limit;
   - `40020` is recorded as a non-retryable Governor/kingdom mismatch requiring review or relinking.
7. Preserve server-side consent, verified-character eligibility, idempotency, provider health gates, audit records and the environment kill switch.

## Player Details boundary

The supplied projects do **not** restore the removed official player-details lookup. They avoid it by requiring a previously known Player ID and kingdom ID. Forge's Player Details path remains separate: the `kingshot-player` Supabase Edge Function currently proxies the Kingshot.net player-information API and validates the returned Player ID, name, kingdom and level before writing a verified player account.

No speculative replacement or unverified player record is introduced by this hotfix. If the Kingshot.net lookup is also unavailable, Forge must use its existing Forge Vision/manual evidence workflow or adopt a separately reviewed provider with explicit provenance, authentication, rate limits and terms.

## Database compatibility

The existing attempt constraint permitted retryable outcomes only when no request was sent. Provider code `40019` is an explicit, non-mutating rejection received after a request was sent. Migration `20260729190000_giftcode_explicit_rate_limit.sql` allows only this narrowly defined `sent + rate_limited` combination and does not relax ambiguity handling for network failures or unknown provider responses.

## Validation requirements

Before production enablement:

- `npm run test:auto-redeem`
- provider unit tests and TypeScript build
- full `npm run check`
- migration preflight and application
- preview deployment from the exact branch commit
- one owner-approved controlled redemption using a linked Governor whose kingdom is independently confirmed
- verification that the provider receives no player lookup request
- verification that wrong-kingdom and rate-limit fixtures remain non-destructive
- production smoke test followed by provider-health review

## Useful source concepts for future Forge work

The reviewed bots contain several ideas worth adapting natively rather than copying:

1. **Account-level redemption queue:** bounded per-Governor scheduling, explicit cooldowns and resumable retry state for `40019` responses.
2. **Alliance roster redemption operations:** permissioned R4/R5 campaigns, consent per player, progress summaries and exception queues. This belongs in Alliance Operations and must not allow leaders to enrol players without consent.
3. **Provider diagnostics:** grouped wrong-kingdom, invalid-player, exhausted-code and throttled outcomes with review queues rather than destructive deletion.
4. **Player-change monitoring:** reviewable name, kingdom and progression changes with provenance and confidence. This aligns with Player Identity and Forge Vision, but must not silently overwrite verified identity.
5. **Discord notifications:** new-code alerts, redemption summaries and actionable failure notices through a future Forge Discord integration.
6. **Operational calculators:** transfer, event and alliance-management concepts should be assessed against Forge's existing canonical datasets and Operations roadmap before implementation.
7. **Multi-account support:** Forge's Player Domain should eventually support multiple linked Governors with an explicit active character and separate consent/history per character.

## Deferred items

- Automatic retry execution for queued `40019` outcomes. This hotfix records `next_attempt_at`; a durable worker must claim and execute later attempts safely.
- A replacement official Player Details API. None was established by the supplied sources.
- Alliance-wide bulk redemption, Discord commands, dashboards or automatic roster ingestion.
- Any use of source-embedded credentials, browser impersonation, evasion or destructive invalid-player cleanup.
