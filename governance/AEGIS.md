# AEGIS Engineering Handbook

## Purpose

This handbook defines how Kingshot Forge is designed, built, reviewed, tested and released.

Forge is treated as a long-term software platform rather than a collection of isolated pages. Technical decisions should make the product easier to understand, extend and maintain.

## Roles

### Product Owner

The Product Owner defines:

- product vision;
- priorities;
- user experience;
- feature scope;
- community direction;
- release decisions.

### Technical Architect

The Technical Architect defines and protects:

- platform architecture;
- code quality;
- consistency;
- maintainability;
- security boundaries;
- testing standards;
- documentation standards.

The Product Owner retains final decision-making authority.

## Core Principles

### Finish before expanding

A capability is not complete until it is implemented, validated, integrated and documented.

### Build platforms, not pages

Reusable behaviour belongs in shared services, platform modules, contracts or components.

### One source of truth

Business rules, dataset definitions and platform contracts must not be duplicated across the codebase.

### Quality over speed

A slightly slower implementation is acceptable when it materially improves reliability or maintainability.

### Every commit leaves Forge better

Commits should be intentional, coherent and understandable.

## Platform Boundaries

Forge separates reusable platform capabilities from product features.

```text
src/
  platform/
    datasets/
    editorial/
    permissions/
    publishing/
    validation/
    audit/

  features/
    admin/
    heroes/
    profiles/
    transfer/
    giftcodes/
```

Platform modules must not depend on feature-specific UI.

Features may consume platform contracts and services.

## Dataset Rules

- Dataset definitions are canonical and centrally registered.
- Dataset-specific adapters translate raw records into platform contracts.
- Validation is explicit and reusable.
- Dataset status and availability must not be inferred from UI state.
- Source provenance and confidence should be retained where available.

## Editorial Rules

- Versions are immutable.
- Published content is never edited in place.
- Every mutation creates an audit event.
- Workflow transitions are explicit and validated.
- Optimistic concurrency is required for editorial mutations.
- Rollback creates a new version rather than moving history backwards.

## Security Rules

- Authorisation is enforced server-side.
- UI visibility is not an access-control boundary.
- Secrets must never be committed.
- Service-role credentials must never be exposed to client code.
- Privileged operations require explicit roles and auditable actions.

## UI Rules

- Interfaces must be responsive.
- Admin workflows must make state, errors and next actions clear.
- Reusable visual patterns should become shared components.
- Destructive actions require clear confirmation.
- Accessibility and keyboard usability are part of completion.

## Documentation Rules

Documentation changes are part of the same milestone as the code they describe.

Update the relevant:

- architecture document;
- ADR;
- change-set document;
- roadmap;
- release notes.

## Long-Term Standard

Every significant decision should pass this test:

> Would we be happy maintaining this implementation in two years?
