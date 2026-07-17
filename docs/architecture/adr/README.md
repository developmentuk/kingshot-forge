# Architecture Decision Records

## When an ADR is required

Create an ADR for decisions that materially affect architecture, security, data ownership, public contracts, deployment, permissions, dependencies or long-term maintainability.

## Naming

`NNNN-short-decision-title.md`, beginning with `0001`.

## Status

Proposed, Accepted, Superseded, Deprecated or Rejected.

## Template

```markdown
# ADR-NNNN: Decision title

- Status: Proposed
- Date: YYYY-MM-DD
- Owners: Aegis / relevant owner
- Milestone: Platform Milestone N

## Context

What problem and constraints require a decision?

## Decision

What is being decided?

## Alternatives considered

What credible alternatives were evaluated?

## Consequences

Positive, negative and operational consequences.

## Migration

How the current platform moves to this decision.

## Validation

How success will be measured.
```

## Initial ADR backlog

- ADR-0001: Modular monorepo and module boundaries
- ADR-0002: CMS record versioning and publication model
- ADR-0004: Runtime schema validation library
- ADR-0005: Server-side authorisation policy
- ADR-0006: Design-system styling strategy
- ADR-0007: API error and response contract

## Recorded decisions

- ADR-0002: Data-driven dataset platform
- ADR-0003: Hero Skill stable identifiers (Proposed)
