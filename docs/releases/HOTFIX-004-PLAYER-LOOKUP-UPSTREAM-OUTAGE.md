# HOTFIX-004 — Player Lookup Upstream Outage Handling

**Date:** 29 July 2026  
**Status:** implementation candidate; Edge Function version 8 active; application release pending  
**Branch:** `hotfix/player-lookup-upstream-error-20260729`

## Incident

Player Account refreshes and lookups reached the Forge `kingshot-player` Edge Function successfully, but the external KingShot.net `/api/player-info` service returned HTTP 400 with the message `Unknown player info error.` for known Player IDs. Forge previously forwarded that ambiguous upstream text to users, making a provider outage look like invalid player data.

## Resolution

1. Distinguish an explicit `PLAYER_NOT_FOUND` response from unknown upstream failures.
2. Return HTTP 503 and `PLAYER_LOOKUP_UPSTREAM_UNAVAILABLE` when the upstream returns an ambiguous error.
3. State clearly that no Player Account details were changed.
4. Preserve 404, 409, 429 and 503 statuses through the server-side Player Identity service.
5. Keep Player ID and State validation unchanged.
6. Keep existing verified Player Account data unchanged when refresh fails.

## Production evidence

The live Edge Function logs showed repeated HTTP 400 responses for known Player IDs with valid State values. The requests completed in roughly 0.5–0.7 seconds, confirming that Forge reached the Edge Function and the Edge Function reached its upstream; this was not a browser, CORS or authentication failure inside Forge.

## Gift-code protocol boundary

This incident affects Player Details lookup, not Forge's gift-code redemption transport. Current Kingshot-specific source evidence continues to show direct `/api/gift_code` submissions using Player ID, State, gift code and a signed Unix-seconds timestamp. CAPTCHA-based flows found in Whiteout Survival projects must not be assumed to apply to Kingshot without Kingshot-specific production evidence.

Forge must not automate CAPTCHA solving or disguise requests to defeat provider anti-bot controls. If Century Games requires an interactive challenge for Kingshot redemption, Auto Redeem must remain paused until an authorised, terms-compliant integration is available.
