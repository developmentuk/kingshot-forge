# Dataset contracts

Contracts are declarative definitions containing accepted file types and sheets, canonical/detail sheet roles, keys, fields, types, nullability, unique constraints, relationships, metadata, and validation policy. Domain validators consume the same contract shape so future Troops, Gear, Events, Heroes, VIP, Truegold and KvK imports use the same pipeline.

Buildings uses `buildings_catalog` as the canonical entity sheet and `buildings_import` as progression detail. `record_id` is the detail identity and `building_key` is the relational identity. Requirements JSON is required to remain an array, while `requirements_text` preserves the source display.

The Buildings Data Studio preflight also records workbook fingerprint, sheet metadata, row/column coordinates, severity, suggested resolution, prerequisite mappings and unresolved prerequisites. Valid source rows may enter an authenticated `staged` import run; they never write `buildings` or `building_progression` directly. Publication is a separate owner-authorised editorial action.

The correction checkpoint uses `review_required` for an authenticated staged import run. Import-run detail reads are limited to the authenticated uploader, and the review surface exposes source rows, original values, prerequisite warnings and a publication-disabled summary before any public projection write.
