# REL-004 — Final Authenticated Browser Acceptance

Status: **NOT READY FOR VERSION 1.0** pending owner authentication on the repaired preview host.

## Candidate and deployment

- Starting HEAD: `7ea62889bdf3efef8e06a2d7158e737aacdcef15`
- Repaired HEAD: `1144aba77d6ab544a68719a28e563e5acceb58c9`
- Repair commit: `1144aba fix content studio publication overview`
- Deployment: `dpl_J3JPWgMNpA5iX37kEqTPXvkRmUgV`
- Preview: `https://kingshot-forge-jfs65xo0k-clarksim-7474s-projects.vercel.app`
- Deployment status: `READY`; protected preview, not promoted to production
- Supabase project: `hrvdhjscwitqpwjhnjkm`

The existing owner session was authenticated on the prior preview hostname. The repaired hostname correctly returned `Access denied` for `/admin/content-studio` until the owner signs in on that exact hostname. No authentication boundary was bypassed and no publication mutation was attempted.

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

## Browser checks and root cause

Public checks passed on the repaired preview: Buildings directory (10 cards), Town Center, Barracks, Academy, Search route, published Town Center search result, and console error/warning checks. Town Center showed 71 progression records and Truegold; Barracks showed 70 Truegold records; Academy showed 30 Standard records. No partial or staged-only Buildings data was observed publicly.

The first authenticated preview exposed a real Content Studio read-path defect: the overview endpoint selected nonexistent `publication_queue.created_at`, causing a staged fallback and hiding the published import. Commit `1144aba` changes the query to canonical `requested_at` and makes the checkpoint/timeline reflect the returned import state. No Buildings data, publication, warning decision or import-run state was changed.

Owner-authenticated acceptance of the repaired preview remains pending. Therefore Content Studio, owner role/capability evidence, audit timeline UI, rollback preview UI, responsive authenticated workflow, and authenticated network checks are not certified by this report.

## Validation

`npm run check` passed end-to-end, including publication integrity, Buildings publication, Content Studio, search, Personal Progression, rollback-contract coverage, security/RLS contract coverage, lint and build. Also passed: `npx tsc -p tsconfig.server.json --noEmit`, `npm run validate:nodenext`, and `git diff --check`. Lint retains pre-existing non-blocking warnings; the Vercel build retains the known large-client-chunk warning and 11 npm audit findings.

## Recommendation

**Not Ready for Version 1.0**

Exact next owner action: open the repaired protected preview, authenticate in that browser session, confirm `/admin/content-studio` shows the published Buildings import, and complete the owner-only Content Studio, audit, rollback, responsive, console and network checks. Do not promote to production until that evidence is recorded.
