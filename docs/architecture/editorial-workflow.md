# Forge Editorial Workflow

## Purpose

The Editorial Workflow framework manages mutable draft work, immutable record versions, review, approval, publication, rollback and audit history. Dataset capability declarations and the server runtime determine which of those framework operations are actually exposed.

## Lifecycle

```text
draft → in_review → approved → published → archived
                                  ↑          │
                                  └─ restore ┘
```

A rejected or returned record moves back to `draft`. Published content is never edited in place; a new immutable version is created.

## Pack 01: Draft and version foundation

PM2B Pack 01 introduced:

- immutable editorial record versions;
- a current-record head pointer;
- append-only audit events;
- an `EditorialRepository` persistence boundary;
- an in-memory reference repository;
- optimistic concurrency through `expectedVersion`;
- draft creation and save operations.

## Pack 02: Review and approval workflow

PM2B Pack 02 adds controlled transitions:

```text
draft → in_review
in_review → draft
in_review → approved
```

Both rejection and return-for-changes move the record back to draft, but create distinct audit actions.

## Pack 03: Publication lifecycle

PM2B Pack 03 adds the production-facing transitions:

```text
approved → published
published → archived
archived → published
```

A rollback is available from `published` or `archived`. The caller selects an older version belonging to the same record. The service copies that version's values into a new immutable `published` version and records the original and target version details in audit metadata.

Rollback does not move the head pointer backwards and does not alter an existing version. Version numbers therefore remain monotonic and the complete publication history remains inspectable.

These are framework semantics, not a declaration that archive, restore or rollback is currently supported by a live dataset. In Release 0.7.1 the Admin UI and editorial API intentionally reject those operations because their interaction with published projections has not been defined and verified. The Verification Centre must report them as `Unsupported`, not `Ready`.

Every transition:

1. loads the current head;
2. verifies `expectedVersion`;
3. checks that the transition is legal;
4. creates a new immutable version;
5. advances the head;
6. appends an audit event.

Invalid state changes throw `EditorialTransitionError`. Invalid rollback targets throw `EditorialRollbackError`. Concurrent edits throw `EditorialConcurrencyError`.

## Concurrency

Every mutation supplies the version the caller originally loaded:

```text
expectedVersion = currentVersion at operation start
```

The repository compares this with the current stored version. A mismatch writes nothing.

## Invariants

- Versions are immutable.
- Version numbers increase by one for each record.
- The head points to one current version.
- Every mutation creates an audit event.
- Workflow state changes are explicit and validated.
- Rollbacks create new versions instead of rewriting history.
- Production authorisation remains a server-side responsibility.
- Published content is never edited in place.

## Canonical references from Editorial guidance

Editorial recommendations reference stable canonical IDs and the publication version on which the recommendation was reviewed. They do not own copies of canonical names, descriptions, progression values or unlock requirements.

For Hero Skills, priority, upgrade order, best-use guidance, strengths/weaknesses, synergies and formations remain Editorial records. A canonical publication change marks dependent guidance review-due; a withdrawn canonical skill blocks new guidance publication until the reference is resolved. Existing immutable Editorial versions retain the historical reference.
