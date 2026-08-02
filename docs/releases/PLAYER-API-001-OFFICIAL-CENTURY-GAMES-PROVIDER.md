# PLAYER-API-001 — Century Games Player Provider Investigation

**Status:** BLOCKED — supplied API contract is no longer live  
**Branch:** `feature/official-player-api-captcha`  
**Production:** Unchanged

## Purpose

Investigate whether the Century Games Kingshot Gift Code Centre could replace the unavailable KingShot.net player lookup for Forge player-facing workflows.

## Supplied package

The supplied `official-kingshot-player-api-captcha-v2.zip` describes this legacy flow:

- `GET /api/captcha`;
- `POST /api/player`;
- Player ID, timestamp, MD5 signature and CAPTCHA code;
- returned nickname, Town Centre level, State ID and avatar.

The package is not an official Century Games SDK. It is a third-party wrapper around endpoints that were formerly exposed by the gift-code service.

## Forge prototype

A protected preview prototype was built with:

- human CAPTCHA entry only;
- no Tesseract, Playwright or automated CAPTCHA solving;
- strict host allowlisting;
- bounded upstream payloads and timeouts;
- AES-256-GCM sealed challenge and receipt tokens;
- exact Player ID and State validation;
- receipt-only account linking and revalidation;
- no raw CAPTCHA, provider cookie or player payload persistence.

The prototype passed local, build and integration checks. Those checks proved the Forge implementation boundary, not the continuing availability of the external endpoints.

## Live acceptance result — 2 August 2026

The configured Vercel preview was tested with an owner-supplied farm/test account.

Observed result:

- `GET https://ks-giftcode.centurygame.com/api/captcha` returned HTTP `403`;
- response content type was `application/xml`;
- response server was `AmazonS3`;
- no CAPTCHA JSON was returned;
- changing browser-compatible request headers did not alter the result.

Independent current API-surface evidence records that Century Games removed both backend routes on 21 July 2026:

- `/captcha` removed at 10:59 UTC;
- `/player` removed at 11:00 UTC.

The old route names remain present in the public frontend bundle, which explains why older wrappers still appear plausible despite the backend routes no longer existing.

## Replacement endpoint assessment

The remaining signed `/gift_code` endpoint is a redemption operation. It requires gift-code and kingdom data and can create redemption side effects. It is not a safe read-only replacement for player profile lookup and does not provide the verified nickname, avatar and Town Centre contract required by Forge.

Forge will not use gift-code redemption as an account-probing mechanism.

## Decision

- Do not merge or promote this prototype.
- Do not continue asking owners to test the retired CAPTCHA/player flow.
- Preserve the implementation and evidence on the feature branch for research and possible future revival.
- Resume only when a current, read-only Century Games player-detail contract is independently verified.
- Continue Forge Vision screenshot verification and other non-retired identity methods separately.

## Safety state

- Production unchanged.
- Supabase unchanged.
- No migrations.
- No production environment promotion.
- No automated CAPTCHA bypass.
- No secret material committed.
