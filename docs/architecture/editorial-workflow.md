# Forge Editorial Workflow

## Purpose

The Editorial Workflow manages mutable draft work, immutable record versions, review, approval, publication, rollback and audit history.

## Lifecycle

```text
draft → in_review → approved → published → archived
```

A rejected or returned record moves back to `draft`. Published content is never edited in place; a new immutable version is created.

## Pack 01: Draft and version foundation

PM2B Pack 01 introduces:

- immutable editorial record versions;
- a current-record head pointer;
- append-only audit events;
- an `EditorialRepository` persistence boundary;
- an in-memory reference repository;
- optimistic concurrency through `expectedVersion`;
- draft creation and save operations.

The in-memory repository is a reference implementation for development and contract verification. Production persistence will be supplied by a server-side repository adapter.

## Concurrency

Every save supplies the version the editor originally loaded:

```text
expectedVersion = currentVersion at edit start
```

The repository compares this with the current stored version. A mismatch raises `EditorialConcurrencyError` and no version, head or audit event is written.

## Invariants

- Versions are immutable.
- Version numbers increase by one for each record.
- The head points to one current version.
- Every mutation creates an audit event.
- Client-side route guards are not an authorisation boundary.
- Production persistence and workflow transitions remain server-side responsibilities.
