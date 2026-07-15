# Forge Platform CS-003B

## Dataset Registry Integration

This change set connects the platform-neutral Dataset Registry introduced in CS-003A to the existing admin catalogue, editor adapter registry and server Data Engine identity catalogue.

## Files

- `shared/data-engine/datasets.ts` — canonical cross-layer dataset IDs
- `shared/data-engine/types.ts` — imports and re-exports the shared DatasetKey
- `server/data-engine/registry.ts` — verifies every declared dataset has an importer
- `src/features/admin/dataEngineApi.ts` — removes the duplicated client DatasetKey union
- `src/features/admin/datasetDefinitions.ts` — feature-owned platform registrations
- `src/features/admin/adminDatasets.ts` — compatibility projection for the existing admin UI
- `src/features/admin/datasetAdapterRegistry.ts` — validates editor adapters against registered capabilities
- `docs/architecture/dataset-framework.md` — updates migration status

## Apply

Extract into the repository root while on:

`feature/cs-003b-dataset-registry-integration`

Then run:

```powershell
npm run build
npm run lint
git status
```

Commit after verification:

```powershell
git add .
git commit -m "CS-003B integrate dataset registries"
git push
```

## Verification performed

TypeScript compilation completed with zero errors using `tsc -b`.

The full Vite build could not run in the Linux verification workspace because the source snapshot contained Windows-specific optional native dependencies. Run `npm run build` in the normal Windows development environment before committing.
