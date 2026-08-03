# COMPANION-BUILDINGS-001 — Complete Buildings Companion

**Status:** Public companion and governed media implementation candidate; controlled rollback acceptance and final owner visual acceptance pending  
**Branch:** `feature/buildings-companion-completion`  
**Production application:** Unchanged  
**Supabase:** Buildings editorial projection and media-permission guard applied

## Player outcome

The Buildings section becomes a complete, image-led Kingshot Companion experience rather than a plain progression table.

Players can browse every published Forge building, understand what it does, see the fields that are actually present in the owner-approved publication, switch between standard and Truegold progression, review source and verification context, and use the experience on desktop or mobile.

Approved editors can upload or replace a building image in Admin. A replacement is not public merely because its file was uploaded: it must be saved to an editorial draft, reviewed, approved and published before the public Data Engine projection consumes it.

## Canonical baseline

The current owner-approved full-dataset publication remains version 1 and contains:

- 10 building catalogue records;
- 587 building progression records;
- standard resource costs and upgrade times;
- mapped prerequisites;
- power where published;
- Truegold and Tempered Truegold where published;
- building-specific fields including hero level caps, training capacity, training speed, rally capacity, troop deployment and reinforcement capacity.

The public page reads only the current published Buildings projection through the Data Engine. It does not expose drafts or staged import records.

## Public companion completion

Included:

- original Forge illustration for each of the 10 published buildings;
- explicit disclosure that artwork is original Forge companion artwork, not official Kingshot art;
- image-led directory cards with category, purpose, max level, progression count and Truegold status;
- search across building name, category and purpose;
- category filter;
- richer detail hero with purpose, publication facts and verification date;
- dynamic key-effect summary using only fields present in the published projection;
- Building Planner powered by the same published projection;
- separate Standard/transition and Truegold progression views;
- separate Truegold and Tempered Truegold columns and calculator totals;
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

Alt text and a licence/ownership/permission basis are mandatory whenever an image is supplied. Images are stored in the existing public `companion-images` bucket under `buildings/<building-key>/` and remain subject to the bucket's existing authenticated editor policies.

The public page prefers an approved published image. If no image exists or loading fails, it falls back to the original Forge illustration. An editorial override changes or clears only fields explicitly present in that approved version, preserving media supplied by future full-dataset imports.

## Publication architecture

The existing full-dataset Buildings publisher remains the immutable source of the 10 catalogue and 587 progression records.

The additive, server-only `building_editorial_overrides` projection stores the latest approved Buildings editorial values together with their published version, actor and timestamp. The immutable source publication and its historical publication records are not rewritten.

The atomic queue publication path:

1. verifies the queued version still matches the approved Buildings editorial head;
2. writes a new immutable published editorial version;
3. upserts the server-only Buildings projection;
4. records the audit event;
5. marks the queue item complete;
6. allows rollback to reapply an older published version to the same projection.

The Data Engine applies only published projection values. Drafts and approved-but-unpublished versions remain private.

## Live acceptance evidence

Connected Supabase evidence confirms:

- the Buildings editorial projection migration is applied;
- the Buildings publisher and rollback functions exist;
- Academy completed an initial draft → review → approve → publish cycle on 2 August 2026;
- migration `20260803131500_building_media_permission_guard.sql` was approved and applied on 3 August 2026;
- the guard preserves existing historical rows but blocks future image projection writes without a permission basis;
- the owner supplied the media basis: `Owner-declared public domain; freely available for reuse`;
- Academy completed a second immutable draft → review → approve → publish sequence;
- Academy Version 10 is published with the image, alt text and the owner-supplied public-domain basis;
- the second publication queue item completed on its first attempt;
- the canonical 10/587 full-dataset publication remains unchanged.

## Why Admin still says “Publishing: Partial”

The Buildings live publication path is now verified. Admin remains **Partial** only because the rollback-and-restore acceptance has not yet been completed through the governed Admin workflow and final desktop/phone acceptance remains outstanding.

Buildings may move to **Implemented** only after:

- rolling Academy back to original Version 1;
- confirming the public page falls back to the Forge illustration;
- restoring the permission-complete Version 10;
- confirming the approved image returns;
- verifying immutable rollback audit and version evidence;
- completing final owner visual acceptance.

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

Uploaded replacements require a recorded usage basis. The current Academy image is recorded as owner-declared public-domain material. This is an owner-supplied provenance statement rather than an independent legal determination.

## Validation

Exact candidate head `39e93591716edd7c73f29cb0f9e47b82d9449fe6` passed:

- Buildings Companion validation;
- full Forge integration gate;
- Buildings publication integrity;
- Buildings progression ordering;
- Content Studio integration;
- image upload/media contracts;
- building media permission regression;
- server-only projection and rollback structure;
- lint;
- TypeScript/Vite production build;
- Vercel Preview build.

## Remaining release gates

- complete rollback to original Academy Version 1 through Forge Admin;
- confirm the Forge illustration returns publicly;
- restore permission-complete Academy Version 10;
- confirm the approved image returns publicly;
- verify queue, immutable versions and rollback audit evidence;
- change Buildings readiness from Partial to Implemented only after the live acceptance passes;
- complete owner desktop and phone visual acceptance;
- merge the exact accepted commit;
- deploy and smoke-test production.

## Safety

- production application remains unchanged;
- canonical 10/587 publication remains unchanged;
- no automatic publication of uploaded files;
- direct database rollback was blocked by the platform safety layer and was not bypassed;
- rollback acceptance must be completed through the governed Forge Admin UI;
- no changes to Player Identity, Art Studio or research branches.
