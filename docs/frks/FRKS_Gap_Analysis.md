# FRKS Gap Analysis

- **Updated:** 2026-07-23
- **Scope:** FRKS foundation, RoeBot JavaDocs reference and engineering governance

## Missing validation

### RoeBot building inventory

The extracted enum inventory has not been compared record-by-record with the current canonical Buildings dataset. Additional names may represent aliases, decorative structures, feature entrances, retired content or genuine missing entities.

**Required:** editorial comparison with source evidence before any canonical dataset change.

### RoeBot terminology freshness

The JavaDocs may lag behind the live game and use RoeBot-specific recognition labels.

**Required:** review against current in-game screenshots or other governed evidence.

### Database migration rehearsal

The project intentionally declined a paid Supabase branch. The safe alternative requires documented local/static checks, backup readiness, rollback guidance and explicit post-deployment validation.

**Required:** align ADR-013 with any existing detailed database governance and migration scripts.

## Missing documentation

- A reusable FRKS Commit checklist should be added to sprint close-out guidance.
- The relationship between FRKS and the existing Editorial Intelligence evidence model should be documented in more detail.
- A stable FRKS JSON schema has not yet been defined.
- Retention and archival rules for large evidence files, screenshots and external source captures remain to be specified.

## Unknowns

- Whether all 28 RoeBot building constants correspond to current live Kingshot entities.
- Whether `ARCHER`, `BREAD`, `CLINIC` and similar labels are translations, internal conventions or stale names.
- Whether any RoeBot image/template assets are legally reusable. They have not been imported and should remain out of scope pending licensing review.
- Whether future FRKS registers should remain file-based only or gain a governed Supabase projection for admin search.

## Superseded assumptions

- The JavaDocs were initially expected to expose hidden hero, item, event and research identifiers. The completed review did not support that conclusion.
- A separate Forge Constitution was proposed. AEGIS already fills that authoritative role.
- FRKS was described as preparation for Version 1. Forge is already in Version 1; FRKS is current infrastructure.

## Priority order

1. Merge the FRKS and ADR foundation after review.
2. Compare the RoeBot building inventory with canonical Buildings records.
3. Add FRKS Commit checks to sprint completion guidance.
4. Define register schemas and maintenance ownership.
5. Decide whether searchable FRKS projections belong in Supabase without making chat or database copies the sole source of truth.
