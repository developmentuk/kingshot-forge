# ADR-013: Safe Database Migration Workflow

- **Status:** Accepted
- **Decision date:** 23 July 2026
- **Reconciled:** 13 August 2026
- **Decision owner:** Clark
- **Applies to:** Supabase and other persistent Forge data stores

## Context

Database work must protect production while remaining compatible with Forge's
cost-conscious operating model. Generating a migration is not authority to run
it, and an automated suggestion to create a paid rehearsal environment is not
owner approval.

## Decision

The default migration lifecycle is:

1. inspect the current repository and schema in read-only mode;
2. create an isolated feature branch;
3. generate an ordered, version-controlled migration;
4. run static and local validation;
5. document destructive, locking, irreversible and data-rewriting behaviour;
6. obtain explicit owner approval for execution;
7. confirm backup and rollback or compensating actions;
8. apply the migration through the controlled workflow;
9. validate schema objects, constraints, indexes, functions, grants, RLS and
   relevant data invariants;
10. record deployment evidence and update permanent documentation.

Unless execution is explicitly authorised, engineering agents must not:

- run SQL against production;
- create paid Supabase branches;
- modify secrets or environment variables;
- treat a successful local check as production acceptance.

## Migration requirements

Material migrations must be reviewable as plain SQL, follow the repository
naming convention, retain permanent Git history, preserve existing RLS and grant
intent, and include preflight and postflight checks. They should be idempotent
where practical and must say when they are not.

## Completion gate

A migration is not complete merely because SQL executed successfully. The exact
deployed state and material invariants must also be verified and recorded.

## Provenance

Recovered from PR #17 during the Version 1.1.0 repository re-baseline. This ADR
does not approve any pending or historical migration.

## Related records

- `docs/ADR/ADR-012-cost-conscious-development.md`
- `docs/AEGIS.md`
- `docs/operations/migration-plan.md`
