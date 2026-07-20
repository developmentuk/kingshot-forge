# Forge Data Studio

Forge Data Studio is the shared upload and validation boundary for editorial datasets. It accepts trusted XLSX/CSV input, identifies sheets, validates against a versioned declarative contract, and produces a preview before any staging or publication mutation.

The first production contract is Buildings. Uploads are fingerprinted and associated with an immutable import run. Published data remains owned by the existing editorial version/publication platform; Data Studio never writes public projections directly from a file-picker action.

States are `uploaded`, `parsing`, `validation_failed`, `review_required`, `staged`, `approved`, `publishing`, `published`, `failed`, `rolled_back`, and `cancelled`. Missing records default to `retain_existing`. Source values and editorial overrides are separate fields.

The live schema adds `forge_dataset_contracts`, `forge_import_runs`, `forge_import_records`, `buildings`, and `building_progression`, all with RLS enabled. Public Buildings reads are limited to published projections.

## DATA-001 workbook outcome — 20 July 2026

`KSForge_Buildings_Import_Ready_200726.xlsx` was read without modification. SHA-256 is `840d70bc9173ef12d454fe72fbe517fe49124b250562c8fbef1b68c0f2dd1980`; the workbook is 90,060 bytes, contains no formulas, merged cells, hidden rows/columns, macros or external links, and contains `buildings_import` (587 rows), `buildings_catalog` (10 rows) and `verification_notes` (11 non-blank rows plus 8 trailing blank rows).

The enhanced preflight passed with zero blocking errors, duplicates, orphan records or invalid requirements JSON. It recorded 8 warnings for unresolved prerequisite names (`Sawmill`, `House 1`, `Quarry`, `Hero Hall`, `House 3`, `Iron Mine`, `Mill` and `Watchtower`), preserving source text and creating no fictitious entities. The connected project had zero live Buildings rows and zero import runs at inspection, so the workbook represents 10 new building entities and 587 new progression records; missing-record handling remains `retain_existing`.

The protected `/admin/imports` UI was verified to load its access gate, but the available browser session was signed out. No import run was created and no staging mutation was made without an authenticated Forge actor. Publication remains gated and requires owner approval after an authenticated Data Studio staging run and review.

## DATA-002A correction checkpoint — 20 July 2026

The first protected-preview attempt used the wrong deployment hostname. The
deployment ID `dpl_GMV4tBog8kVhUAt598qiQfa9YDsq` resolves to
`https://kingshot-forge-95pez7k5k-clarksim-7474s-projects.vercel.app`.
The corrected import surface now loads authenticated import-run detail,
preserves `review_required` as the initial state, displays the eight
unresolved prerequisite records and keeps publication disabled during review.
