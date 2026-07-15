# CS-003D Build Fix

This pack fixes TypeScript TS1294 errors caused by constructor parameter properties while `erasableSyntaxOnly` is enabled.

Replace these complete files:

- `src/platform/datasets/services/DatasetService.ts`
- `src/platform/datasets/validation/DatasetValidationService.ts`

Then run:

```powershell
npm run build
npm run lint
```
