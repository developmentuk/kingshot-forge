# Kingshot Forge Player Domain Glossary

**Status:** Proposed for Clark and Aegis approval; selected terms implemented as local Sprint 9.3 contracts
**Owner:** Player Domain architecture
**Version:** 1.1
**Date:** 17 July 2026
**Last reviewed:** 17 July 2026

## Purpose

This glossary is the canonical language for Player, character, membership, visibility and future Planning work. All definitions are Proposed until the glossary is approved. Implementations must not use an ambiguous shorter word where the qualified term changes authority, privacy or lifecycle.

Privacy classifications used here are **Public**, **Scoped**, **Private**, **Restricted** and **Contextual**. Contextual means the record contains fields with different classifications and must be projected deliberately.

## Identity and verification

### Forge User

- **Canonical definition:** The person/account represented by a server-validated Supabase Auth principal in Forge.
- **What it is not:** A Kingshot character, Player ID, Alliance member or verified owner.
- **Domain owner:** Forge User Identity.
- **Privacy classification:** Private; selected profile fields may have separate projections.
- **Implementation notes:** Server code derives the Forge User from the authenticated session.
- **Related terms:** Actor, Game Character, Character Link, Forge Global Role.

### Game Character

- **Canonical definition:** A Kingshot in-game character identified by a stable external Player ID and represented independently of any Forge user.
- **What it is not:** A Forge account, Character Link or ownership proof.
- **Domain owner:** Player Character Identity.
- **Privacy classification:** Contextual; external Player ID is sensitive, safe display fields may be scoped/public.
- **Implementation notes:** One character can have historical links but no more than one effective verified owner.
- **Related terms:** Observed Character, Character Record, Character Ownership.

### Observed Character

- **Canonical definition:** A Game Character whose existence and visible attributes were obtained from an approved lookup or observation.
- **What it is not:** A linked, verified or currently owned character.
- **Domain owner:** Player Character Identity.
- **Privacy classification:** Private/internal until projected.
- **Implementation notes:** Observation provenance and freshness are recorded; refresh does not rewrite ownership history.
- **Related terms:** Game Character, Character Record, Character Link.

### Character Record

- **Canonical definition:** Forge's internal representation of one observed Game Character, independent of a user association.
- **What it is not:** A public profile, authentication record or Character Link.
- **Domain owner:** Player Character Identity.
- **Privacy classification:** Restricted/internal with safe projections.
- **Implementation notes:** Physical table/entity name remains subject to schema discovery; this glossary defines semantics, not schema.
- **Related terms:** Game Character, Observed Character, Public Projection.

### Character Link

- **Canonical definition:** An effective-dated association asserting that a Forge User manages or claims a Game Character in Forge.
- **What it is not:** Proof of ownership, verification or permanent identity fusion.
- **Domain owner:** Player Character Identity.
- **Privacy classification:** Private.
- **Implementation notes:** Link creation is server-authoritative, limit-policy checked, revocable and auditable.
- **Related terms:** Linked Character, Verified Character, Character Ownership.

### Linked Character

- **Canonical definition:** A Game Character with a current Character Link to the authenticated Forge User.
- **What it is not:** Necessarily verified, primary, active, a Kingdom member or an Alliance member.
- **Domain owner:** Player Character Identity.
- **Privacy classification:** Private; selected character fields may be projected.
- **Implementation notes:** Low-risk features may accept linked state only when their policy explicitly says so.
- **Related terms:** Character Link, Verified Character, Primary Character, Active Character.

### Verified Character

- **Canonical definition:** A Linked Character with a current effective ownership Verification Decision that is not expired, revoked or disputed.
- **What it is not:** A character that merely passed public lookup or has an unreviewed label.
- **Domain owner:** Character Verification.
- **Privacy classification:** Private status; safe status may be purpose-scoped.
- **Implementation notes:** Effective status is derived server-side on every verified-only action.
- **Related terms:** Character Ownership Verification, Verification Decision, Verification Revocation.

### Primary Character

- **Canonical definition:** The user's persisted default/convenience choice among current Character Links.
- **What it is not:** The automatically authorised subject of every request or a stronger ownership state.
- **Domain owner:** Player Character Identity.
- **Privacy classification:** Private preference.
- **Implementation notes:** Recommended exactly one when current links exist; policy remains Proposed.
- **Related terms:** Active Character, Linked Character, Character Limit Policy.

### Active Character

- **Canonical definition:** The exact linked character explicitly resolved for the current request or workspace.
- **What it is not:** A synonym for Primary Character or a client-authoritative global session value.
- **Domain owner:** Player Character Identity with the consuming domain.
- **Privacy classification:** Private request context.
- **Implementation notes:** Sensitive operations bind an opaque character reference and re-authorise it server-side.
- **Related terms:** Primary Character, Actor, Subject, Revision.

### Character Alias

- **Canonical definition:** An opaque, non-sequential public-safe identifier for a Character projection.
- **What it is not:** The external Player ID, internal character key, Forge user ID or player name.
- **Domain owner:** Player Profile/Visibility.
- **Privacy classification:** Public when its projection is public.
- **Implementation notes:** Alias rotation and redirect policy require approval; aliases do not grant access.
- **Related terms:** Public Projection, Game Character, Visibility Scope.

### Character Ownership

- **Canonical definition:** The effective, evidence-backed relationship that a Forge User currently controls a Game Character for approved Forge purposes.
- **What it is not:** Legal property ownership, a Character Link or permanent entitlement.
- **Domain owner:** Character Verification.
- **Privacy classification:** Restricted relationship with safe owner status.
- **Implementation notes:** Ownership is established only through Character Ownership Verification policy.
- **Related terms:** Character Link, Verified Character, Character Ownership Verification.

### Character Ownership Verification

- **Canonical definition:** The Player-domain process that evaluates evidence and decides whether a Forge User controls a Game Character.
- **What it is not:** Dataset readiness verification, lookup success or editorial record verification.
- **Domain owner:** Character Verification.
- **Privacy classification:** Restricted.
- **Implementation notes:** Always use the qualified name when Codex A's Dataset Verification could be confused.
- **Related terms:** Dataset Verification, Verification Case, Verification Decision.

### Dataset Verification

- **Canonical definition:** Codex A's evidence-based assessment of whether canonical dataset capabilities are ready in a named environment.
- **What it is not:** Character ownership proof or a Player permission.
- **Domain owner:** Editorial Intelligence/Verification Centre.
- **Privacy classification:** Internal operational evidence, subject to its own safe projections.
- **Implementation notes:** Its statuses, routes and contracts must not be reused for Character Ownership Verification.
- **Related terms:** Character Ownership Verification, Verification Evidence.

### Verification Case

- **Canonical definition:** One bounded ownership-verification, recovery or re-verification review for a Character Link.
- **What it is not:** The effective ownership status or an editable verification boolean.
- **Domain owner:** Character Verification.
- **Privacy classification:** Restricted with an owner-safe summary.
- **Implementation notes:** Carries purpose, policy/provider version, lifecycle, expiry and immutable decisions.
- **Related terms:** Verification Evidence, Verification Decision, Verification Dispute.

### Verification Evidence

- **Canonical definition:** Protected information or metadata submitted/collected to support or contradict a Verification Case.
- **What it is not:** Public profile content, a reusable credential or the decision itself.
- **Domain owner:** Character Verification.
- **Privacy classification:** Restricted/high sensitivity.
- **Implementation notes:** Minimise, protect, access-audit and retain only under approved policy.
- **Related terms:** Verification Case, Verification Decision, Data Classification.

### Verification Decision

- **Canonical definition:** An immutable, attributable outcome applying a versioned policy to a Verification Case for an effective period.
- **What it is not:** A mutable status label, provider response alone or support assertion.
- **Domain owner:** Character Verification.
- **Privacy classification:** Restricted; owner-safe outcome may be private.
- **Implementation notes:** New decisions record expiry, revocation, restoration or rejection without rewriting prior outcomes.
- **Related terms:** Verified Character, Verification Expiry, Verification Revocation.

### Verification Provider

- **Canonical definition:** An approved boundary that supplies a proof mechanism, assertion or reviewed evidence process for Character Ownership Verification.
- **What it is not:** Approved merely because it is technically possible or used by another feature.
- **Domain owner:** Character Verification.
- **Privacy classification:** Contextual; configuration restricted, owner instructions private.
- **Implementation notes:** No provider is currently approved.
- **Related terms:** Verification Case, Verification Evidence, Character Ownership Verification.

### Verification Expiry

- **Canonical definition:** The time or event after which a positive Verification Decision no longer grants verified status.
- **What it is not:** Deletion of the link, case, decision or audit history.
- **Domain owner:** Character Verification.
- **Privacy classification:** Private/restricted status.
- **Implementation notes:** Expiry policy may vary by approved provider and requires re-verification for restoration.
- **Related terms:** Verified Character, Verification Decision, Verification Revocation.

### Verification Revocation

- **Canonical definition:** A new authoritative decision that ends verified eligibility before or at its normal expiry.
- **What it is not:** Silent status editing or deletion of evidence/history.
- **Domain owner:** Character Verification.
- **Privacy classification:** Restricted with owner-safe notice.
- **Implementation notes:** Immediately invalidates verified-only downstream operations and subscriptions.
- **Related terms:** Verification Decision, Verification Dispute, Audit Event.

### Verification Dispute

- **Canonical definition:** A recorded conflict or challenge concerning Character Ownership, evidence or an effective verification decision.
- **What it is not:** An informal support note or automatic transfer of ownership.
- **Domain owner:** Character Verification with Support governance.
- **Privacy classification:** Restricted/high sensitivity.
- **Implementation notes:** Freezes high-risk permissions until reviewed; resolution appends decisions/events.
- **Related terms:** Verification Case, Support Intervention, Verification Revocation.

### Forge Global Role

- **Canonical definition:** A platform-wide Forge role governing administration capabilities such as Editorial access.
- **What it is not:** Alliance Rank, Alliance Membership or automatic Leadership.
- **Domain owner:** Permissions platform.
- **Privacy classification:** Restricted/internal.
- **Implementation notes:** Current examples include owner/admin/moderator; Player work must not repurpose them as Alliance ranks.
- **Related terms:** Alliance Rank, Alliance Authority, Actor.

### Character Limit Policy

- **Canonical definition:** The server-evaluated product/commercial policy that determines how many current Character Links an account may create or retain.
- **What it is not:** A schema cardinality, architectural maximum or promise of unlimited default use.
- **Domain owner:** Player product policy with Character Identity enforcement.
- **Privacy classification:** Private entitlement outcome; policy definition internal/product-facing.
- **Implementation notes:** May consider default allowance, supporter tier, Alliance-role entitlement, administrative exception or future subscription; none is implemented here.
- **Related terms:** Character Link, Entitlement Policy, Primary Character.

### Entitlement Policy

- **Canonical definition:** A future approved policy translating account/product state into feature or quantity allowances.
- **What it is not:** An implemented subscription system or an automatic permission to bypass security rules.
- **Domain owner:** Platform/product policy.
- **Privacy classification:** Private account/commercial data.
- **Implementation notes:** Entitlement changes never grant ownership, verification or Alliance authority.
- **Related terms:** Character Limit Policy, Alliance Capability, Support Intervention.

## Kingdom and Alliance

### Kingdom

- **Canonical definition:** A Kingshot Kingdom master record owned by the Kingdom Domain.
- **What it is not:** A Character's current membership or a user-entered profile string.
- **Domain owner:** Kingdom Domain.
- **Privacy classification:** Public canonical/community fields plus scoped administration.
- **Implementation notes:** Player records reference a stable Kingdom key.
- **Related terms:** Kingdom Membership, Kingdom Membership Term.

### Kingdom Membership

- **Canonical definition:** The effective relationship derived from the current qualifying Kingdom Membership Term for a Game Character.
- **What it is not:** A lookup observation, permanent character attribute or Alliance membership.
- **Domain owner:** Kingdom Domain with Player identity validation.
- **Privacy classification:** Scoped/contextual.
- **Implementation notes:** Current state is derived, not stored as an unaudited mutable field.
- **Related terms:** Kingdom Membership Term, Observed Character, Alliance Membership.

### Kingdom Membership Term

- **Canonical definition:** An effective-dated observed, claimed, confirmed, former or disputed record relating a character to a Kingdom.
- **What it is not:** An overwrite-only current Kingdom value.
- **Domain owner:** Kingdom Domain.
- **Privacy classification:** Scoped; evidence restricted.
- **Implementation notes:** Terms preserve start/end and source/decision evidence.
- **Related terms:** Kingdom Membership, Verification Evidence, Transfer Listing.

### Alliance

- **Canonical definition:** A Forge representation of a Kingshot Alliance and its approved public/community attributes.
- **What it is not:** A membership, rank, global Forge role or self-reported profile value.
- **Domain owner:** Alliance Domain.
- **Privacy classification:** Public master fields plus scoped/private operations.
- **Implementation notes:** Alliance resource identifiers scope membership and capabilities.
- **Related terms:** Alliance Application, Alliance Membership, Resource Scope.

### Alliance Application

- **Canonical definition:** A character's request to join a specific Alliance and the associated review decision lifecycle.
- **What it is not:** Alliance Membership, rank or authority.
- **Domain owner:** Alliance Domain.
- **Privacy classification:** Private to applicant and authorised leadership; messages restricted.
- **Implementation notes:** Approval creates a separate membership term atomically.
- **Related terms:** Alliance Membership Term, Alliance Authority, Active Character.

### Alliance Membership

- **Canonical definition:** The current effective relationship between a Game Character and an Alliance, derived from a Membership Term.
- **What it is not:** An application, profile label, Forge User role or automatic leadership.
- **Domain owner:** Alliance Domain.
- **Privacy classification:** Alliance-scoped with approved roster projection.
- **Implementation notes:** Former or disputed terms do not grant current access.
- **Related terms:** Alliance Membership Term, Alliance Rank, Alliance Application.

### Alliance Membership Term

- **Canonical definition:** An effective-dated tenure record for a character in one Alliance.
- **What it is not:** A rank assignment or mutable “current alliance” text field.
- **Domain owner:** Alliance Domain.
- **Privacy classification:** Alliance/scoped; reasons and disputes restricted.
- **Implementation notes:** One current term per character is the proposed default invariant.
- **Related terms:** Alliance Membership, Alliance Rank, Kingdom Membership Term.

### Alliance Rank

- **Canonical definition:** An effective R1–R5 game-domain rank term attached to one Alliance Membership Term.
- **What it is not:** A global Forge role or complete authorisation decision.
- **Domain owner:** Alliance Authority.
- **Privacy classification:** Alliance-scoped; history may be leadership/restricted.
- **Implementation notes:** Rank contributes to capability evaluation but numeric comparison alone is insufficient.
- **Related terms:** Forge Global Role, Alliance Authority, Alliance Capability.

### Alliance Authority

- **Canonical definition:** The server decision that an Actor may perform a named Alliance Capability on a specific Resource Scope now.
- **What it is not:** A client flag, rank label alone or platform-admin shortcut.
- **Domain owner:** Alliance Authority.
- **Privacy classification:** Restricted decision with safe UI explanation.
- **Implementation notes:** Evaluates verified character, current membership/rank, delegation, scope and revision.
- **Related terms:** Alliance Capability, Alliance Delegation, Resource Scope.

### Alliance Capability

- **Canonical definition:** A named, reviewable action that can be granted/evaluated within an Alliance Resource Scope.
- **What it is not:** A page, rank name or broad “manage everything” boolean.
- **Domain owner:** Alliance Authority.
- **Privacy classification:** Internal policy; individual grants restricted.
- **Implementation notes:** Capability registry and grant ceilings require approval.
- **Related terms:** Alliance Authority, Alliance Rank, Alliance Delegation.

### Alliance Delegation

- **Canonical definition:** A time-bounded, revocable grant of specific Alliance Capabilities within an exact Resource Scope.
- **What it is not:** Rank promotion, membership or transferable global permission.
- **Domain owner:** Alliance Authority.
- **Privacy classification:** Leadership/restricted.
- **Implementation notes:** Requires delegator authority, expiry, reason and audit.
- **Related terms:** Alliance Capability, Leadership, Audit Event.

### Leadership

- **Canonical definition:** The audience and responsibility formed by current Alliance Authority for approved leadership capabilities.
- **What it is not:** Every Alliance member, every R-rank by default or every Forge administrator.
- **Domain owner:** Alliance Domain.
- **Privacy classification:** Alliance leadership-scoped.
- **Implementation notes:** Leadership is evaluated for the specific resource/action rather than stored as a universal boolean.
- **Related terms:** Alliance Authority, Alliance Rank, Visibility Scope.

## Visibility, profile and integrations

### Visibility Scope

- **Canonical definition:** The approved audience category applied to a record or projection: public, kingdom, alliance, leadership, private or restricted.
- **What it is not:** A guarantee that every field is visible to that audience.
- **Domain owner:** Shared Player visibility policy with the owning domain.
- **Privacy classification:** Policy metadata; usually private/internal.
- **Implementation notes:** Entity-specific field allowlists and current resource relationships are evaluated separately.
- **Related terms:** Public Projection, Private Projection, Restricted Projection.

### Public Projection

- **Canonical definition:** A versioned, allowlisted representation safe for unauthenticated audiences under the current visibility policy.
- **What it is not:** A raw table row, browser join or permission to expose internal/external identifiers.
- **Domain owner:** Owning domain plus Public API/Visibility policy.
- **Privacy classification:** Public.
- **Implementation notes:** Uses opaque aliases, bounded search, rate limits and cache invalidation.
- **Related terms:** Character Alias, Visibility Scope, Public Data API.

### Private Projection

- **Canonical definition:** A field-minimised representation available to the authenticated owner for an approved purpose.
- **What it is not:** Raw unrestricted database access or a public response with extra fields.
- **Domain owner:** Owning product domain.
- **Privacy classification:** Private.
- **Implementation notes:** Actor ownership and exact character are resolved server-side.
- **Related terms:** Owner, Active Character, Restricted Projection.

### Restricted Projection

- **Canonical definition:** A minimal representation available only to explicitly authorised reviewers, support or security roles for a scoped purpose.
- **What it is not:** An administrator's unrestricted view or a normal owner projection.
- **Domain owner:** Owning domain with Security/Privacy governance.
- **Privacy classification:** Restricted.
- **Implementation notes:** Sensitive reads require reason/case, least privilege and access audit where approved.
- **Related terms:** Support Intervention, Verification Evidence, Resource Scope.

### Consent

- **Canonical definition:** A versioned, purpose-specific, informed and revocable grant by a Forge User for an identified character/action/data use.
- **What it is not:** A mutable generic boolean, bundled terms acceptance or Alliance leader approval on another player's behalf.
- **Domain owner:** Consent/Privacy boundary; consuming feature owns its wording and purpose.
- **Privacy classification:** Private/restricted evidence.
- **Implementation notes:** Withdrawal is effective immediately for new actions; one character/purpose does not transfer to another.
- **Related terms:** Gift Centre Eligibility, Transfer Contact Details, Audit Event.

### Player Profile

- **Canonical definition:** User-authored presentation and preferences for one linked Game Character under explicit visibility policy.
- **What it is not:** The Forge User account profile, canonical game facts, verified Kingdom/Alliance membership or ownership proof.
- **Domain owner:** Player Profile.
- **Privacy classification:** Contextual; private by default with safe scoped/public projection.
- **Implementation notes:** References the active/owned character and canonical keys without duplicating canonical facts.
- **Related terms:** Game Character, Visibility Scope, Public Projection.

### Hero Ownership

- **Canonical definition:** Character-specific Player state asserting that the active character owns a canonical Hero record under Player policy.
- **What it is not:** Canonical Hero existence, Showcase placement or proof of character ownership.
- **Domain owner:** Hero Personalisation/Player Domain.
- **Privacy classification:** Private/scoped.
- **Implementation notes:** Stored separately from canonical Hero facts and validated for the exact active character.
- **Related terms:** Hero Collection, Hero Showcase, Active Character.

### Hero Collection

- **Canonical definition:** The aggregate of one character's Hero Ownership and personal progression records referencing canonical Heroes.
- **What it is not:** The canonical Hero catalogue or a public Showcase.
- **Domain owner:** Hero Personalisation/Player Domain.
- **Privacy classification:** Private/scoped.
- **Implementation notes:** Cross-character reads/writes are denied; canonical fields remain read-only references.
- **Related terms:** Hero Ownership, Hero Showcase, Player Profile.

### Hero Showcase

- **Canonical definition:** An ordered presentation of eligible owned Heroes for one character under a visibility policy.
- **What it is not:** Hero ownership evidence or a progression editor.
- **Domain owner:** Hero Showcase/Player Domain.
- **Privacy classification:** Contextual; private by default, allowlisted when shared/public.
- **Implementation notes:** References Hero Collection rows, replaces atomically and cannot mutate progression.
- **Related terms:** Hero Collection, Public Projection, Revision.

### Transfer Listing

- **Canonical definition:** A verified-character-owned lifecycle record advertising approved transfer preferences and public/scoped information.
- **What it is not:** Private contact details, verified ownership itself or permanent publication.
- **Domain owner:** Transfer Domain.
- **Privacy classification:** Contextual; listing projection public/scoped, source record private.
- **Implementation notes:** Supports draft, listed, paused, matched, completed, withdrawn, expired and archived behaviour subject to approval.
- **Related terms:** Transfer Contact Details, Verified Character, Consent.

### Transfer Contact Details

- **Canonical definition:** Private communication information associated with a Transfer Listing and disclosed only for an approved purpose.
- **What it is not:** Part of the public listing or automatically visible to every Alliance leader.
- **Domain owner:** Transfer Domain.
- **Privacy classification:** Restricted/high sensitivity.
- **Implementation notes:** Separate storage/projection, current consent and recruiter authority; access removed promptly on withdrawal.
- **Related terms:** Transfer Listing, Consent, Restricted Projection.

### Gift Centre Eligibility

- **Canonical definition:** Gift Centre's current decision that one exact verified character and consent state satisfy the prerequisites to request a redemption action.
- **What it is not:** Provider success, a redemption request/result or permission for Player Domain to execute the provider.
- **Domain owner:** Gift Centre, consuming Player identity projection.
- **Privacy classification:** Private/restricted decision.
- **Implementation notes:** Rechecked before provider activity; client Player ID is never authoritative.
- **Related terms:** Verified Character, Active Character, Provider Execution.

### Provider Execution

- **Canonical definition:** Gift Centre's server-only interaction with the approved external redemption provider, including signing/session/transport/result handling.
- **What it is not:** Player identity resolution or Gift Centre Eligibility.
- **Domain owner:** Gift Centre.
- **Privacy classification:** Restricted operational/security boundary.
- **Implementation notes:** No live provider is approved by Player governance; credentials and results never enter Player Domain.
- **Related terms:** Gift Centre Eligibility, Consent, Audit Event.

### Data Classification

- **Canonical definition:** The assigned sensitivity and purpose category that controls audience, handling, retention, deletion and export.
- **What it is not:** Visibility alone or a substitute for authorisation.
- **Domain owner:** Owning domain with Privacy/Security governance.
- **Privacy classification:** Internal policy metadata.
- **Implementation notes:** Classify before setting retention or migrating uncertain legacy data.
- **Related terms:** Visibility Scope, Verification Evidence, Audit Event.

## Planning and operations

### Player Availability

- **Canonical definition:** A character's scoped response about ability or intent to participate in a defined planning period/segment.
- **What it is not:** Player Planning as a whole, attendance outcome, public schedule or membership proof.
- **Domain owner:** Future Player Planning/Operations Domain.
- **Privacy classification:** Alliance/leadership or private; never public by default.
- **Implementation notes:** First proposed Planning extension after identity/membership/authority foundations.
- **Related terms:** Player Planning, Attendance, Assignment.

### Player Planning

- **Canonical definition:** The future bounded domain coordinating Alliance-scoped availability, rallies, formations, assignments, requisitions, attendance and derived readiness.
- **What it is not:** Player Profile, canonical event/scoring data or an implemented current capability.
- **Domain owner:** Future Player Planning/Operations Domain.
- **Privacy classification:** Primarily alliance/leadership/restricted.
- **Implementation notes:** Must depend on verified identity, confirmed membership, Alliance Authority, visibility and audit.
- **Related terms:** Player Availability, Rally, Formation, Assignment.

### Rally

- **Canonical definition:** An Alliance-scoped planned operational objective with server time, leader, participant terms and lifecycle.
- **What it is not:** A public event definition, canonical game fact or informal chat message.
- **Domain owner:** Future Player Planning.
- **Privacy classification:** Alliance participants/leadership; timing restricted.
- **Implementation notes:** Requires eligible leader authority, explicit participants, revision and auditable transitions.
- **Related terms:** Formation, Assignment, Attendance.

### Formation

- **Canonical definition:** A character-owned ordered preparation using canonical Hero/troop references for a planning purpose.
- **What it is not:** Canonical Hero data, Hero Showcase or proof of ownership beyond referenced Player state.
- **Domain owner:** Future Player Planning with Hero Personalisation references.
- **Privacy classification:** Private/assigned/leadership.
- **Implementation notes:** Competitive composition details are not public; locking/sharing is explicit.
- **Related terms:** Rally, Hero Collection, Assignment.

### Assignment

- **Canonical definition:** A leadership-issued, scoped request for one character to perform a Planning task, role or Rally position.
- **What it is not:** Alliance Rank, permanent authority or attendance outcome.
- **Domain owner:** Future Player Planning.
- **Privacy classification:** Target participant and authorised leadership.
- **Implementation notes:** Separate proposal, acceptance/decline, replacement and completion history.
- **Related terms:** Rally, Formation, Attendance.

### Attendance

- **Canonical definition:** A Planning record distinguishing a character's declared participation intent from a leader-recorded operational outcome.
- **What it is not:** Player Availability alone or a public real-world schedule.
- **Domain owner:** Future Player Planning.
- **Privacy classification:** Alliance/leadership/private.
- **Implementation notes:** Intent and outcome retain different actor/evidence semantics and privacy periods.
- **Related terms:** Player Availability, Assignment, Audit Event.

## Authority and technical governance

### Audit Event

- **Canonical definition:** An append-only, attributable record of a material Player-domain state change or sensitive support/security action.
- **What it is not:** A mutable activity log, raw request payload, secret dump or Editorial audit record.
- **Domain owner:** Player audit/security boundary.
- **Privacy classification:** Restricted.
- **Implementation notes:** Contains safe actor, subject, resource, before/after, reason, correlation, environment and policy context.
- **Related terms:** Actor, Subject, Revision, Idempotency Key.

### Support Intervention

- **Canonical definition:** A case/reason-bound, resource- and capability-scoped support action performed under an approved time-limited grant.
- **What it is not:** Silent impersonation, database editing or unrestricted administrator power.
- **Domain owner:** Support governance with the affected domain.
- **Privacy classification:** Restricted/high sensitivity.
- **Implementation notes:** Read-only by default; high-risk positive actions require four-eyes approval where policy requires.
- **Related terms:** Audit Event, Resource Scope, Verification Dispute.

### Resource Scope

- **Canonical definition:** The exact Alliance, character, case, listing, planning period or other resource boundary within which a capability decision applies.
- **What it is not:** A global role or route string alone.
- **Domain owner:** Shared authorisation policy with the resource-owning domain.
- **Privacy classification:** Internal/restricted authorisation context.
- **Implementation notes:** Server resolves scope from stable records and current relationships.
- **Related terms:** Alliance Authority, Alliance Capability, Subject.

### Actor

- **Canonical definition:** The authenticated user, approved service, reviewer or support principal that initiates or performs an action.
- **What it is not:** Necessarily the affected character, owner or subject.
- **Domain owner:** Shared identity/audit platform.
- **Privacy classification:** Restricted/internal; safe attribution may be shown to affected owners.
- **Implementation notes:** Actor identity is server-derived and recorded with actor type.
- **Related terms:** Subject, Owner, Audit Event.

### Subject

- **Canonical definition:** The person, Game Character or resource whose state or rights are affected by an action.
- **What it is not:** Necessarily the Actor or record Owner.
- **Domain owner:** Owning domain.
- **Privacy classification:** Follows the subject/resource classification.
- **Implementation notes:** Audit and authorisation keep actor, subject and resource distinct.
- **Related terms:** Actor, Owner, Resource Scope.

### Owner

- **Canonical definition:** The principal or domain with authority/responsibility over a specific record, capability or lifecycle under policy.
- **What it is not:** Always the Forge User, legal property ownership or unrestricted access.
- **Domain owner:** Context-dependent; use a qualified form such as character owner, record owner or domain owner.
- **Privacy classification:** Contextual.
- **Implementation notes:** Bare “owner” is prohibited in security rules when the owned object is ambiguous.
- **Related terms:** Actor, Subject, Character Ownership.

### Revision

- **Canonical definition:** A monotonic concurrency/version marker for one mutable aggregate or projection contract.
- **What it is not:** Audit history, a timestamp alone or proof of identity.
- **Domain owner:** Owning domain/service.
- **Privacy classification:** Internal; may appear in owner-safe command responses.
- **Implementation notes:** Sensitive mutations compare expected revision and reject stale writes.
- **Related terms:** Idempotency Key, Audit Event, Active Character.

### Idempotency Key

- **Canonical definition:** A client/request token bound server-side to actor, command scope, subject and request hash so safe replay returns the same outcome.
- **What it is not:** Authentication, permission, a globally reusable key or permission to retry an ambiguous external mutation.
- **Domain owner:** Server application/platform boundary.
- **Privacy classification:** Restricted/internal.
- **Implementation notes:** Store a hash/receipt with bounded retention; reject same key with different request material.
- **Related terms:** Revision, Actor, Subject, Audit Event.

### Public Data API

- **Canonical definition:** The approved anonymous-facing contract serving allowlisted public projections through a server API or reviewed exposed database object.
- **What it is not:** The complete Supabase schema or automatic access to tables in `public`.
- **Domain owner:** Player API architecture with Database/Security review.
- **Privacy classification:** Public output; implementation details restricted.
- **Implementation notes:** Explicit grants, RLS/view posture, rate limits, aliases, versioning and cache policy are required.
- **Related terms:** Public Projection, Visibility Scope, Character Alias.

## Terminology conflicts

| Ambiguous word | Required qualified usage | Prohibited inference |
| --- | --- | --- |
| verification | Say **Dataset Verification** or **Character Ownership Verification**. | Dataset readiness never proves character ownership; character verification never publishes canonical data. |
| owner | Say character owner, record owner, domain owner or decision owner. | “Owner” never means unrestricted access without the object and policy. |
| member | Say Kingdom member, Alliance member, current member or former member. | An applicant, profile label or Forge user is not automatically an Alliance member. |
| active | Say Active Character, active link, active term, active listing or active planning period. | Active Character is not Primary Character; active record is not necessarily authorised. |
| primary | Say Primary Character when referring to the persisted default. | Primary does not mean active, verified, most powerful or sole character. |
| public | Say public field, Public Projection, public route or public visibility scope. | A public record does not make every source field or identifier public. |
| role | Say Forge Global Role, Alliance Rank or Planning role. | A global Forge role never implies Alliance Authority. |
| rank | Say Alliance Rank or game rank with its domain. | Numeric R-rank alone is not a full capability decision. |
| profile | Say Forge user profile, Player Profile or Transfer Listing. | Profile text does not prove identity, membership or authority. |
| identity | Say Forge User Identity, Game Character Identity or public Character Alias. | Authentication identity and game identity are not interchangeable. |
| availability | Say Player Availability, provider availability or service availability. | Player Availability is not all of Player Planning and must not describe provider uptime. |

## Governance references

- [ADR convention and registry](./ADR/README.md)
- [Player Domain Architecture](./PLAYER_DOMAIN_ARCHITECTURE.md)
- [Player Decision Register](./PLAYER_DOMAIN_DECISION_REGISTER.md)
- [Player Approval Matrix](./PLAYER_DOMAIN_APPROVAL_MATRIX.md)
- [Implementation Entry Criteria](./PLAYER_DOMAIN_IMPLEMENTATION_ENTRY_CRITERIA.md)

## Sprint 9.3 contract usage

The local contract foundation now uses the qualified terms **Forge User Identity**, **Game Character Identity**, **Character Link**, **Character Ownership Verification**, **Primary Character**, **Active Character**, **Public Player Alias**, **Private Player Projection** and **Public Player Projection**. This implementation is evidence for review, not approval of the glossary.

The contract-only visibility audience values `selected_fields` and `authenticated_forge_users` express evaluation inputs for the narrow policy. They do not replace or accept the broader Proposed Visibility Scope taxonomy. Before production, Clark, Aegis, Privacy and Security must reconcile those policy inputs with PD-007 and ADR-0105.
