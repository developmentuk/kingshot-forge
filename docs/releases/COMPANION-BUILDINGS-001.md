# COMPANION-BUILDINGS-001 — Complete Buildings Companion

**Status:** Public companion implemented; owner visual acceptance and controlled rollback acceptance pending  
**Branch:** `feature/buildings-companion-completion`  
**Production application:** Unchanged  
**Supabase:** Buildings editorial projection migration applied; one Academy image publication completed; rollback not yet accepted

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

The Buildings Record Editor includes:

- building image upload, replacement and removal;
- WebP, PNG and JPEG support;
- 2 MB maximum file size;
- recommended 1600 × 900 and minimum 800 × 450 dimensions;
- immutable object paths for replacement files;
- image alt text;
- image credit;
- image source/evidence URL;
- licence, ownership or permission statement.

Alt text and a licence, ownership or permission statement are mandatory whenever an uploaded image is supplied. Image credit remains conditional because original Forge assets and some permission arrangements do not require attribution.

Images are stored in the existing public `companion-images` bucket under `buildings/<building-key>/` and remain subject to the bucket's authenticated editor policies.

The public page prefers an approved published image. If no image exists or loading fails, it falls back to the original Forge illustration. An editorial override changes or clears only fields explicitly present in that approved version, preserving media supplied by future full-dataset imports.

## Publication architecture

The existing full-dataset Buildings publisher remains the immutable source of the 10 catalogue and 587 progression records.

The server-only `building_editorial_overrides` projection stores only the latest approved Buildings editorial values together with their published version, actor and timestamp. The immutable source publication and its historical publication records are not rewritten.

The atomic queue publication path:

1. verifies the queued version still matches the approved Buildings editorial head;
2. writes a new immutable published editorial version;
3. upserts the server-only Buildings projection;
4. records the audit event;
5. marks the queue item complete;
6. allows rollback to reapply an older published version to the same projection.

The Data Engine applies only published projection values. Drafts and approved-but-unpublished versions remain private.

## Live acceptance evidence

Read-only reconciliation on 3 August 2026 confirmed:

- `building_editorial_overrides` exists with server-side publisher and rollback functions;
- the canonical full-dataset publication remains version 1;
- the canonical publication still contains 10 Buildings and 587 progression rows;
- Academy has immutable editorial versions 1–6;
- Academy version 6 was published successfully on 2 August 2026;
- its publication queue item completed successfully after two attempts;
- the published Academy projection contains an uploaded image and alt text;
- no rollback audit event has yet been recorded;
- the accepted Academy image version does not yet contain image credit or a licence/permission statement.

The missing licence/permission statement is treated as a real completion defect. The candidate now rejects future building-image drafts without this metadata and includes an additive database constraint for future projection writes. Existing immutable history remains readable.

## Why Admin still says “Publishing: Partial”

This is now a narrow evidence distinction rather than an unimplemented publisher.

A live Buildings image publication has succeeded through draft → review → approve → publish, proving the projection and queue publication path. Publishing remains **Partial** because:

- controlled rollback and restoration have not been accepted;
- the current Academy image publication predates the mandatory permission guard;
- the additive permission constraint has not yet been applied;
- owner desktop and mobile acceptance remains incomplete.

Buildings publishing moves to **Implemented** only after the permission-complete publication and rollback cycle both pass.

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

Uploaded replacements require an appropriate usage basis. Forge records alt text, optional credit, optional evidence URL and mandatory licence/ownership/permission metadata alongside the published image.

## Validation

The current PR head must pass:

- Buildings Companion validation;
- building media permission regression;
- full Forge integration gate;
- Buildings publication integrity;
- Buildings progression ordering;
- Content Studio integration;
- image upload/media contracts;
- server-only projection and rollback structure;
- lint;
- TypeScript/Vite production build;
- Vercel Preview build.

The exact validated commit and Preview deployment are recorded in PR #32.

## Remaining release gates

- owner review of the public Buildings directory, detail pages and Building Planner on desktop and phone;
- owner approval to apply `20260803131500_building_media_permission_guard.sql`;
- create a new Academy draft from the current public version and record the real image licence/ownership/permission basis;
- review, approve and publish that permission-complete version;
- confirm the public Data Engine projection contains the permission-complete version;
- roll back Academy to the original version 1 and confirm the public page returns to the Forge illustration;
- restore the permission-complete Academy version and confirm the approved image returns;
- verify immutable versions, queue state and audit events after both operations;
- change Buildings readiness from Partial to Implemented only after the live acceptance passes;
- merge the exact accepted commit, deploy and smoke-test production.

## Safety

- this reconciliation introduced no new Supabase mutation;
- the permission guard is committed but not applied;
- the canonical 10/587 publication remains unchanged;
- no automatic publication of uploaded files occurs;
- no changes were made to Player Identity, Art Studio or research branches.
