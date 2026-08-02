# PLAYER-API-001 — Official Century Games Player Provider

**Status:** Implemented on feature branch; preview runtime configuration and owner acceptance pending  
**Branch:** `feature/official-player-api-captcha`  
**Production:** Unchanged

## Purpose

Replace the unavailable KingShot.net player lookup in player-facing Forge workflows with the public Century Games Kingshot Gift Code Centre player service.

## Source assessment

The supplied `official-kingshot-player-api-captcha-v2.zip` documents the current request shape:

- CAPTCHA challenge from `/api/captcha`;
- player lookup through `/api/player`;
- `fid`, Unix time in seconds, an MD5 request signature and `captcha_code`;
- returned Player ID, nickname, Town Center level, State ID and avatar image.

The ZIP is treated as integration evidence, not proof that Century Games published or endorsed the wrapper itself. The service host is independently constrained to `https://ks-giftcode.centurygame.com`.

## Safety decision

The wrapper's automated Tesseract and Playwright CAPTCHA solvers are explicitly excluded. Forge preserves the provider's human-verification boundary:

1. Forge requests an official verification image.
2. The browser displays it to the user.
3. The user enters the four characters.
4. Forge submits the signed request server-side.
5. Forge validates exact Player ID and State.
6. Forge returns a short-lived signed lookup receipt.
7. Account linking or revalidation accepts only that receipt, never browser-authored player fields.

No CAPTCHA image, answer, provider cookie or raw upstream payload is persisted or logged.

## Implementation

- `server/player-identity/officialKingshotPlayerProvider.ts`
  - fixed official host allowlist;
  - bounded JSON and image handling;
  - request signing;
  - cookie continuity inside a signed, short-lived challenge token;
  - exact Player ID and State validation;
  - safe avatar URL projection;
  - tamper-evident short-lived lookup receipts.
- `api/player/lookup.ts`
  - same-origin POST contract;
  - challenge and completion actions;
  - no-store responses;
  - best-effort server rate limiting;
  - safe error codes without player or CAPTCHA logging.
- Player Lookup and linked-player UI
  - human CAPTCHA entry;
  - official service wording;
  - no OCR or browser automation;
  - receipt-backed linking and revalidation.

## Environment

Required server-only variables:

- `KINGSHOT_PLAYER_API_HOST=https://ks-giftcode.centurygame.com`
- `KINGSHOT_PLAYER_SIGNATURE_SALT`
- `KINGSHOT_PLAYER_PROVIDER_SECRET` — random, at least 32 characters

None of these values belongs in browser variables or source control.

## Remaining gates

- configure the three variables in the protected preview environment;
- complete one owner-approved lookup using a non-sensitive test/farm Player ID;
- verify CAPTCHA image rendering on mobile and desktop;
- verify exact State mismatch and invalid CAPTCHA failures;
- confirm the official provider's acceptable-use and sustained rate posture;
- run the complete repository checks and Vercel preview smoke test;
- do not enable production until those gates pass.

## Acceptance redeploy

An owner-requested preview redeploy was triggered on 2 August 2026 after the preview environment configuration step. This documentation-only commit exists to produce a fresh Git-linked Vercel preview from the exact `feature/official-player-api-captcha` branch. Production remains unchanged.
