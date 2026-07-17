# Player Domain Implementation Entry Criteria

**Status:** Scoped Sprint 9.3 local contract/discovery entry completed; product, persistence and production entry not approved
**Owner:** Player Domain architecture
**Version:** 1.1
**Date:** 17 July 2026
**Last reviewed:** 17 July 2026

## Rule

Player Identity product implementation may begin only when every **Blocking** criterion is explicitly satisfied at the same reviewed repository head. A criterion classified **May be deferred behind an interface** requires an explicit recorded deferral and a contract that cannot make a positive claim. **Required before production** and **Required before public release** criteria do not authorise risky local implementation; they state the latest permitted gate.

No criterion grants Supabase write, migration, deployment or production authority. Those actions require their own accepted milestone/change approvals.

## Criteria

| ID | Classification | Criterion | Required evidence | Accountable approval | Current state |
| --- | --- | --- | --- | --- | --- |
| EC-01 | Blocking | Player Domain Architecture approved. | Clark/Aegis approval record tied to exact document revision. | Clark and Aegis | Unmet; architecture is Proposed. |
| EC-02 | Blocking | Critical identity ADRs accepted: ADR-0100, 0101, 0102, 0103, 0109, 0115 and the applicable private/public posture of 0117. | ADR status and explicit approvals with conditions resolved. | Per Approval Matrix | Unmet; all Player ADRs are Proposed. |
| EC-03 | Blocking | Canonical glossary approved. | Clark/Aegis review confirming terms and conflicts. | Clark and Aegis | Unmet; glossary is Proposed. |
| EC-04 | May be deferred behind an interface | Verification provider selected or explicitly deferred. | PD-001 record; deferral must prohibit provider code and positive verification claims. | Clark, Aegis, Security and Privacy | Unmet; recommendation is explicit interface-only deferral. |
| EC-05 | Blocking | Linked-character limit policy approved without architectural hard limit. | PD-004 finite default/evaluation-order decision and over-limit behaviour. | Clark and Aegis | Unmet; configurable boundary is Proposed. |
| EC-06 | Blocking | Primary and Active Character semantics approved. | PD-005/006 outcomes and multi-tab/request binding evidence. | Clark and Aegis; Security for active context | Unmet. |
| EC-07 | Blocking | Visibility semantics for private and safe projections approved. | PD-007 field/audience matrix, default-deny posture and contract scope. | Clark, Aegis, Privacy and Security | Unmet. |
| EC-08 | May be deferred behind an interface | Public Player ID exposure policy approved or explicitly set to omit. | PD-009 outcome; interface contains no public Player ID while deferred. | Clark, Aegis, Privacy and Security | Unmet; conservative omission is recommended. |
| EC-09 | May be deferred behind an interface | Alliance Authority policy approved where the milestone consumes it. | PD-010/011 or an interface that returns unavailable/denied and implements no Alliance command. | Clark, Aegis, Security and Operations | Unmet; Identity Milestone 1 excludes Alliance authority. |
| EC-10 | Blocking | Read-only schema discovery charter approved. | Named environment/operator, exact object scope, access method, sanitised evidence/hash location and stop conditions. | Clark, Aegis, Database, Security and Privacy | Satisfied only for Sprint 9.3 by the exact brief and discovery report; no continuing database authority. |
| EC-11 | Blocking | Migration recovery strategy approved for discovery/reconstruction planning. | Accepted ADR-0115 and reviewed recovery sequence. | Aegis, Clark and Database review | Unmet. |
| EC-12 | Blocking | Supabase target environment identified and classified. | Exact project/branch reference and proof of production/non-production classification. | Database, Security and Aegis | Project `hrvdhjscwitqpwjhnjkm` identified; environment classification remains unresolved, so access stopped at read-only catalogue discovery. |
| EC-13 | Blocking | No production write authorisation is assumed. | Scope statement explicitly excludes SQL writes, migration application, fixtures and production mutations. | Clark and Aegis | Satisfied for Sprint 9.3; no write or migration authority exists. |
| EC-14 | Blocking | Active Codex A/B/D overlap reassessed at implementation start. | Current heads/statuses, path/contract collision matrix and named resolution owner. | Aegis | Reassessed for isolated Player paths; package-script and future shared actor/projection integration remain review risks. |
| EC-15 | Blocking | API, ADR, logical model and future migration naming reservations agreed. | Collision check against accepted release head and workstreams; no in-flight shared names reused. | Aegis and Database review where physical names are involved | Unmet. |
| EC-16 | Blocking | Milestone-specific Security and Privacy requirements accepted. | Threat/privacy model, prohibited data, logging/redaction, access and retention gates. | Security, Privacy, Aegis and Clark | Unmet. |
| EC-17 | Blocking | Identity Milestone 1 scope approved. | Accepted objective, in/out scope, interfaces, no-provider/no-migration boundaries and completion criteria. | Clark and Aegis | Satisfied only for the local Sprint 9.3 contract/discovery brief; executable product and persistence remain blocked. |
| EC-18 | Blocking | Test and rollback strategy approved. | Contract/negative/concurrency/secret tests, stop conditions, docs/code rollback and no-data rollback statement. | Aegis, Security and Operations | Implemented locally for additive unused contracts; production review remains unmet. |
| EC-19 | Required before production | Verification provider, proof, expiry, dispute and recovery policies accepted for any positive verified state. | Accepted PD-001/002/003/021 and provider-safe validation evidence. | Approval Matrix roles | Unmet. |
| EC-20 | Required before production | Schema baseline, forward migrations, grants and RLS validated in an approved non-production target. | Inventory/reconstruction hashes, migration/RLS matrix, rollback rehearsal and advisor/review evidence current at execution. | Database, Security, Aegis and Clark | Unmet; no migration exists. |
| EC-21 | Required before production | Data-classification retention and deletion processes accepted. | PD-017/022 outcomes, scheduled expiry/deletion tests and backup treatment. | Privacy, Security, Operations, Database, Clark and Aegis | Unmet. |
| EC-22 | Required before production | Support intervention and incident procedures accepted. | PD-016/021, four-eyes policy, action prohibitions, audit and escalation runbooks. | Security, Privacy, Operations, Clark and Aegis | Unmet. |
| EC-23 | Required before public release | Account closure, export and public-cache removal work end to end. | Subject lifecycle tests covering links, profiles, aliases, caches, consent, audit and backups. | Privacy, Security, Operations and Clark | Unmet. |
| EC-24 | Required before public release | Public alias, field allowlist and Data API/server projection posture accepted and tested. | PD-008/009/018, enumeration/rate/cache tests and compatibility plan. | Clark, Aegis, Security, Privacy and Database | Unmet. |
| EC-25 | Required before public release | Exact release commit passes Forge production quality gates. | Build/tests, approved environment validation, deployment, smoke tests, documentation and monitoring. | Existing Forge release governance | Unmet and outside this milestone. |

## Critical ADR set for Identity Milestone 1

The minimum accepted set before product code is ADR-0100, ADR-0101, ADR-0102, ADR-0103 and ADR-0109. ADR-0115 must be accepted before database discovery/recovery work. ADR-0105 and ADR-0117 must be accepted before implementing public/private projection behaviour. ADR-0104 may remain Proposed only if verification is an unavailable interface with no provider, evidence collection or positive state.

## Interface deferral rule

An interface deferral must:

1. return `unavailable`, `not_verified` or equivalent safe state rather than simulated success;
2. contain no provider, credential, proof or schema implementation;
3. prevent downstream code from treating linked state as verified;
4. name the deferred Decision Register IDs and revisit point;
5. be removable/replaced without changing the approved identity semantics.

## Entry review outcome

Sprint 9.3 local contract/discovery entry is complete under the brief's explicit exception. Broader Player Identity product implementation remains **not approved**: every Player ADR is Proposed, live schema is not canonical, and persistence, provider, public release, Alliance authority and executable Player workflows remain blocked.

## Related documents

- [Player Identity Milestone 1 proposal](./PLAYER_IDENTITY_IMPLEMENTATION_MILESTONE_1.md)
- [Decision Register](./PLAYER_DOMAIN_DECISION_REGISTER.md)
- [Approval Matrix](./PLAYER_DOMAIN_APPROVAL_MATRIX.md)
- [ADR registry](./ADR/README.md)
# Sprint 9.4 disabled-slice record

Sprint 9.4 satisfies local implementation and test entry only for a disabled, non-persistent vertical slice. It does not satisfy migration, live persistence, verification, capability-grant, public-exposure or production-release criteria. Those gates remain blocked on the recovery and approval evidence listed in [docs/player-identity/MIGRATION_RECOVERY_AND_VALIDATION.md](./player-identity/MIGRATION_RECOVERY_AND_VALIDATION.md).
