# ADR-DATA-001 — Dataset-Centric, Operation-Based Data Engine

- Status: Accepted
- Date: 2026-07-14
- Decision owners: Clark and Aegis
- Related: `docs/AEGIS.md`, `docs/architecture/DATA-ENGINE.md`

## Context

Sprint 3 left Forge with a Hero Repository and an early browser-side importer/synchronisation path. That path mixed source acquisition, parsing, privileged Supabase mutations and UI role checks. It could not safely scale to gear, troops, buildings, VIP, research, events and other canonical datasets.

The first Sprint 4 attempts also used ambiguous “importer” and “sync” terminology. Those terms risked making each source integration a bespoke pipeline and risked collapsing evidence acquisition, canonical mutation and publication into one action.

Forge now has a stronger constitution: server-side authority, evidence-first provenance, immutable history, explicit workflow and published-only consumer projections.

## Decision

Forge will use a dataset-centric, operation-based Data Engine.

The Data Engine owns reusable orchestration. Each dataset module owns only source-specific concerns:

- stable dataset key and title;
- source identity and acquisition configuration;
- source envelope validation;
- record normalisation;
- stable record key generation;
- duplicate and completeness validation;
- source-specific metadata extraction;
- declared supported operations.

The canonical operation lifecycle is:

```text
Preview → Stage → Apply → Review → Publish → Rollback
```

A scheduled or manual “sync” may trigger Preview and Stage, but must not imply automatic publication.

Code trust boundaries are:

```text
src/     browser UI and public clients only
api/     thin Vercel Function entrypoints
server/  privileged business logic, auth and persistence
shared/  environment-neutral contracts
```

Privileged Supabase credentials and canonical mutations remain server-only. API entrypoints authenticate the actor and verify Forge capabilities before invoking operations.

## Consequences

### Positive

- One reusable engine can support many datasets.
- Source provenance, confidence and hashes are consistently captured.
- Dataset-specific complexity remains isolated.
- Browser bundles cannot access server credentials.
- Preview and review are possible without mutation.
- Publication remains compatible with immutable Editorial Platform history.
- Scheduled operations can reuse the same server pipeline as manual operations.

### Negative

- More up-front contracts and persistence are required.
- Early browser importer code becomes technical debt.
- A direct source-to-table implementation is no longer acceptable.
- Dataset modules must conform to stronger validation and evidence rules.

## Superseded approaches

- Browser-side hero catalogue writes.
- UI-only role checks as an authorisation boundary.
- Framework-style route exports for plain Vite Vercel Functions.
- One bespoke importer pipeline per dataset.
- Automatic hard deletion of records absent from one source response.
- Treating a successful fetch as publication approval.

## Implementation constraints

1. Fetch and validate the entire source before any canonical mutation.
2. Preserve raw evidence or an equivalent immutable source snapshot.
3. Generate a deterministic payload hash.
4. Reject duplicate stable record keys.
5. Use a per-dataset lock for mutating operations.
6. Apply related database changes transactionally.
7. Soft-deactivate missing source records only after a complete successful source validation.
8. Record operation status, actor, source URL, timestamps, counts, hash and errors.
9. Keep confidence separate from workflow status.
10. Publish through the shared Editorial Platform rather than a parallel path.

## Review trigger

Review this ADR if Forge changes hosting platform, replaces Supabase, introduces high-frequency live feeds, or materially changes the Editorial Platform publication model.
