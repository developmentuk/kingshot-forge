# Sprint 9.2 — Milestone 4 Verification Centre

## Scope and safety decision

Validation date: 17 July 2026.

Branch: `release/0.7.0-player-domain`.

Milestone 4 adds an evidence-driven Admin Verification Centre and deterministic local verification coverage. It does not redesign the Editorial Platform or add a database evidence store.

The connected Supabase project is `hrvdhjscwitqpwjhnjkm` (`Kingshot Forge`, `eu-west-2`, PostgreSQL 17). Account inspection found no second project, and branch enumeration could not prove an approved non-production target. The project classification therefore remains `unproven`.

Database execution stopped at that safety boundary. No migration, SQL write, test-data creation, publication, rollback or RLS query was executed. The approved migration `20260717170000_secure_atomic_editorial_publication.sql` is absent from the connected project's migration history and remains local and unapplied.

## Repository and environment evidence

The read-only preflight recorded:

- starting HEAD `187a83c067f8d699f44f7344d285b76331e07a65`;
- origin HEAD `1aca694ebe2e57339e17ab85ab190ad762620b8b`;
- local branch four commits ahead, zero behind, with the remote commit as merge base;
- clean working tree before Milestone 4 changes;
- local API environment variables for the Supabase URL and service role present without values being displayed;
- the Gift Code worktree clean with ten unique files and no Milestone 4 file overlap;
- the Player Planning worktree clean with no unique files and no Milestone 4 file overlap.

The only Supabase operations were read-only project/account metadata and migration-history inspection. The branch-list request failed before returning branch metadata. No further database command was issued after the environment could not be classified safely.

## Evidence and readiness rules

Result states are `Passed`, `Failed`, `Blocked`, `Not Run`, `Stale` and `Not Applicable`.

Aggregate states are `Ready`, `Partial`, `Blocked` and `Unsupported`.

- A dataset is `Ready` only when every applicable required check has passed.
- A required failed check makes the dataset `Blocked`.
- A mixture of passed evidence and blocked, not-run or stale required evidence is `Partial`.
- A capability with only not-applicable evidence is `Unsupported`.
- Missing evidence becomes `Not Run`; it does not silently pass.
- Expired passed evidence becomes `Stale` and cannot count toward `Ready`.

The current local snapshot has 14 `Partial` datasets, zero `Ready` datasets, one failed platform check, zero stale checks and outstanding blocked live-database checks.

## Dataset verification matrix

| Dataset | Browse / record view | Schema / edit | Workflow | Publication / projection | RLS / public read | Overall |
|---|---|---|---|---|---|---|
| Heroes | Passed | Passed | Passed | Local contract passed; live transaction and projection Blocked | Blocked | Partial |
| Hero Skills | Passed | Passed, including schema-driven first draft | Passed | Local contract passed; live transaction and projection Blocked | Blocked; canonical boundary Passed | Partial |
| Buildings | Passed | Passed | Passed | Unsupported; direct API rejection Passed | Live RLS Blocked; public read Not Run | Partial |
| Hero XP | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| Hero Shards | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| Hero Gear | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| Chief Charms | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| Troops | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| Truegold | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| War Academy | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| VIP | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| Events | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| Mastery Forging | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |
| KvK Scoring | Passed | Unsupported | Unsupported | Unsupported | Not Run | Partial |

All 14 definitions are derived from `DATASET_KEYS` and `DATASET_CAPABILITY_REGISTRY`. Unknown dataset UI and API requests receive intentional not-found responses and no fallback capability.

## Role, permission and RLS matrix

The application columns below were exercised through local policy, direct API or protected-route tests. The database column remains blocked until a proven non-production environment exists.

| Actor | UI / API expectation | Local evidence | Live grants and RLS |
|---|---|---|---|
| Unauthenticated | No Admin access, mutation, queue, schedule or publication | Protected Admin route showed Access denied; local API returned 401 | Blocked / not run |
| Viewer | Permitted reads only; mutations rejected | Shared role policy passed; update rejected | Blocked / not run |
| Contributor | Create/edit/save draft and submit; no approve, publish or privileged queue recovery | Workflow and permission contracts passed with in-memory repositories | Blocked / not run |
| Moderator | Review and reject/return to draft; no approval or publication | Review policy and transition contracts passed | Blocked / not run |
| Admin / Owner | Approve, queue, schedule, publish and supported recovery | Policy, queue, scheduling and direct API contracts passed | Blocked / not run |
| Service role | Server-only atomic transaction execution | Migration source revokes `PUBLIC`, `anon` and `authenticated`, then grants only `service_role` | Structural evidence only; live grant inspection Blocked |

The proposed database policies require `cms.history.view` for editorial history/head/audit reads and `cms.publish` for queue/schedule reads. Their SQL is structurally validated but unapplied, so live RLS is not marked Passed.

## Publication transaction evidence

| # | Invariant | Current evidence |
|---:|---|---|
| 1 | Queue item belongs to supplied dataset | Direct API resource-mismatch rejection Passed |
| 2 | Queue item belongs to supplied record | Direct API resource-mismatch rejection Passed |
| 3 | Approved version matches current head | In-memory workflow/publication contract Passed |
| 4 | Stale versions fail | Optimistic concurrency and stale-version tests Passed |
| 5 | Invalid states fail | Invalid workflow and publication-state tests Passed |
| 6 | Unsupported datasets fail | All eleven browse-only datasets and Buildings publication return structured 422 |
| 7 | Unauthorized actors fail | Local role/API tests Passed |
| 8 | Projection update and publication history are atomic | Structural and repository contract Passed; live database transaction Blocked |
| 9 | Audit actor attribution is preserved | In-memory history/audit identity tests Passed |
| 10 | Failure rolls back success-path writes | In-memory failure path Passed; live forced-failure transaction Blocked |
| 11 | Failed queue recovery is explicit | Failed-state and recovery tests Passed |
| 12 | Retry returns to Pending only when valid | Retry transition tests Passed |
| 13 | Duplicate execution is rejected or idempotent | Duplicate processing test Passed |
| 14 | Ambiguous response cannot report false success | Completed-outcome recovery and still-processing rejection Passed with repository mocks |

No synthetic or in-memory result is used to claim live publication, projection, RLS or production readiness.

## Controlled migration validation plan

This plan is documentation only. Every write requires a separately proven non-production target plus explicit Clark and Aegis approval.

### Preconditions

1. Record the exact Supabase project and branch reference and prove it is non-production.
2. Confirm the branch is disposable or has an approved point-in-time recovery path.
3. Report every intended fixture and migration write before execution.
4. Confirm migration history through `20260717170000` and inspect the live schema for all referenced tables, columns, types, constraints and RLS enablement.
5. Confirm `hero_skills.editorial_key` uniqueness and the expected Heroes/Hero Skills projection columns.
6. Create uniquely prefixed disposable fixtures only in the approved isolated environment; never alter production or canonical Hero Skills content.
7. Capture sanitized before-state evidence for record head, approved version, queue item, projection and audit rows.

### Expected migration objects

- schema `forge_private` with no `PUBLIC` access;
- security-definer function `forge_private.has_permission(text)` with empty `search_path`;
- select grants and permission-backed policies for editorial versions, heads, audit, queue and schedules;
- security-definer function `public.publish_editorial_queue_item(text,text,text,text,timestamptz)` with empty `search_path`;
- explicit execute revocation from `PUBLIC`, `anon` and `authenticated`;
- execute grant only to `service_role`.

Live inspection must prove the exact grants, owners, function definitions, policy predicates and schema qualification. Any broader execute or table privilege stops the test.

### Application and transaction cases

1. Apply the reviewed migration once to the approved non-production branch and capture migration history and object diffs.
2. Execute the unauthenticated, Viewer, Contributor, Moderator, Admin/Owner and service-role matrix with disposable identities.
3. Confirm authenticated reads require the intended Forge permission and that client roles cannot execute the publication function.
4. Run a success publication for an isolated fixture and prove, in one committed outcome, projection update, new immutable published version, head advancement, audit actor/action identity and completed queue metadata.
5. Force one failure after the projection branch begins and prove projection, version, head, audit and queue-success writes roll back together.
6. Exercise stale head, invalid status, unsupported dataset, mismatched version and missing projection-record failures.
7. Prove queue failure is explicit, valid retry moves only a failed item to Pending, duplicate processing is rejected, and ambiguous client response is reconciled from committed queue state without false success.

### Rollback and cleanup

- Application rollback: keep publication readiness Partial, disable use of the RPC path and return to the prior repository path without presenting a successful outcome.
- Database rollback: use a separately reviewed forward migration to restore prior policies/grants and remove new functions only after dependency and privilege inspection. Do not use ad hoc destructive SQL.
- A database migration rollback does not undo content already published by a committed transaction; any content reversal requires a separate governed editorial operation.
- Delete only the exact disposable fixture identifiers after evidence capture, verify no residual queue, schedule, version, audit or projection rows, and return the branch to its approved seed/snapshot state.
- Record sanitized SQL results, timestamps, project/branch identity, migration version and actor roles. Never record service keys, tokens, connection strings or private stack traces.

## Verification Centre UI evidence

- The unauthenticated in-app browser reached the expected protected-route Access denied state.
- An existing authenticated owner session reached the overview and displayed all 14 datasets, 14 Partial states, zero Ready, one failed check and zero stale checks.
- Heroes, Hero Skills, Buildings and Events detail routes displayed their declarations, latest evidence, expected evidence, blockers, remediation, environment and unsupported operations.
- Invalid dataset and invalid run identifiers displayed intentional not-found states with no fallback evidence.
- The run view displayed safe environment metadata, counts, checks, outcomes and source/document references.
- The browser viewport override was set to 1440×1000 for desktop and 390×844 for mobile. Chrome's existing 90% zoom produced effective CSS viewports of 1600×1111 and 433×937; both had zero page-level horizontal overflow.
- At mobile size, the 1376 CSS-pixel dataset table remained contained in a 356 CSS-pixel named scroll region.
- Keyboard traversal exposed a visible cyan outline and focus ring. No browser console errors or Vite error overlay were present.

## Validation record

Final command results are recorded after code freeze:

- `npm run check` — passed after code freeze;
- `git diff --check` — passed after code freeze;
- TypeScript/Vite production build — passed through `npm run check` (263 modules transformed);
- Verification Centre structural and source-secret validation — passed;
- readiness aggregation and expiry tests — passed;
- dataset capability consistency tests — passed;
- role and permission matrix tests — passed;
- direct editorial API contracts — passed without database writes;
- publication recovery and ambiguous-response tests — passed with in-memory/repository fixtures;
- responsive, keyboard, focus, overflow, invalid-route and console checks — passed;
- `npm audit --json` — failed with 10 dependency findings: 6 high, 4 moderate, 0 critical.

No automatic dependency fix was run. The suggested `@vercel/node` remediation is not safe to apply mechanically because it changes the toolchain version materially and requires separate review.

## Unexercised behavior and production blockers

- migration application and rollback in a proven non-production database;
- live grant and RLS matrix;
- live Heroes and Hero Skills publication success;
- forced live transaction failure and rollback evidence;
- live projection before/after evidence;
- public consumer behavior through the applied published projection;
- production schema compatibility and production readiness;
- dependency vulnerability remediation.

Archive, restore and rollback remain unsupported at the Admin/API boundary. Buildings remains non-publishable. No canonical Hero Skills record was modified.

## Explicit declarations

- No production migration was applied.
- No production or Supabase data write occurred.
- No canonical Hero Skills record was modified.
- No archive, restore or rollback semantics were invented or enabled.
- No unsupported feature was shown as Ready.
- No deployment, push, merge or tag occurred.
