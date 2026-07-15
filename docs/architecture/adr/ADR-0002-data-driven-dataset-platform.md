# ADR-0002: Adopt a data-driven dataset platform

- **Status:** Accepted
- **Date:** 2026-07-15
- **Decision owners:** Founder & Product Owner; Aegis, Technical Lead

## Context

Forge currently represents datasets through several separate mechanisms: Data Engine keys, admin catalogue entries, browser adapters and Record Editor schemas. These mechanisms evolved independently and duplicate dataset identity, metadata and capabilities.

Continuing to add bespoke editors would multiply this duplication and make publishing, permissions, validation, history and search inconsistent.

## Decision

Forge will use a platform-neutral dataset contract as the canonical language for data managed by the CMS.

A dataset definition describes:

- identity and metadata;
- fields and sections;
- capabilities;
- permissions;
- publishing policy;
- adapters;
- validation.

The platform framework must not contain Kingshot-specific concepts. Buildings, heroes, troops and other game datasets remain feature registrations that consume the platform contract.

The initial registry is deliberately in-memory. Persistent records, publishing state and version history will be implemented separately behind services that consume the same contracts.

## Consequences

### Positive

- New datasets can reuse shared browsing, editing, validation and publishing capabilities.
- Dataset metadata has one intended source of truth.
- Platform code remains reusable and testable.
- Migration can happen incrementally without breaking current admin workflows.

### Negative

- Existing registries remain temporarily duplicated during migration.
- The contract introduces abstraction before all capabilities are implemented.
- Dataset-specific fields may still require custom renderers or validators.

## Guardrails

- Do not place Kingshot entity names in `src/platform/datasets`.
- Do not access Supabase, HTTP APIs or React from the contract layer.
- Do not silently replace existing production registries until compatibility mapping and regression tests exist.
- Changes to core contracts require an ADR amendment or a new ADR.
