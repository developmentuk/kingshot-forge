# FRKS Preservation — Sprint 4 Data Engine and Knowledge Governance

- **Preserved:** 13 August 2026
- **Source pull requests:** #16 and #17
- **Source branches:** `docs/frks-sprint-4-data-engine-archive` and
  `docs/frks-knowledge-governance`
- **Current baseline:** Version 1.1.0 at `c524c08`
- **Classification:** Historical architecture and governance record

## Purpose

This record preserves durable knowledge from two stale documentation branches
without merging their obsolete repository snapshots or creating a second source
of operational authority.

`docs/AEGIS.md` remains the Forge operational constitution. Current architecture,
dataset and release documents take precedence over this historical record.

## Durable FRKS operating model

The Forge Research & Knowledge System is the practice of moving lasting project
knowledge out of transient conversations and into version-controlled records.
It preserves:

- verified evidence and source provenance;
- architectural and product decisions;
- dataset contracts and confidence;
- validation outcomes and known gaps;
- supersession and correction history;
- safe next actions and unresolved decisions.

FRKS does not replace AEGIS, ADRs, release records or canonical published data.
Binding decisions belong in ADRs; operational truth belongs in current release
and architecture documents; research must retain its confidence and limitations.

## Historical Sprint 4 Data Engine model

Sprint 4 established the Data Engine as a reusable platform service rather than
a hero-specific importer. Its durable boundaries were:

- browser UI must not own privileged canonical mutations;
- Vercel API entry points remain thin;
- server services own authentication, capabilities and privileged persistence;
- shared contracts remain serialisable and environment-neutral;
- external payloads require source identity, provenance and deterministic
  validation before editorial use;
- public consumers read published projections, not staged evidence.

The proposed lifecycle was:

`Preview → Stage → Apply → Review → Publish → Rollback`

The labels remain useful as operation semantics, but this document does not
claim that every operation or historic route exists in Version 1.1.0.

## Durable dataset-module requirements

A governed dataset adapter should:

- accept unknown input and validate the complete source envelope;
- reject missing collections, unexpected empty datasets and duplicate stable
  keys unless a documented policy permits them;
- preserve source metadata, attribution, confidence and acquisition time;
- produce deterministic normalised candidates without writing to the database;
- distinguish source facts from editorial judgement;
- use Forge-owned stable keys rather than mutable display names;
- expose structured, browser-safe errors without secrets or raw database detail;
- test malformed envelopes, invalid records, duplicate keys, missing metadata,
  unknown optional fields and deterministic output.

Confidence describes evidence strength. It does not grant publication authority.

## Safe full-dataset principles

- Validate a complete snapshot before considering deactivation.
- Never hard-delete automatically because a source record disappears.
- Treat missing records as source-inactive only after a complete successful
  acquisition and according to dataset policy.
- Apply related mutations transactionally and use appropriate concurrency
  controls.
- Preserve immutable evidence and audit history.
- Rollback creates a new governed state; it does not rewrite history.

## Current supersession map

The following Version 1.1.0 documents now carry current authority:

- `docs/architecture/data-engine-framework-review.md`
- `docs/architecture/dataset-framework.md`
- `docs/platform/DATASET-CONTRACTS.md`
- `docs/architecture/editorial-workflow.md`
- `docs/architecture/verification-centre.md`
- `docs/governance/repository-governance.md`
- `docs/governance/technical-debt-register.md`

The uppercase `docs/FRKS/` tree proposed by PR #16 is not restored. A single
lowercase research convention avoids case-sensitive/case-insensitive filesystem
conflicts.

## RoeBot research correction from PR #17

The reviewed RoeBot JavaDocs described a screen-automation domain model and were
potentially useful for terminology such as buildings, navigation, search and
qualitative march states. They did **not** establish hidden hero IDs, item IDs,
event identifiers, research trees or internal Kingshot mechanics.

Those earlier claims remain rejected speculation. RoeBot is not a canonical
game-data source and its raw extracted reference is not restored by this record.

## Preservation decision

The unique durable decisions from PRs #16 and #17 are now represented by this
record and ADR-012/ADR-013. Their many generated indexes and point-in-time status
files are intentionally omitted because they would immediately be stale and
compete with current documentation.

No application code, database schema, runtime configuration or production data
was changed as part of this preservation.
