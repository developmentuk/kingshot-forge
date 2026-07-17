# ADR-0003: Hero Skill stable identifiers

- Status: Proposed
- Date: 2026-07-17
- Owners: Clark / Aegis
- Milestone: Release 0.7.1 — Sprint 9.3

## Context

Hero Skills require an identity that survives corrected names, translations, descriptions, categories, slots and source versions. The 60 existing staged rows use extraction UUIDs; those identifiers describe staging rows and cannot become canonical skill IDs.

Identity must also support deterministic import matching, duplicate display names, awakening variants, withdrawal and player-owned progression references without binding to editorial order or a database sequence.

No canonical IDs may be minted for staged facts until their source and identity are approved.

## Decision

Forge will use a deterministic UUID-v5 as the canonical Hero Skill ID.

The UUID is minted once, after source and identity approval, from a versioned immutable seed:

```text
hero-skill:v1
|hero=<canonical Hero UUID>
|category=<approved category at identity minting>
|slot=<approved canonical slot at identity minting>
|variant=<base|awakening>
|variant-index=<positive integer>
```

The fixed namespace is:

```text
8d7a8d8a-709f-4e75-a2f5-9347a2bf30e0
```

Both UUID and seed are stored. The seed is immutable after minting.

The current category and slot remain correctable canonical fields. A correction does not recompute the ID because the stored identity seed records the minting decision. A Hero-binding correction is materially different: the incorrect record is withdrawn and a new correctly bound identity is created.

Progression levels, unlock groups and unlock requirements use the same namespace with separate versioned seeds based on the canonical skill UUID and their identity-time level or group/order coordinates.

## Import and collision rules

- Import matching first uses an existing canonical ID or retained identity/evidence relationship.
- A new ID is minted only after approval confirms the Hero/category/slot/variant identity.
- UUID-v5 output, identity seed and active Hero/category/slot/variant uniqueness are independently constrained.
- A UUID or seed collision blocks the import for review; it is never silently merged.
- A renamed or translated skill reuses the stored ID.
- A changed source row UUID has no effect on canonical identity.
- A withdrawn skill retains its ID permanently and cannot be reused for a different fact.
- Awakening skills use `variant=awakening` plus a positive variant index; they do not collide with base skills.
- A future variant kind requires an ADR/contract revision rather than using an ambiguous `other` identity.

## Alternatives considered

### Random UUID

Stable after creation and independent of mutable facts, but it cannot provide deterministic first-import idempotency without a separate allocation/mapping service. Rejected as the primary convention.

### Deterministic UUID recalculated from current fields

Idempotent, but category or slot corrections would change identity. Rejected. Forge stores the mint-time seed and never recalculates an existing record from corrected fields.

### Semantic string key

Readable and deterministic, but exposes mutable semantics and encourages consumers to parse identity. Rejected as the canonical ID. The stored seed remains internal evidence.

### Composite database identity

Hero/category/slot is useful as a uniqueness rule but is unsafe as the permanent foreign key because corrections and awakening variants complicate it. Rejected as the canonical identifier.

### Source-derived identity

Ties Forge identity to one source, extraction run or row UUID and fails cross-source correction. Rejected.

## Consequences

Positive:

- deterministic first-import behavior after approval;
- stable references across names, translations and factual corrections;
- explicit awakening collision handling;
- no dependency on database sequences or staging UUIDs;
- safe withdrawal and historical references.

Costs:

- identity minting is a governed server-side operation;
- identity-time category/slot remain in the internal seed even after correction;
- incorrect Hero binding requires withdrawal and replacement;
- importers must retain identity/evidence mappings rather than recomputing existing IDs.

## Migration

The unapplied Sprint 9.3 proposal adds immutable identity seed/version and variant fields to `hero_skills`, removes the random-ID default, and adds unique constraints. It contains a guard that stops if existing canonical rows require backfill.

The migration must not be applied until:

1. this ADR is accepted;
2. publication code supplies deterministic IDs and child identities;
3. any existing-row backfill is separately reviewed;
4. the complete migration is tested in a proven non-production database.

The 60 staged facts receive no IDs in this milestone.

## Validation

`scripts/test-hero-skills-governance.mjs` verifies:

- deterministic output for the same seed;
- different base/awakening identities;
- name corrections retaining ID;
- category corrections retaining the stored ID;
- duplicate identity and Hero/category/slot/variant rejection;
- deterministic progression and unlock identities.
