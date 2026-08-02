# PLAYER-IDENTITY-002 — Indexed Player Claims and Hybrid Verification

**Status:** Implementation candidate; protected-preview acceptance pending  
**Branch:** `feature/player-identity-002-hybrid-claims`  
**Production:** Unchanged  
**Supabase schema:** Unchanged

## Outcome

Players can connect a Kingshot Player ID and State to their authenticated Forge account without depending on a live third-party player API.

The claim is usable immediately for Player Passport workflows, but Forge does not describe self-reported values as verified. Verification remains a separate evidence and review decision.

## Why this replaces PLAYER-API-001

The supplied CAPTCHA/player wrapper targeted Century Games routes that were removed on 21 July 2026. Live acceptance testing returned an Amazon S3 `403` response instead of CAPTCHA JSON. The blocked investigation remains in PR #30 and must not be merged.

Forge will not use gift-code redemption as a read-only player probe and will not automate or bypass CAPTCHA controls.

## Trust model

`player_accounts` remains the unique claim registry. No second ownership store is introduced.

Claim and verification are separate:

- `linked` + `none` — self-reported Player ID and State;
- `pending` + `none` — Forge Vision evidence submitted for review;
- `community_verified` — an authorised Forge or community reviewer approved evidence;
- `verified` — legacy player-service verification retained for existing accounts;
- `officially_verified` — reserved for a future independently reviewed official route;
- `rejected` or `revoked` — review outcome or removed assurance.

A verification failure never means that the Player ID is invalid. It means only that the submitted evidence or provider route did not establish the required assurance.

## Indexed search

Forge searches existing `player_accounts` records by exact Player ID and State.

Authenticated claim search can return:

- `not_found` — no indexed record; self-reporting or screenshot submission is allowed;
- `owned` — the Player ID is already linked to the signed-in user;
- `claimed_elsewhere` — the unique Player ID belongs to another Forge account;
- `state_mismatch` — the entered State conflicts with the indexed record.

Public Player Lookup returns only records whose owner enabled `is_public`. It does not call KingShot.net or Century Games and never implies live freshness.

## Self-reported claim

A new claim requires:

- authenticated Forge user;
- numeric Player ID;
- State from 1 to 9999;
- player name from the in-game profile;
- optional Town Centre level from 1 to 30.

New claims are private by default and are inserted as `linked` / `none`. A `player_verification_events` row records the claim boundary. Player ID and Forge user uniqueness continue to prevent silent duplicate ownership claims.

## Forge Vision verification request

The existing private evidence upload and server-side OCR path is retained.

Before submission:

1. the user reviews every extracted field;
2. Town Centre level requires explicit manual confirmation;
3. the server rereads the governed evidence bytes;
4. OCR is recomputed server-side;
5. Player ID and State are compared with the submitted values and any existing claim.

A successful submission changes the claim to `pending`, writes a verification-history event and a Vision audit event, and keeps the governed evidence available for authorised review under its retention policy.

Account, verification-history and audit writes use compensating rollback if a later mandatory write fails.

## Privacy and safety

- Self-reported claims are private by default.
- Public lookup reads public records only.
- Private claimed records do not expose names or profile details to another claimant.
- No external provider cookie, CAPTCHA value or raw third-party payload is stored.
- No browser automation is used.
- No Century Games or KingShot.net request occurs in the claim path.
- Verified claims cannot be deleted directly by the player; they require review.

## Reused platform capabilities

- `player_accounts` — unique claim and current assurance state;
- `player_verification_events` — append-only verification history;
- Forge Vision evidence storage — governed screenshot bytes and retention;
- `vision_audit_events` — evidence workflow audit;
- existing admin/manual player management — community verification upgrade path;
- Player Identity context — browser source of truth for the primary claim.

## Validation

Dedicated workflow: `.github/workflows/player-identity-002-check.yml`

Required checks:

- hybrid claim validation;
- existing Player Identity regression suite;
- State-aware linking contracts;
- NodeNext import validation;
- full TypeScript/Vite build;
- protected Vercel preview;
- signed-in self-report smoke test;
- duplicate Player ID rejection;
- wrong-State indexed result;
- screenshot evidence submission to `pending`;
- desktop and mobile review;
- confirmation that production and Supabase schema remain unchanged.

## Deferred

- moderator Verification Centre UI specifically for player evidence;
- account-recovery/dispute workflow for a Player ID claimed elsewhere;
- ingestion of independently licensed player observations into a separate evidence pipeline;
- optional avatar enrichment after a stable, independently verified CDN contract is established;
- future official API verification, only after a read-only contract is proven current.
