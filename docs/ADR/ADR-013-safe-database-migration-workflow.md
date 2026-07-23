# ADR-013: Safe Database Migration Workflow

- **Status:** Accepted
- **Date:** 2026-07-23
- **Decision owner:** Clark
- **Applies to:** Supabase and other persistent Forge data stores

## Context

Forge requires a migration process that protects production while remaining compatible with the project's cost-conscious operating model. Automated tools may suggest creating paid rehearsal environments or executing migrations directly. Neither behaviour is permitted by default.

The identity hotfix workflow established the required precedent: generate the migration SQL, do not execute it, do not create a Supabase branch, leave production unchanged and report the repository state.

## Decision

Database changes follow this default lifecycle:

```text
Feature branch
    ↓
Generate version-controlled migration SQL
    ↓
Static review and local checks
    ↓
Human approval
    ↓
Pre-deployment backup and rollback plan
    ↓
Controlled application to the existing environment
    ↓
Schema, RLS, grant and data validation
    ↓
Deployment evidence and FRKS/documentation update
```

### Tool behaviour

Unless an instruction explicitly authorises execution, coding agents must:

- begin in read-only mode;
- inspect the current schema and repository conventions first;
- generate migration files only;
- not run SQL against production;
- not create paid Supabase branches;
- not modify environment variables or secrets;
- report the branch, commit SHA and working-tree status where available;
- identify destructive, locking, irreversible or data-rewriting operations;
- include rollback or compensating-action guidance.

### Migration requirements

Every material migration must be:

- version controlled and ordered using the repository naming convention;
- safe to review as plain SQL;
- idempotent where practical, or explicitly marked otherwise;
- compatible with current RLS and grant policies;
- tested against representative data where possible;
- accompanied by preflight and postflight checks;
- linked to its sprint, issue, ADR or release record;
- retained permanently in Git history.

### Production gate

Production execution requires explicit owner approval. Successful execution is not complete until the exact deployed state has been validated, including relevant schema objects, constraints, indexes, functions, grants, RLS policies and key data invariants.

## Consequences

- Production remains protected from implicit agent actions.
- SQL changes are inspectable and auditable before execution.
- Manual gates add friction but reduce accidental destructive changes.
- The absence of a paid rehearsal branch increases the importance of backups, rollback design and disciplined validation.

## Related records

- `docs/ADR/ADR-012-cost-conscious-development.md`
- `docs/AEGIS.md`
- `docs/frks/FRKS_Decision_Register.json`
