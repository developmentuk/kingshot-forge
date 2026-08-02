# COMPANION-BUILDINGS-001 — Complete Buildings Companion

**Status:** Milestone 1 implementation candidate  
**Branch:** `feature/buildings-companion-completion`  
**Production:** Unchanged  
**Supabase:** Read-only inspection only; no schema or data mutation

## Player outcome

The Buildings section becomes a complete, image-led Kingshot Companion experience rather than a plain progression table.

Players can browse every published Forge building, understand what it does, see the fields that are actually present in the owner-approved publication, switch between standard and Truegold progression, review source and verification context, and use the experience on desktop or mobile.

## Canonical baseline

The current owner-approved publication contains:

- 10 building catalogue records;
- 587 building progression records;
- standard resource costs and upgrade times;
- mapped prerequisites;
- power where published;
- Truegold and Tempered Truegold where published;
- building-specific fields including hero level caps, training capacity, training speed, rally capacity, troop deployment and reinforcement capacity.

The public page continues to read only the current published Buildings projection through the Data Engine. It does not read drafts, staged import records or a second editable data source.

## Milestone 1 — Public companion completion

Included:

- original Forge illustration for each of the 10 published buildings;
- explicit disclosure that artwork is original Forge companion artwork, not official Kingshot art;
- image-led directory cards with category, purpose, max level, progression count and Truegold status;
- search across building name, category and purpose;
- category filter;
- richer detail hero with purpose, publication facts and verification date;
- dynamic key-effect summary using only fields present in the published projection;
- separate Standard and Truegold progression views;
- separate Truegold and Tempered Truegold columns;
- dynamic building-specific progression columns;
- raw/base resource warning;
- source link, verification note and publication coverage;
- loading, error and empty states;
- responsive desktop, tablet and phone layouts;
- regression validation for artwork, effect coverage, publication boundary and responsive structure.

## Truth boundary

Forge does not invent missing building values.

The current published schema does not yet contain every defining effect for every building. Known gaps include:

- Academy research effects or unlock detail;
- Storehouse protected-resource capacity;
- Infirmary capacity;
- Embassy Alliance Help count and time reduction;
- governed catalogue media metadata and image provenance fields.

Milestone 1 surfaces all existing canonical values and clearly states when effect data is not present. These gaps move to the governed data-extension milestone rather than being hard-coded into the page.

## Artwork boundary

The illustrations are first-party Forge presentation assets implemented as accessible inline SVG. They are not copied from community sites, hotlinked from third parties or represented as official game art.

Future replacement with in-game screenshots or licensed assets requires:

- source identity;
- usage permission or licence;
- credit and source URL;
- alt text;
- immutable media version;
- editorial review and publication.

## Next milestones

### Milestone 2 — Canonical companion data extension

- define governed building media and companion-detail fields;
- add missing building-effect fields to the Buildings contract;
- prepare a versioned import-ready dataset with field-level provenance and confidence;
- retain the current 10/587 publication until owner review approves a replacement.

### Milestone 3 — Editorial and media workflow

- align the Buildings editor with the current catalogue/progression contract;
- add permissioned media selection/upload through the shared media boundary;
- validate image source, alt text, credit and licence;
- preserve immutable versions and audit events.

### Milestone 4 — Publication and acceptance

- preflight the replacement dataset;
- resolve all warnings;
- publish atomically through the existing Buildings publication service;
- validate public and admin experiences on desktop and mobile;
- deploy the exact accepted commit and smoke-test production.

## Validation

Dedicated workflow: `.github/workflows/buildings-companion-check.yml`

Required checks:

- Buildings Companion contracts;
- existing Buildings publication integrity;
- progression ordering;
- lint;
- TypeScript/Vite production build;
- protected Vercel Preview;
- desktop and mobile owner review;
- no Supabase mutation during Milestone 1.
