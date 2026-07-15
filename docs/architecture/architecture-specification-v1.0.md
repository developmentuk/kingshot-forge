# Forge Platform Architecture Specification v1.0

## 1. Purpose

Forge Platform is the product and data foundation for Kingshot player tools, community services, editorial data, administration and publishing. The architecture must support continuous growth without coupling every feature to one frontend bundle, one global stylesheet or one data shape.

## 2. Architectural principles

1. **Modular monolith first.** Maintain one repository and one deployable web platform while enforcing internal module boundaries.
2. **Feature ownership.** Product behaviour belongs to feature modules, not generic page or service dumping grounds.
3. **Server authority.** Authentication, permissions, imports, mutations and publishing are enforced server-side. Client checks are usability controls, never the security boundary.
4. **Schema at every boundary.** External payloads, API input, database records and CMS edits must be validated before use.
5. **Drafts are not published data.** Source, working, approved and published states are distinct.
6. **Additive migration.** Improve the current codebase incrementally; avoid a high-risk rewrite.
7. **Observable operations.** Imports and publishing must produce run records, logs, counts, errors and actor attribution.
8. **Accessible by default.** Components meet WCAG 2.2 AA intent, keyboard operation and visible focus requirements.
9. **Documentation is part of delivery.** Architectural and behavioural changes include their documentation.
10. **Complete features.** A feature is not complete until its UI, persistence, permissions, validation, errors, tests and documentation are complete.

## 3. System context

### Actors

- Public visitor
- Authenticated player
- Alliance manager
- Contributor/content creator
- Moderator
- Administrator
- Owner
- Scheduled platform process
- External Kingshot data provider

### External systems

- Supabase Auth and PostgreSQL
- Vercel hosting and serverless functions
- Kingshot data/API sources
- Google OAuth
- Optional future Discord and notification services

## 4. Logical architecture

### Experience layer

- Public site and studios
- Player account and profile tools
- Community and alliance tools
- Admin CMS

### Application layer

- Feature use-cases
- Commands and queries
- Permission checks
- API contracts
- Publishing orchestration

### Domain layer

- Player/profile
- Alliance/community
- Transfer
- Hero progression
- Content dataset
- Import run
- Content version
- Publication

### Infrastructure layer

- Supabase repositories
- External source adapters
- Vercel request handlers
- Cache and telemetry adapters

## 5. Target module boundaries

- `platform/auth`: session and identity primitives
- `platform/permissions`: role and policy evaluation
- `platform/database`: clients, generated database types and transaction helpers
- `platform/http`: API response, error and request helpers
- `platform/observability`: logs, correlation IDs and operational events
- `features/*`: independently owned product capabilities
- `cms/*`: dataset catalogue, editing, validation, review, publishing and history
- `data-engine/*`: fetch, parse, normalise, compare and stage source data
- `design-system/*`: tokens and reusable UI primitives

A module may import from `platform` and shared contracts. Features must not import private internals from other features. Cross-feature work uses a public module API.

## 6. Deployment architecture

Continue with Vercel + Supabase for the current platform phase:

- Vite SPA for the web experience
- Vercel Functions for trusted server operations
- Supabase Postgres as the system of record
- Supabase Auth for identity
- Scheduled Vercel jobs or an equivalent scheduler for imports

Reconsider a separate API service only when execution duration, queueing, regional constraints or operational load prove serverless functions insufficient.

## 7. Data architecture

### Data classes

- **Reference source data:** fetched external data and source metadata
- **Staged data:** validated normalised candidate records
- **CMS working data:** editable draft versions
- **Published data:** immutable publication snapshot or version pointer
- **User data:** profiles, memberships, progression and preferences
- **Operational data:** import runs, publish runs, audit events and errors

### Required guarantees

- Stable dataset and record identifiers
- Versioned schemas
- Actor and timestamp on mutations
- Optimistic concurrency for editing
- Immutable history
- Reversible publication
- Source provenance and confidence retained per dataset/record where available

## 8. API architecture

All endpoints use a common envelope and typed error codes.

Success:

```json
{ "status": "success", "data": {}, "meta": {} }
```

Failure:

```json
{ "status": "error", "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

API handlers must be thin: parse request, authenticate, authorise, invoke an application use-case, map the result. Business logic does not live in request handlers.

## 9. Security architecture

- Enforce row-level security for browser-accessible Supabase data.
- Use service-role credentials only in server code.
- Replace shared static import secrets with authenticated administrative requests or signed scheduled-job credentials.
- Validate all write payloads server-side.
- Apply least privilege to roles and database policies.
- Record every privileged mutation in an append-only audit log.
- Never package `.env.local`, build output or `node_modules` in review/release snapshots.

## 10. Quality attributes

- **Reliability:** green build and tests before merge; idempotent imports and publication.
- **Maintainability:** modules under explicit boundaries; large files decomposed by responsibility.
- **Performance:** route-level code splitting, cached reference datasets and bounded queries.
- **Accessibility:** semantic structure, keyboard support, focus management and contrast checks.
- **Security:** server-side policy enforcement and auditable privileged actions.
- **Portability:** infrastructure isolated behind adapters where practical.

## 11. Definition of Done

A feature is complete only when:

- acceptance criteria are met;
- responsive and accessible UI is complete;
- loading, empty, success and failure states exist;
- persistence and migrations are included;
- permissions are enforced server-side;
- validation exists at trust boundaries;
- unit/integration tests cover core behaviour;
- build, lint and tests pass;
- documentation and release notes are updated;
- rollback or recovery is understood.
