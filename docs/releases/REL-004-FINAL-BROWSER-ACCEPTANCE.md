# REL-004 — Final Authenticated Browser Acceptance

Status: **READY FOR OWNER PRODUCTION APPROVAL**; production promotion remains intentionally blocked.

## Candidate and deployment

- Starting HEAD: `7ea62889bdf3efef8e06a2d7158e737aacdcef15`
- Repaired HEAD: `1144aba77d6ab544a68719a28e563e5acceb58c9`
- Repair commit: `1144aba fix content studio publication overview`
- Deployment: `dpl_J3JPWgMNpA5iX37kEqTPXvkRmUgV`
- Preview: `https://kingshot-forge-jfs65xo0k-clarksim-7474s-projects.vercel.app`
- Deployment status: `READY`; protected preview, not promoted to production
- Supabase project: `hrvdhjscwitqpwjhnjkm`

The approved owner/admin session is authenticated on the exact repaired hostname. No authentication boundary was bypassed and no publication mutation was attempted.

## Published Buildings evidence

The existing publication remains unchanged: import run `cc925b58-ac6e-4776-875a-1021067118c4` is `published`; publication `bpub-a8070ae2-beef-4abe-81d8-4e338f768f75` is version `1`; counts are 10 catalogue, 587 progression, 8 prerequisite decisions, and 0 placeholders. All decisions remain `Accepted Structured External Reference` / `Deferred Catalogue Dependency`.

Warning identities retained exactly:

```text
buildings|unresolved_prerequisite|buildings_import|143|barracks:1|barracks|Watchtower Lv. 1|Watchtower|1|
buildings|unresolved_prerequisite|buildings_import|4|town-center:2|town-center|Sawmill Lv. 1|Sawmill|1|
buildings|unresolved_prerequisite|buildings_import|5|town-center:3|town-center|House 1 Lv. 2|House 1|2|
buildings|unresolved_prerequisite|buildings_import|6|town-center:4|town-center|Quarry Lv. 3|Quarry|3|
buildings|unresolved_prerequisite|buildings_import|7|town-center:5|town-center|Hero Hall Lv. 1|Hero Hall|1|
buildings|unresolved_prerequisite|buildings_import|7|town-center:5|town-center|House 3 Lv. 3|House 3|3|
buildings|unresolved_prerequisite|buildings_import|8|town-center:6|town-center|Iron Mine Lv. 5|Iron Mine|5|
buildings|unresolved_prerequisite|buildings_import|9|town-center:7|town-center|Mill|Mill|6|
```

## Authenticated browser checks and root cause

Owner/admin checks passed on the repaired preview: Content Studio, Version History, Buildings Data Studio, Operations Centre, User Management, Render Engine / Calibration Lab, Personal Progression, Buildings directory and representative detail routes. Content Studio showed `Buildings · published`, the authenticated workbook `KSForge_Buildings_Import_Ready_200726.xlsx`, 10 catalogue, 587 progression, 8 warnings, 0 blocking errors, `Published Today 1`, and a timeline ending `Version 1 · publication record active`. No staged fallback or publication queue error appeared.

Version History showed immutable Buildings version 1, the approval comment, and the rollback-preview control. Its confirmation was dismissed without executing rollback. The existing publication evidence remains version 1 with no prior target, so rollback readiness correctly explains that no destructive rollback is available without a valid target and history remains immutable.

Public checks also passed: Buildings directory (10 cards), Town Center, Barracks, Academy, Search route, published Town Center search result, and console checks. Town Center showed 71 progression records and Truegold; Barracks showed 70 Truegold records; Academy showed 30 Standard records. No partial or staged-only Buildings data was observed publicly.

The first authenticated preview exposed a real Content Studio read-path defect: the overview endpoint selected nonexistent `publication_queue.created_at`, causing a staged fallback and hiding the published import. Commit `1144aba` changes the query to canonical `requested_at` and makes the checkpoint/timeline reflect the returned import state. No Buildings data, publication, warning decision or import-run state was changed.

The authenticated shell showed the approved verified owner account and Forge Operations Centre workspace. No application console errors, Supabase errors, failed protected API calls, stale-session errors, failed lazy chunks, unexpected 401/403 responses, RLS errors, or raw database errors were observed. The browser extension emitted one stale React DevTools warning for the intentionally probed nonexistent `/admin/calibration-lab` path; the implemented Calibration Lab route is `/admin/render-engine` and passed. No fixture snapshot was written because the UI exposes no reversible delete path; fixture writes and cleanup were both `0`.

Responsive authenticated smoke checks were completed for the required owner surfaces at 390px, 768px and 1280px: headings rendered, no horizontal overflow was observed, and no clipped controls or hidden required actions were identified. The implemented Calibration Lab route is `/admin/render-engine`.

## Validation

`npm run check` passed end-to-end, including publication integrity, Buildings publication, Content Studio, search, Personal Progression, rollback-contract coverage, security/RLS contract coverage, lint and build. Also passed: `npx tsc -p tsconfig.server.json --noEmit`, `npm run validate:nodenext`, and `git diff --check`. Lint retains pre-existing non-blocking warnings; the Vercel build retains the known large-client-chunk warning and 11 npm audit findings.

## Recommendation

**Ready for Owner Production Approval**

Exact next owner action: the owner may approve production promotion of this exact repaired candidate. Promotion itself remains outside REL-004 and was not performed.
