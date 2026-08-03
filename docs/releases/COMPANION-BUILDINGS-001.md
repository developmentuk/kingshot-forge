# COMPANION-BUILDINGS-001 — Complete Buildings Companion

**Status:** Rollback acceptance failed at the live projection boundary; atomic rollback correction pending validation and owner-approved migration  
**Branch:** `feature/buildings-companion-completion`  
**Production application:** Unchanged  
**Supabase:** Buildings editorial projection and media-permission guard applied; checked rollback migration not yet applied

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
5. marks the queue item complete.

Rollback must provide the same atomic guarantee: the immutable rollback version, editorial head, audit event and dataset-specific public projection must all change in one transaction.

## Live publication evidence

Connected Supabase evidence confirms:

- the Buildings editorial projection migration is applied;
- the Buildings publisher and dataset-aware rollback functions exist;
- Academy completed an initial draft → review → approve → publish cycle on 2 August 2026;
- migration `20260803131500_building_media_permission_guard.sql` was approved and applied on 3 August 2026;
- the guard preserves existing historical rows but blocks future image projection writes without a permission basis;
- the owner supplied the media basis: `Owner-declared public domain; freely available for reuse`;
- Academy completed a second immutable draft → review → approve → publish sequence;
- Academy Version 10 was published with the image, alt text and owner-supplied public-domain basis;
- the second publication queue item completed on its first attempt;
- the canonical 10/587 full-dataset publication remains unchanged.

## Controlled rollback acceptance — failed

The owner initiated a governed Admin rollback from Academy Version 10 to original Version 1 on 3 August 2026.

The following parts succeeded:

- immutable Academy Version 11 was created;
- the editorial head advanced to Version 11 with status `published`;
- Version 11 contains the original Version 1 values and no uploaded image;
- an immutable `rolled_back` audit event records Version 10 → Version 1.

The live projection did not change:

- `building_editorial_overrides` remained on Version 10;
- the public projection therefore continued to carry the uploaded Academy image and permission statement;
- the fallback Forge illustration was not restored.

This is a release-blocking atomicity failure. The editorial head/history and public projection must never disagree after a successful rollback response.

## Root cause

The Admin rollback action used `EditorialWorkflowService.rollback`, which committed the new version through `SupabaseEditorialRepository.commitVersion`.

That repository always invoked the generic `commit_editorial_version` RPC. The generic transaction correctly wrote Version 11, the editorial head and audit event, but it bypassed the dataset-aware `rollback_editorial_version` wrapper that updates `building_editorial_overrides`.

The database's Buildings rollback wrapper was not defective; the server repository routed around it.

## Atomic rollback correction

The candidate now includes:

- `SupabaseEditorialRepository` routing rollback commits through a dedicated atomic rollback RPC;
- rollback target resolution from immutable `rolledBackToVersionId` audit metadata;
- additive migration `20260803141000_editorial_atomic_rollback_concurrency.sql`;
- server-only `rollback_editorial_version_checked(...)`;
- a row lock and expected-version concurrency check before invoking the existing dataset-aware rollback wrapper;
- preservation of the generic commit path for non-rollback editorial actions;
- dedicated regression coverage proving that Buildings rollback reaches `apply_building_editorial_override`.

The new migration has not been applied. It requires explicit owner approval after the candidate passes validation.

## Current live state

Until recovery is completed:

- Academy editorial head: Version 11, published, no image;
- Academy immutable history: Versions 1–11 preserved;
- Academy live editorial projection: Version 10, uploaded image present;
- canonical Buildings publication: unchanged at 10 catalogue and 587 progression records.

Do not restore Academy or perform another rollback from an older Preview while this split state exists.

## Why Admin still says “Publishing: Partial”

The Buildings publication path is verified, but rollback is not yet atomic in the deployed Preview. Admin must remain **Partial** until the corrected live rollback-and-restore cycle passes.

Buildings may move to **Implemented** only after:

- applying the owner-approved checked rollback migration;
- deploying a Preview containing the corrected repository routing;
- rolling Academy back to original Version 1 again;
- confirming editorial head and live projection advance together and the Forge illustration returns;
- restoring permission-complete Version 10 through the same corrected rollback path;
- confirming the approved image and permission statement return;
- verifying immutable versions, audit events and projection versions after both operations;
- completing final owner desktop and phone visual acceptance.

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

Uploaded replacements require a recorded usage basis. The current Academy image is recorded as owner-declared public-domain material. This is an owner-supplied provenance statement and has not been independently verified by Forge.

## Validation

The last implementation baseline before rollback correction passed:

- Buildings Companion validation;
- full Forge integration gate;
- Buildings publication integrity;
- Buildings progression ordering;
- Content Studio integration;
- image upload/media contracts;
- building media permission regression;
- lint;
- TypeScript/Vite production build;
- Vercel Preview build.

The atomic rollback correction must pass the same gates plus the new atomic rollback regression before another live acceptance attempt.

## Remaining release gates

- complete exact-head validation of the atomic rollback candidate;
- obtain owner approval for migration `20260803141000_editorial_atomic_rollback_concurrency.sql`;
- apply and verify the checked rollback function;
- deploy the corrected Preview;
- repeat rollback to original Academy Version 1;
- verify the Forge illustration returns publicly and projection/head versions agree;
- restore permission-complete Academy Version 10;
- verify the approved image and usage basis return publicly;
- verify immutable versions and rollback audit evidence;
- change Buildings readiness from Partial to Implemented only after live acceptance passes;
- complete owner desktop and phone visual acceptance;
- merge the exact accepted commit;
- deploy and smoke-test production.

## Safety

- production application remains unchanged;
- canonical 10/587 publication remains unchanged;
- no automatic publication of uploaded files;
- the failed rollback is preserved as immutable acceptance evidence;
- the stale Version 10 projection is not being silently patched;
- the checked rollback migration is committed but not applied;
- no restoration will be attempted until the atomic correction is validated and approved;
- no changes to Player Identity, Art Studio or research branches.
