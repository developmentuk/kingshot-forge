# Forge Architecture Decision Records

**Status:** Current convention
**Owner:** Aegis, with Clark as Product Owner
**Version:** 1.0
**Date:** 17 July 2026
**Last reviewed:** 17 July 2026

## Purpose

Architecture Decision Records preserve consequential Forge decisions, their evidence, trade-offs, approval state and implementation consequences. An ADR is required for a material change to architecture, security, privacy, data ownership, public contracts, deployment, permissions, dependencies or long-term maintainability.

`docs/ADR/` is the canonical ADR directory because [AEGIS](../AEGIS.md) identifies it as the home of binding decisions. The earlier [architecture ADR directory](../architecture/adr/README.md) remains a legacy location. Accepted records are not moved or renumbered merely to make the paths uniform.

## Numbering and filenames

New records use four digits and a descriptive lowercase slug:

```text
ADR-NNNN-short-decision-title.md
```

Numbers are never reused. Current allocation is:

| Range | Purpose |
| --- | --- |
| `0001`–`0099` | Platform-wide and legacy decisions |
| `0100`–`0199` | Player, Alliance-facing identity and Player Planning prerequisites |
| `0200` onward | Reserved until assigned by Aegis |

The accepted `ADR-001` filename predates the four-digit convention and remains valid at its existing path. The accepted `ADR-0002` also remains at its existing legacy path. Neither record is silently renamed.

## Status values

| Status | Meaning |
| --- | --- |
| Proposed | A complete recommendation awaiting every required approval. It is not implementation authority. |
| Accepted | The named approvers explicitly approved the decision and the approval is recorded. |
| Rejected | The named approvers explicitly declined the decision. |
| Superseded | A later accepted ADR replaces this decision. |
| Deprecated | The decision remains historical but must not govern new work. |

Only Clark and Aegis may supply their respective product and architecture approvals. Security, Privacy, Operations and Database review are functional gates; a named reviewer is recorded only when governance has assigned one. Silence, implementation, a merged branch or a recommendation does not change `Proposed` to `Accepted`.

## Required record structure

Every ADR contains:

- title, status, date, decision owner and required approvers;
- Context and Decision;
- Consequences, Benefits and Risks;
- Alternatives considered;
- Security, Privacy, Operational and Migration impact;
- Dependencies and Validation required;
- Revisit triggers and Related documents.

Use direct UK English. Separate current state, proposed target and migration state. Link durable repository documents by relative path without line numbers.

## Approval and review process

1. The decision owner drafts the ADR as `Proposed` and links it from the relevant architecture and decision register.
2. Required reviewers record evidence, unresolved risks and conditions in the decision register or review record.
3. Clark approves product direction and public experience where applicable.
4. Aegis approves architecture, domain boundaries, security posture, migration strategy and implementation sequencing where applicable.
5. Functional Security, Privacy, Operations or Database approval is required when the ADR names that gate.
6. The status changes only after all required approvals are explicit and attributable.
7. Implementation begins only when the applicable entry criteria are also satisfied.

Proposed ADRs may be edited as review evidence develops. Accepted ADRs are immutable except for status metadata, review dates and links that identify a superseding ADR. A substantive change to an accepted decision requires a new ADR.

## Supersession and deprecation

A superseding ADR must identify the earlier record, explain the changed conditions and include a migration or compatibility plan. The earlier ADR receives only a status/link update. Deprecated records remain available with a replacement or migration note.

## Relationship to architecture documents

Architecture specifications explain the complete target system. ADRs isolate individual choices and approval state. The [Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md) remains the integrated design; the [Player Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md) tracks unresolved choices; and the [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md) identifies review responsibility. An ADR does not override AEGIS or the Forge Blueprint.

## Registry

| ADR | Title | Status | Location |
| --- | --- | --- | --- |
| ADR-0001 (legacy filename) | Canonical Content — Publish Once, Consume Everywhere | Accepted | [ADR-001](./ADR-001-canonical-content.md) |
| ADR-0002 | Adopt a data-driven dataset platform | Accepted | [Legacy architecture path](../architecture/adr/ADR-0002-data-driven-dataset-platform.md) |
| ADR-0100 | Separate Forge User and Game Character identity | Proposed | [ADR-0100](./ADR-0100-separate-user-and-character-identity.md) |
| ADR-0101 | Separate character links from verified ownership | Proposed | [ADR-0101](./ADR-0101-separate-link-from-verified-ownership.md) |
| ADR-0102 | Keep linked-character limits in configurable policy | Proposed | [ADR-0102](./ADR-0102-configurable-multiple-character-policy.md) |
| ADR-0103 | Distinguish primary and active character semantics | Proposed | [ADR-0103](./ADR-0103-primary-and-active-character-semantics.md) |
| ADR-0104 | Use provider-neutral evidence-backed verification | Proposed | [ADR-0104](./ADR-0104-character-verification-model.md) |
| ADR-0105 | Protect public identity with scoped projections | Proposed | [ADR-0105](./ADR-0105-public-identity-and-visibility.md) |
| ADR-0106 | Model Kingdom membership as effective-dated terms | Proposed | [ADR-0106](./ADR-0106-kingdom-membership-lifecycle.md) |
| ADR-0107 | Separate Alliance application, membership and rank | Proposed | [ADR-0107](./ADR-0107-alliance-application-membership-rank-separation.md) |
| ADR-0108 | Resolve Alliance authority by scoped capability | Proposed | [ADR-0108](./ADR-0108-alliance-authority-model.md) |
| ADR-0109 | Keep sensitive Player operations server-authoritative | Proposed | [ADR-0109](./ADR-0109-server-authoritative-player-operations.md) |
| ADR-0110 | Separate Hero ownership from Showcase presentation | Proposed | [ADR-0110](./ADR-0110-hero-ownership-showcase-separation.md) |
| ADR-0111 | Separate Transfer listing, contact and verification | Proposed | [ADR-0111](./ADR-0111-transfer-domain-boundary.md) |
| ADR-0112 | Keep provider execution inside Gift Centre | Proposed | [ADR-0112](./ADR-0112-gift-centre-integration-boundary.md) |
| ADR-0113 | Keep notification delivery in the notification platform | Proposed | [ADR-0113](./ADR-0113-notification-boundary.md) |
| ADR-0114 | Defer Player Planning behind identity and authority | Proposed | [ADR-0114](./ADR-0114-player-planning-extension-boundary.md) |
| ADR-0115 | Recover the schema baseline before forward migrations | Proposed | [ADR-0115](./ADR-0115-player-schema-recovery-strategy.md) |
| ADR-0116 | Classify Player data before setting retention | Proposed | [ADR-0116](./ADR-0116-player-data-classification-retention.md) |
| ADR-0117 | Expose public Player data through safe projections | Proposed | [ADR-0117](./ADR-0117-public-player-data-api-posture.md) |
| ADR-0118 | Constrain and audit support intervention | Proposed | [ADR-0118](./ADR-0118-support-intervention-model.md) |
| ADR-0119 | Append immutable Player audit history | Proposed | [ADR-0119](./ADR-0119-player-audit-immutable-history.md) |

## Sprint 9.3 evidence note

Local contracts and read-only schema evidence now exercise parts of ADR-0100 through ADR-0105, ADR-0109 through ADR-0115, ADR-0117 and ADR-0119. This is implementation evidence only. No Player ADR status changed; every ADR-0100 through ADR-0119 remains Proposed until its required approval record is added.
# Sprint 9.4 status note

The disabled Player Identity vertical slice provides implementation evidence for review but does not change the status of ADR-0100 through ADR-0119. They remain Proposed until Clark and Aegis record explicit outcomes in the decision register and each affected ADR.
