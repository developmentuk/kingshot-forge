# REL-003 — Atomic Buildings Publication & Warning Decisions

Status: PASS for the approved Buildings publication on 2026-07-20.

## Certification

Starting HEAD: `5799ea4`  
Import run: `cc925b58-ac6e-4776-875a-1021067118c4`  
Publication: `bpub-a8070ae2-beef-4abe-81d8-4e338f768f75`  
Publication version: `1`  
Manifest hash: `0209b43dea3054fadfe88483274c902d`

The eight warning identities reconcile exactly between validation, the current decision view, publication prerequisites, and publication audit metadata:

```text
buildings|unresolved_prerequisite|buildings_import|143|barracks:1|barracks|Watchtower Lv. 1|Watchtower|1|
buildings|unresolved_prerequisite|buildings_import|4|town-center:2|town-center|Sawmill Lv. 1|Sawmill|1|
buildings|unresolved_prerequisite|buildings_import|5|town-center:3|town-center|House 1 Lv. 2|House 1|2|
buildings|unresolved_prerequisite|buildings_import|6|town-center:4|town-center|Quarry Lv. 3|Quarry|3|
buildings|unresolved_prerequisite|buildings_import|7|town-center:5|town-center|Hero Hall Lv. 1|Hero Hall|1|
buildings|unresolved_prerequisite|buildings_import|7|town-center:5|town-center|House 3 Lv. 3|House 3|3|
buildings|unresolved_prerequisite|buildings_import|8|town-center:6|town-center|Iron Mine Lv. 5|Iron Mine|5|
buildings|unresolved_prerequisite|buildings_import|9|town-center:7|town-center|Mill Lv. 6|Mill|6|
```

Each decision is `Accepted Structured External Reference` with dependency status `Deferred Catalogue Dependency`; no placeholder Buildings were created. Publication contains 10 catalogue records, 587 progression records, and 8 immutable prerequisite decisions. The import run is `published`.

## Root cause and repair

The original blocker was a warning identity/count mismatch in staged warning persistence. REL-001 repaired identity reconciliation. REL-003 then found two publication-boundary defects during safe dry execution: formatted numeric strings were cast without removing commas, and the publication queue stored a publication ID where its foreign key required an editorial version ID. Both failures rolled back atomically with no public rows. Hardening migrations normalize numeric/integer values, use a valid editorial version link, make refresh retries idempotent, and provide append-only rollback.

Runtime Buildings reads now use the published Supabase projection only. Refresh results were: search `succeeded` (10 records), relationship `succeeded` (0 canonical relationships because all eight references are intentionally external/deferred), prerequisite graph `succeeded`, and Personal Progression `succeeded`. No staged-only rows leaked into the public projection.

Rollback preview is available and reports history preservation; version 1 has no earlier publication, so its executable rollback availability is correctly `false` until a later publication exists.

## Release certification

PASS — publication is atomic, server-only, permission-gated, idempotent, manifest-hash gated, warning-identity gated, RLS protected, and audit-linked. The application was not merged, tagged, pushed, deployed, or released to production by this sprint.

REL-004 found that the first protected preview's Content Studio overview
selected nonexistent `publication_queue.created_at` instead of canonical
`requested_at`. Commit `1144aba` repairs the read path and status copy. The
repaired preview requires owner sign-in on its new protected hostname before
authenticated acceptance can be certified.
