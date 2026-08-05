# FRKS — PLAYER-IDENTITY-003 resilience distinction

The Player Passport must distinguish three operational states rather than
using one error string for all outcomes:

1. A canonical `player_accounts` query failure is a blocking load error.
2. A successful query with no primary Player Account is an empty-account
   state and makes linking controls available.
3. A linked account whose external refresh fails retains cached details and
   receives a non-blocking refresh warning and retry action.

The automatic refresh sequence loads the canonical account first. It never
probes the external player provider for an account that does not exist. The
`NO_LINKED_PLAYER` API result is a successful no-op. Existing manual claim,
Forge Vision OCR review and evidence-retention contracts remain unchanged.
