# Sprint 9.3 Hero Skills Governance Validation

## Scope

This evidence covers local contracts, governance documentation, the source inventory, stable identifiers, validation, Verification Centre declarations and an unapplied SQL proposal. It does not prove live persistence, migration safety, canonical data completeness, publication or public UI behavior.

Validation date: 17 July 2026.

## Safety boundary

- Connected project `hrvdhjscwitqpwjhnjkm` was inspected read-only.
- No migration was applied.
- No database mutation command was run.
- No staged, canonical, editorial or published Hero Skill record was created.
- Tests use invented structural fixture labels only; they contain no game fact.
- Public Hero Skill UI and runtime loaders were not changed.

## Read-only database evidence

| Check | Result |
|---|---|
| `hero_skills` live rows | 0 |
| `published_hero_skills` rows | 0 |
| Hero Skill editorial heads | 0 |
| source scrape runs | 1 |
| staged Hero Skill facts | 60, all unreviewed |
| staged names | 24 present, 36 missing |
| staged Hero coverage | 10 Heroes, six category/slot facts each |
| staged unlock facts | None |
| staged digest/licensing decision | Not recorded |
| existing category support | Includes incompatible `exclusive_gear` |
| current active-slot uniqueness | Incompatible with category-scoped slots |
| current public base-table policies | Includes a permissive `USING (true)` SELECT policy |

## Focused contract evidence

`npm run test:hero-skills-governance` exercises local fixtures for deterministic identity, identity stability across name/category corrections, base/awakening separation, duplicate Hero/category/slot prevention, missing names, invalid maximum levels, structured progression uniqueness/order/completeness, typed unlock validation, source digest validation, missing/unapproved evidence, unreviewed/withdrawn publication rejection, canonical/editorial separation, Exclusive Gear exclusion, public projection privacy and absence of synthesized levels.

`npm run validate:hero-skills-governance` verifies required contract and SQL structures, an explicit no-staged-promotion boundary, private-field exclusion from the public view, and the unapplied proposal header.

The Verification Centre records governance and stable-identity contract checks as Passed while approved-source coverage and schema application remain Blocked.

## SQL validation

The migration is a forward-only local proposal. Parsing is performed locally without connecting to Supabase. Structural validation rejects canonical inserts, staged-table mutation and private public-view fields. Application and rollback behavior remain blocked pending a proven non-production database and explicit approval.

## Full repository validation

Record exact commands and outcomes here after the final validation run:

| Command | Result |
|---|---|
| `npm run check` | Passed: all validators/tests, lint and production build |
| `npm run test:hero-skills-governance` | Passed with local invented structural fixtures only |
| `npm run validate:hero-skills-governance` | Passed; no-data/no-staged-promotion and public privacy boundaries verified |
| local PostgreSQL parse | Passed with `pg-query-emscripten` 5.1.0; 99 statements; no database connection |
| `git diff --check` | Passed |
| `npm audit --json` | Reported 10 existing issues: 6 high, 4 moderate, 0 critical |

Lint retained seven existing warnings in Auth/Role/Player Identity contexts and `useDataset`; no new lint warning was introduced. The production build retained the existing bundle-size warning for the main client chunk. This milestone changed no dependency version and ran no automatic audit fix.

## Not exercised

- schema application, rollback or RLS behavior;
- atomic parent/child publication;
- canonical import or source approval;
- Admin editing of structured progression/unlocks;
- runtime/public projection compatibility;
- final public UI and removal of inferred progression;
- production or preview deployment.

These remain blockers and must not be represented as Ready.
