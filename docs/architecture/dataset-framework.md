# Forge Dataset Framework

## Purpose

The Dataset Framework provides the platform-neutral contracts used by the CMS, Data Engine integration, validation, publishing, search and version history.

## Package structure

```text
src/platform/datasets/
├── contracts/
│   ├── adapter.ts
│   ├── dataset.ts
│   ├── field.ts
│   ├── permissions.ts
│   ├── publishing.ts
│   ├── record.ts
│   ├── validation.ts
│   └── value.ts
├── registry/
│   └── DatasetRegistry.ts
├── services/
│   └── DatasetService.ts
└── index.ts
```

## Responsibilities

The framework may describe and query datasets, records, fields, validation, permissions and publishing policy. It must not contain game-specific data, page components, network access or database implementation.

## Registration rules

- Dataset IDs must be stable, non-empty and unique.
- Schema versions are positive integers.
- Field IDs must be stable within a dataset.
- Platform-managed record metadata must not be duplicated in dataset values.
- A dataset registration should declare capabilities explicitly.

## Dataset Service

`DatasetService` is the platform entry point for dataset discovery. It consumes a `DatasetDefinitionSource`, allowing the current in-memory registry and future persistent catalogues to use the same service contract.

The service supports:

- optional and required lookup;
- existence checks;
- category filtering;
- capability filtering;
- tag filtering;
- capability checks for a single dataset.

The service does not load dataset records, call APIs or persist changes. Those responsibilities belong to later record, validation and publishing services.

## Migration status

CS-003B connected the platform registry to the existing admin catalogue and adapter registry through a compatibility layer. Dataset identity is shared with the server Data Engine through `shared/data-engine/datasets.ts`.

CS-003C introduces `DatasetService` and moves admin catalogue discovery onto the service while preserving the existing admin API. Record loading, schema validation, persistence and publishing remain scheduled for later change sets.
