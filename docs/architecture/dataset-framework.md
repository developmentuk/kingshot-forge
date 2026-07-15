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

CS-003A introduces contracts and the registry foundation only. Existing admin and Data Engine registries remain authoritative until CS-003B provides compatibility adapters and controlled integration.
