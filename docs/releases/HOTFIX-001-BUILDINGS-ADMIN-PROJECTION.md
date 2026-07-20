# HOTFIX-001 — Buildings Admin projection

## Status

Implemented locally on 20 July 2026. This hotfix is protected-preview-only;
it does not deploy or mutate production.

## Defect and correction

The published Buildings loader returned the 10 catalogue rows followed by the
587 progression rows as one flat dataset. The Admin adapter then generated
fallback keys and names for rows that did not have catalogue identity fields.
That produced 597 apparent Buildings, including fabricated `Building 1`-style
records.

The loader now returns exactly one canonical record per `building_key`, with
its associated progression nested under `progression`. It reports 10 catalogue
records, 587 progression records and 597 total publication records in
provenance metadata. No runtime demo/fallback generation remains in this path.

## Editor and security

The Buildings editor opens canonical identity, source, verification and the
complete associated progression as a read-only field. Buildings creation,
duplication and deletion remain disabled. Saves use the existing editorial
`save_draft` flow and are disabled unless the editorial head is in `draft`; no
direct browser mutation of published tables is introduced.

## Verification contract

`npm run test:buildings-admin-projection` covers grouping, placeholder removal,
nested public projection handling, honest error state and draft-only editor
safeguards. Database verification is read-only and must confirm publication
`bpub-a8070ae2-beef-4abe-81d8-4e338f768f75`, version 1, with 10 / 587 / 597
counts and no orphan progression rows. Protected-preview browser acceptance
must verify the owner/admin view and ordinary-player denial without staged
leakage.
