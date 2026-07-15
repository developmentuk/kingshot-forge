# Forge Platform CS-003E

## Record Editor Validation Integration

This change set connects the existing Record Editor save path to the shared Dataset Validation Service introduced in CS-003D.

## Files

- `src/features/admin/recordEditor/recordEditorPlatformValidation.ts`
- `src/features/admin/recordEditor/RecordEditorPanel.tsx`
- `docs/architecture/dataset-framework.md`

## Behaviour

- Existing interactive validation remains active while fields are edited.
- A save attempt converts the active Record Editor schema and record into platform dataset contracts.
- The shared Dataset Validation Service runs before `onSave`.
- Validation errors block the save callback and are displayed in the existing validation summary and field messages.
- Successful validation permits the existing save flow to continue unchanged.
- Persistence and publishing are not introduced by this change set.

## Apply

Extract into the repository root while on:

`feature/cs-003e-record-editor-validation`

Then run:

```powershell
npm run build
npm run lint
git status
```

Commit after verification:

```powershell
git add .
git commit -m "CS-003E integrate Record Editor validation"
git push
```
