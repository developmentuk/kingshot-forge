# COMPANION-INDEX-001 — Canonical Item Index Foundation and Media Publication

**Status:** Owner-accepted 75-item media catalogue; persisted `items` Search projection published at index v7; Admin item management incomplete
**Branch:** `feature/companion-index-foundation`  
**Base:** `020ba32f8b36184b879f8acfee3245664a0a43b2`  
**Production:** Unchanged  
**Supabase:** One authorised `items`-only Search refresh; no unrelated mutation

## Player outcome

Forge gains one searchable Companion landing page and one canonical item-page route for 75 governed item identities, including 59 full-artwork items, seven compact-icon items and nine accepted text-only foundation items.

The player experience includes:

- `/companion` as the connected Companion Index;
- `/companion/items/:itemKey` as the canonical item route;
- search by name, alias, category, tags and trust state;
- direct links to currently published Buildings, Building Planner and Hero Companion destinations;
- typed item relationships with available and planned destinations shown honestly;
- source, confidence, verification and rights disclosures;
- explicit loading, unavailable, empty and not-found states;
- responsive desktop, tablet and phone layouts;
- keyboard-visible focus states and trust labels that do not rely on colour alone.

## Canonical identity

The shared Forge entity registry now includes the `item` namespace.

The first canonical IDs are:

- `item.mithril`;
- `item.governor-stamina`;
- `item.forgehammer`;
- `item.gilded-threads`;
- `item.satin`;
- `item.charm-guide`;
- `item.charm-design`;
- `item.artisans-vision`;
- `item.truegold`;
- `item.tempered-truegold`.

Every item resolves through the existing stable identity route builder to `/companion/items/:itemKey`. Display names, aliases and future media changes do not change the Forge ID.

## Published projection

The accepted 75 records are exposed as the non-importable `items` published projection through the shared Data Engine read API.

The projection is derived from the governed intake recorded in:

`docs/companion/assets/ITEM-ASSET-INTAKE-2026-08-03.json`

It provides:

- canonical key and Forge ID;
- name and approved aliases;
- category and summary supported by the intake;
- trust state and verification note;
- typed Companion relationship targets;
- canonical URL;
- source and rights metadata;
- a governed immutable image path when approved media exists, otherwise an honest null image state.

`items` is deliberately separate from the existing 14 Admin `DATASET_KEYS`. It does not claim a complete Admin browser/editor/publication vertical. Search and public consumers use `PUBLISHED_DATASET_KEYS`, which adds the item projection without changing the existing Admin capability registry.

## Search

The shared Search provider registry indexes `PUBLISHED_DATASET_KEYS`, including `items`.

Item Search records include:

- stable `item.*` Forge IDs;
- canonical item URLs;
- names and aliases;
- categories, tags and trust labels;
- the published text summary;
- no image while media is withheld;
- no unresolved Search graph edges.

Typed relationships are displayed on item pages through the governed Companion projection. They are not emitted into `search_relationship_projections` until both endpoints have canonical published Search destinations, preventing orphaned relationship records.

The owner-authorised persisted Search publication completed as run `search-refresh-1785795347195`. It ran in `dataset` mode with exactly `["items"]`, started at `2026-08-03T22:15:47.195Z`, completed at `2026-08-03T22:16:21.194Z` and advanced the index from v6 to v7. The run inspected 75 records, inserted 65, updated one, left nine unchanged, removed none, changed no relationships and recorded no failures.

The authenticated actor was `d245eb2e-b295-4c9b-bcef-cd134bfe981a`, corroborated as the Forge `owner` and verified primary Kingdom 850 player. The immutable `search_refresh_runs` schema does not contain an actor column, so actor identity is execution evidence rather than a field of the run row.

Direct persisted-state comparison found 75 expected and 75 actual item projections, zero missing, zero unexpected and zero duplicates. Every route uses `/companion/items/:itemKey`; all 66 non-null images use governed role-specific paths; aliases and keywords are trimmed; no invalid dataset key, orphan relationship or refresh error exists. The historical ten-item run `search-refresh-1785782191921` remains unchanged at v6.

Authenticated Search Explorer verification returned the following persisted v7 results:

- `Mithril` and `mythril` → `item.mithril` at `/companion/items/mithril`;
- `Transfer Pass`, `Governor Gear Materials Chest`, `Pet Advancement Materials Custom Chest`, `Bread` and `Arena Token` → their exact canonical records;
- `teleporter` → Advanced, Alliance and Random Teleporter;
- `emblem` → six canonical emblem records;
- `skill book` → Epic, Mythic and Rare Conquest Skill Book;
- `hero widget chest` → the Gen 4 and Gen 5 Custom Hero Widget Chests.

## Trust states

The first collection uses four explicit states:

- **Verified** — direct or independently corroborated evidence supports the material facts;
- **Confirmed** — a published Forge dataset supports the current relationship;
- **Provisional** — the relationship is supported but a complete description is not yet published;
- **Research needed** — important source or usage details still require editorial verification.

The current intake supports:

- Confirmed: Gilded Threads, Satin, Charm Guide, Charm Design, Artisan's Vision, Truegold and Tempered Truegold;
- Provisional: Mithril and Forgehammer;
- Research needed: Governor Stamina.

No item is marked Verified in this slice.

## Original media boundary

The original ten-file intake remains recorded as:

`owner_supplied_unverified_rights`

That intake alone did not grant publication rights. The later governed media expansion supersedes this boundary only for assets present in the accepted 66-asset manifest. Nine foundation records still have no published image; Mithril now uses the separately accepted governed media path. The original intake preserves:

- the withheld state for foundation assets not in the accepted manifest;
- the intended alt text and planned canonical path preserved as intake metadata;
- a visible explanation that the image is withheld pending source and reuse verification.

Checksums and planned filenames in the intake are evidence records, not publication permission.

## Accepted media expansion — 2026-08-03

The owner supplied and approved two archives: `items.zip` (`7ad7c36474089a683501292ebd849689bb41aa6f9daec14357d0d5984439e233`) and `icons.zip` (`cab698d9d984d4ebb1413b0e27a14e8ac0d297a6d2c8a2d958dc6061c543e26e`). The generated manifest records 59 full artworks, seven compact icons and 66 total transparent WebPs, including source and published checksums, dimensions, byte lengths, original entry names, canonical paths, alt text and publication state.

The accepted expansion uses repository-controlled static WebP publication with immutable role-specific paths. It records the rights basis exactly as `owner_declared_creative_commons`; Forge does not claim independent licence, artist, source, ownership or official-status verification. The existing ten-item projection is preserved, with `mythril` normalised to `item.mithril` and no `item.mythril` identity. The projection contains 75 canonical item records: the accepted ten plus 58 new full-artwork identities and seven compact-icon identities.

The project owner accepted the expanded visual candidate at `de1f99fe556784a6830b1cab5ce5dbb6ae5b4c99` on protected deployment `dpl_GVxisaMDHPL2MkJAR1XA7ifG3dvT`, including representative desktop and approximately 320px, 375px, 390px and 430px mobile review. The governed record is `docs/releases/evidence/COMPANION-INDEX-001-VISUAL-ACCEPTANCE.md`.

The existing persisted ten-item run remains untouched as historical evidence: `search-refresh-1785782191921`, completed `2026-08-03T18:36:31.954952Z`, index v6, 10/10 projections, zero mismatches and zero orphan relationships. The separately authorised 75-item publication is the distinct v7 run documented above.

Validation evidence includes `scripts/test-companion-media.mjs`, the updated Companion Index gate, Search, Search persistence/API/experience, entity identity, Buildings publication and production build. Exact final-candidate results are recorded in PR #37. Admin item browsing, editing, approval, publication and rollback remain incomplete by design.

## Visual acceptance readiness cleanup

The manifest generator now resolves the repository root from its own script location, writes only to governed repository-relative outputs and requires both source archive paths as explicit parameters. It never searches Downloads or another workstation directory. The companion media integrity test accepts optional `KS_ITEMS_ARCHIVE` and `KS_ICONS_ARCHIVE` inputs for source-archive verification without embedding a username or machine path.

Deterministic regeneration with the verified archives preserved the manifest and generated TypeScript byte-for-byte. Expanded visual acceptance is recorded under `docs/releases/evidence/COMPANION-INDEX-001-VISUAL-ACCEPTANCE.md`. The local catalogue intentionally matches canonical `Mithril` but not the typo `mythril`; global governed Search supports and verifies the typo through a Search-only alias without changing local catalogue filtering.

## Admin boundary

This slice does not implement:

- an Items Admin dataset browser;
- an Items Record Editor;
- governed media upload or replacement;
- source/confidence editing;
- review and approval transitions;
- atomic item publication or rollback;
- item readiness badges in the Admin dataset matrix.

Those capabilities remain required by `COMPANION-REL-001` and must be delivered as a complete Player/Admin vertical slice before Item publishing can be marked Implemented.

## Relationship boundary

Available destinations in this slice include:

- Truegold → Buildings and Building Planner;
- Tempered Truegold → Buildings and Building Planner;
- Governor Stamina → Storehouse.

Governor Gear, Governor Charms, Hero Gear, event and future calculator destinations remain visibly planned. The item pages do not create links to routes that are not implemented.

## Validation contract

The dedicated Companion Index gate verifies:

- exact agreement between the 75 canonical projection records and governed intake/media identities;
- stable `item.*` identities and canonical route resolution;
- all 66 published image URLs resolve to governed role-specific paths and the remaining nine stay honestly null;
- published media rights status remains exactly `owner_declared_creative_commons` without an independent-verification claim;
- `mythril` remains a global Search-only alias for canonical `item.mithril`;
- no item relationships are emitted as unresolved Search graph edges;
- Data Engine API and Search provider registration;
- `/companion` and item routes;
- navigation registration;
- absence of direct browser-side Supabase access;
- responsive and keyboard-focus contracts;
- existing entity identity, Search, Search API, Search experience and workspace tests;
- lint and TypeScript/Vite production build.

## Final validation evidence

Local validation completed after the accepted Search publication and before the focused evidence commit:

- Companion media integrity: passed;
- Companion Index identity, projection, rights, alias, Search and responsive route contracts: passed;
- Search, Search persistence, Search performance, Search API and Search experience: passed;
- workspace navigation and Forge/entity identity: passed;
- Buildings Companion, media permission, atomic rollback, Building Planner, publication and progression ordering: passed;
- full Forge/Vision platform, worker, authoring, authenticated acceptance, profile OCR, account-linking, evidence storage/adapters, permission transition, policy correction and activation tests: passed;
- lint: passed with the same ten existing warnings and no new warning;
- TypeScript and Vite production build: passed;
- `git diff --check`: passed.

The complete `npm run check` gate passed in 180.5 seconds. The exact final commit SHA and exact-head remote workflow results are recorded in PR #37 after commit creation and push; a commit cannot contain its own resulting SHA.

## Remaining release gates

- preserve the dedicated Companion Index and full Forge/Vision exact-head results on the final evidence commit;
- preserve the accepted protected Preview evidence and the 75-record Data Engine/Search results;
- merge only after explicit owner approval;
- deploy and smoke-test production;
- keep media and Admin publishing readiness incomplete until their separate governed acceptance passes.

## Safety

- production application remains unchanged;
- Supabase received exactly one dataset-scoped Search mutation for `["items"]`: run `search-refresh-1785795347195`;
- no migration is included;
- no runtime secret, authentication token or local log is committed;
- no canonical Buildings, Hero or other dataset is mutated;
- no unrelated Search projection was touched and no full rebuild was run;
- existing 14-dataset Admin capability and verification registries remain unchanged;
- no unrelated Player Identity, Vision, Art Studio or Operations workstream is modified.
