# COMPANION-BUILDINGS-001 — Complete Buildings Companion

**Status:** Public companion and governed media implementation candidate; owner acceptance and migration approval pending  
**Branch:** `feature/buildings-companion-completion`  
**Validated head:** `477bc99a300fb054a4f5f633177a1560b6e07aa8`  
**Production:** Unchanged  
**Supabase:** Read-only inspection only; additive migration prepared but not applied

## Player outcome

The Buildings section becomes a complete, image-led Kingshot Companion experience rather than a plain progression table.

Players can browse every published Forge building, understand what it does, see the fields that are actually present in the owner-approved publication, switch between standard and Truegold progression, review source and verification context, and use the experience on desktop or mobile.

Approved editors can upload or replace a building image in Admin. A replacement is not public merely because its file was uploaded: it must be saved to an editorial draft, reviewed, approved and published before the public Data Engine projection consumes it.

## Canonical baseline

The current owner-approved publication contains:

- 10 building catalogue records;
- 587 building progression records;
- standard resource costs and upgrade times;
- mapped prerequisites;
- power where published;
- Truegold and Tempered Truegold where published;
- building-specific fields including hero level caps, training capacity, training speed, rally capacity, troop deployment and reinforcement capacity.

The public page continues to read only the current published Buildings projection through the Data Engine. It does not expose drafts or staged import records.

## Public companion completion

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

## Governed building media

The Buildings Record Editor now includes:

- building image upload, replacement and removal;
- WebP, PNG and JPEG support;
- 2 MB maximum file size;
- recommended 1600 × 900 and minimum 800 × 450 dimensions;
- immutable object paths for replacement files;
- image alt text;
- image credit;
- image source/evidence URL;
- licence or permission statement.

Alt text is mandatory whenever an image is supplied. Images are stored in the existing public `companion-images` bucket under `buildings/<building-key>/` and remain subject to the bucket's existing authenticated editor policies.

The public page prefers an approved published image. If no image exists or loading fails, it falls back to the original Forge illustration. An editorial override changes or clears only fields explicitly present in that approved version, preserving media supplied by future full-dataset imports.

## Publication architecture

The existing full-dataset Buildings publisher remains the immutable source of the 10 catalogue and 587 progression records.

A new additive, server-only `building_editorial_overrides` projection is proposed for Record Editor publications. It stores only the latest approved Buildings editorial values together with their published version, actor and timestamp. The immutable source publication and its historical publication records are not rewritten.

The proposed atomic queue publication path:

1. verifies the queued version still matches the approved Buildings editorial head;
2. writes a new immutable published editorial version;
3. upserts the server-only Buildings projection;
4. records the audit event;
5. marks the queue item complete;
6. allows rollback to reapply an older published version to the same projection.

The Data Engine applies only published projection values. Drafts and approved-but-unpublished versions remain private. Before the additive migration is applied, the loader safely ignores the absent overlay relation and continues serving the current source publication.

## Why Admin currently says “Publishing: Partial”

This is a real readiness distinction, not missing building statistics.

Forge already has a complete atomic **full-dataset** Buildings publication workflow. However, the currently deployed shared Record Editor publisher supports live canonical projection only for Heroes and Hero Skills. Therefore an individual Buildings draft can be reviewed and queued, but cannot yet become the public Buildings projection.

The branch contains the missing Buildings projection and rollback contract, but the additive migration has not been applied and no live image publish/rollback acceptance has occurred. Admin must remain **Partial** until both happen. Once verified, the readiness evidence can move Buildings publishing to **Implemented**.

## Truth boundary

Forge does not invent missing building values.

The current published schema does not yet contain every defining effect for every building. Remaining data gaps include:

- Academy research effects or unlock detail;
- Storehouse protected-resource capacity;
- Infirmary capacity;
- Embassy Alliance Help count and time reduction.

The media workflow does not silently fill these gameplay-data gaps.

## Artwork boundary

The fallback illustrations are first-party Forge presentation assets implemented as accessible inline SVG. They are not copied from community sites, hotlinked from third parties or represented as official game art.

Uploaded replacements require appropriate usage permission. Forge records alt text, credit, evidence URL and licence/permission alongside the published image.

## Validation

Exact head `477bc99a300fb054a4f5f633177a1560b6e07aa8`:

- Buildings Companion validation: passed;
- full Forge integration gate: passed;
- Buildings publication integrity: passed;
- Buildings progression ordering: passed;
- Content Studio integration: passed;
- image upload/media contracts: passed;
- server-only projection and rollback structure: passed;
- lint: passed;
- TypeScript/Vite production build: passed;
- Vercel Preview build: passed.

Preview deployment: `dpl_7sjfPtfNxhs9sESXavwVohyLrkBb`.

## Remaining release gates

- owner review of the Admin upload controls and public fallback behaviour;
- review the additive migration and server-only RLS boundary;
- apply the migration only after owner approval;
- publish one non-sensitive test replacement through draft → review → approve → publish;
- confirm the public page changes only after publication;
- roll back to the previous image and confirm the public projection follows;
- change Buildings readiness from Partial to Implemented only after the live acceptance passes;
- deploy the exact accepted commit and smoke-test production.

## Safety

- no production deployment;
- no Supabase schema or data mutation;
- no canonical 10/587 publication mutation;
- no automatic publication of uploaded files;
- no changes to Player Identity, Art Studio or research branches.
