# ADR-0110: Separate Hero ownership from Showcase presentation

- **Status:** Proposed
- **Date:** 17 July 2026
- **Decision owner:** Hero Personalisation and Player Domains
- **Approval required from:** Clark and Aegis; Security and Privacy review

## Context

Current Showcase state shares Player Hero progression rows, can select an unowned Hero and uses sequential replacement writes that may partially fail or overwrite unrelated progression.

## Decision

Hero Collection owns character-specific Hero ownership and progression referencing canonical Hero keys. Hero Showcase is a separate presentation aggregate containing ordered references to eligible owned Hero records. Showcase membership never proves ownership. Replacement is atomic, revision-controlled and limited by configurable product policy; the current recommendation is six slots, still Proposed.

## Consequences

Showcase updates cannot mutate levels, skills, gear or ownership. Public Showcase projection includes only approved canonical and character presentation fields.

## Benefits

- Protects progression integrity.
- Makes owned-only eligibility enforceable.
- Allows Showcase visibility and ordering to evolve independently.

## Risks

- Existing combined fields require migration and compatibility handling.
- Canonical Hero changes may leave a referenced Showcase entry unavailable.

## Alternatives considered

- Keep Showcase flags on progression rows: rejected due mixed aggregate ownership.
- Copy Hero details into Showcase: rejected as canonical duplication.
- Infer ownership from Showcase: rejected because presentation is not evidence.

## Security impact

The server resolves active character ownership, verifies every referenced Hero record belongs to that character and rejects cross-character or duplicate slots.

## Privacy impact

Hero Collection is private/scoped by default. Showcase can be more broadly visible only through an explicit safe projection and visibility setting.

## Operational impact

Atomic replacement, canonical-key invalidation and repair tooling for orphaned references are required.

## Migration impact

Showcase flags/order are extracted from Player Hero rows after ownership validation. Invalid or unknown references are quarantined rather than silently published.

## Dependencies

[ADR-0103](./ADR-0103-primary-and-active-character-semantics.md), [ADR-0105](./ADR-0105-public-identity-and-visibility.md), accepted canonical-content ADR.

## Validation required

Test owned-only selection, cross-character access, duplicate/order/slot limits, atomic failure, concurrent replacement, canonical retirement and public field allowlists.

## Revisit triggers

Revisit if Showcase supports multiple layouts, team presets or a different approved slot policy.

## Related documents

[Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md), [Canonical Content ADR](./ADR-001-canonical-content.md).

## Sprint 9.3 implementation evidence

The Hero Showcase boundary keeps Player-owned selection/progression claims separate from Hero Domain canonical facts and Editorial recommendations. No Hero data, editorial service or UI was changed; this ADR remains **Proposed**.
