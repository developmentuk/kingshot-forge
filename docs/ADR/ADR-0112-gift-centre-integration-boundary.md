# ADR-0112: Keep provider execution inside Gift Centre

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Player/Gift Centre integration boundary
- **Approval required from:** Clark and Aegis; Player, Gift Centre, Security, Privacy and Operations review

## Context

Codex B's current proposed architecture treats a separately supplied official redemption script as the authoritative provider-flow reference while keeping live execution disabled. Gift Centre needs trustworthy character context, but provider credentials, signing, session state and redemption lifecycle do not belong in Player Domain.

## Decision

Player Domain supplies a server-only, revisioned eligibility projection for one exact character: actor-character authorisation, effective verification/ownership state, active-character match, purpose-approved provider Player ID, safe display snapshot and revocation/dispute facts. Gift Centre owns consent wording/version, provider mapping, signing, cookie/session state, request lifecycle, idempotency, retries, results and provider operations.

No provider credential, signing rule, provider cookie or redemption result is stored or implemented in Player Domain.

## Consequences

Gift Centre re-checks the Player projection when a request is accepted and immediately before provider activity. Primary character is convenience only; active character is explicit. Revocation, dispute, unlink or character change blocks new calls.

## Benefits

- Prevents provider implementation from contaminating identity contracts.
- Gives Gift Centre the exact verified subject it requires.
- Preserves independent rollout, kill switch and incident ownership.

## Risks

- Cross-domain contract/version drift can block redemption.
- A stale eligibility snapshot could target the wrong character without revision checks.

## Alternatives considered

- Player Domain executes redemption: rejected as wrong ownership.
- Gift Centre reads Player tables directly: rejected as coupling and privacy risk.
- Client supplies Player ID: rejected because it is tamperable and bypasses active-character confirmation.

## Security impact

The interface is server-only, purpose-scoped and default-deny. Provider secrets and transport never enter React, Player shared contracts, logs or public projections.

## Privacy impact

Provider Player ID is disclosed only for the approved redemption purpose. Character-scoped consent does not transfer to another character.

## Operational impact

Gift Centre owns provider health, ambiguity, circuit breaking and incident response. Player Domain owns identity revocation/dispute notification and current-state resolution.

## Migration impact

No shared table or migration is implied. Any future cross-domain reference must use agreed stable identifiers after schema recovery.

## Dependencies

[ADR-0103](./ADR-0103-primary-and-active-character-semantics.md), [ADR-0104](./ADR-0104-character-verification-model.md), [ADR-0109](./ADR-0109-server-authoritative-player-operations.md).

## Validation required

Contract tests for exact character, wrong owner, primary/active mismatch, unverified, revoked, disputed, former owner, stale revision, consent absence and provider-boundary redaction.

## Revisit triggers

Revisit when Codex B's provider design is accepted, the Player interface lands or the official provider changes identity requirements.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md), Codex B's current proposed Gift Centre architecture (read-only workstream evidence; no repository link until tracked and integrated).
