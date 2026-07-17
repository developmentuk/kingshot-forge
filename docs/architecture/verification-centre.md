# Forge Verification Centre

## Purpose

The Verification Centre turns existing Forge capability and readiness declarations into evidence-backed operational status. It does not replace the dataset registry, Editorial Platform or shared readiness model, and it cannot make a capability available.

The architecture separates four concerns:

1. `shared/platform/verification.ts` defines platform-neutral verification contracts and aggregation rules.
2. `shared/data-engine/verification-registry.ts` declares dataset-specific checks and the current evidence snapshot from the canonical 14-dataset inventory.
3. `src/platform/verification/VerificationService.ts` resolves latest evidence, expiry, blockers and aggregate status.
4. `src/features/admin/verification/` renders the overview, dataset detail and run evidence without embedding readiness decisions in React components.

## Relationship to readiness

`shared/data-engine/readiness-registry.ts` remains the Admin readiness authority. Its verification capability is derived from the Verification Centre aggregate rather than manually asserted.

The Verification Centre reuses:

- `DATASET_KEYS` as the dataset inventory;
- `DATASET_CAPABILITY_REGISTRY` as capability authority;
- the current Admin browser and Record Editor registries as implementation evidence;
- the Editorial Platform role, workflow, validation, history, audit and publishing services;
- the current published-projection contracts for Heroes and Hero Skills.

It adds no dataset adapter, editor adapter, publication service, permission or persistence path.

## Verification model

A verification definition describes:

- dataset, when the check is dataset-specific;
- affected capability;
- expected evidence;
- severity;
- whether the check is required for `Ready`;
- supporting source, test or document references.

Evidence records:

- result;
- reason;
- environment;
- confidence;
- attempted and verified times;
- optional expiry;
- verifier;
- remediation;
- evidence references.

The supported result states are:

| Result | Meaning |
|---|---|
| Passed | The expected evidence passed in the named environment. |
| Failed | The check ran and contradicted the expected outcome. |
| Blocked | The check could not safely run because a prerequisite is unavailable. |
| Not Run | No current evidence exists. |
| Stale | Previously passed expiring evidence is no longer current. |
| Not Applicable | The capability is intentionally unsupported. |

The aggregate states are:

| State | Derivation |
|---|---|
| Ready | Every applicable required check passed. |
| Partial | Some required evidence passed, but at least one required check is blocked, not run or stale. |
| Blocked | A required check failed, or no applicable required check passed. |
| Unsupported | Every relevant check is not applicable. |

Missing evidence is synthesized as `Not Run`. Only passed evidence can become stale, and only when it has an explicit expiry. Failed, blocked, not-run and stale required evidence can never be counted as `Ready`.

## Evidence lifecycle

The Milestone 4 registry is a reviewed source-controlled evidence snapshot. The Verification Service accepts definitions, evidence, environments and a run descriptor, so a later runner or persistence adapter can supply equivalent records without changing aggregation or UI code.

Evidence that depends on runtime state carries an expiry. Structural evidence without a time expiry must be reviewed when its supporting source changes. The UI shows the latest attempted time, verifier, environment, evidence references and remediation for every check.

No database table, migration or evidence write path was added for Milestone 4.

## Environment safety

The current environment is explicitly classified as `local application / database classification unproven` with read-only database access. Because no connected Supabase branch could be proven non-production:

- migration application is `Blocked`;
- live publication and projection checks are `Blocked`;
- live RLS checks are `Blocked` or `Not Run`;
- local structural, API, in-memory and browser evidence remains distinguishable from live database evidence.

The UI never upgrades these states based on mocked or in-memory publication success.

## Admin routes

- `/admin/verification` — evidence overview for all registered datasets;
- `/admin/verification/:datasetId` — declaration, checks, blockers and remediation for one registered dataset;
- `/admin/verification/runs/:runId` — environment-safe run metadata, counts, logs and evidence references.

All routes use the existing protected Admin route and `cms.view` permission boundary. Unknown dataset and run identifiers show intentional not-found states and do not receive fallback evidence.

## Unsupported operations

Buildings publication is unsupported because no live Buildings projection exists. Archive, restore and rollback remain unsupported at the Admin/API boundary for every dataset until their live-projection semantics are separately designed and verified. The existence of reusable lifecycle methods inside the Editorial Platform is not evidence that these operations are safe or available.

## Extension rules

Future checks should:

1. derive dataset scope from the canonical registry;
2. declare the exact expected evidence and environment;
3. return `Blocked` or `Not Run` when safe execution is unavailable;
4. avoid secrets and sensitive infrastructure details in logs or evidence;
5. keep execution outside React components;
6. add a shared service only when more than one surface needs it;
7. preserve unsupported states instead of inventing behavior.
