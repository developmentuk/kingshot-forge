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

## Migration status

CS-003B connects the platform registry to the existing admin catalogue and adapter registry through a compatibility layer. Dataset identity is shared with the server Data Engine through `shared/data-engine/datasets.ts`.

The compatibility layer deliberately preserves the existing admin and Data Engine APIs. Record schemas, validation, persistence and publishing services will migrate in later change sets.
