# COMPANION-BUILDINGS-001 — Complete Buildings Companion

**Status:** Live publication, rollback and restoration accepted; merge and production deployment pending  
**Branch:** `feature/buildings-companion-completion`  
**Production application:** Unchanged  
**Supabase:** Buildings projection, media-permission guard and checked atomic rollback migrations applied

## Player outcome

The Buildings section is an image-led Kingshot Companion experience rather than a plain progression table.

Players can browse every published Forge building, understand its purpose, review published progression, switch between standard and Truegold stages, inspect source and verification context, and use the Building Planner from either the directory or a building detail page.

## Canonical baseline

The owner-approved full-dataset publication remains version 1 and contains:

- 10 building catalogue records;
- 587 building progression records;
- standard resource costs and upgrade times;
- mapped prerequisites;
- power where published;
- Truegold and Tempered Truegold where published;
- building-specific effects where present.

The companion and calculator consume the same published Buildings projection. Forge does not maintain a second calculator copy of canonical progression data.

## Player Companion completion

Included:

- accessible Forge fallback illustration for each published building;
- approved published imagery where available;
- image-led Buildings compendium;
- search by name, category and purpose;
- category filtering;
- canonical building detail routes;
- Building Planner links and embedded calculator;
- standard, transition, Truegold and Tempered Truegold progression;
- resource, time, prerequisite and known-power summaries;
- source, verification and trust context;
- loading, error and empty states;
- responsive desktop, tablet and phone layouts.

## Admin Companion completion

The Buildings Record Editor includes:

- governed first-draft creation;
- editing from a published record through a new immutable draft;
- draft → review → approve → publish workflow;
- image upload, replacement and removal;
- immutable replacement object paths;
- image alt text;
- image credit and source evidence;
- mandatory licence, ownership or permission statement;
- immutable version history;
- rollback preview and governed rollback;
- atomic dataset-specific projection updates.

Uploaded files do not become public merely because they exist in storage. Public values change only after the editorial workflow completes.

## Governed media boundary

Building images support WebP, PNG and JPEG, with a 2 MB maximum file size, recommended 1600 × 900 dimensions and minimum 800 × 450 dimensions.

Alt text and a licence, ownership or permission basis are mandatory whenever an image is supplied. The database enforces the permission rule on future Buildings projection writes.

The current Academy image carries the owner-supplied statement:

`Owner-declared public domain; freely available for reuse`

This is owner-supplied provenance and is not represented as an independent legal determination by Forge.

## Publication architecture

The immutable full-dataset Buildings publication remains the canonical source of catalogue and progression data.

The server-only `building_editorial_overrides` projection stores approved Buildings editorial values and media together with their published version, actor and timestamp.

Publication atomically:

1. verifies the queued approved version;
2. creates a new immutable published version;
3. updates the Buildings projection;
4. records the audit event;
5. completes the publication queue item.

Rollback atomically:

1. locks and verifies the current editorial head version;
2. creates a new immutable published rollback version;
3. updates the editorial head;
4. reapplies the selected historical values to the Buildings projection;
5. records the rollback audit event.

Only the server role can execute the checked rollback function.

## Live acceptance history

### Permission-complete publication

On 3 August 2026:

- migration `20260803131500_building_media_permission_guard.sql` was owner-approved and applied;
- Academy completed a permission-complete draft → review → approve → publish cycle;
- Academy Version 10 published the uploaded image, alt text and owner-declared public-domain statement;
- the publication queue completed on its first attempt;
- the canonical 10/587 full-dataset publication remained unchanged.

### Initial rollback failure

The first Admin rollback created immutable Academy Version 11 and its audit event, but the generic repository path bypassed the Buildings projection wrapper. The editorial head moved while `building_editorial_overrides` remained on Version 10.

The failure was preserved as acceptance evidence and was not silently patched.

### Atomic rollback correction

The correction includes:

- repository routing through `rollback_editorial_version_checked(...)`;
- rollback target resolution from immutable audit metadata;
- row locking and expected-version concurrency validation;
- invocation of the existing dataset-aware rollback wrapper;
- service-role-only execution;
- dedicated atomic rollback regression coverage.

Migration `20260803141000_editorial_atomic_rollback_concurrency.sql` was owner-approved and applied. Supabase recorded it as `20260803143301_editorial_atomic_rollback_concurrency`.

### Successful rollback

The owner repeated the rollback through the corrected Preview:

- Academy Version 12 was created;
- the editorial head and live Buildings projection both advanced to Version 12;
- both referenced immutable version ID `aa39dfa9-d057-4223-95fc-379cb87027db`;
- the uploaded image and permission fields were removed;
- the rollback audit correctly recorded Version 11 → original Version 1 values.

### Successful restoration

The owner restored permission-complete Version 10 through the same corrected path:

- Academy Version 13 was created;
- the editorial head and live Buildings projection both advanced to Version 13;
- both reference immutable version ID `9b976404-a105-4449-90f6-078e0600392e`;
- the uploaded image returned;
- alt text returned;
- the owner-declared public-domain statement returned;
- the rollback audit correctly recorded Version 12 → Version 10 values.

## Current live state

- Academy editorial head: Version 13, published;
- Academy Buildings projection: Version 13, published;
- head and projection version IDs match;
- governed image, alt text and usage basis are present;
- immutable Versions 1–13 are preserved;
- the failed Version 11 acceptance attempt remains auditable;
- canonical Buildings publication remains 10 catalogue and 587 progression records.

## Admin readiness decision

Buildings **Publishing** is now `Implemented`.

The status is supported by live evidence for:

- draft creation;
- review and approval;
- publication queue execution;
- public projection update;
- immutable history;
- rollback;
- restoration;
- optimistic concurrency;
- media permission enforcement.

This decision applies to the Buildings publishing capability. Other Companion datasets remain independently assessed and must not inherit this status without their own live acceptance evidence.

## Truth boundary

Forge does not invent missing building values.

Current known data gaps include:

- Academy research effects or unlock details;
- Storehouse protected-resource capacity;
- Infirmary capacity;
- Embassy Alliance Help count and time reduction.

Those gaps remain research and dataset work; they are not silently filled by the media or calculator layers.

## Validation

The atomic rollback candidate passed:

- Buildings Companion validation;
- atomic rollback regression;
- building media permission regression;
- Building Planner contracts;
- Buildings publication integrity;
- Buildings progression ordering;
- full Forge/Vision integration gate;
- lint;
- TypeScript/Vite production build;
- Vercel Preview build.

A final exact-head validation is required after updating readiness and this release record.

## Remaining release gates

- pass exact-head Buildings and full Forge integration validation after readiness completion;
- complete final owner review of the accepted candidate;
- mark PR #32 ready for review;
- merge the exact accepted commit only after owner release approval;
- verify the production deployment;
- smoke-test Buildings directory, Academy detail, Building Planner and Admin history in production;
- inspect production runtime logs.

## Safety

- production application remains unchanged until merge;
- canonical 10/587 publication remains unchanged;
- no automatic publication of uploaded files;
- no direct mutation of immutable history;
- the original rollback failure remains preserved as evidence;
- the current live projection is internally consistent at Version 13;
- no changes to Player Identity, Art Studio or research branches.
