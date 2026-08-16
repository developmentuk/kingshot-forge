# OASIS-001A-PUB Phase 1 — governed publication foundation

## Delivery identity

- Starting SHA: `1c52129755d8643b4a34fbf55698d6fa48412c5b` (confirmed equal to `origin/main` before implementation).
- Branch: `agent/oasis-001a-publication-foundation`.
- Final commit: the draft PR head is authoritative; a Git commit cannot contain its own final object ID. The delivery report records the exact SHA after commit and push.
- Status: implementation candidate for review only. OASIS-001A-PUB is not complete or activated.

## Scope delivered

Phase 1 adds the repository foundation needed for a later controlled Oasis publication: a versioned public projection, forward-only migration proposal, deterministic WebP projection and private manifest, a fail-closed published-only loader, an inactive Search adapter, and a development-only UI acceptance entry point. It does not register a public dataset, API, route, navigation item or Search provider. Derivative media remains private and unstaged for production publication.

The public record allow-list is: `schemaVersion`, `id`, `name`, `aliases`, `recordType`, `rarity`, `availabilityCategory`, `footprint`, `typeLimit`, `maxLevel`, `function`, `levels`, `maxEffects`, `unlock`, `upgrade`, `maxProsperity`, `trustLabel`, `media`, `publicationId`, `publicationVersion`, `publishedAt`, `updatedAt`, `canonicalRoute`, and `status`.

The projection rejects or drops `_meta`, source documents and table indexes, source URLs and raw source objects, `sourceText`, verification history and notes, provenance and research conflicts, original filenames, private inventories, repository/filesystem paths, and all other non-allow-listed fields. Null and absent values remain unknown; the builder does not infer game values. Public projection schema v2 maps each recognised private verification status to an explicit public trust label and rejects missing or unsupported states. `Owner verified in-game` is reserved exclusively for the explicit `owner_direct_ingame_verified` source status; it is not assigned to the current catalogue wholesale.

## Publication proposal

`20260816150042_oasis_001a_pub_phase_1_foundation.sql` was created with Supabase CLI 2.114.0. It proposes immutable version and record history, a separate atomic current pointer, manifest identity, exact record/media counts, actor/reason/time evidence, unique idempotency keys, transaction advisory locking, append-only audits, service-role-only execution, RLS/revokes, publication-tied Search refresh state, and rollback by creating a new publication. Before activation it validates the complete manifest and record payload, recursively rejects forbidden keys, checks record/media/publication identity, and recomputes the manifest SHA-256 from a deterministic SQL canonical-JSON contract shared with TypeScript. A rollback locks publication state, requires an Oasis-owned complete immutable target, verifies the caller candidate is content-identical to that stored target apart from new-publication identity fields, and derives the forward-only records and manifest from stored history before any new version or current-pointer write. Idempotency also binds the rollback source, and audit evidence records its manifest hash. The ineffective `current_user` test was removed: explicit `EXECUTE` revokes and the sole `service_role` grant are the documented caller boundary for the `SECURITY DEFINER` RPC. It was not applied to local or remote Supabase.

## Media reconciliation

- Records: 55; recorded levels: 430.
- Original private PNGs: 111/111 mapped exactly once, 10,723,573 bytes (approximately 10.23 MiB), unchanged under `server/data-engine/source-assets/oasis-island`.
- Private WebP derivatives: 111, 1,608,830 bytes (approximately 1.53 MiB), plus one shared 720×720 designed placeholder, stored under `fixtures/oasis-001a-publication/media/oasis-island`.
- Missing-artwork records: Fountain of Life, Reservoir, Purifier, Golden Sunset, Skating Rink and Construction Hut. Each resolves to the shared placeholder.
- Manifest: checked in server-side with source record, private filename/checksum, private derivative path, planned future public path/checksum, dimensions, role/level variant and alt text. Acceptance fixture records retain planned public URLs; the development entry resolves them to private Vite-imported assets.
- Island Route header: 7,380,112-byte PNG replaced by a 400,100-byte WebP (approximately 94.6% smaller).
- Scenic draft: `src/assets/island-route/island-background-draft.png` remains unchanged, unimported and outside the production entry graph. It was not repurposed.

Catalogue artwork uses native image dimensions and `loading="lazy"` on cards. Generated paths depend on stable record IDs and catalogue/level identities, never private filename slugs. Source transparency is preserved by WebP alpha encoding.

## Acceptance and Search preparation

`oasis-acceptance.html` is a Vite development entry point using the sanitised checked-in projection fixture and a hash router. It imports all 111 private derivatives and the placeholder through a development-only `import.meta.glob` edge, preserving catalogue/detail review, text and rarity filtering, all level tables, WebP artwork and placeholder states, responsive desktop/mobile CSS, and links to the existing Island Chest Route Optimizer. It is not imported by `src/main.tsx`, and the production app has no Oasis route. A clean production Vite build is asserted to contain no Oasis derivative checksum, placeholder, acceptance fixture identity, acceptance HTML/entry, old Island Route PNG or scenic draft.

The Search adapter prepares published records with dataset `oasis-island`, stable IDs, canonical building routes, sanitised text/media, publication identity and published status. Oasis remains absent from `PUBLISHED_DATASET_KEYS` and the live Search runtime registry. Tests reject source-staged, unpublished and forbidden-field inputs.

## Verification

Focused tests cover strict projection behavior, exhaustive recognised trust-state mapping and fail-closed unknown states, forbidden-field injection, immutable rollback reproduction and altered/missing/cross-dataset target rejection, 55-record/430-level preservation, manifest/file checksums, 111 unique mappings, six placeholders, size budgets, loader failure modes, migration structure, all requested adversarial SQL rejection guards, inactive production routes/registries, fixture isolation, clean-build artifact exclusion and Search projection. A production dependency boundary test also verifies that pinned `sharp` is installed from `dependencies` and that the production OCR/API import graph loads successfully. SQL coverage is structural in this environment: Docker, PostgreSQL and a standalone Supabase CLI are unavailable, so the migration was not executed against a disposable database. Full required repository validation results are recorded in the draft PR and final delivery report.

## Risks and Phase 2 blockers

- The migration requires owner review, controlled application and database-level acceptance before any publication can exist.
- The adversarial SQL suite must be executed in an approved disposable Supabase/PostgreSQL environment before migration approval; local structural checks are not database execution.
- The first publication needs an authorized actor/reason/idempotency key and a verified manifest/record payload.
- Public API/Data Engine registration, Search refresh activation and public routes/navigation remain deliberately absent.
- Desktop and approximately 390px mobile visual acceptance must be repeated against the final published-only runtime, including transparent WebP quality and the optimized header.
- The scenic draft requires an explicit later archive/removal decision if it should leave the repository.

## Safety confirmation

Nothing was published, deployed or merged. No release tag was created. No Vercel configuration changed. No Supabase migration was applied and no live schema/data changed. No media was uploaded to production storage. Production Search was not refreshed. Public Oasis routes and promotions remain absent. The source-staged loader remains private and unchanged.
