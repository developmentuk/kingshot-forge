# Buildings dataset

The owner workbook contract expects 10 catalog rows and 587 progression rows (597 data rows total), plus a verification-notes sheet. Resource costs are raw/base costs and that warning is retained as published metadata. Sparse effect columns are valid and may be null.

Preflight is run with `npm run preflight:buildings -- <path> [report-path]`. It never mutates the workbook and reports workbook fingerprint/metadata, sheets, row/column counts, trailing blank rows, formulas, merges, hidden rows/columns, external links, macros, field validation, cross-sheet reconciliation, progression continuity and prerequisite resolution.

The 20 July 2026 owner workbook `KSForge_Buildings_Import_Ready_200726.xlsx` is 90,060 bytes with SHA-256 `840d70bc9173ef12d454fe72fbe517fe49124b250562c8fbef1b68c0f2dd1980`. It contains 10 catalog rows, 587 progression rows and the required `verification_notes` sheet. Preflight passed with 0 blocking errors, 0 duplicates, 0 orphan records and 0 invalid JSON records. It produced 710 prerequisite mappings and 8 unresolved prerequisite warnings. The unresolved source names remain editorial warnings; no fictitious buildings were created.

Generated reports: `artifacts/buildings-preflight.json`, `artifacts/buildings-preflight-summary.md`, `artifacts/buildings-validation-errors.csv`, `artifacts/buildings-validation-warnings.csv`, `artifacts/buildings-unresolved-prerequisites.csv` and `artifacts/buildings-change-preview.csv`. Live comparison found an empty Buildings baseline (0 catalog/progression rows), so all 597 workbook data records are new and no missing-existing records were identified. Staging remains pending an authenticated Forge actor; publication remains blocked pending owner approval.

DATA-002A correction work keeps the workbook unchanged and adds an owner-visible staged review surface for the 10 catalog and 587 progression records. The eight unresolved prerequisite warnings remain explicit and unmapped until an owner or editor records a decision.

The authenticated recovery run is `cc925b58-ac6e-4776-875a-1021067118c4` and
remains `review_required`. Its source fingerprint and filename match the
validated workbook. The owner preview reports 8 warnings even where two
warnings share source row 7; the warnings are prerequisite entries, not a
deduplicated row count.

REL-002 owner acceptance supplied the decision `Approve Buildings
Publication`, with each warning classified as `Accepted Structured External
Reference` and dependency status `Deferred Catalogue Dependency`. The current
branch has no supported atomic Buildings publication operation, so no
publication write was attempted and no placeholder catalogue records may be
created.
# Publication status

Buildings is published through Forge Content Studio version 1 with 10 catalogue records, 587 progression records, and eight retained structured external prerequisite references. Runtime consumers must use the published-only Supabase projection and its provenance metadata.

REL-004 confirms the repaired preview serves the published-only Buildings
projection publicly: 10 catalogue records and 587 progression records. The
existing import run and eight structured external prerequisite decisions remain
unchanged; Content Studio now reads queue timestamps from canonical
`requested_at`.

## HOTFIX-001 Admin projection correction

The Admin Buildings page now consumes a grouped published projection: 10
catalogue rows, each carrying its associated progression, with 587 progression
rows represented in total. The 597 publication records remain a storage
count, not a directory-row count. Placeholder Building names/keys are not
generated. Editor views expose the canonical progression read-only and save
only through editorial draft actions.
# HOTFIX-001B editor contract

Admin hydration is canonical-first. Published catalogue fields and nested
progression own the initial editor values. Editorial state supplies metadata
and overlays only explicit values from a real draft; a missing draft is not an
empty editable record. Standard cost levels map from `base_level`; Truegold
uses its explicit `truegold_tier`/`stage` fields and is not coerced into the
standard level column. Published progression is displayed read-only.
