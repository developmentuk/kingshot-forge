# Kingshot Forge Player Domain Decision Register

**Status:** Proposed decisions awaiting review
**Owner:** Player Domain architecture
**Version:** 1.1
**Date:** 17 July 2026
**Last reviewed:** 17 July 2026

## Purpose and rules

This register is the authoritative queue of unresolved Player Domain decisions. Every recommendation is architecture advice, not approval. A row remains `Proposed` until the approvals in the [Approval Matrix](./PLAYER_DOMAIN_APPROVAL_MATRIX.md) are explicit and its ADR status is updated through the [ADR convention](./ADR/README.md).

Decision classes are **Architecture recommendation**, **Product policy**, **Security policy**, **Privacy policy**, **Operational policy** and **Unresolved technical discovery**. Some decisions have more than one class; the first class names the accountable policy domain.

## Decisions

### PD-001 — Character verification provider

- **Classification:** Security policy / Product policy.
- **ADR:** [ADR-0104](./ADR/ADR-0104-character-verification-model.md).
- **Status:** Proposed; no provider approved.
- **Recommendation:** Keep the provider-neutral interface and approve none until an authorised provider passes product, security, privacy and operations review.
- **Options:** Official provider assertion; controlled profile challenge; authenticated federation; moderated evidence; no provider.
- **Owner:** Character Verification boundary.
- **Approver:** Clark, Aegis, Security review and Privacy review; Operations for live use.
- **Blocking implementation milestone:** Verified-character implementation and every verified-only production feature.
- **Consequence of deferral:** Identity Milestone 1 may define interfaces only; it cannot assert verified ownership.
- **Required evidence:** Provider authority, threat model, data flow, failure/revocation model, privacy/retention assessment and safe non-production validation plan.
- **Target review point:** Before implementing any provider adapter or positive verification claim.

### PD-002 — Ownership proof method

- **Classification:** Security policy / Privacy policy.
- **ADR:** [ADR-0104](./ADR/ADR-0104-character-verification-model.md).
- **Status:** Proposed.
- **Recommendation:** Select only a time-bounded, replay-resistant method with accessible recovery and evidence minimisation.
- **Options:** Provider assertion; public/profile challenge; account federation; moderated evidence; combinations.
- **Owner:** Character Verification boundary.
- **Approver:** Aegis, Clark, Security review and Privacy review.
- **Blocking implementation milestone:** Verification case/challenge/evidence implementation.
- **Consequence of deferral:** Case interfaces may remain generic; no proof collection or positive decision workflow.
- **Required evidence:** Attack analysis, replay/competing-claim tests, accessibility, evidence sensitivity, reviewer separation and recovery design.
- **Target review point:** With PD-001 before proof-specific schema or UI.

### PD-003 — Verification expiry

- **Classification:** Security policy / Operational policy.
- **ADR:** [ADR-0104](./ADR/ADR-0104-character-verification-model.md).
- **Status:** Proposed.
- **Recommendation:** Provider-specific expiry with an approved maximum age and event-driven revocation; no non-expiring default.
- **Options:** Non-expiring; fixed 90/180/365 days; provider-specific; event-driven plus maximum age.
- **Owner:** Character Verification boundary.
- **Approver:** Aegis and Clark; Security, Privacy and Operations review.
- **Blocking implementation milestone:** Effective verification projection, expiry processing and production verified-only access.
- **Consequence of deferral:** Verification interface exposes expiry as unresolved and cannot support production positive states.
- **Required evidence:** Provider assurance lifetime, account-transfer risk, reverification burden, notification/support capacity and retention impact.
- **Target review point:** Before accepting PD-001 provider for implementation.

### PD-004 — Linked-character policy limit

- **Classification:** Product policy / Operational policy.
- **ADR:** [ADR-0102](./ADR/ADR-0102-configurable-multiple-character-policy.md).
- **Status:** Proposed.
- **Recommendation:** Architectural cardinality remains unbounded; require a finite server-configured default policy before general use, with extension points for supporter tier, Alliance-role entitlement, administrative exception and future subscription.
- **Options:** Fixed one; fixed three; fixed five; configurable policy; unlimited default.
- **Owner:** Clark for product policy; Character Identity enforces it.
- **Approver:** Clark and Aegis; Security/Operations review for abuse and cost.
- **Blocking implementation milestone:** Multi-character link creation beyond compatibility contracts.
- **Consequence of deferral:** Schema/contracts may support many links, but product cannot enable general link creation.
- **Required evidence:** User cohorts, abuse/cost model, policy evaluation order, entitlement freshness, over-limit handling and support messaging.
- **Target review point:** Before multi-character product implementation; initial architecture must not encode a number.

### PD-005 — Primary-character behaviour

- **Classification:** Product policy / Architecture recommendation.
- **ADR:** [ADR-0103](./ADR/ADR-0103-primary-and-active-character-semantics.md).
- **Status:** Proposed.
- **Recommendation:** Exactly one Primary Character while a user has current links; zero only when there are no current links.
- **Options:** Optional primary; exactly one; last-used only; per-feature default.
- **Owner:** Player Character Identity.
- **Approver:** Clark and Aegis.
- **Blocking implementation milestone:** Primary switching and compatibility migration.
- **Consequence of deferral:** Existing primary-only journeys cannot receive a deterministic compatibility default.
- **Required evidence:** Zero/one/many UX, concurrent switch invariant, former/unlinked fallback and accessibility review.
- **Target review point:** Before Identity Milestone 1 contracts freeze.

### PD-006 — Active-character behaviour

- **Classification:** Security policy / Architecture recommendation.
- **ADR:** [ADR-0103](./ADR/ADR-0103-primary-and-active-character-semantics.md).
- **Status:** Proposed.
- **Recommendation:** Every sensitive request names an opaque character reference; the server validates ownership and current policy. Primary/last-used may preselect but never authorise.
- **Options:** Primary only; client-global active state; explicit request context; per-feature implicit defaults.
- **Owner:** Player server architecture with each consuming domain.
- **Approver:** Aegis and Clark; Security review.
- **Blocking implementation milestone:** Active-character request context and all multi-character sensitive operations.
- **Consequence of deferral:** No sensitive multi-character API or Gift Centre integration can proceed.
- **Required evidence:** Multi-tab/stale-client model, request contract, server resolution, idempotency binding and safe confirmation UX.
- **Target review point:** Before Identity Milestone 1 interface implementation.

### PD-007 — Visibility scopes

- **Classification:** Privacy policy / Product policy.
- **ADR:** [ADR-0105](./ADR/ADR-0105-public-identity-and-visibility.md).
- **Status:** Proposed.
- **Recommendation:** Adopt public, kingdom, alliance, leadership, private and restricted scopes with entity-specific field allowlists.
- **Options:** Public/private only; proposed six scopes; per-feature custom scopes.
- **Owner:** Shared Player visibility policy with domain owners.
- **Approver:** Clark and Aegis; Privacy and Security review.
- **Blocking implementation milestone:** Public/private projection contracts and scoped membership/Planning reads.
- **Consequence of deferral:** Identity may remain private-only; no public Player projection may launch.
- **Required evidence:** Audience matrix, current/former membership rules, field classifications, cache invalidation and negative-access tests.
- **Target review point:** Before public/private contract implementation.

### PD-008 — Public Character Alias behaviour

- **Classification:** Architecture recommendation / Privacy policy.
- **ADR:** [ADR-0105](./ADR/ADR-0105-public-identity-and-visibility.md).
- **Status:** Proposed.
- **Recommendation:** Use unique opaque non-sequential aliases with documented rotation, redirect and revocation rules.
- **Options:** Forge ID; Player ID; player name; stable opaque alias; rotating opaque alias; no public profile.
- **Owner:** Player Profile/Visibility boundary.
- **Approver:** Aegis and Clark; Security and Privacy review.
- **Blocking implementation milestone:** Public Player routes and compatibility redirects.
- **Consequence of deferral:** Public projections remain unavailable or use no externally addressable identity.
- **Required evidence:** Enumeration model, collision/rotation handling, link stability, abuse recovery and cache/SEO consequences.
- **Target review point:** Before any new public Player URL contract.

### PD-009 — External Player ID exposure

- **Classification:** Privacy policy / Security policy.
- **ADR:** [ADR-0105](./ADR/ADR-0105-public-identity-and-visibility.md).
- **Status:** Proposed; default is omitted.
- **Recommendation:** Keep Player ID owner/private-purpose only; approve any public exposure separately by field and use case.
- **Options:** Public full ID; masked public ID; owner-only; no Forge display.
- **Owner:** Player Profile/Visibility boundary.
- **Approver:** Clark and Aegis; Privacy and Security review.
- **Blocking implementation milestone:** Public Player projection and Gift/Transfer field contracts.
- **Consequence of deferral:** Conservative projections omit Player ID; private server integrations may use it only after purpose approval.
- **Required evidence:** User need, account-targeting/enumeration risk, provider requirements, masking utility and incident response.
- **Target review point:** Before public release or any third-party disclosure.

### PD-010 — Alliance rank and capability policy

- **Classification:** Product policy / Security policy.
- **ADR:** [ADR-0108](./ADR/ADR-0108-alliance-authority-model.md).
- **Status:** Proposed.
- **Recommendation:** R1–R5 are effective game-domain ranks; authorisation evaluates named capabilities and resource scope, never numeric rank alone or global Forge roles.
- **Options:** Rank hierarchy only; capabilities only; R1–R5 plus capabilities/delegation; global role mapping.
- **Owner:** Alliance Domain/Authority.
- **Approver:** Clark and Aegis; Security and Operations review.
- **Blocking implementation milestone:** Alliance management and leadership-dependent Planning.
- **Consequence of deferral:** Identity implementation must keep Alliance authority behind an interface and cannot implement leadership actions.
- **Required evidence:** Capability matrix, rank grant ceilings, succession/removal/dispute rules and cross-Alliance negative tests.
- **Target review point:** Before Alliance authority implementation; may be deferred behind Identity interfaces.

### PD-011 — Alliance delegation limits

- **Classification:** Security policy / Operational policy.
- **ADR:** [ADR-0108](./ADR/ADR-0108-alliance-authority-model.md).
- **Status:** Proposed.
- **Recommendation:** Delegations are named-capability, resource-scoped, expiring, revocable, reasoned and cannot exceed the delegator's grant ceiling.
- **Options:** No delegation; rank-equivalent delegation; scoped capability delegation; permanent delegation.
- **Owner:** Alliance Authority.
- **Approver:** Clark and Aegis; Security and Operations review.
- **Blocking implementation milestone:** Delegated Alliance operations and Planning leadership.
- **Consequence of deferral:** No delegation is implemented; only directly approved rank policy may later authorise actions.
- **Required evidence:** Delegation use cases, maximum duration, ceilings, revocation latency, audit and emergency suspension.
- **Target review point:** After PD-010 and before any delegated capability implementation.

### PD-012 — Read-only live-schema discovery

- **Classification:** Unresolved technical discovery / Security policy.
- **ADR:** [ADR-0115](./ADR/ADR-0115-player-schema-recovery-strategy.md).
- **Status:** Proposed; no live command authorised.
- **Recommendation:** Approve a named operator, exact Supabase project/branch, read-only scope, sanitised evidence location and stop conditions before discovery.
- **Options:** No inspection; dashboard notes; approved catalogue/DDL inventory; full data export.
- **Owner:** Database review with Player architecture.
- **Approver:** Clark and Aegis; Database, Security and Privacy review.
- **Blocking implementation milestone:** Identity Milestone 1 schema discovery and every migration-dependent milestone.
- **Consequence of deferral:** Contracts may be drafted, but physical mapping and migrations remain blocked.
- **Required evidence:** Environment classification, least-privilege access method, fields/objects to inspect, evidence sanitisation/hash plan and confirmation that row data/secrets are excluded.
- **Target review point:** Before any Supabase/SQL/CLI/MCP database command.

### PD-013 — Migration baseline recovery

- **Classification:** Architecture recommendation / Unresolved technical discovery.
- **ADR:** [ADR-0115](./ADR/ADR-0115-player-schema-recovery-strategy.md).
- **Status:** Proposed.
- **Recommendation:** Reconstruct a reviewed baseline in a disposable environment, align history non-destructively, then use forward-only hardening migrations.
- **Options:** Recreate production; ignore history; baseline plus history alignment; incremental reverse-engineering only.
- **Owner:** Database review and Aegis.
- **Approver:** Aegis and Clark; Database, Security and Operations review.
- **Blocking implementation milestone:** Any Player schema migration or production persistence cutover.
- **Consequence of deferral:** Identity Milestone 1 remains contract/discovery-only; no schema creation or write path.
- **Required evidence:** Inventory hash, disposable reconstruction, migration-history comparison, backup/restore rehearsal, forward/rollback plan and exact environment proof.
- **Target review point:** After PD-012 evidence and before writing a migration.

### PD-014 — Transfer contact retention

- **Classification:** Privacy policy / Operational policy.
- **ADR:** [ADR-0111](./ADR/ADR-0111-transfer-domain-boundary.md).
- **Status:** Proposed.
- **Recommendation:** Remove active contact access immediately on withdrawal/consent revocation and retain only minimal pseudonymised audit evidence for an approved period.
- **Options:** Retain with listing; immediate deletion; fixed post-withdrawal period; pseudonymised audit only.
- **Owner:** Transfer Domain with Privacy review.
- **Approver:** Clark and Aegis; Privacy, Security and Operations review.
- **Blocking implementation milestone:** Transfer private-details migration and recruiter contact access.
- **Consequence of deferral:** Transfer remains private/draft-only with no contact disclosure.
- **Required evidence:** Support/recruiter need, abuse risk, account deletion/export treatment, backups and legal/security retention.
- **Target review point:** Before Transfer contact schema or public listing release.

### PD-015 — Notification channels

- **Classification:** Product policy / Operational policy.
- **ADR:** [ADR-0113](./ADR/ADR-0113-notification-boundary.md).
- **Status:** Proposed.
- **Recommendation:** In-app first, opt-in email second; defer Discord/push until provider, consent and operations ownership are approved.
- **Options:** In-app; email; Discord; push; combinations; none.
- **Owner:** Notification platform/product policy.
- **Approver:** Clark and Aegis; Privacy, Security and Operations review.
- **Blocking implementation milestone:** Notification delivery platform and channel-specific subscriptions.
- **Consequence of deferral:** Features may emit no external delivery; critical operational journeys need explicit in-app/manual fallback.
- **Required evidence:** User need, provider contract, consent/quiet hours, retry/support, sensitive preview handling and cost/SLO.
- **Target review point:** Before notification persistence or provider selection.

### PD-016 — Support intervention powers

- **Classification:** Security policy / Operational policy.
- **ADR:** [ADR-0118](./ADR/ADR-0118-support-intervention-model.md).
- **Status:** Proposed.
- **Recommendation:** Read-only by default; time-bounded scoped mutation with reason; four-eyes approval for identity/verification/leadership positive changes; no silent impersonation.
- **Options:** None; read-only; unrestricted admin; scoped time-bound commands; dual-control high-risk commands.
- **Owner:** Support governance with affected domain.
- **Approver:** Clark and Aegis; Security, Privacy and Operations review.
- **Blocking implementation milestone:** Dispute/recovery support tooling and production operational readiness.
- **Consequence of deferral:** No privileged recovery beyond user-safe lifecycle and emergency feature suspension.
- **Required evidence:** Support cases, action allowlist/prohibitions, duration, approver separation, notice policy, audit and incident escalation.
- **Target review point:** Before support grant schema/API or production verification.

### PD-017 — Data-classification retention schedule

- **Classification:** Privacy policy / Security policy.
- **ADR:** [ADR-0116](./ADR/ADR-0116-player-data-classification-retention.md).
- **Status:** Proposed.
- **Recommendation:** Approve classification-specific retention, deletion/pseudonymisation, export and hold rules; reject a single global period.
- **Options:** Indefinite; immediate deletion; one global period; classification-based schedule.
- **Owner:** Privacy governance with each domain owner.
- **Approver:** Clark and Aegis; Privacy, Security and Operations review.
- **Blocking implementation milestone:** Verification evidence, Transfer contact, audit, Planning timing and production deletion jobs.
- **Consequence of deferral:** Sensitive persistence may be interface-only or short-lived; no production release that needs unresolved retention.
- **Required evidence:** Data inventory/purpose, legal/security need, support need, backup treatment, account deletion/export and hold controls.
- **Target review point:** Before schema approval for each sensitive class and before production.

### PD-018 — Public Data API posture

- **Classification:** Architecture recommendation / Security policy.
- **ADR:** [ADR-0117](./ADR/ADR-0117-public-player-data-api-posture.md).
- **Status:** Proposed.
- **Recommendation:** Vercel safe projections for public Player data and sensitive operations; reviewed invoker views only where discovery proves a clear read benefit.
- **Options:** Raw tables with RLS; dedicated API schema/views; Vercel APIs only; reviewed hybrid; Data API disabled.
- **Owner:** Player API architecture and Database review.
- **Approver:** Aegis and Clark; Security, Privacy and Database review.
- **Blocking implementation milestone:** Public projection implementation and direct-browser cutover.
- **Consequence of deferral:** Identity remains private/interface-only; raw tables cannot become the new public contract.
- **Required evidence:** Live grants/RLS/views, consumer needs, field allowlists, rate/enumeration/cache model and compatibility plan.
- **Target review point:** After PD-012 discovery and before public API/schema work.

### PD-019 — Hero Showcase slot limit

- **Classification:** Product policy / Architecture recommendation.
- **ADR:** [ADR-0110](./ADR/ADR-0110-hero-ownership-showcase-separation.md).
- **Status:** Proposed.
- **Recommendation:** Six slots initially, enforced as configurable product policy; ownership and atomicity are architectural regardless of the number.
- **Options:** Fixed six; configurable finite limit; layout-specific limits; no Showcase.
- **Owner:** Hero Showcase product policy.
- **Approver:** Clark and Aegis.
- **Blocking implementation milestone:** Hero Showcase aggregate migration and replacement API.
- **Consequence of deferral:** Ownership/Showcase separation can be designed, but product replacement limit and UI cannot be finalised.
- **Required evidence:** Current UX, responsive layout, abuse/storage impact and future formation/showcase distinction.
- **Target review point:** Before Showcase implementation/migration.

### PD-020 — Gift Centre verified-character requirement

- **Classification:** Security policy / Product policy.
- **ADR:** [ADR-0112](./ADR/ADR-0112-gift-centre-integration-boundary.md).
- **Status:** Proposed; current safe recommendation requires effective verification.
- **Recommendation:** Provider execution requires one exact active character with effective Player-approved verification and character-scoped consent, rechecked before send.
- **Options:** Link sufficient; selected verification tiers; strongest provider only; no automatic provider execution.
- **Owner:** Gift Centre eligibility with Player identity dependency.
- **Approver:** Clark and Aegis; Player/Gift owners, Security, Privacy and Operations review.
- **Blocking implementation milestone:** Live Gift Centre request acceptance/provider execution.
- **Consequence of deferral:** Manual official redemption remains; Identity Milestone 1 exposes no positive eligibility claim.
- **Required evidence:** Accepted verification policy/tier, exact-character contract, consent, revocation/dispute behaviour and Codex B contract tests.
- **Target review point:** Before Codex B implements Player integration or live provider route.

### PD-021 — Verification and authority dispute handling

- **Classification:** Security policy / Operational policy.
- **ADR:** [ADR-0104](./ADR/ADR-0104-character-verification-model.md), [ADR-0108](./ADR/ADR-0108-alliance-authority-model.md), [ADR-0118](./ADR/ADR-0118-support-intervention-model.md).
- **Status:** Proposed.
- **Recommendation:** Freeze high-risk rights, preserve evidence/history, notify affected parties safely, use bounded reviewed resolution and append compensating decisions/events.
- **Options:** Ignore until resolved; automatic transfer; immediate deletion/revocation; freeze and reviewed resolution.
- **Owner:** Character Verification or Alliance Authority according to subject.
- **Approver:** Aegis and Clark; Security, Privacy and Operations review.
- **Blocking implementation milestone:** Verification disputes, ownership recovery and authority dispute tooling.
- **Consequence of deferral:** Positive verification/authority production release remains blocked because conflicts cannot be recovered safely.
- **Required evidence:** Claimant privacy, freeze matrix, review roles/SLAs, restoration/revocation semantics, notification and appeal/support procedure.
- **Target review point:** Before positive verification or Alliance authority production use.

### PD-022 — Account deletion and closure behaviour

- **Classification:** Privacy policy / Operational policy.
- **ADR:** [ADR-0116](./ADR/ADR-0116-player-data-classification-retention.md), [ADR-0119](./ADR/ADR-0119-player-audit-immutable-history.md).
- **Status:** Proposed.
- **Recommendation:** End active links/consents/subscriptions, remove public/private projections, delete or pseudonymise personal content by class, and retain only approved minimal immutable security/business evidence.
- **Options:** Hard-delete all; retain all; deactivate only; classification-based deletion/pseudonymisation.
- **Owner:** Forge User Identity with each data-owning domain.
- **Approver:** Clark and Aegis; Privacy, Security, Operations and Database review.
- **Blocking implementation milestone:** Production account closure/export and public release of persistent Player data.
- **Consequence of deferral:** Production Player persistence cannot claim complete privacy lifecycle; public release remains blocked.
- **Required evidence:** Data map, Auth/session revocation, link/ownership consequences, public cache purge, backups, exports, holds, audit integrity and restoration policy.
- **Target review point:** Before production persistence/public release and before accepting retention schedule.

## Review record

Record explicit review outcomes by changing the matching ADR and this register in the same governance change. An outcome must name the decision ID, approver role, result, date, conditions and evidence reference. Do not record approval by inference from an implementation commit.

## Sprint 9.3 local implementation record

The Sprint 9.3 brief authorised local contracts and read-only discovery under conservative defaults. It did not record any decision approval. All PD entries remain Proposed.

| Decision evidence | Local implementation | Remaining gate |
| --- | --- | --- |
| PD-004 | Pure finite configurable limit input supports the named future adjustment sources; the only numeric default is clearly marked test-only. | Launch values, evaluation precedence and entitlement operations require approval. |
| PD-005/006 | Pure Primary policy and explicit server Active resolver reject invalid/stale context and never fall back for a sensitive request. | Product behaviour, persistence and executable command approval remain open. |
| PD-007/008/009/018 | Opaque alias and allowlisted projection contracts omit raw Player, Forge User and Character Link IDs. | Visibility taxonomy, alias lifecycle, public API, rate/cache/grant/RLS review remain open. |
| PD-001/002/003/021 | Provider-neutral state and expiry/dispute/revocation contracts exist; positive event creation is disabled except marked synthetic tests. | Provider, proof, assurance, recovery and live-positive-state approval remain open. |
| PD-010/011 | Actor types reserve a resource-scoped Alliance candidate only; no capability resolution exists. | Alliance authority and delegation remain open. |
| PD-012/013 | Read-only discovery report confirms migration drift and recovery needs. | Canonical baseline, migration plan and non-production rehearsal remain open. |
| PD-019/020 | Hero Showcase and Gift eligibility boundaries expose minimal Player-owned projections only. | Showcase product limits and Gift verified-character/consent/provider decisions remain open. |

## Sprint 9.4 local implementation record

Sprint 9.4 implements the complete Player Identity path only as a disabled local vertical slice. Exact-match feature gates are all OFF by default; the production repository cannot persist; capabilities grant nothing; verification and public exposure remain disabled. The service, API, UI, integration, support, legacy and migration-proposal artifacts are implementation evidence, not decision approval. Every PD and ADR remains Proposed until an explicit governance record says otherwise.
