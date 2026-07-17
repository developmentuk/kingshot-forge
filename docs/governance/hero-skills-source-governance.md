# Hero Skills Source Governance

## Authority and scope

This document governs how Hero Skill evidence may progress from an external observation to a published Kingshot Forge canonical fact. It implements the evidence, provenance and publication principles in `docs/AEGIS.md` without replacing the Data Engine, Editorial Platform or Verification Centre.

It applies to Hero Skill identity, names, categories, slots, descriptions, progression levels and unlock requirements. It does not govern editorial recommendations or Exclusive Gear facts.

The 60 existing `source_hero_skill_facts` rows remain staged and unapproved. This policy does not approve, promote or copy them.

## Lifecycle vocabulary

| Term | Meaning | Canonical/public authority |
|---|---|---|
| Extracted | Raw text or structure was observed or captured. | None |
| Staged | Extracted evidence was normalised enough for review and retained with provenance. | None |
| Reviewed | A named reviewer assessed source, content, conflicts and permitted use. | None |
| Approved | A reviewer recorded a record-level evidence decision, approved permitted use and required attribution. | May support canonical drafting |
| Canonical | A governed Hero Skill record passed the canonical contract and references approved evidence. | Canonical fact, but not necessarily public |
| Editorial | Subjective guidance that references canonical facts without owning them. | Editorial Domain only |
| Published | An approved immutable canonical version was projected through the Publishing Platform. | Public consumption |
| Withdrawn | Evidence or a canonical record is no longer eligible for new publication; history is retained. | Excluded from new public projections |

Scraping, extraction, staging, confidence scoring and source popularity never imply approval.

## Acceptable source classes

The following source classes may enter evidence review:

1. Official game announcements, patch notes or in-game evidence with a traceable date and origin.
2. Authoritative publisher material with clear ownership and permitted use.
3. Structured datasets already approved by Forge, including an explicit licence and attribution requirement.
4. Community sources where permitted use is documented and material facts can be corroborated.
5. User-submitted screenshots or observations where the submitter grants the required use and the evidence is retained safely.
6. Archives used to establish historical versions, provided provenance and permitted use are documented.

An acceptable source class is eligible for review, not automatically suitable for canonical promotion.

## Rejected source classes

The following must not support canonical promotion:

- unattributed copied content;
- unverifiable memory or recollection;
- generated or speculative content;
- source material with rejected, unknown or incompatible permitted use;
- staged facts without preserved evidence or a digest;
- source-row identifiers presented as canonical skill identity;
- pages that provide only subjective rankings or recommendations for a factual field;
- unrelated domain data, including Master skills, Governor Gear or Exclusive Gear facts;
- conflicting claims that have no deterministic, reviewed resolution;
- translations with no traceable source text or translation review.

## Minimum source evidence

Every evidence record requires:

- stable evidence identity;
- dataset and source identity;
- source name and URL, or a documented authoritative origin when no URL exists;
- retrieval timestamp;
- SHA-256 content digest;
- source version or the explicit marker `unversioned` when the source has no version;
- licensing or permitted-use decision;
- attribution requirement, including “none required” when applicable;
- extraction method;
- review status;
- reviewer identity and review timestamp for approval;
- private evidence notes where required;
- supersession and withdrawal state;
- optimistic revision number and timestamps.

Evidence notes, licensing deliberations and reviewer identities are private operational data. The public projection may expose only a safe source summary.

## Licensing and attribution

Before evidence can be approved, a reviewer must record one of these decisions:

- `approved`: Forge may use the evidence for the stated purpose;
- `restricted`: use is conditional and therefore blocked from canonical promotion until the restriction is resolved;
- `rejected`: Forge may retain only the minimum audit record permitted by policy;
- `pending`: no decision has been made.

Only `approved` evidence can support canonical publication. Approval must record the required attribution or state that none is required. A source URL or public availability is not a licensing decision.

## Source approval workflow

```text
discover
  → preserve evidence
  → calculate digest
  → register source/version
  → classify permitted use
  → stage record facts
  → review each fact
  → resolve conflicts
  → approve or reject each evidence relationship
  → mint canonical identity
  → create canonical draft
  → normal editorial validation/review/approval/publication
```

The source reviewer and canonical editor may be the same authorised person, but both decisions must remain explicit and auditable.

## Staged-to-reviewed workflow

1. Confirm that the staged row points to retained evidence and a registered source version.
2. Recalculate or verify the evidence digest.
3. Confirm Hero binding against the canonical Hero UUID.
4. Check name, category, slot, description, progression and unlock fields independently.
5. Mark unknown values as absent; do not infer them from layout or expected slot counts.
6. Record conflicts and corroborating evidence.
7. Record permitted use and attribution.
8. Set the record to `reviewed`, `approved` or `rejected` through a named operation.

The existing 60 rows cannot complete this workflow because they have no recorded evidence digest or licensing decision, and 36 lack a canonical skill name.

## Reviewed-to-canonical workflow

A canonical draft may be created only when:

- the source evidence record is approved;
- the record-level fact relationship is approved;
- the canonical Hero UUID is valid;
- the canonical name is non-empty;
- category and slot are evidenced;
- stable identity is minted under the accepted ADR;
- progression and unlock availability accurately describe the evidence;
- all included child rows reference approved evidence;
- canonical validation has no blocking issue;
- publication eligibility is calculated server-side as eligible.

Canonical promotion is an Editorial Platform operation. It must not be implemented as an update from staging tables into the live projection.

## Canonical corrections

- Names, descriptions, category, slot and structured values may be corrected through a new immutable editorial version.
- The stored skill ID and identity seed do not change after identity minting.
- A Hero-binding error requires withdrawal and a new correctly bound record; it must not silently transfer a skill between Heroes.
- Corrections retain prior evidence relationships and add the evidence supporting the correction.
- Publication creates a new immutable publication reference.

## Withdrawal

Evidence or canonical facts may be withdrawn for licensing changes, provenance failures, confirmed factual errors, duplicate identity or supersession.

Withdrawal requires a named actor, timestamp and reason. It never deletes immutable editorial, publication or audit history. A withdrawn record is ineligible for future publication and is excluded from the eventual public projection.

## Conflicting sources

1. Retain every material source and its digest.
2. Do not average or merge conflicting values automatically.
3. Compare source freshness, authority, independence and direct in-game support.
4. Record the conflict and reviewer rationale.
5. Approve only the resolved claim; keep dissenting evidence visible internally.
6. If evidence cannot resolve the conflict, leave the fact absent or block the record.

Confidence does not replace conflict resolution or approval.

## Translation handling

- The stable skill ID is language-independent.
- The first canonical name must identify its source locale.
- Translations are separate versioned text records or fields in a future approved localisation contract.
- A translated name cannot replace the source identity or create a new skill.
- Machine translation must remain unapproved until a reviewer validates meaning and game terminology.

## Missing names

A missing canonical name blocks canonical promotion and publication. Numbered slots, descriptions, source-row UUIDs and generated labels must not be used as substitutes. The 36 unnamed staged rows remain evidence only.

## Incomplete progression

Progression availability is explicit:

- `complete`: every level from 1 through the evidenced maximum is present;
- `partial`: some verified levels are present and missing levels remain absent;
- `unavailable`: the approved source states that progression does not apply;
- `unknown`: available evidence cannot establish progression.

Forge may publish verified partial facts when the final publication policy permits it, but it must preserve the partial state. It must not generate rows from `maxLevel` or parse arbitrary prose into numeric effects.

## Unlock requirements

Unlock conditions are typed facts. Display text may be retained as a fallback, but it does not replace requirement type, operator, value, combination semantics and related-domain identity where applicable. Unsupported conditions remain absent.

An Exclusive Gear requirement may reference an Exclusive Gear identity. The Gear fact remains owned by that separate domain.

## Freshness and versioning

- Every retrieval is associated with a source version and digest.
- A changed digest creates a new evidence version; it does not overwrite prior evidence.
- Time-sensitive sources must define a review interval before approval.
- Patch notes and balance changes supersede older evidence only through an explicit reviewed relationship.
- Stale evidence may remain historically useful but cannot silently support a current publication.

## Evidence retention

Retain enough evidence to reproduce the review decision without exposing private or licensed material publicly. Store digests and private references when full content retention is not permitted. Supersession and withdrawal never erase audit history.

## Reviewer responsibilities

Reviewers must:

- verify identity, source version, digest, permitted use and attribution;
- confirm Hero binding and field-level meaning;
- distinguish fact, estimate and editorial judgement;
- record conflicts and uncertainty;
- reject invented, ambiguous or unrelated fields;
- avoid approving their own unsupported extraction merely because it is structured;
- ensure public-safe and private evidence fields remain separated.

## Publication requirements

Publication requires all of the following:

- verified, non-withdrawn canonical record;
- server-calculated publication eligibility;
- approved primary source evidence with a matching digest;
- named reviewer and review timestamp;
- non-empty canonical name and description;
- valid Hero/category/slot/variant identity;
- only verified, non-withdrawn progression and unlock rows;
- approved immutable editorial version;
- existing server-side permission and publication checks;
- a published projection that excludes private evidence and editorial guidance.

The local Sprint 9.3 schema proposal is not publication approval. Live publication remains blocked until the migration and compatible publication path are approved and validated outside production.
