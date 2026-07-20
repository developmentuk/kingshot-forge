# Forge Data Studio

Forge Data Studio is the shared upload and validation boundary for editorial datasets. It accepts trusted XLSX/CSV input, identifies sheets, validates against a versioned declarative contract, and produces a preview before any staging or publication mutation.

The first production contract is Buildings. Uploads are fingerprinted and associated with an immutable import run. Published data remains owned by the existing editorial version/publication platform; Data Studio never writes public projections directly from a file-picker action.

States are `uploaded`, `parsing`, `validation_failed`, `review_required`, `staged`, `approved`, `publishing`, `published`, `failed`, `rolled_back`, and `cancelled`. Missing records default to `retain_existing`. Source values and editorial overrides are separate fields.

The live schema adds `forge_dataset_contracts`, `forge_import_runs`, `forge_import_records`, `buildings`, and `building_progression`, all with RLS enabled. Public Buildings reads are limited to published projections.

