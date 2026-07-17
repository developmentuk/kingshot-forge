# Editorial Dataset Audit

## Purpose

This document records the evidence-based audit begun in Sprint 9.2 Milestone 2, extended by the Milestone 3 Editorial Platform audit and represented in the Milestone 4 Verification Centre. A capability is not marked complete unless its implementation has been inspected and proportionately exercised. Unknown work remains `Not audited`; it is never inferred from a page name, table or placeholder status.

The executable metadata model lives in:

- `shared/platform/readiness.ts`
- `shared/data-engine/readiness-registry.ts`
- `shared/platform/verification.ts`
- `shared/data-engine/verification-registry.ts`

## Canonical dataset inventory

The shared Data Engine contract registers 14 datasets.

| Dataset | Import/adapter | Admin browser | Editor/history | Publication | Remaining audit |
|---|---:|---:|---:|---:|---|
| Heroes | Implemented | Implemented | Implemented | Partial | Live atomic publication and public consumption |
| Hero Skills | Source staging only; no approved source | Legacy editor registered | Legacy framework only; zero records | Blocked | Source approval, target-schema application, compatible publication and public consumption |
| Hero XP | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| Hero Shards | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| Hero Gear | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| Chief Charms | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| Troops | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| Buildings | Implemented | Implemented | Implemented | Missing | Validation, API and public consumption |
| Truegold | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| War Academy | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| VIP | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| Events | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| Mastery Forging | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |
| KvK Scoring | Implemented | Implemented | Missing | Missing | Validation, API and public consumption |

## Confirmed findings

1. `DATASET_KEYS` is the canonical inventory and currently contains 14 datasets.
2. Thirteen datasets are declared importable and are enforced against the server importer registry at startup.
3. Hero Skills is intentionally not a standard Data Engine import. It uses governed source-staging tables and must not be reported as "Dataset adapter not yet available".
4. Import and adapter readiness are therefore implemented for all registered datasets, using one of two approved modes: `data-engine` or `source-staging`.
5. Every registered dataset has an implemented Admin browser, record viewer, search and mobile layout.
6. Heroes, Hero Skills and Buildings have registered editor schemas and editor adapters. The other eleven datasets are intentionally browse-only.
7. Heroes and Hero Skills have registered publication capability. Buildings remains editable without a publication action.
8. Hero Skills is the only dataset with schema-driven creation enabled. No synthetic browser record is used to enter create mode.
9. Events is browse-only; editing is neither declared nor presented.
10. Filters remain missing for all datasets. Public/API consumption remains unaudited unless separately evidenced.

## Sprint 9.3 Hero Skills governance evidence

Validated locally on 17 July 2026 with read-only connected-database inspection.

- The 60 extracted facts remain staged and unreviewed. Thirty-six lack a canonical name; none has a recorded source digest, permitted-use decision or record-level approval.
- Live, editorial and published Hero Skill record counts are all zero. The registered legacy editor and publication capability therefore do not constitute a canonical dataset.
- The target canonical contract now separates structured progression, typed unlocks, source evidence, withdrawal and server-calculated publication eligibility from subjective Editorial guidance.
- The shared canonical vocabulary excludes `exclusive_gear`; runtime/UI compatibility changes are explicitly deferred.
- The current live schema cannot safely represent structured progression or unlocks, contains an incompatible Hero/slot uniqueness rule, and has overlapping SELECT policies including a permissive policy. These findings are not corrected in production by this milestone.
- A local unapplied proposal provides target constraints and public privacy boundaries. Approved source coverage and schema application remain `Blocked` in the Verification Centre.
- The current public component still derives upgrade-path language and empty level markers. Public UI correction is deferred until approved canonical facts and a compatible projection exist.

## Milestone 3 editorial-platform evidence

Validated locally on 17 July 2026 without Supabase writes.

- Heroes, Hero Skills and Buildings now reuse their registered Record Editor schemas for authoritative server validation. Invalid payloads are rejected with HTTP 422 before an editorial write is attempted.
- The shared capability registry is the authority used by Admin declarations and the server runtime. Browse-only, unknown and non-publishable datasets cannot gain broader support through direct editorial API calls.
- Viewer mutation, Moderator approval and non-publisher publication attempts are rejected server-side. Contributor draft/save/submit, Moderator reject and Admin approve/queue contracts were exercised with in-memory repositories.
- Expected request, permission, transition, concurrency, resource-mismatch and capability failures map to actionable 4xx responses. An unauthenticated request to the running local API returned HTTP 401.
- Draft saving cannot reset an existing non-Draft workflow state. Queue and schedule mutations require a resource belonging to the supplied dataset and record.
- Buildings remains editable and non-publishable. Archive, restore and rollback are intentionally disabled until their live-projection semantics are defined.
- A local, unapplied migration proposes permission-backed editorial read policies and one service-role-only atomic publication transaction for the existing Heroes and Hero Skills live projections.
- Publication readiness is `Partial`, not `Implemented`: the SQL/application boundary passed structural and mocked queue-outcome checks, but no migration was applied and no live transaction was exercised.
- At exact 1440×1000 and 390×844 CSS viewports, the authenticated Heroes and Buildings surfaces had no page-level horizontal overflow. Mobile tables used contained horizontal scrolling; the mobile Record Editor remained vertically reachable.
- The Hero Skills route reached its intentional error/retry state because the local API process did not have `SUPABASE_URL`. No fallback records were substituted. Schema-driven Hero Skills draft creation passed the in-memory API/schema contract but was not re-exercised through the browser in this environment.

## Admin dataset experience validation

Validated locally on 17 July 2026 against all 14 registered Admin dataset routes.

- Desktop validation used a 1440×1000 viewport; mobile validation used an exact 390×844 CSS viewport.
- All routes reached an intentional terminal state without page-level horizontal overflow. Wide tables scroll inside their own containers on mobile.
- Browse-only datasets expose `View` only. Heroes and Buildings expose `View` and `Edit`. Hero Skills loaded an empty live source and exposed schema-driven `Create Record`.
- Events exposed `View` only. No route exposed unavailable `Duplicate` or `Delete` controls.
- Live loading, loaded-empty, API error, retry recovery and unregistered-dataset states were exercised. The error state did not substitute demo or fallback records.
- The catalogue and dashboard report readiness evidence rather than placeholder record counts or import dates. Live record counts remain visible only after a source has loaded.

## Milestone 4 verification evidence

Validated locally on 17 July 2026 without Supabase writes, migrations, deployment or production-data mutation.

- The Admin Verification Centre derives all 14 dataset rows from the canonical dataset capability registry and the latest evidence recorded through the shared verification contracts. It does not maintain a second dataset inventory.
- Readiness states are explicit: `Ready`, `Partial`, `Blocked`, `Unsupported`, `Failed`, `Not Run`, `Stale` and `Not Applicable`. A missing required result is synthesized as `Not Run`; failed, blocked, stale or untested required evidence cannot become `Ready`.
- The current local snapshot reports 14 `Partial` datasets, zero `Ready`, one failed platform check and zero stale checks. Live publication, projection and RLS evidence remains blocked because no connected non-production database could be proven.
- Heroes and Hero Skills show local publication-contract evidence separately from blocked live publication, projection, RLS and migration evidence. Buildings publication is `Unsupported`, while direct publication rejection is independently evidenced as passed.
- Browse-only datasets report unsupported editor, workflow and publication capabilities rather than inheriting editor-backed behavior. Their live RLS and public-consumer checks remain `Not Run`.
- Archive, restore and rollback are shown as explicitly unsupported at the current Admin/API boundary. The Verification Centre does not imply that the underlying workflow framework's unpublished lifecycle methods are safe for live projections.
- Invalid dataset and invalid run routes show intentional not-found states and never substitute fallback evidence.
- Protected-route rejection was exercised unauthenticated. The authenticated owner overview, representative detail routes and run evidence were exercised without page-level overflow or console errors.
- Responsive verification set the browser viewport override to 1440×1000 and 390×844. Chrome's existing 90% zoom yielded effective CSS viewports of 1600×1111 and 433×937; the dimensions were recorded and wide tables remained contained horizontal-scroll regions.
- Keyboard focus visibility was exercised, and each scrollable evidence table is a named, focusable region.
- The focused source scan found no tracked credential-bearing environment file or recognised secret literal. `npm audit` remains a failed verification check: 10 dependency findings (6 high, 4 moderate) were reported and no automatic fix was applied.

The complete evidence ledger and the controlled database test plan are in `docs/testing/SPRINT-9.2-MILESTONE-4.md`.

## Scoring rules

- `Implemented` = 1 point.
- `Partial` = 0.5 points.
- `Missing` = 0 points.
- `Not applicable` is excluded.
- `Not audited` is excluded from the score and reported separately.

A percentage must always expose the implemented, partial, missing and unaudited counts that produced it.

## Next audit sequence

1. Dataset validation readiness.
2. Remaining editor, publishing and immutable-history integrations.
3. Dataset filters.
4. Public API and public pages.
5. Authoritative live draft and published counts when supported by shared services.
6. Re-run blocked verification checks in a proven non-production Supabase environment.
