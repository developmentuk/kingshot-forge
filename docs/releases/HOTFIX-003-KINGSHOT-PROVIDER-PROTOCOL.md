# HOTFIX-003 — Kingshot Provider and Player Identity Recovery

**Date:** 29 July 2026  
**Status:** implementation candidate; production deployment and controlled validation pending  
**Branch:** `hotfix/kingshot-provider-kid-20260729`

## Incident

The Kingshot gift-code provider protocol changed during the week beginning 20 July 2026. Forge's previous transport first called the provider's player lookup endpoint and then submitted the gift code in the same session. The supplied community bot sources consistently report that the old player lookup route was removed and that current redemption calls submit the linked Player ID (`fid`), State/kingdom ID (`kid`), gift code (`cdk`) and a Unix-seconds timestamp directly to the gift-code endpoint.

Forge production evidence matches the reported change window: the latest successful and already-claimed outcomes were recorded on 20 July 2026, followed by four terminal `invalid_player` outcomes through 25 July 2026. Separately, several users could not complete Player Account linking because the upstream Player Details service returned failures.

## Reviewed evidence

The following supplied projects were reviewed as protocol evidence:

- `kingshot-bot-main.zip`
- `kingshot-auto-redeemer-main.zip`
- `ks-giftcode-main.zip`

The projects corroborate the direct redemption payload, alphabetically sorted signing material, required State/kingdom ID, Unix-seconds timestamp and several current provider result codes. No external source code or embedded credential was copied into Forge. The signing value remains server-only configuration.

## Confirmed provider changes

1. Remove the retired player-lookup request from the Forge redemption transport.
2. Require the authoritative linked `player_accounts.kingdom_id` as part of the server-created provider request.
3. Sign and submit `cdk`, `fid`, `kid` and `time` directly to the configured gift-code endpoint.
4. Use Unix seconds rather than milliseconds.
5. Fail closed before an external request when the linked Governor has no valid State.
6. Distinguish explicit provider throttling from a wrong or missing State:
   - `40019` is recorded as a retryable rate limit;
   - `40020` is recorded as a non-retryable Governor/State mismatch requiring review or relinking.
7. Preserve server-side consent, verified-character eligibility, idempotency, provider health gates, audit records and the environment kill switch.

## Player Identity recovery

Forge now treats Player ID and State as one linking identity:

1. The normal Player Account form requires both values.
2. The `kingshot-player` Edge Function accepts `kingdomId`/`state` and rejects a successful upstream record when its returned State differs from the requested State.
3. Revalidation uses the Player ID and State already stored on the linked account.
4. User Management provides authorised Owners and Administrators with:
   - **Lookup details** — checks Player ID and State without writing;
   - **Apply verified lookup** — repeats the lookup server-side and writes a `verified` account only after a match;
   - **Apply manual link** — records an independently confirmed account as `community_verified` with verification method `forge_admin` when the upstream lookup is unavailable.
5. Every admin write requires a reason, prevents silent replacement unless explicitly confirmed, blocks Player IDs already linked elsewhere, and writes a redacted identity audit event in the same database transaction.
6. Player ID search is supported in User Management without exposing complete IDs in list projections or audit state.

## Player Details boundary

The supplied projects do **not** restore the removed official Player Details lookup. They avoid it by requiring a previously known Player ID and State. Forge's Player Details path remains separate: the `kingshot-player` Supabase Edge Function proxies the Kingshot.net player-information API and validates the returned Player ID, name, State and level before writing a verified player account.

Adding State improves identity matching and supplies the value required by redemption, but it cannot make an unavailable upstream Player Details provider return data. The audited manual admin path is therefore the immediate recovery mechanism for known users. Forge Vision/manual evidence remains the longer-term evidence route until a separately reviewed Player Details provider is established.

## Release-gate separation

Art Studio and Render Engine acceptance are now isolated in `.github/workflows/art-studio-check.yml`. Their known provenance regression remains visible and must be resolved in the Art Studio workstream, but it no longer blocks this urgent Provider and Player Identity release.

The core release workflow continues to require Player Identity, Auto Redeem, Vision, security, lint and production build validation. Art Studio files trigger their own path-scoped workflow.

## Database compatibility

The existing attempt constraint permitted retryable outcomes only when no request was sent. Provider code `40019` is an explicit, non-mutating rejection received after a request was sent. Migration `20260729190000_giftcode_explicit_rate_limit.sql` allows only this narrowly defined `sent + rate_limited` combination and does not relax ambiguity handling for network failures or unknown provider responses.

Migration `20260729193000_admin_player_linking.sql` registers `users.manage_players`, grants it to Owner and Admin, and installs the security-definer `admin_link_player_account` transaction. Browser clients cannot execute the function directly; the Operations API remains the authorisation boundary.

## Validation requirements

Before production enablement:

- `npm run test:auto-redeem`
- `npm run test:player-identity`
- `npm run test:player-state-linking`
- provider unit tests and TypeScript build
- core integration workflow without Art Studio
- migration preflight and application
- preview deployment from the exact branch commit
- User Management smoke test for lookup, State mismatch and manual link
- one owner-approved controlled redemption using a linked Governor whose State is independently confirmed
- verification that the provider receives no player lookup request
- verification that wrong-State and rate-limit fixtures remain non-destructive
- production smoke test followed by provider-health review

## Useful source concepts for future Forge work

The reviewed bots contain several ideas worth adapting natively rather than copying:

1. **Account-level redemption queue:** bounded per-Governor scheduling, explicit cooldowns and resumable retry state for `40019` responses.
2. **Alliance roster redemption operations:** permissioned R4/R5 campaigns, consent per player, progress summaries and exception queues. This belongs in Alliance Operations and must not allow leaders to enrol players without consent.
3. **Provider diagnostics:** grouped wrong-State, invalid-player, exhausted-code and throttled outcomes with review queues rather than destructive deletion.
4. **Player-change monitoring:** reviewable name, State and progression changes with provenance and confidence. This aligns with Player Identity and Forge Vision, but must not silently overwrite verified identity.
5. **Discord notifications:** new-code alerts, redemption summaries and actionable failure notices through a future Forge Discord integration.
6. **Operational calculators:** transfer, event and alliance-management concepts should be assessed against Forge's existing canonical datasets and Operations roadmap before implementation.
7. **Multi-account support:** Forge's Player Domain should eventually support multiple linked Governors with an explicit active character and separate consent/history per character.

## Deferred items

- Automatic retry execution for queued `40019` outcomes. This hotfix records `next_attempt_at`; a durable worker must claim and execute later attempts safely.
- A replacement official Player Details API. None was established by the supplied sources.
- Alliance-wide bulk redemption, Discord commands, dashboards or automatic roster ingestion.
- Any use of source-embedded credentials, browser impersonation, evasion or destructive invalid-player cleanup.
