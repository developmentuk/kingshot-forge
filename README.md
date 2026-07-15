# Forge Platform CS-003C

## Dataset Service Integration

This change set introduces the shared Dataset Service and moves the existing admin catalogue onto that service without changing record loading, editor behaviour or publishing.

## Files

- `src/platform/datasets/services/DatasetService.ts`
- `src/platform/datasets/services/index.ts`
- `src/platform/datasets/index.ts`
- `src/features/admin/adminDatasetService.ts`
- `src/features/admin/adminDatasets.ts`
- `docs/architecture/dataset-framework.md`

## Apply

Extract into the repository root while on:

`feature/cs-003c-dataset-service-integration`

Then run:

```powershell
npm run build
npm run lint
git status
```

Commit after verification:

```powershell
git add .
git commit -m "CS-003C add dataset service integration"
git push
```
