# COMPANION-INDEX-001 — Canonical Item Index Foundation

**Status:** First text-only Player and Search foundation candidate; validation pending  
**Branch:** `feature/companion-index-foundation`  
**Base:** `020ba32f8b36184b879f8acfee3245664a0a43b2`  
**Production:** Unchanged  
**Supabase:** Unchanged

## Player outcome

Forge gains one searchable Companion landing page and one canonical item-page route for the first ten governed item identities.

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

The first ten text records are exposed as the non-importable `items` published projection through the shared Data Engine read API.

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
- null public image URL while media remains withheld.

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

A deployed Search projection refresh remains a release acceptance requirement. Code-level provider registration alone does not prove the persistent production Search index contains the new records.

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

## Media boundary

The ten owner-supplied WebP files remain recorded as:

`owner_supplied_unverified_rights`

This slice does not commit, upload, copy, hotlink or publish those binaries. Every public item record has:

- `image_url: null`;
- `media_state: withheld_pending_rights`;
- the intended alt text and planned canonical path preserved as intake metadata;
- a visible explanation that the image is withheld pending source and reuse verification.

Checksums and planned filenames in the intake are evidence records, not publication permission.

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

- exact agreement between the ten text projection records and the governed intake names, alt text and planned paths;
- stable `item.*` identities and canonical route resolution;
- all public image URLs remain null;
- rights status remains `owner_supplied_unverified_rights`;
- no item relationships are emitted as unresolved Search graph edges;
- Data Engine API and Search provider registration;
- `/companion` and item routes;
- navigation registration;
- absence of direct browser-side Supabase access;
- responsive and keyboard-focus contracts;
- existing entity identity, Search, Search API, Search experience and workspace tests;
- lint and TypeScript/Vite production build.

## Remaining release gates

- pass the dedicated Companion Index exact-head workflow;
- pass the full Forge/Vision integration gate;
- deploy the exact commit to Vercel Preview;
- verify `/companion` and at least Truegold, Governor Stamina and Mithril item pages on desktop and phone;
- verify `/api/data-engine/dataset?dataset=items` returns exactly 10 text-only records;
- refresh and verify the Preview Search projection;
- confirm item Search results resolve to canonical pages;
- complete owner visual acceptance;
- merge only after explicit owner approval;
- deploy and smoke-test production;
- keep media and Admin publishing readiness incomplete until their separate governed acceptance passes.

## Safety

- production application remains unchanged;
- Supabase remains unchanged;
- no migration is included;
- no image binary is committed or published;
- no canonical Buildings, Hero or other dataset is mutated;
- existing 14-dataset Admin capability and verification registries remain unchanged;
- no unrelated Player Identity, Vision, Art Studio or Operations workstream is modified.
