# Kingshot Forge Player Domain Approval Matrix

**Status:** Proposed governance
**Owner:** Player Domain architecture
**Version:** 1.0
**Date:** 17 July 2026
**Last reviewed:** 17 July 2026

## Approval roles

This matrix applies the roles already established by Forge governance:

- **Clark — Product Owner:** product direction, public experience, account limits, visibility, Alliance behaviour and support experience.
- **Aegis — engineering partner/Technical Lead:** architecture, domain boundaries, server authority, migration strategy, shared-service integration and implementation sequencing.
- **Security review:** proof/provider security, evidence handling, support intervention, authentication/authorisation and public exposure.
- **Privacy review:** identifiers, visibility, consent, retention, contact details, deletion and export.
- **Operations review:** provider/service operation, incident handling, support procedures, audit access, escalation and rollback readiness.
- **Database review:** schema baseline, constraints, RLS, grants, migration sequencing, recovery and rollback.

Security, Privacy, Operations and Database are functional review roles. This document does not invent named individuals for them. A named reviewer is recorded only after Forge governance assigns one.

## Matrix legend

- **A — Approve:** explicit approval is required for the decision to be Accepted.
- **R — Required review:** evidence and a recorded review outcome are required; the role may impose blocking conditions within its remit.
- **C — Consult:** input is required but separate approval is not inherently required unless the review finds a remit-specific blocker.
- **— — Not normally required:** re-evaluate if scope changes.

## Decision approval matrix

| Decision | Clark | Aegis | Security | Privacy | Operations | Database |
| --- | --- | --- | --- | --- | --- | --- |
| [PD-001 Verification provider](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-001--character-verification-provider) | A | A | A | A | R | C |
| [PD-002 Proof method](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-002--ownership-proof-method) | A | A | A | A | R | C |
| [PD-003 Verification expiry](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-003--verification-expiry) | A | A | A | A | A | C |
| [PD-004 Linked-character policy limit](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-004--linked-character-policy-limit) | A | A | R | C | R | — |
| [PD-005 Primary-character behaviour](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-005--primary-character-behaviour) | A | A | C | C | — | C |
| [PD-006 Active-character behaviour](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-006--active-character-behaviour) | A | A | A | C | R | — |
| [PD-007 Visibility scopes](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-007--visibility-scopes) | A | A | A | A | C | C |
| [PD-008 Public Character Alias](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-008--public-character-alias-behaviour) | A | A | A | A | R | C |
| [PD-009 Player ID exposure](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-009--external-player-id-exposure) | A | A | A | A | C | — |
| [PD-010 Alliance rank/capability](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-010--alliance-rank-and-capability-policy) | A | A | A | C | A | C |
| [PD-011 Alliance delegation](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-011--alliance-delegation-limits) | A | A | A | C | A | C |
| [PD-012 Read-only schema discovery](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-012--read-only-live-schema-discovery) | A | A | A | A | R | A |
| [PD-013 Migration baseline](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-013--migration-baseline-recovery) | A | A | A | C | A | A |
| [PD-014 Transfer contact retention](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-014--transfer-contact-retention) | A | A | A | A | A | C |
| [PD-015 Notification channels](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-015--notification-channels) | A | A | A | A | A | C |
| [PD-016 Support intervention](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-016--support-intervention-powers) | A | A | A | A | A | C |
| [PD-017 Retention schedule](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-017--data-classification-retention-schedule) | A | A | A | A | A | A |
| [PD-018 Public Data API](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-018--public-data-api-posture) | A | A | A | A | R | A |
| [PD-019 Hero Showcase slots](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-019--hero-showcase-slot-limit) | A | A | C | C | — | C |
| [PD-020 Gift verified-character requirement](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-020--gift-centre-verified-character-requirement) | A | A | A | A | A | C |
| [PD-021 Dispute handling](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-021--verification-and-authority-dispute-handling) | A | A | A | A | A | C |
| [PD-022 Account deletion](./PLAYER_DOMAIN_DECISION_REGISTER.md#pd-022--account-deletion-and-closure-behaviour) | A | A | A | A | A | A |

## Approval order

1. Decision owner supplies the evidence required by the Decision Register.
2. Functional reviewers record findings and conditions.
3. Clark records the product/public/privacy-experience decision within his remit.
4. Aegis records the architecture, security posture, migration and sequencing decision within his remit.
5. Every `A` role records approval before the ADR may become Accepted.
6. Entry criteria are evaluated separately; Accepted ADRs do not automatically authorise implementation, database writes or deployment.

## Four-eyes and separation rules

- A person requesting or performing a high-risk support intervention cannot be its sole approver.
- Positive verification, ownership transfer and Alliance leadership restoration cannot be created by an unreviewed support override.
- Production migration execution requires a named operator and a separate approving authority under the accepted change plan.
- Emergency disable/freeze authority may be broader than re-enable/restore authority, but both must be documented and audited.

## Related documents

- [Player Decision Register](./PLAYER_DOMAIN_DECISION_REGISTER.md)
- [ADR convention](./ADR/README.md)
- [Implementation Entry Criteria](./PLAYER_DOMAIN_IMPLEMENTATION_ENTRY_CRITERIA.md)
- [Player Domain Architecture](./PLAYER_DOMAIN_ARCHITECTURE.md)
