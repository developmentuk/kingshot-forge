# Player Domain clean-room audit

**Status:** Complete; architecture and governance evidence baseline
**Owner:** Aegis with Clark as Product Owner
**Version:** 1.1
**Audit date:** 17 July 2026
**Last governance update:** 17 July 2026
**Repository baseline:** `1aca694ebe2e57339e17ab85ab190ad762620b8b`
**Workstream:** `feature/player-planning-foundation`
**Review scope:** Existing Forge Player capabilities and high-level observable planning behaviours

## Summary

Forge has useful Player-facing capabilities, but it does not yet have a safe identity foundation for Player Planning. Public player lookup proves that a character exists; it does not prove that the signed-in Forge user owns that character. Existing journeys resolve one primary character, important mutations occur directly from the browser, visibility is fragmented, and the checked-in migration history cannot reproduce the Player, Kingdom, Alliance, Hero-collection or Transfer persistence used by the application.

Player Planning must not be implemented until Forge has a server-authoritative character link and verification model, reproducible schema history, resource-scoped Alliance authority, safe projections and an append-only Player audit trail.

The target architecture produced from this audit is [Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md). Canonical terms are in the [Player Domain Glossary](../PLAYER_DOMAIN_GLOSSARY.md); proposed decisions and approvals are tracked through the [ADR registry](../ADR/README.md), [Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md) and [Approval Matrix](../PLAYER_DOMAIN_APPROVAL_MATRIX.md).

## ADR and Governance Outcome

The architecture-and-governance continuation converted this audit into:

- 20 Player Domain ADRs, ADR-0100 through ADR-0119, all marked **Proposed**;
- a canonical glossary that separates Forge User/Game Character, linked/verified, primary/active and Dataset Verification/Character Ownership Verification;
- a 22-decision register with architecture, product, security, privacy, operational and discovery classifications;
- an approval matrix for Clark, Aegis and existing functional review roles;
- explicit [Implementation Entry Criteria](../PLAYER_DOMAIN_IMPLEMENTATION_ENTRY_CRITERIA.md); and
- a proposed [Player Identity Foundation — Implementation Milestone 1](../PLAYER_IDENTITY_IMPLEMENTATION_MILESTONE_1.md).

The governance outcome does not approve implementation. No Player ADR is Accepted, no verification provider is approved and the current entry assessment is **not approved**.

Multiple linked characters are an architectural capability. The architecture has no hard maximum of three or any other number. A finite effective limit is configurable server policy that may later consider a default allowance, supporter tier, Alliance-role entitlement, administrative exception or subscription entitlement. None of those entitlements is implemented or approved here.

## Repository State

At the audit baseline:

| Item | Observed state |
| --- | --- |
| Worktree | `C:\Users\clark\Projects\kingshot-forge-player-planning` |
| Branch | `feature/player-planning-foundation` |
| HEAD | `1aca694ebe2e57339e17ab85ab190ad762620b8b` |
| Audited upstream base | `origin/release/0.7.0-player-domain` at the same SHA |
| Working tree | Clean |
| Feature commits | None |
| Supabase activity | No commands or live inspection |
| External mutations | None |

Codex A and Codex B were inspected read-only from their separate worktrees during the original audit. The governance continuation also inspected Codex D read-only. No files in any protected worktree were changed by Codex C.

## Existing Forge Player Domain Audit

### Forge user identity and profiles

- Supabase Auth with Google OAuth provides the authenticated Forge principal.
- `profiles` supplies Forge-facing display information and a permanent `forge_id`.
- `forge_user_roles` and `forge_role_permissions` provide global platform roles and editorial permissions.
- Profile UI also stores a self-reported Alliance value. It is not authoritative Alliance membership.
- The application uses both `profiles` and `player_profiles`, but their ownership and lifecycle boundaries are not documented as one coherent model.

### Linked game characters

- A user can look up a numeric Player ID, review returned public character information and link it.
- Linking writes a `player_accounts` row in the browser with `linked`, primary and public defaults.
- The UI correctly warns that linking does not verify ownership.
- `PlayerIdentityContext` and dependent journeys load only the row marked primary.
- Current code therefore behaves as a single-character product even though `is_primary` suggests a future multi-character model.
- Refresh, privacy changes and unlinking are browser writes. Verification-like rows are protected from simple deletion in the UI, but that presentation rule is not a server-authoritative lifecycle.

### Verification

- Existing TypeScript vocabulary includes linked, pending, community-verified, officially-verified, rejected and revoked states.
- The repository contains no checked-in claim, challenge, evidence, decision, expiry, revocation, dispute, recovery or audit model.
- No approved ownership-proof provider or proof method is defined.
- A linked character must therefore be treated as unverified regardless of its successful public lookup.

### Player profile and progression

- A character-linked profile supports biography, language, play style, activity interests, transfer status and a public toggle.
- Public profile reads combine `player_profiles` and `player_accounts` in the browser and expose external Player ID and other identity fields.
- Progression snapshots are append-oriented and can be marked private or public.
- Validation is inconsistent: VIP accepts 0–30 in the profile editor but 0–12 in progression.
- Profile and progression mutations bypass a server-owned Player API.

### Kingdom membership

- Kingdom lookup is an external observation and does not prove membership.
- Forge displays a public kingdom directory from a database view and claims that linked current data creates membership.
- The application expects `player_kingdom_memberships` and `public_kingdom_members`, but their schema, policy and lifecycle are absent from checked-in migrations.
- No durable distinction exists between observed, claimed, verified-current, former and disputed membership.

### Alliance membership and authority

- Users can request, cancel and leave membership through database RPC calls.
- Alliance management can approve or reject requests and choose a role.
- The UI presents a management link to any current member; it relies on unseen view, RPC and RLS behaviour to prevent unauthorised actions.
- Existing role names do not provide a complete resource-scoped R1–R5 authority model.
- Historical tenure and role-change audit behaviour cannot be reproduced from Git.

### Hero Collection and Hero Showcase

- Canonical Hero records remain separate from player-owned Hero state, which is the correct domain direction.
- Player Hero progression belongs to the linked character and has skill, gear and special-equipment child records.
- Hero Showcase is represented on the progression row rather than as a separate presentation aggregate.
- The editor can select any catalogue Hero, not only an eligible owned Hero.
- Showcase save clears the existing selection and then performs sequential writes. Partial failure can leave a partial result.
- Showcase writes also submit progression fields and null values, creating a risk that presentation editing overwrites unrelated progression data.

### Transfer Hub

- A transfer profile stores a character reference, current Kingdom and Alliance references, status, preferences, availability, public message, private notes and contact details.
- The UI describes the character as verified even though it only requires the currently linked primary row.
- Public listing and private/contact fields share one record and depend on policy filtering not reproducible from the repository.
- The public listing route links by player name rather than a stable public identity and the dedicated public transfer page is empty.
- Expiry, archival, consent withdrawal, contact disclosure and membership-history interaction are not defined.

### Notifications, availability and planning

- No shared notification platform exists.
- No character availability, campaign, rally, formation, assignment, confirmation, attendance, requisition or War Room persistence or server API exists.
- These are future capabilities and must depend on verified character identity and authoritative current membership.

### Server, API and migration posture

- Existing checked-in Vercel APIs serve editorial and data-engine behaviour; no Player-domain Vercel mutation API exists.
- Most sensitive Player mutations call Supabase directly from the browser.
- The checked-in migrations create editorial persistence additions, Hero Skills projection changes, Companion image policies and feedback reports.
- They do not create `profiles`, Player identity/profile/progression tables, base Hero collection tables, Kingdom or Alliance membership objects, Transfer objects, their public views, or their RPCs.
- The Player release document names a progression visibility migration that is not present in the audited history.
- Live-schema correctness and RLS safety cannot be inferred from application types.

## Behavioural Reference Inventory

This inventory contains observation only. It deliberately excludes contributed source details, names, contracts, schemas and implementation structure.

| User goal | Visible input | Visible output | Lifecycle or status | Broad business rule | Security or privacy concern |
| --- | --- | --- | --- | --- | --- |
| Prepare an Alliance for an event period | Event identity, dates, participating group | Named planning period and readiness summary | Draft, active, closed | Operational work belongs to one Alliance and time period | Only authorised leaders may create or close it |
| State when a player can participate | Character, time window or event segment, availability choice | Availability visible to the appropriate planning audience | Not submitted, available, unavailable, tentative, locked | One character submits its own intent for a planning period | Operational timing can expose real-world routines |
| Organise a rally | Rally time, objective, leader, participant intent | Rally roster and launch information | Draft, open, confirmed, launched, completed, cancelled | Membership and authority are evaluated for the scoped Alliance | Exact timing and formations must not be public |
| Coordinate synchronised launches | Launch order or timing offsets | Ordered launch plan and visible countdown state | Planned, confirmed, active, complete | Server time is authoritative | Stale clients and replayed actions can disrupt coordination |
| Prepare formations | Character-owned Heroes or troops and intended positions | Named formation visible to authorised participants | Draft, shared, locked, archived | Canonical Hero facts remain read-only; player state belongs to a character | Formation details are competitively sensitive |
| Assign participants | Character, role, rally or task | Assignment and confirmation state | Proposed, assigned, accepted, declined, replaced, complete | Leaders assign only current eligible members | Role escalation and cross-Alliance access must be prevented |
| Confirm attendance | Character and attendance choice | Participant and leadership attendance summary | Unknown, attending, absent, tentative, recorded | A player may declare their own intent; leaders record operational outcome with audit | Attendance may reveal personal schedules |
| Request resources or preparation | Character, requested item or target, amount and note | Request and fulfilment status | Draft, submitted, accepted, fulfilled, withdrawn, rejected | Requests are scoped to a campaign and character | Private notes and spending patterns require restricted visibility |
| Review operational readiness | Planning period, authorised filters | Aggregated availability, assignments and shortfalls | Live projection of underlying states | Summaries derive from authoritative records and must not become a second source of truth | Aggregation must not leak hidden member data |
| Receive reminders or announcements | Subscription, channel and quiet-hour preferences | Reminder or announcement delivery status | Scheduled, sent, failed, acknowledged, cancelled | Users own preferences; leaders own Alliance announcement intent | Consent, quiet hours and revoked-membership effects matter |
| Review history | Resource and time filter | Read-only transition history | Append-only | Material leadership and identity actions remain traceable | History must redact secrets and limit support access |

## Clean-Room Feature Gap Analysis

| Capability | Forge state | Gap before safe use |
| --- | --- | --- |
| Authenticated Forge user | Present | Clarify separation from profile and character identity |
| Character existence lookup | Present | Rate limiting, safe projection and enumeration controls |
| Character link | Present but browser-owned | Server-authoritative link transaction and conflict handling |
| Ownership verification | Vocabulary only | Provider-neutral claim, evidence, decision, expiry, revocation and dispute framework |
| Multiple characters | Data hint only | Many-link architecture, configurable server policy limit, primary/active separation and per-character state; no numeric hard limit |
| Public profile | Present | Unified visibility and safe server projection |
| Progression history | Present | Consistent validation, server mutation and visibility enforcement |
| Kingdom membership | Implicit | Explicit evidence-backed lifecycle and historical terms |
| Alliance membership | Partial | Reproducible schema, current-term invariant and audited transitions |
| Alliance authority | Partial/opaque | Resource-scoped R1–R5 capability model with server enforcement |
| Hero Collection | Present | Server API and transactional child updates |
| Hero Showcase | Present but unsafe | Owned-only eligibility and atomic replacement isolated from progression |
| Transfer Hub | Partial | Verified prerequisite, safe projection, contact consent and archival |
| Gift Centre identity | Manual foundation in Codex B | Active-character contract, verified-only gates where required and consent boundary |
| Notifications | Absent | User preferences, subscriptions, delivery and revocation model |
| Player Planning | Absent | Identity, membership, authority, visibility and audit prerequisites |

## Original Forge Domain Architecture

The audit recommends bounded services rather than a single Player service:

- Forge User Identity owns authentication-principal resolution.
- Character Identity owns observed game-character records and user-character associations.
- Character Verification owns cases, provider-neutral evidence and decisions.
- Player Profile and Character Progression own player-authored presentation and time-based progression.
- Kingdom and Alliance domains own membership terms and resource authority.
- Hero Personalisation owns character-owned Hero state and Showcase presentation.
- Transfer owns transfer intent and contact disclosure.
- Consent owns purpose-specific, versioned permission records.
- Notifications owns user delivery preferences and records.
- Player Planning consumes these domains but does not own or weaken them.

The definitive boundaries are in [Player Domain Architecture](../PLAYER_DOMAIN_ARCHITECTURE.md).

## Original Data Model

The audit recommended separating:

- game character from the Forge user-character link;
- link from verification case and decision;
- user profile from per-character profile;
- current membership from immutable membership history;
- Alliance rank assignments from membership tenure;
- Hero progression from Showcase presentation;
- public Transfer projection from private contact data;
- consent from feature-specific operational records;
- operational Player audit from editorial record history.

No schema was created. Final entity names and migration mapping are governed by the architecture document.

## Original Permission Model

The minimum safe model has four independent checks:

1. authenticated Forge actor;
2. verified ownership of the selected character where required;
3. current resource membership;
4. capability granted by an Alliance-scoped role or explicit support intervention.

Global Forge roles do not confer Alliance leadership. Client checks may hide or explain actions but never authorise them.

## Original API Surface

The audit recommended server APIs for character links, primary selection, verification, profile and privacy mutations, progression, membership transitions, Hero updates, Showcase replacement, Transfer intent, consent and future Planning. Public reads must use dedicated safe projections. Browser writes to the underlying Player tables should be removed incrementally after the server foundation is available.

## Original UI Structure

The audit recommended retaining familiar Forge journeys while making character context explicit:

- a character switcher and character management area within My Forge;
- a verification status and recovery journey;
- per-character profile, progression, Hero Collection and Transfer workspaces;
- public routes keyed by an approved opaque public identity;
- Alliance application and leadership surfaces guarded by server decisions;
- future Planning routes nested under the relevant Alliance and planning period.

No UI was implemented by the audit.

## Likely Supabase Changes — Not Created

Likely future work includes:

- a reviewed baseline for missing existing objects;
- separation of characters from links;
- verification, dispute and audit records;
- historical Kingdom and Alliance terms and role assignments;
- version columns and uniqueness constraints for mutable aggregates;
- purpose-specific consent;
- dedicated safe public projections;
- least-privilege grants and RLS for every exposed object;
- removal of direct browser mutation privileges after API migration;
- transaction functions only where a short, atomic database boundary is required and can be safely secured.

No migration or database command was created or run.

## Overlap Risk with Codex A

Codex A owns Editorial Platform Completion, editorial permission enforcement, validation, persistence, publishing and Dataset Verification. Its Verification Centre evaluates canonical-dataset readiness in an environment; it is unrelated to Character Ownership Verification. Player work must not reuse its statuses/contracts/routes or modify editorial APIs, services, dataset registries, default policies, publication persistence, migrations, package configuration or validation scripts. Player audit history remains distinct from Editorial history while following the same append-only principle.

## Overlap Risk with Codex B

Codex B owns Gift Centre safety contracts, the manual redemption journey, provider policy/execution and feature-specific consent/eligibility. At the final read-only snapshot, its official-provider integration design was committed and its worktree contained additional uncommitted provider-foundation changes; live execution remained disabled and no Player integration was added. Player work supplies an exact active-character, ownership/verification and purpose projection only. It must not import Codex B's official-flow reference, implement signing/session/provider/result logic, modify Codex B files, enable live automation or weaken Gift safety gates.

## Overlap Risk with Codex D

At the final read-only snapshot, Codex D had one Art Studio-specific audit commit and a clean worktree. No current path overlap exists. Its proposed public attribution choice remains unapproved. If Art Studio later uses Player identity, public creator attribution must use an approved Character Alias/Public Projection rather than raw Player IDs, Forge user IDs or Character Links. Codex C must not edit Art Studio routes, data, components or moderation workflows.

## Recommended First Implementation Milestone

The smallest safe first product milestone is not availability, Alliance membership, verification-provider implementation or a rally planner. Governance refines the audit recommendation to **Player Identity Foundation — Implementation Milestone 1**, preceded by approved read-only schema discovery and migration-recovery preparation.

Evidence for this choice:

- linking currently does not prove ownership;
- all downstream Player features bind to a primary linked row;
- Alliance and Transfer journeys already imply stronger identity than exists;
- Codex B needs an exact, trustworthy character context before provider execution;
- Planning requires membership and authority, which in turn require trustworthy character identity;
- checked-in schema history is not reproducible.

The milestone is limited to identity contracts, configurable Character Limit Policy, safe projection contracts, explicit Active Character context and server actor/character resolution interfaces. Verification remains an unavailable provider-neutral interface; no positive verification claim, Alliance authority, Gift provider, Planning code, schema or migration is included by default.

## Questions Requiring Approval

- Which verification providers and proof methods may be evaluated?
- What is the verification expiry policy?
- What finite default and entitlement/exception evaluation order should the configurable Character Limit Policy use at launch?
- May an external Player ID appear in public projections?
- Which visibility scopes and defaults does Clark approve?
- What powers, duration and reason requirements apply to support intervention?
- What retention periods apply to verification evidence, membership history, transfer contact, consent and audit?
- When may a read-only live-schema inventory be obtained, and who approves the production baseline?

The complete unresolved set is [Player Domain Decision Register](../PLAYER_DOMAIN_DECISION_REGISTER.md); no answer is inferred by recommendation.

## Implementation Entry Blockers

Implementation is blocked until the [Implementation Entry Criteria](../PLAYER_DOMAIN_IMPLEMENTATION_ENTRY_CRITERIA.md) are reviewed. Current blockers include Proposed architecture/ADRs/glossary, unresolved character-limit and primary/active policy, unapproved read-only schema discovery, no identified safe Supabase target, unapproved migration recovery, unresolved visibility/Player ID policy, pending security/privacy requirements, future naming/workstream reassessment and no approved milestone test/rollback charter.

Verification provider and Alliance Authority may be deferred only behind interfaces that return unavailable/denied and cannot create positive trust or authority. Production and public-release criteria remain separately blocking even after local implementation entry.

## Known Risks

- The live schema may differ materially from application expectations.
- Existing public views may expose internal user identifiers or other sensitive foreign keys.
- Current browser writes may rely on permissive policies that cannot be reviewed from Git.
- Existing verification-like values may not have evidence capable of migration to a verified state.
- Splitting `player_accounts` may require compatibility projections and a staged cutover.
- Multi-character support affects every current primary-character consumer.
- Operational timing and Transfer contact data require stricter privacy than profile data.

## Licence Boundary Confirmation

The contributed Kingshot KvK Planner was treated as behavioural reference only. The behavioural inventory records only user goals, visible inputs, visible outputs, lifecycle/status, broad business rules and security/privacy concerns.

For this audit:

- no contributed source code was copied;
- no contributed schema was copied;
- no contributed migration was copied;
- no contributed identifiers, function names, component names, API contracts or file structure were reused;
- no distinctive contributed implementation structure was reused;
- implementation proposals were derived from Forge, Clark’s requirements, the clean-room observations and general engineering principles;
- no product files were changed during the audit;
- no commits were created during the audit;
- no database commands were run during the audit.

The later ADR/glossary governance continuation changed documentation and created local documentation commits only. It added no Player Identity or Player Planning product code, API route, React component, server implementation, database schema, migration, dependency, Supabase command/write, external mutation request or deployment. It did not copy contributed source or reuse contributed implementation structure.

## Git status -sb

Audit completion state before this record was later documented:

```text
## feature/player-planning-foundation
```
