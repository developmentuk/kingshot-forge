# Architecture Principles

## 1. Clear Boundaries

Separate:

- platform contracts;
- platform services;
- persistence;
- API transport;
- feature orchestration;
- presentation.

## 2. Dependency Direction

Dependencies should point inward toward stable contracts.

```text
UI → Feature Service → Platform Service → Repository Contract
```

Persistence implementations depend on repository contracts, not the reverse.

## 3. Explicit State

Important state changes must be represented by named operations.

Avoid indirect workflow changes caused by incidental field edits.

## 4. Immutable History

Editorial and audit history is append-only.

Historical records must not be rewritten to simulate rollback.

## 5. Replaceable Infrastructure

Core business logic should not depend directly on Supabase, Vercel or browser storage.

Use repository and service boundaries so infrastructure can evolve.

## 6. Server-Side Authority

The server is authoritative for:

- permissions;
- publication;
- privileged mutations;
- secret-backed integrations;
- audit records.

## 7. Validation at Boundaries

Validate external data when it enters the system.

Do not assume remote datasets, API payloads or user input are trustworthy.

## 8. Observability

Important operations should expose enough information to diagnose:

- what happened;
- who initiated it;
- when it occurred;
- what changed;
- whether it succeeded.

## 9. Incremental Evolution

Prefer small, compatible architectural improvements over unnecessary rewrites.

## 10. Documentation as Architecture

Architecture documents and ADRs are part of the implementation and must remain current.
