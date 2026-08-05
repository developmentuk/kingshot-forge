# PLAYER-IDENTITY-003 — Empty Account and Refresh Resilience

## Scope

This correction preserves the existing Player Passport, manual claim and
Forge Vision screenshot-linking workflows. It changes only the distinction
between canonical account loading, an empty account and an external refresh
warning.

## State contract

- **Canonical account loading failure:** blocking and announced as an alert;
  Forge cannot safely determine whether a Player Account exists.
- **Empty account:** successful canonical `player_accounts` query with no
  primary row. This is a no-op state, does not trigger external revalidation,
  and exposes Player ID, State, claim and screenshot-linking controls.
- **Provider refresh warning:** a linked account remains visible with cached
  data and a non-blocking status warning plus retry control.
- **No account to revalidate:** the API returns the typed `NO_LINKED_PLAYER`
  no-op outcome and does not become a generic refresh error.

OCR remains review-only evidence. It does not verify ownership, create a
verified claim or change Player Account trust boundaries.
