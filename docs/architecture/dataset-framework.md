# Forge Dataset Framework

## Purpose

The Dataset Framework provides the platform-neutral contracts and services used by the CMS, Data Engine integration, validation, publishing, search and version history.

## Package structure

```text
src/platform/datasets/
├── contracts/
├── registry/
├── services/
│   └── DatasetService.ts
├── validation/
│   └── DatasetValidationService.ts
└── index.ts
```

## Responsibilities

The framework may describe datasets, records, fields, validation, permissions and publishing policy. It must not contain game-specific data, page components, network access or database implementation.

## Registration rules

- Dataset IDs must be stable, non-empty and unique.
- Schema versions are positive integers.
- Field IDs must be stable within a dataset.
- Platform-managed record metadata must not be duplicated in dataset values.
- A dataset registration should declare capabilities explicitly.

## Dataset Service

`DatasetService` is the platform entry point for discovering definitions and querying them by category, capability or tag. It does not load or persist records.

## Validation Service

`DatasetValidationService` validates a `DatasetRecordDraft` against its registered definition. It performs:

- dataset identity checks;
- required-field checks;
- primitive field-type checks;
- numeric minimum, maximum and integer checks;
- text length and regular-expression checks;
- select and multiselect option checks;
- field-level custom validation;
- dataset-level asynchronous validation.

A validation result is valid when it contains no issues with `error` severity. Warnings and information issues do not block the result.

Validation is deliberately independent from React, Supabase and HTTP. Persistence and publishing services will call this service before accepting state transitions.

## Migration status

CS-003B connected the platform registry to the existing admin catalogue and adapter registry. Dataset identity is shared with the server Data Engine through `shared/data-engine/datasets.ts`.

CS-003C introduced the shared Dataset Service and migrated admin catalogue lookup onto it.

CS-003D introduces the shared validation service. Existing Record Editor validation remains unchanged until a later compatibility change set connects editor schemas to platform field definitions.

## Record Editor validation integration

CS-003E adds a compatibility bridge between the existing Record Editor schemas and the platform Dataset Validation Service. Interactive field validation remains available while editing, and every save attempt now passes through the shared platform validation boundary before the persistence callback can run.

The bridge is temporary. Dataset registrations will ultimately own complete field schemas, allowing the Record Editor to consume platform definitions directly without translating its legacy schema format.
