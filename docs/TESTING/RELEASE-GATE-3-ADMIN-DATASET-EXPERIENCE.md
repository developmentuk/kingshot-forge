# Release Gate 3 — Admin Dataset Experience

- Date: 2026-07-17
- Branch: `release/0.6.0-hero-domain`
- Starting commit: `14ca60d87121fb7d17a5dd871fcd23a557fe317f`
- Scope: Dataset Registry, Data Engine dataset browser, Record Editor availability and responsive Admin states

## Outcome

All fourteen registered datasets now have an intentional Admin experience backed by their existing Data Engine source. Dataset implementation status is derived from the registered capability, browser adapter and Record Editor schema rather than from manual import-status labels.

Heroes, Hero Skills and Buildings expose the governed Record Editor. The other eleven datasets are explicitly browse-only and do not render Edit, Duplicate, Delete or publication actions. Buildings retains draft editing and version history, but does not advertise live publishing because no Buildings live projection exists.

Static demo rows, demo record counts and demo import dates were removed. A failed live load no longer substitutes unrelated fallback data.

## Dataset audit

Record counts are the live local Data Engine responses observed during validation and may change when their canonical sources change.

| Dataset | Source | Browser/search | Record Editor | Create | Live publish | Records observed |
|---|---|---:|---:|---:|---:|---:|
| Heroes | External Data Engine source | Yes | Yes | No | Yes | 27 |
| Hero Skills | Published canonical source | Yes | Yes | Yes | Yes | 0 |
| Buildings | External Data Engine source | Yes | Yes | No | No | 5 |
| Governor Gear | External Data Engine source | Yes | No | No | No | 58 |
| Troops | External Data Engine source | Yes | No | No | No | 15 |
| Governor Charm | External Data Engine source | Yes | No | No | No | 22 |
| VIP | External Data Engine source | Yes | No | No | No | 12 |
| Hero Shards | External Data Engine source | Yes | No | No | No | 30 |
| Hero XP | External Data Engine source | Yes | No | No | No | 80 |
| Truegold | External Data Engine source | Yes | No | No | No | 8 |
| War Academy | External Data Engine source | Yes | No | No | No | 264 |
| Events | External Data Engine source | Yes | No | No | No | 5 |
| KvK Scoring | External Data Engine source | Yes | No | No | No | 32 |
| Masters | External Data Engine source | Yes | No | No | No | 4 |

## State and interaction validation

- Registration and capabilities: all fourteen definitions resolve through the existing Dataset Registry; startup validation rejects missing browser adapters and incomplete editor/schema pairs.
- Browser: all fourteen routes loaded normalized live records through the existing Data Engine endpoint.
- Search, sorting and pagination: verified with Governor Gear, including a one-record search result, numeric sorting and navigation to page 2 of 6.
- Filters: no current dataset browser declares filter controls, so the conditional filter criterion is not applicable to this gate.
- Record view: verified from a browse-only dataset; the record detail panel renders the configured leading display value and normalized fields.
- Editing: Heroes and Buildings render View and Edit. Hero Skills exposes an explicit Create record action. Browse-only datasets render View only.
- Empty state: the live Hero Skills response contained zero rows and rendered a successful-empty message rather than a failed-search message. The Create action remained available.
- Loading state: observed while each live source was fetched and normalized.
- Error state: the browser has an explicit alert, retry action and no demo-data substitution. The failure branch was reviewed structurally; a live source was not intentionally taken offline during this validation.
- Unsupported route: an unregistered dataset ID rendered Dataset not found with a return link and no record actions.
- Desktop: verified at 1440 × 1000 with three dataset cards per row and no horizontal page overflow.
- Mobile: verified at 390 × 844 for the directory, all fourteen detail routes, browse-only tables, the Hero Skills empty/create flow and the Hero editor. Tables scroll within their panel, the identity and action columns remain visible, and the page itself does not overflow horizontally.

## Automated validation

`npm run check` passed after updating the Hero Skills structural validator to assert the explicit Create action and the schema-owned empty-record factory.

Known pre-existing lint warnings remain in the three React context modules and `src/lib/dataEngine/useDataset.ts`. The existing Vite large-chunk warning also remains.

## Release Gate 4 blockers

1. Exercise the authenticated Viewer, Contributor/Content Creator, Moderator, Publisher and Admin role matrix end to end.
2. Verify server-side rejection for unauthorised record mutation, workflow and publication commands.
3. Validate draft save, review, approval, publication, immutable history and audit identity for Heroes and Hero Skills; validate draft/history without publication for Buildings.
4. Reconcile the generic server runtime dataset definition with the audited registered capabilities so direct API use cannot imply broader dataset support than the Admin UI.
5. Verify invalid transitions, optimistic concurrency and failed-publication rollback against the persistent Supabase runtime.
6. Complete exact-commit preview/production smoke validation before release acceptance.
