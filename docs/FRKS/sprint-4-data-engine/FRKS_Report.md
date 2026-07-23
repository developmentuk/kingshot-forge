# FRKS Report — Sprint 4 Data Engine Architecture

## Executive summary

This archive preserves the long-term knowledge recovered from the Sprint 4 Data Engine conversation. The work established a secure Vite + Vercel Functions + Supabase backend boundary, reusable data acquisition primitives, a dataset registry and runner, and the intended server-authoritative import architecture.

The conversation also records an important correction: early browser-side hero synchronisation and importer-centric designs were transitional and are superseded. The canonical direction is a dataset-centric, operation-based Data Engine aligned with the Forge constitution: evidence is staged, validated and reviewed before publication; privileged mutations remain server-side; history and provenance are retained.

## Permanent knowledge inventory

### FRKS-S4-DE-001 — Server/client boundary
- Category: Decision Record
- Importance: Critical
- Confidence: 100
- Status: Accepted
- Summary: `src/` is browser-only, `api/` contains thin Vercel Function entrypoints, `server/` contains privileged business logic and database access, and `shared/` contains environment-neutral contracts.
- Dependencies: Vite, Vercel Functions, Supabase.
- Related documents: `docs/AEGIS.md`, `docs/architecture/DATA-ENGINE.md`.

### FRKS-S4-DE-002 — Vercel handler standard
- Category: Specification
- Importance: High
- Confidence: 100
- Status: Accepted
- Summary: Plain Vite Vercel Functions use the Node handler signature with `VercelRequest` and `VercelResponse`. Earlier framework-style `GET()` and ambiguous Web `Response` approaches caused `FUNCTION_INVOCATION_FAILED` and are superseded.

### FRKS-S4-DE-003 — Server-only Supabase authority
- Category: Decision Record
- Importance: Critical
- Confidence: 100
- Status: Accepted
- Summary: Browser code uses only the public Supabase client. Privileged writes use a server-only client created from `SUPABASE_SECRET_KEY` or the legacy service-role fallback. Secrets are never prefixed with `VITE_` and never imported into `src/`.

### FRKS-S4-DE-004 — Data Engine primitives
- Category: Permanent Knowledge
- Importance: High
- Confidence: 100
- Status: Implemented foundation
- Summary: Shared dataset contracts, deterministic SHA-256 hashing, JSON source fetching with timeout/content checks, a dataset registry, and a preview runner form the reusable engine foundation.

### FRKS-S4-DE-005 — Dataset-centric modules
- Category: Decision Record
- Importance: High
- Confidence: 95
- Status: Accepted architectural direction
- Summary: The Data Engine performs import operations; each dataset module defines its source, schema validation, normalisation, stable record keys and supported operations. Dataset modules are first-class; bespoke browser importers are not.

### FRKS-S4-DE-006 — Operation lifecycle
- Category: Workflow
- Importance: High
- Confidence: 95
- Status: Accepted direction
- Summary: Canonical operations are Preview, Stage/Apply, Review, Publish and Rollback. “Sync” remains an informal trigger term only and must not collapse evidence acquisition, canonical mutation and publication into one uncontrolled action.

### FRKS-S4-DE-007 — Hero source envelope
- Category: Dataset Specification
- Importance: High
- Confidence: 95
- Status: Reference source
- Summary: The hero source is an object containing `_meta` and a `heroes` array, not a flat array. Source metadata, confidence and provenance must be preserved. Hero rankings are editorial judgements even where identity fields are verified.

### FRKS-S4-DE-008 — Safe full-dataset application
- Category: Specification
- Importance: Critical
- Confidence: 95
- Status: Planned
- Summary: Validate the entire source before mutation; use stable Forge-owned keys; upsert new and changed records; never hard-delete automatically; deactivate missing records only after a complete successful validation; run database application transactionally with a per-dataset lock.

### FRKS-S4-DE-009 — Admin API shape
- Category: Specification
- Importance: High
- Confidence: 90
- Status: Planned
- Summary: Initial endpoints are health, dataset status, run history, manual hero operation and scheduled data operation. Admin requests carry a user access token; the server verifies identity and Forge capability before privileged work.

### FRKS-S4-DE-010 — Scheduled operations
- Category: Decision Record
- Importance: Medium
- Confidence: 90
- Status: Planned
- Summary: Vercel Cron is the initial scheduler for this Vercel-centred backend. Cron requests require `CRON_SECRET`. Daily refresh is sufficient for static reference datasets unless evidence shows otherwise.

## Architecture map

```text
Public/Admin UI
    -> thin API endpoint
    -> authenticated server operation
    -> Data Engine runner
    -> dataset registry/module
    -> source fetch + hash + validation + normalisation
    -> evidence/import run persistence
    -> explicit review/publication workflow
    -> published projection
```

## Conflict and supersession register

1. Browser-side privileged hero catalogue writes conflict with server-side authority. They are technical debt and must be removed after the server replacement is validated.
2. Framework-style `export function GET()` and mixed Web handler assumptions are superseded by the Node Vercel handler standard for this project.
3. Importer-centric naming is superseded by dataset-centric modules, but the reusable engine contract remains valid.
4. A direct Fetch → Upsert “sync” conflicts with AEGIS evidence, review and publication requirements. Future implementation must stage evidence and preserve immutable history.
5. The early suggestion to physically move existing browser importers unchanged is superseded; parsing may be reused conceptually, but privileged and browser concerns must be split.

## Risk assessment

- Critical: exposing or reusing compromised Supabase server credentials.
- Critical: allowing browser code to perform privileged canonical writes.
- High: automatically deactivating records after a malformed or partial source response.
- High: treating source confidence as publication approval.
- High: losing raw payloads, hashes or import-run provenance.
- Medium: dataset modules drifting into inconsistent bespoke contracts.
- Medium: relying on one community source without review.
- Medium: treating editorial hero tiers as verified game facts.

## Repository mapping

- Architecture: `docs/architecture/DATA-ENGINE.md`
- ADR: `docs/ADR/ADR-DATA-001-dataset-centric-data-engine.md`
- Dataset contract: `docs/specifications/DATASET-MODULE-CONTRACT.md`
- Sprint record: `docs/releases/SPRINT-4-DATA-ENGINE.md`
- FRKS archive: `docs/FRKS/sprint-4-data-engine/`
- Runtime code: `api/`, `server/data-engine/`, `server/database/`, `shared/data-engine/`
- Future raw evidence snapshots: governed Supabase evidence tables, with repository schemas and migrations committed under `supabase/migrations/`.

## Migration summary

The conversation has been converted into permanent repository documentation and structured registers. No lasting architectural decision should remain dependent on the chat transcript. Implementation claims are separated from planned architecture; source-derived datasets remain references rather than automatically published Forge truth.
