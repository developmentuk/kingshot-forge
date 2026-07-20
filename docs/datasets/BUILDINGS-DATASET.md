# Buildings dataset

The owner workbook contract expects 10 catalog rows and 587 progression rows (597 data rows total), plus a verification-notes sheet. Resource costs are raw/base costs and that warning is retained as published metadata. Sparse effect columns are valid and may be null.

Preflight is run with `npm run preflight:buildings -- <path> [report-path]`. It never mutates the workbook and reports sheets, row/column counts, formulas, merges and missing-sheet findings. The supplied workbook was not available in this checkout, so no trial import or publication was attempted.

