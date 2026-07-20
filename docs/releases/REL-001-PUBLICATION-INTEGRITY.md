# REL-001 — Publication Integrity & Version 1.0 Release Certification

Date: 20 July 2026
Branch: `recovery/0.9.0-rc3-feature-reconciliation`
Starting HEAD: `2cdcfe8cde202e5da7b0ce6bac7dac83bea21990f`
Import run: `cc925b58-ac6e-4776-875a-1021067118c4`

## Root cause

Validation produced eight unresolved prerequisite warning objects. Staging classified warnings on `forge_import_records`, which is unique per `(import_run_id, sheet_name, external_key)`. `town-center:5` row 7 contains two warnings (`Hero Hall Lv. 1` and `House 3 Lv. 3`), so eight warnings became seven record-level warning states. The validation report also placed these warnings under `prerequisiteResolution.rows` while the API looked for `findings`, leaving the report/staging identity boundary implicit.

## Repair

REL-001 gives each warning a deterministic immutable identity from dataset, code, sheet, row, record, building, source text and parsed prerequisite identity. The new append-only `forge_import_warnings` table stores one row per warning and links it to the existing import record where applicable. The current run was backfilled with eight rows; Buildings projections remain empty and the run remains `review_required`.

The Data Studio staging path now writes warning identities, the review API returns them, and validation payloads carry `warningIds`. The release certification compares sorted identity sets and fails on missing, extra or duplicate IDs at any boundary.

## Reconciliation evidence

| Stage | Count | Identity result |
|---|---:|---|
| Validation engine/report | 8 | PASS — eight IDs |
| Import run | 8 | PASS — `warningIds` recorded |
| Immutable warning table | 8 | PASS — eight rows, no duplicates |
| Editorial review | 8 | PASS — API returns warning identities |
| Publication gate/summary | 8 | PASS — candidate identity set reconciles; publication remains disabled |
| Audit identity set | 8 | PASS — certification identity set; no publication audit event is fabricated |

Warning IDs:

- `buildings|unresolved_prerequisite|buildings_import|4|town-center:2|town-center|Sawmill Lv. 1|Sawmill|1|`
- `buildings|unresolved_prerequisite|buildings_import|5|town-center:3|town-center|House 1 Lv. 2|House 1|2|`
- `buildings|unresolved_prerequisite|buildings_import|6|town-center:4|town-center|Quarry Lv. 3|Quarry|3|`
- `buildings|unresolved_prerequisite|buildings_import|7|town-center:5|town-center|Hero Hall Lv. 1|Hero Hall|1|`
- `buildings|unresolved_prerequisite|buildings_import|7|town-center:5|town-center|House 3 Lv. 3|House 3|3|`
- `buildings|unresolved_prerequisite|buildings_import|8|town-center:6|town-center|Iron Mine Lv. 5|Iron Mine|5|`
- `buildings|unresolved_prerequisite|buildings_import|9|town-center:7|town-center|Mill Lv. 6|Mill|6|`
- `buildings|unresolved_prerequisite|buildings_import|143|barracks:1|barracks|Watchtower Lv. 1|Watchtower|1|`

## Release certification

- Validation totals: 597 rows; 8 warnings; 0 blocking errors.
- Blocking IDs: none.
- Audit IDs: the same eight warning identities; no audit event is created for an unpublished run.
- Publication IDs: the same eight candidate warning identities; no Buildings publication version exists.
- Import Run IDs: `cc925b58-ac6e-4776-875a-1021067118c4`.
- Relationship IDs: none created while unpublished.
- Search Refresh IDs: none created while unpublished.
- Rollback IDs: none created while unpublished.
- Publication Version: `null`.
- Certification: **PASS** for identity reconciliation; **publication remains gated** pending owner review.

## Automated coverage

`test-publication-integrity` proves that two warnings sharing one source row remain distinct and that validation/stored/review/publication/audit mismatches fail certification. The append-only database trigger prevents warning history mutation.

## Scope and recommendation

No new import run, Buildings import, feature, publication, merge, push, deployment or tag was created. Version 1.0 remains **Not Ready** because the broader owner-authenticated cross-role, responsive and operational recovery evidence in the final gate is still outstanding.

REL-002 rechecked the certification after applying the REL-001 migration to
Supabase. The eight identities still reconcile and Buildings remain
unpublished. Owner acceptance and the exact publication approval phrase were
not available, so no publication action was taken.
