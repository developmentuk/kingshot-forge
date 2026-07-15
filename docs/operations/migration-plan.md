# Migration Plan: Current Project to Target Platform Architecture

## Strategy

Use a strangler migration inside the existing repository. Keep production behaviour available while new governed modules replace legacy paths feature by feature.

## Phase 0 — Freeze and baseline

- Declare `forge_1641_150726.zip` the historical review baseline.
- Create a clean repository clone without `.env.local`, `node_modules`, `dist` or `.vercel`.
- Rotate any credentials that may have been distributed in the snapshot.
- Record current production smoke tests.
- Fix existing build type errors without expanding Buildings Editor scope.

## Phase 1 — Quality and governance

- Replace starter README.
- Add `.env.example`, contribution guide, PR template and CODEOWNERS.
- Add formatter, tests and CI.
- Align router dependencies.
- Check in Supabase migrations and generated database types.

## Phase 2 — Platform contracts

- Create packages/workspaces.
- Move shared dataset keys, API envelopes and schema contracts to `packages/contracts`.
- Add platform HTTP/error/auth/permission helpers.
- Keep compatibility exports for old imports.

## Phase 3 — Data engine

- Move importers and source fetching to `packages/data-engine`.
- Introduce runtime schemas and typed dataset map.
- Unify preview/load validation.
- Add import run staging and operational records.
- Migrate endpoint handlers to thin application commands.

## Phase 4 — CMS core

- Add CMS database migrations.
- Implement record versions, validation, reviews and publication.
- Migrate Heroes, then Events, then Buildings as vertical slices.
- Do not begin a second dataset until the first satisfies the CMS Definition of Done.

## Phase 5 — UI and design-system migration

- Extract tokens and primitives.
- Move admin UI first because it exercises forms, tables, states and overlays.
- Decompose the global stylesheet by feature while retaining temporary compatibility layers.
- Migrate public feature modules incrementally.

## Phase 6 — Remove legacy paths

- Remove duplicated dataset clients/types and unsupported adapters.
- Delete compatibility exports after all imports migrate.
- Archive obsolete docs and placeholders.
- Run dependency, dead-code and route audits.

## Migration safety

Each phase must preserve:

- production deployability;
- database backward compatibility until cutover;
- rollback instructions;
- release notes;
- smoke tests for affected journeys.
