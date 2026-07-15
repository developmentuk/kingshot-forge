# Folder Structure Review and Target Repository Structure

## Current-state assessment

The baseline uses `src/pages`, `src/components`, `src/services`, `src/features/admin`, `server`, `api` and `shared`. This was suitable during rapid product discovery, but responsibility is now distributed by technical type rather than business capability.

Key symptoms:

- `src/App.css` is approximately 14,893 lines.
- Several pages exceed 600–1,200 lines.
- Admin code mixes table browsing, dataset adaptation, record editing and route presentation.
- Dataset keys and API contracts are duplicated.
- Client and server data-engine implementations coexist with unclear authority.
- `api` contains both browser client code and Vercel handlers.

## Target structure

```text
/
├─ apps/
│  └─ web/
│     ├─ src/
│     │  ├─ app/                 # bootstrap, providers, routing
│     │  ├─ features/            # public feature modules
│     │  ├─ cms/                 # admin CMS modules
│     │  └─ styles/              # app composition only
│     └─ public/
├─ packages/
│  ├─ contracts/                 # API/domain contracts and schemas
│  ├─ design-system/             # tokens and UI primitives
│  ├─ data-engine/               # source adapters and normalisation
│  ├─ database/                  # generated DB types and repositories
│  └─ platform/                  # auth, permissions, HTTP, logging
├─ api/                          # thin Vercel entry points
├─ supabase/
│  ├─ migrations/
│  ├─ seed/
│  └─ tests/
├─ docs/
├─ scripts/
├─ tests/
└─ .github/
```

This can initially use npm workspaces. It remains a modular monorepo, not microservices.

## Feature module pattern

```text
features/player-profile/
├─ api/
├─ components/
├─ domain/
├─ pages/
├─ repositories/
├─ tests/
├─ index.ts
└─ README.md
```

Only `index.ts` is a public import surface. Private module files are not imported across feature boundaries.

## CMS module pattern

```text
cms/
├─ catalogue/
├─ records/
├─ validation/
├─ review/
├─ publishing/
├─ history/
├─ imports/
└─ shared/
```

## Migration rules

- Move files only when the owning module is clear.
- Do not combine structural movement with behavioural redesign unless required.
- Introduce path aliases after target boundaries exist.
- Keep compatibility exports during staged migration.
- Delete legacy paths only after all imports and tests migrate.
