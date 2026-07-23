# Forge Data Engine Architecture

## Purpose

The Forge Data Engine acquires external Kingshot evidence and converts it into governed Forge data without bypassing provenance, validation, review, immutable history or publication controls.

It is a platform service, not a hero-specific feature.

## Canonical boundaries

```text
src/
  React UI, public Supabase client, browser API clients

api/
  Thin Vercel Function entrypoints using VercelRequest/VercelResponse

server/
  Authentication, capabilities, Data Engine operations, repositories and privileged Supabase client

shared/
  Environment-neutral contracts and serialisable types
```

Nothing under `src/` may import the server Supabase client or perform privileged canonical mutations.

## Logical architecture

```text
Admin or scheduled trigger
    -> API request validation
    -> actor/cron authentication
    -> capability check
    -> operation runner
    -> dataset registry
    -> dataset module
    -> source fetch
    -> deterministic hash
    -> envelope validation
    -> normalisation
    -> duplicate/completeness checks
    -> evidence staging and operation record
    -> explicit editorial review
    -> canonical apply and publication services
    -> published projection
```

## Core components

### Dataset registry

Maps a stable dataset key to a dataset module. Registration fails closed for unknown or duplicate keys.

### Source fetcher

Responsible for timeouts, redirects, HTTP status checks, JSON content checks and acquisition timestamps. It does not interpret dataset semantics.

### Payload hashing

Canonicalises object key order while preserving array order, then generates a SHA-256 hash. The hash supports provenance and unchanged detection; it is not a security signature.

### Operation runner

Coordinates reusable operation steps and produces structured results. It must not contain hero-, gear- or building-specific field rules.

### Dataset module

Defines the source-specific schema, normalisation, metadata extraction and stable record key. See `docs/specifications/DATASET-MODULE-CONTRACT.md`.

### Evidence and operation persistence

Every acquisition should record at minimum:

- dataset key;
- trigger and actor;
- source identity and resolved URL;
- started, fetched and completed timestamps;
- HTTP status;
- payload hash;
- source-reported update date;
- received, valid, invalid, inserted, updated, unchanged and deactivated counts;
- validation results;
- operation status and error details;
- raw payload reference or preserved evidence reference.

### Editorial integration

The Data Engine does not create a competing publication system. Staged source facts feed the existing Editorial Intelligence and Editorial Platform domains. Public consumers continue to use published projections only.

## Operation lifecycle

### Preview

Fetch, hash, validate and normalise. Return metadata, counts, keys, warnings and validation errors. No persistent canonical mutation.

### Stage

Persist source evidence, import-run metadata and normalised candidate facts. Staged data is not public.

### Apply

Create or update governed draft records through the shared editorial contracts. Use optimistic concurrency and immutable versions.

### Review

Editors inspect evidence, conflicts, completeness and confidence.

### Publish

Authorised server-side operation updates the published projection and audit history.

### Rollback

Creates a new version based on a prior accepted state. Existing history is never rewritten or deleted.

## Safe full-dataset rules

- Validate the complete source before deactivating anything.
- Reject empty datasets unless the module explicitly permits an empty source.
- Reject duplicate stable keys.
- Use Forge-owned stable keys, not mutable display names, as identity.
- Acquire a dataset-level database lock for mutating operations.
- Apply related changes transactionally.
- Never hard-delete automatically.
- Missing records may be marked source-inactive only after a complete successful source snapshot.
- A source confidence score does not grant publication permission.

## Authentication and authorisation

Manual admin requests send the signed-in user's Supabase access token. The server resolves the Forge actor and checks a dedicated capability before any mutation. UI visibility is not an authorisation boundary.

Cron requests use `CRON_SECRET` and may only invoke operations explicitly enabled for scheduling.

## Initial API surface

```text
GET  /api/health
GET  /api/admin/data/status
GET  /api/admin/data/runs
POST /api/admin/data/heroes/preview
POST /api/admin/data/heroes/stage
POST /api/cron/data-operations
```

Exact routes may evolve, but API entrypoints remain thin and operation semantics remain explicit.

## Initial dataset order

1. Heroes
2. Hero XP and shards
3. Gear and charm
4. Buildings and Truegold
5. Troops and War Academy
6. VIP
7. Events and KvK
8. Masters after conflict resolution

Expansion is gated by a complete, validated Hero vertical slice.

## Known technical debt

- Legacy browser-side hero importer and catalogue sync code.
- Browser repositories that still expose write methods.
- Missing evidence/run persistence migrations.
- Missing transactional apply operation.
- Missing automated malformed-source and concurrency tests.

## Definition of done

A dataset operation is complete only when its contracts, source validation, provenance, persistence, permissions, audit history, publication integration, browser workflow, mobile states, automated checks, deployed smoke tests and documentation all pass the AEGIS quality gates.
