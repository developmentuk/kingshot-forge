# Sprint 4 — Forge Data Engine

## Objective

Establish a secure and reusable backend architecture for importing governed Kingshot datasets through Vercel Functions and Supabase.

## Completed foundation

- Re-evaluated the early backend instead of extending it blindly.
- Established explicit `src/`, `api/`, `server/` and `shared/` boundaries.
- Added a server-only Supabase client and environment checks.
- Standardised plain Vite Vercel Functions on `VercelRequest` and `VercelResponse`.
- Restored and reorganised accidentally misplaced Sprint 4 files.
- Removed empty Data Engine and API placeholders.
- Moved the health endpoint to `/api/health` and validated it in production.
- Added shared dataset contracts.
- Added deterministic JSON SHA-256 hashing.
- Added reusable JSON source fetching with timeout and response validation.
- Added the dataset registry.
- Added the preview runner foundation.
- Committed the architecture foundation without build issues.

## Bugs resolved

### FUNCTION_INVOCATION_FAILED on health endpoint

Cause: incompatible or ambiguous handler exports were used for a plain Vite Vercel Function.

Resolution: use a default-exported Node handler with `VercelRequest` and `VercelResponse`, supported by `@vercel/node`.

### Confusing and damaged folder structure

Cause: files were accidentally deleted or created under the wrong shared/server paths during manual changes.

Resolution: audit the uploaded project, identify line-ending-only changes, restore tracked files, remove the misplaced `shared/data-engine/importers` path and restore missing shared/server files.

### Empty placeholder sprawl

Cause: multiple zero-byte API and browser Data Engine files obscured the real implementation state.

Resolution: remove unused empty placeholders and retain only working or planned files with clear ownership.

## Architectural decisions

- Server-side authority is mandatory for privileged writes.
- The browser may read published data but may not run privileged catalogue mutations.
- The Data Engine is reusable infrastructure, not a hero-only importer.
- Dataset modules are first-class; the engine owns operations.
- Preview, Stage, Apply, Review, Publish and Rollback are explicit lifecycle operations.
- Source acquisition never implies automatic publication.
- Full-source validation precedes mutation or soft deactivation.
- Stable Forge keys replace mutable display names as canonical identity.
- Automatic hard deletion is prohibited.
- Vercel Cron is the initial scheduler, secured by `CRON_SECRET`.

## Superseded work

The following early approaches are retained only as architectural history and technical debt references:

- browser-side hero catalogue synchronisation;
- browser repository write methods for canonical data;
- framework-style `GET()` API exports;
- ambiguous Web `Request`/`Response` handler attempts;
- importer-centric module terminology;
- direct Fetch → Upsert “sync” without evidence staging and review.

## Outstanding implementation

- Complete the Hero dataset module.
- Add the read-only Hero preview API.
- Design source, evidence and operation-run persistence.
- Implement transactional Stage/Apply with a dataset lock.
- Integrate with the existing Editorial Platform and immutable versions.
- Enforce a dedicated admin capability server-side.
- Replace the browser-side Hero Sync panel path.
- Add status and operation history APIs.
- Add secured Vercel Cron execution.
- Complete automated, mobile, preview and production validation.

## Completion status

The backend and reusable Data Engine foundation was completed. The full Hero vertical slice and scheduled multi-dataset operations were not completed in this conversation and must not be represented as finished.

## FRKS archive

Permanent knowledge, decisions, source inventory, terminology, confidence and gaps are archived at:

`docs/FRKS/sprint-4-data-engine/`
