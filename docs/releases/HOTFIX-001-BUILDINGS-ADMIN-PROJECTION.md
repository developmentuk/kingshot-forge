# HOTFIX-001 — Buildings Admin projection

## HOTFIX-001B repair

The defect was a hydration ownership/lifecycle error. The editor started from
the canonical projection, then treated a missing editorial head as editable;
when a version response arrived, its values replaced the whole record. A
sparse or absent draft therefore produced blank required fields and validation
ran against that transient shape. Progression costs also used `stage` before
`base_level`, allowing Truegold stages to become false standard level errors.

The repaired sequence is: canonical record and nested progression render;
editorial state loads without clearing them; a real draft overlays only
explicit draft fields; progression is replaced only by a non-empty valid draft
progression; validation is enabled only after complete draft hydration. A
missing head, published head, or failed request leaves canonical values visible
and disables editing. Published progression and its mutation controls remain
read-only. Buildings controls now have stable `id`/`name` pairs and labelled
error references.

No published rows, import runs, or publication versions were changed. The
Media Library and Building image control remain planned Version 1.1 work; no
direct image URL field is introduced.

## HOTFIX-001C base-state representation

The canonical Town Center projection contains 71 records: 30 normal upgrade
levels, one normal level-0 base state, four pre-Truegold rows and 36 Truegold
stages. Record `town-center:0` is a valid base state with no costs,
requirements or power and is not an editable upgrade level. The editor now
reports canonical, upgrade, base-state and Truegold-stage counts explicitly,
shows the base state in a read-only section, and keeps positive-integer
validation limited to upgrade rows.

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
