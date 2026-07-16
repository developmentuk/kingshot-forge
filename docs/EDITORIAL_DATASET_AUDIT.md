# Editorial Dataset Audit

## Purpose

This document records the evidence-based audit for Sprint 9.2 Milestone 2. A capability is not marked complete unless its implementation has been inspected. Unknown work remains `Not audited`; it is never inferred from a page name, table or placeholder status.

The executable metadata model lives in:

- `shared/platform/readiness.ts`
- `shared/data-engine/readiness-registry.ts`

## Canonical dataset inventory

The shared Data Engine contract registers 14 datasets.

| Dataset | Import mode | Import/adapter status | Remaining audit |
|---|---|---:|---|
| Heroes | Data Engine | Implemented | Browser, viewer, editor, validation, publishing, history, API, public, mobile, verification |
| Hero Skills | Source staging | Implemented intentionally | Browser, viewer, editor, validation, publishing, history, API, public, mobile, verification |
| Hero XP | Data Engine | Implemented | Full capability audit |
| Hero Shards | Data Engine | Implemented | Full capability audit |
| Hero Gear | Data Engine | Implemented | Full capability audit |
| Chief Charms | Data Engine | Implemented | Full capability audit |
| Troops | Data Engine | Implemented | Full capability audit |
| Buildings | Data Engine | Implemented | Full capability audit |
| Truegold | Data Engine | Implemented | Full capability audit |
| War Academy | Data Engine | Implemented | Full capability audit |
| VIP | Data Engine | Implemented | Full capability audit |
| Events | Data Engine | Implemented | Full capability audit |
| Mastery Forging | Data Engine | Implemented | Full capability audit |
| KvK Scoring | Data Engine | Implemented | Full capability audit |

## Confirmed findings

1. `DATASET_KEYS` is the canonical inventory and currently contains 14 datasets.
2. Thirteen datasets are declared importable and are enforced against the server importer registry at startup.
3. Hero Skills is intentionally not a standard Data Engine import. It uses governed source-staging tables and must not be reported as "Dataset adapter not yet available".
4. Import and adapter readiness are therefore implemented for all registered datasets, using one of two approved modes: `data-engine` or `source-staging`.
5. All other readiness cells remain unaudited until repository and database evidence is recorded.

## Scoring rules

- `Implemented` = 1 point.
- `Partial` = 0.5 points.
- `Missing` = 0 points.
- `Not applicable` is excluded.
- `Not audited` is excluded from the score and reported separately.

A percentage must always expose the implemented, partial, missing and unaudited counts that produced it.

## Next audit sequence

1. Dataset browser and record viewer.
2. Record editor and validation.
3. Publishing and immutable version history.
4. Search and filters.
5. Public API and public pages.
6. Mobile readiness.
7. Verification and provenance coverage.
8. Live record, draft and published counts from Supabase.
