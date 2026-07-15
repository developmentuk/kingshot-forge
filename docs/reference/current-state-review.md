# Current-State Architecture Review

## Snapshot inventory

The canonical repository contains:

- React 19 + Vite 8 + TypeScript 6 frontend
- React Router dependencies
- Supabase browser and server clients
- Vercel Functions under `api/data-engine`
- server data-engine registry and 13 importers
- shared data-engine contracts
- public player, profile, community, transfer, hero and studio features
- admin dashboard, dataset browser, adapters and record editor

Approximate authored TypeScript/TSX/CSS size across `src`, `server`, `api` and `shared`: **51,816 lines**.

## Build and lint evidence

On 15 July 2026:

- `npm run build` failed with two TypeScript errors:
  - `src/features/admin/buildingsDatasetAdapter.ts`: `unknown` not assignable to `RecordEditorValue`
  - `src/features/admin/recordEditor/recordEditorSchema.ts`: array-capable `RecordEditorValue` not assignable to scalar `DatasetCellValue`
- `npm run lint` could not execute in the extracted snapshot because the Oxlint binary returned permission denied.

These are recorded as baseline findings. No application implementation was changed during Foundation Pack 1.

## Architectural strengths

- Product breadth proves the platform concept.
- Strict TypeScript settings are largely enabled.
- Server and browser Supabase clients are separated.
- Role/permission concepts already exist.
- Data importers share a coherent interface.
- Dataset source provenance and confidence are available.
- Vercel rewrites correctly preserve `/api` routes from SPA fallback.

## Architectural risks

- The root README is still template content.
- No CI, tests or migrations are present.
- Global CSS and several components/pages are too large.
- Browser-facing and server API concerns are mixed under `api`.
- CMS placeholders refer to prior sprint language and incomplete journeys.
- Route guards do not by themselves provide trusted authorisation.
- Dataset and API contracts are duplicated and type-erased.
- The repository archive includes local/generated directories and an environment file.

## Recommended repository improvements

1. Clean and rotate repository secrets.
2. Establish CI and testing before CMS expansion.
3. Adopt the target modular monorepo structure incrementally.
4. Create a single contracts source of truth.
5. Add migrations and generated database types.
6. Implement server-side permission/use-case boundaries.
7. Build CMS persistence and publication before richer Buildings editing.
8. Extract a design system and stop global stylesheet growth.
9. Add operational logging and audit history.
10. Replace sprint terminology with milestones throughout product copy and docs.
