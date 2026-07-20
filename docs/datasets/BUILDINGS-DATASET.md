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

REL-002 owner acceptance remains pending. The eight warnings must receive
explicit owner/editor decisions before publication; no placeholder catalogue
records may be created.
