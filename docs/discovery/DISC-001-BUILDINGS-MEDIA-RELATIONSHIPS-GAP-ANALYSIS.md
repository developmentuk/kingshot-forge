# DISC-001 — Buildings Domain, Media Library & Content Relationships Gap Analysis

**Date:** 20 July 2026  
**Scope:** discovery and planning only; no feature implementation, schema mutation, publication mutation, merge or deployment was performed.

## Executive conclusion

The Buildings publication recovery is materially complete and safe to treat as the baseline for the next slice, but HOTFIX-001 itself is not yet independently preview-accepted. The checked-out `main` contains the hotfix locally, while GitHub has no HOTFIX branch and Vercel has no deployment for the hotfix HEAD. Production is unchanged and healthy.

The requested Media Library, shared tags, aliases and explicit content-relationship authoring capabilities are missing as reusable editorial features. There are useful foundations—Data Studio staging, Content Studio draft/version/audit workflow, published-only Search, a rebuildable relationship projection, Forge Connections consumption for existing Hero relationships, and a private/unused image bucket—but none of these is a media, tag or relationship CMS.

The next sprint should branch from the hotfix candidate only after the candidate receives a dedicated protected-preview deployment and acceptance. It should be Version 1.1 milestone work, not one large vertical sprint. The first implementation milestone should establish generic entity references and publication boundaries; Media, tags and relationships can then be delivered as separate, reversible slices.

## Evidence boundary and method

Evidence was collected from the checked-out repository, Git history, GitHub connector, Vercel deployment listing, live Supabase project `hrvdhjscwitqpwjhnjkm`, release documentation, and focused contract tests. The named “Kingshot Forge Handover — Buildings Domain, Media Library and Content Relationships” was not present in the repository or the supplied attachment directory; claims attributed to the original handover below are therefore evaluated against the requirements reproduced in the DISC-001 request and marked accordingly.

Production deployment checked: `dpl_HngFANEgbBqbcA5QYJJ7AsXgPMXS`, READY, target `production`, commit `4589175`. Latest listed READY deployment is `dpl_B8YGuvYnTuJtjbU5qj4cSWAbm5AW`, main commit `4495d4c`; neither is the local hotfix HEAD.

## Phase 1 — exact repository and delivery state

| Item | Finding |
|---|---|
| Current branch | `main` |
| Current HEAD | `6d9bfd9952a9511a92e3514b08850c10fbcbf895` — `fix: repair buildings admin projection` |
| `origin/main` / main HEAD | `4589175625af9d82f5f4fec150c7deb3878d1a39` — V1.0 production launch |
| Local divergence | `main` is 2 commits ahead of `origin/main`; working tree was clean at discovery start |
| HOTFIX-001 branch | No local or GitHub branch matching `hotfix` was found. HOTFIX-001 is represented by local `main` commits, including the projection repair. |
| HOTFIX-001 HEAD | Local candidate HEAD `6d9bfd9`; no remote ref or Vercel deployment for this SHA was found. |
| Open PRs | GitHub PR #11, Operations Centre, draft/open; it is unrelated to Buildings/media/relationships. PR #13 is merged V1.0. |
| REL-005 analytics | REL-005 is already in local history and its migration is in the local diff from `origin/main`; no concurrent REL-005 development branch was found. A separate Vercel analytics-install branch/PR exists, but it does not overlap the affected slice. |
| Production | V1.0 deployment is READY and production-targeted; production commit is before HOTFIX-001. |
| Preview | The documented REL-004 preview is READY, but it is commit `1144aba` and predates HOTFIX-001. No exact-HOTFIX protected preview was discoverable. |
| Safe next base | Create the next sprint from the accepted HOTFIX-001 candidate after a dedicated preview is deployed. If that deployment cannot be created, branch from `main` only after the two candidate commits are explicitly promoted/recorded. Do not branch from production `origin/main` and silently omit the projection repair. |

### HOTFIX-001 recommendation

**Needs Verification before Production**, not “Ready for Production” yet. The code and live database satisfy the numerical and contract invariants, but the required exact-candidate protected-preview browser acceptance has not been evidenced. No defect was found in the local projection implementation. The remaining gate is deployment/preview verification of owner/admin access, ordinary-player denial, draft-only saves, honest errors, and no staged leakage on the hotfix SHA.

### HOTFIX-001 code and database checks

| Check | Result | Evidence |
|---|---|---|
| Canonical catalogue rows | PASS: 10 | Live `public.buildings`; loader and adapter contracts |
| Nested progression | PASS: 587 rows grouped under canonical `building_key` records | `server/data-engine/loadPublishedBuildingsDataset.ts`; `test-buildings-admin-projection` |
| Publication records | PASS: 597 | Live `public.buildings_publication_records` |
| Fabricated fallback records | PASS: 0 | Live count of `Building %`/`building-%`; no fallback strings in loader/adapter |
| Orphan progression | PASS: 0 | Live FK-oriented left-join check |
| Canonical editor | PASS in code contract | `buildingsRecordEditorSchema.ts`; create/delete false; progression read-only |
| Draft-only save | PASS in code contract | `ConnectedEditorialRecordEditor.tsx`; `save_draft` and draft-head guard |
| Published v1 direct mutation | PASS by design | Public tables are projection/read boundaries; editorial action API owns draft actions |
| Failed reads | PASS in code contract | Honest error path; no demo/fallback substitution |
| Production unchanged by this discovery | PASS | No writes, migrations, deployment or publication calls executed |
| Exact preview browser acceptance | NOT VERIFIED | No deployment for local hotfix HEAD found |

Focused tests passed: `npm run test:buildings-admin-projection`, `npm run test:buildings-publication`, `npm run test:content-studio`, and `npm run test:search`. The combined `npm run check` command exceeded the 120-second command limit in this environment; this is a verification limitation, not a reported test failure.

## Phase 3 — original handover requirement matrix

Status abbreviations in the matrix are literal: **C** Complete, **P** Partial, **M** Missing, **S** Superseded, **B** Blocked, **V** Needs Verification. “Prod” describes the current production state; “Prev” describes the latest evidence available, not an unverified claim about local HEAD. Priority is the recommended release priority.

### Data import and publication

| Requirement | Status | Evidence / file or table | Prod | Prev | Remaining work / dependency | Priority |
|---|---|---|---|---|---|---|
| Admin Data Import interface | C | Data Studio routes and `api/data-studio/*` | Published V1 workflow | REL-004 accepted | Extend only for new asset/tag/relationship datasets | P1 |
| Buildings catalogue import | C | `api/data-studio/buildings.ts`, `forge_import_records` | 10 rows | Accepted V1 | None for baseline | — |
| Building progression import | C | Buildings contract, import records | 587 rows | Accepted V1 | None for baseline | — |
| Validation | C | Dataset contract/validation service | Applied to V1 import | Accepted | Add contracts for new entities | P1 |
| Staging | C | `forge_import_runs`, staged records | Existing import retained | Accepted | New datasets need staging | P1 |
| Warning review | C | Warning decisions/audits, 8 warning rows | 8 decisions retained | Accepted | Reuse gates for new imports | P1 |
| Publication | C | `publish_buildings_import_run`, publication v1 | Published | Accepted | Generic publication integration later | P1 |
| Version history | C | `buildings_publication_versions`, editorial versions | Version 1 retained | Accepted | Generalise to shared entities | P1 |
| Rollback | P | Buildings rollback RPC exists; no prior target makes it non-actionable | No prior target | REL-004 correctly reports no destructive rollback target | Define generic rollback consumers | P1 |
| Audit evidence | C | `editorial_audit_events`, warning audits | Retained | Accepted | Link new entities and edges | P1 |
| Published-only projections | C | RLS on `buildings`/progression and loader filters publication | Public published-only | Accepted | Enforce for media/tags/edges | P0 |

### Buildings public domain

| Requirement | Status | Evidence / file or table | Prod | Prev | Remaining work / dependency | Priority |
|---|---|---|---|---|---|---|
| `/buildings` | C | `BuildingsBrowserPage.tsx`, route | Published directory | Accepted | None | — |
| `/buildings/:slug` | C | React route and page | Published details | Accepted | None | — |
| Building name | C | `public.buildings.building_name` | Published | Accepted | None | — |
| Primary image | M | No Building media field/control; only generic Search `image` normalization | No governed image | Placeholder/none | Media Library + usage binding | P0 |
| Category | C | `public.buildings.category` | Published | Accepted | None | — |
| Description | C | `public.buildings.description` | Published | Accepted | None | — |
| Unlock condition | P | Requirements text/JSON exist in progression, not a dedicated catalogue unlock model | Partial | Accepted baseline | Govern field and presentation | P2 |
| Maximum normal level | C | `standard_max_level`, mapped as `max_level` | Published | Accepted | None | — |
| Truegold support | C | `truegold_supported`, `truegold_tier` | Published | Accepted | None | — |
| Verification status | C | `verification_status`, source metadata | Published | Accepted | None | — |
| Last reviewed date | P | `verified_on` exists on progression; no consistent catalogue-level reviewed contract | Partial | Accepted baseline | Normalize editorial review metadata | P2 |
| Aliases | M | No shared alias model; no Building alias editor | None | None | Tags/alias foundation | P1 |
| Strategic guidance | M | No Buildings guidance records/editor | None | None | Editorial content model and references | P2 |
| Progression data | C | 587 rows nested under 10 canonical records | Published | Accepted | None | — |
| Requirements | C | `requirements_text`/`requirements_json`; unresolved prerequisites governed in publication | Published | Accepted | Improve structured rendering later | P2 |
| Resource costs | C | Base resource columns in progression | Published | Accepted | None | — |
| Build time | C | `upgrade_time_seconds`/display | Published | Accepted | None | — |
| Power | C | `power` | Published | Accepted | None | — |
| Building effects | P | Capacity/effect-like columns exist; no normalized effect model | Partial | Accepted | Normalize if cross-domain use requires it | P2 |
| Related content | M | UI copy mentions Forge Connections; no authored Building relationship data | None | No exact HOTFIX preview evidence | Relationship foundation + integration | P0 |
| Responsive/mobile behaviour | C | Responsive CSS and REL-004 390/768/1280 acceptance | Accepted V1 | Accepted for prior candidate | Re-test new editors | P1 |
| Global search integration | P | Search supports published records, tags and relationships in its contract, but Buildings media/tags/edges are absent | Buildings text/search baseline only | Prior Search accepted | Add projections after new publication | P1 |

### Media Library

All rows in this section are **M** unless stated otherwise: no matching live table/model was found. The repository has a private/unused image bucket migration for community art and direct image/source fields in some domain records; these are not a reusable Media Library.

| Requirement | Status | Evidence / file or table | Prod | Prev | Remaining work / dependency | Priority |
|---|---|---|---|---|---|---|
| Media asset table/model | M | No `media`, `media_assets` or equivalent live table | None | None | Proposed shared entity | P0 |
| Upload flow | M | No media upload API/editor | None | None | Storage provider, bucket, permission gate | P0 |
| Existing asset selection | M | No asset picker | None | None | Media Library UX | P0 |
| Alt text | M | No governed asset metadata | None | None | Asset version metadata | P0 |
| Caption | M | No governed asset metadata | None | None | Asset version metadata | P1 |
| Credit | M | No governed asset metadata | None | None | Asset version metadata | P0 |
| Source | P | Domain-specific `source_url` exists; not reusable asset provenance | Partial | None | Migrate only with explicit provenance mapping | P0 |
| Usage permission/licence | P | Some importer input types parse licence; no asset-level permission model | Partial | None | Licence fields and validation | P0 |
| Card crop | M | No asset variants/crop UI | None | None | Variant service | P1 |
| Header crop | M | No asset variants/crop UI | None | None | Variant service | P1 |
| Focal point | M | No focal metadata | None | None | Asset version metadata/UI | P1 |
| Replacement without breaking consumers | M | No stable asset reference/usage table | None | None | Stable asset ID + immutable versions | P0 |
| Reuse across domains | M | No reusable asset relation | None | None | Generic usage bindings | P0 |
| Primary image | M | No Building media binding | None | None | Usage role + published resolver | P0 |
| Card thumbnail | M | No variant or usage role | None | None | Variant generation | P1 |
| Page banner | M | No variant or usage role | None | None | Variant generation | P1 |
| Progression images | M | No progression media binding | None | None | Usage binding to progression entities | P1 |
| Gallery | M | Community Art gallery is text-art, not media asset gallery | None for Buildings | None | Asset gallery and permissions | P2 |
| Audit/version history | P | Generic editorial audit/version primitives exist but are not attached to assets | None | None | Adopt existing heads/versions | P0 |
| RLS and permissions | P | RLS/capability foundation exists; no media policies | No media access path | None | Design private write/public published read | P0 |

### Shared tags

| Requirement | Status | Evidence / file or table | Prod | Prev | Remaining work / dependency | Priority |
|---|---|---|---|---|---|---|
| tags | M | No live `tags` table; Heroes and Art Studio use arrays/domain fields | None shared | None | Governed tag entity/reference design | P1 |
| tag_aliases | M | No live table or API | None | None | Alias lifecycle and collision rules | P1 |
| content_tags | M | No live table or API | None | None | Published content binding | P1 |
| Tag search | P | Search contract accepts tags; no shared tag projection exists | Partial | Accepted Search foundation | Index governed tags | P1 |
| Tag creation | M | No tag manager | None | None | Role-gated reference-data workflow | P1 |
| Tag removal | M | No tag manager or impact view | None | None | Safe detach/archive semantics | P1 |
| Usage visibility | M | No usage table/query | None | None | Usage projection and impact UI | P1 |
| Alias management | M | No alias model/editor | None | None | Alias versioning | P1 |
| Editorial status | P | Editorial statuses exist generally, not for tags | None | None | Decide governed reference publication model | P1 |
| Visibility control | P | RLS and published-only patterns exist, no tag implementation | None | None | Public/private tag policies | P1 |
| Cross-domain support | M | No shared binding model | None | None | Entity registry and content references | P0 |

### Explicit content relationships

| Requirement | Status | Evidence / file or table | Prod | Prev | Remaining work / dependency | Priority |
|---|---|---|---|---|---|---|
| `content_relationships` | M | No live table; `search_relationship_projections` is derived only | None | None | Authored relationship entity | P0 |
| Source entity | P | Search relationship contract has source dataset/record | Derived only | Accepted Search foundation | Persist editorial source reference | P0 |
| Target entity | P | Search relationship contract has target dataset/record | Derived only | Accepted Search foundation | Persist validated target reference | P0 |
| Relationship type | P | `RelationshipType` exists in Search code, not governed in DB | Derived only | Accepted Search foundation | Govern relationship type registry | P0 |
| Directionality | P | Search edges carry source/target; no authored direction policy | Derived only | Accepted Search foundation | Type-level directed/bidirectional rules | P1 |
| Editorial status | M | No authored edge lifecycle | None | None | Draft/review/approved/published edge versions | P0 |
| Publication state | P | Search filters published records; no edge publication store | Partial | Accepted projection contract | Publish edge set atomically | P0 |
| Audit trail | P | Generic `editorial_audit_events` exists; no relationship records to audit | None | None | Attach edge mutations to audit | P0 |
| Relationship editor | M | No editor; Search Explorer only inspects/refreshes derived data | None | None | Content Studio relationship controls | P0 |
| Cross-domain support | M | Existing edge types are not a generic authoring registry | None | None | Entity type registry + FK-safe validation | P0 |
| Related-content queries | P | Bounded in-memory relationship expansion exists | No Building authored results | Accepted Search foundation | Resolve published authored edges | P0 |
| Relationship search indexing | P | Rebuildable `search_relationship_projections` exists locally/live object | No new Building edge data | Accepted foundation | Index tags/edges after publication | P1 |
| Relationship graph integration | P | Forge Connections consumes existing published Hero relationships | No Building graph | Accepted prior Hero path | Add Building/media/tag consumers | P1 |

### Editor controls

| Requirement | Status | Evidence / file or table | Prod | Prev | Remaining work / dependency | Priority |
|---|---|---|---|---|---|---|
| Media controls | M | Buildings schema has no media field/control | None | None | Picker and usage roles | P0 |
| Tag controls | M | No shared tag input/manager | None | None | Tag picker and permissions | P1 |
| Relationship controls | M | No authored relationship editor | None | None | Relationship editor and preview | P0 |
| Draft-only editing | C | Existing editorial `save_draft` path and head status guard | Existing Buildings | Contract accepted | Extend to new entities | P0 |
| Validation | C | Editorial and dataset validation foundations | Existing Buildings | Accepted | Add media/tag/edge validators | P0 |
| Preview | P | Buildings/publication preview exists; no media/tag/edge preview | Partial | Accepted Buildings | Add impact/related-content preview | P0 |
| Publication | C | Buildings publication gate exists | Existing Buildings | Accepted | Integrate shared entities atomically | P0 |
| Versioning | C | Heads/versions are live and immutable | Existing Buildings | Accepted | Reuse for new editorial records | P0 |
| Rollback | P | Framework semantics exist; live dataset rollback is bounded by valid target availability | Buildings only | Accepted limitation | Define edge/media rollback behavior | P0 |
| Audit history | C | Editorial audit read capability exists | Existing Buildings | Accepted | Include new entity mutations | P0 |

### Cross-domain integrations

| Requirement | Status | Evidence / file or table | Prod | Prev | Remaining work / dependency | Priority |
|---|---|---|---|---|---|---|
| Heroes | P | Hero tags/source fields and existing relationship consumer, no shared media/tags authoring | Existing domain only | Existing Hero path | Migrate/bridge safely | P1 |
| Events | M | No shared media/tag/edge implementation | None | None | Register domain | P2 |
| Troops | M | Domain importer/source fields only | None | None | Register domain | P2 |
| Research | M | No shared implementation | None | None | Register domain | P2 |
| Guides | M | No shared implementation | None | None | Register domain/content model | P1 |
| Videos | M | No shared implementation | None | None | Register asset/content model | P2 |
| Calculators | M | No shared implementation | None | None | Register entity type | P2 |
| Equipment | M | No shared implementation | None | None | Register domain | P2 |
| Alliance content | M | Alliance domain exists, not connected to shared content | None | None | Register entity type and visibility | P2 |
| Creator content | P | Community Art has creator attribution and publication, but is text-art and not a shared content graph | Separate gallery | Accepted Art path | Bridge only after policy review | P2 |
| Search | P | Search route/API and published-only projection are real | Text/search only | Accepted | Index shared tags/edges/media metadata | P0 |
| Forge Connections | P | Existing published Hero graph consumer and rebuildable edges | No Building edges | Accepted existing path | Consume authored published relationships | P1 |
| Personal Progression | P | Building progression consumes published Buildings; no media/tag/relationship use | Progression works | Accepted | Add only published related content where useful | P2 |

### Requirement matrix totals

Counting each row above: **Complete 29; Partial 28; Missing 43; Superseded 0; Blocked 0; Needs Verification 0**. “Needs Verification” is used for the release recommendation outside the matrix because the documented requirement rows are either implemented, partial or absent; no requirement is claimed complete merely because a related foundation exists.

## Phase 4 — live Supabase schema discovery

The live project is PostgreSQL 17.6.1.141. Read-only inspection covered `public`, `auth`, `storage`, information-schema tables/views/routines/triggers/indexes/policies/grants and foreign keys.

### Direct findings

| Requested object/concept | Live result |
|---|---|
| `media`, `media_assets`, `asset_variants`, `asset_usage`, `building_media` | Not found |
| `tags`, `tag_aliases`, `content_tags`, `building_tags` | Not found as shared tables |
| `content_relationships`, `relationship_types`, `entity_relationships`, `related_content`, `building_relationships` | Not found |
| `search_relationship_projections` | Exists, but it is a derived Search projection with FK to `search_projections`, not an editorial relationship store |
| Buildings tables | `buildings` 10 rows; `building_progression` 587 rows; FK from progression to catalogue |
| Publication tables | `buildings_publication_versions` 1 current published row; `buildings_publication_records` 597 immutable rows; prerequisites 8; refresh records present |
| Editorial primitives | `editorial_record_heads`, `editorial_record_versions`, `editorial_audit_events`, `publication_queue` exist and are used by current workflow |
| Functions/RPCs | Buildings-specific manifest, publish, refresh, warning decision and rollback functions exist; no media/tag/relationship authoring RPCs |
| Triggers | Immutable-history triggers exist for Buildings publication history; no media/tag/relationship triggers |
| RLS | Buildings public projections have published-only policies; editorial heads/versions/audit are authenticated permission-gated; publication history is denied to anon/authenticated. No policies exist for absent media/tag/edge tables. |
| Grants | Public Buildings tables have broad table grants but RLS limits reads; publication history grants are service-role/postgres only; editorial tables grant authenticated SELECT with permission policies. New tables must not copy broad grants without a policy design. |
| Foreign keys | Buildings progression and publication/history relationships are constrained; generic cross-domain content references do not exist. |

### Migration risks and naming conflicts

1. Do not name a derived projection `content_relationships`; reserve that name for authored editorial state. Keep Search projections rebuildable.
2. Existing `tags` arrays in Heroes and Community Art are domain-owned and cannot be silently converted to shared tags. Use an explicit migration/bridge with provenance and deduplication rules.
3. Existing `image`, `image_url`, `source_url` and importer licence fields are not stable asset references. Do not reinterpret them in place without a compatibility plan.
4. Existing Buildings publication records are immutable snapshots. New media/tag/edge references must be published atomically or resolved by a publication manifest; partial cross-entity publication would violate the current boundary.

## Phase 5 — repository discovery

### Reusable foundations found

- Data Studio import, contract validation, staging, warnings, review and publication gates.
- Content Studio `editorial_record_heads`, immutable `editorial_record_versions`, `editorial_audit_events`, draft-only `save_draft`, role/capability checks and version-history UI.
- Published-only Buildings loader and RLS projections, including atomic publication and rebuildable refresh records.
- Search providers, published-only projection building, tags/relationships in the in-memory search contract, bounded relationship expansion, stale-index diagnostics and Search Explorer.
- Existing Forge Connections consumption for published Hero relationships.
- Storage infrastructure exists for a private/unused Companion image bucket, but there is no asset lifecycle or editor.
- Domain identity fields and source metadata on several importers.

### Missing or misleading foundations

- No upload endpoint, media picker, crop/focal-point model, asset usage/impact viewer or stable consumer binding.
- No shared tag vocabulary, alias governance, content-tag bindings or cross-domain tag index.
- No authored relationship records, relationship-type registry, edge editor or generic entity registry.
- Public Buildings UI is text/data-led. It currently renders no primary image, aliases, strategic guidance or authored related content. The “Forge Connections” text is a promise/placeholder, not an active Buildings relationship implementation.
- Search code can accept `tags`, `image` and relationships, but the runtime support is a consumer contract, not evidence that the missing content has been authored or persisted.
- No hidden media/tag/relationship feature flag or live admin page was found.

## Phase 6 — proposed architecture

Do not create a second CMS or publication framework. Treat each reusable asset, tag, and authored relationship as an editorial record managed by the existing heads/versions/audit and capability system. Use shared entity references as validated identifiers (`entity_type`, stable `entity_id`, optional dataset/record version) resolved through a server-side registry; do not use unconstrained arbitrary table names or client-supplied SQL-like references.

1. **Media assets:** independently versioned editorial entities. The stable `asset_id` survives replacement; each replacement creates a new immutable asset version and variants. Consumer bindings point to the stable asset, optionally with a role (`primary`, `card`, `banner`, `progression`, `gallery`) and a version policy. Published resolvers select only the published asset version.
2. **Tags:** governed reference data with editorial lifecycle, not free text. Tag identity is stable; display label, description, visibility and aliases are versioned/governed. Deletion means archive/detach after usage checks, never destructive cascade.
3. **Aliases:** versioned tag aliases with uniqueness scoped to normalized alias plus locale/namespace. Alias resolution returns a canonical tag and preserves the alias provenance in audit history.
4. **Relationships:** draft authored edges containing source reference, target reference, governed relationship type, direction policy, editorial status and explanation. Publish edge changes through existing version/publication gates; Search/Forge Connections receive only the published edge projection.
5. **Generic entity references:** a registry maps safe entity types to server-side resolvers, capability requirements and public route/projection rules. References must validate existence, permitted visibility and publication state before draft save and again before publication.
6. **Public resolution:** public routes query published projections/resolvers only. An unpublished or missing target is omitted with an operational diagnostic; it must never leak a draft or render a broken arbitrary URL.
7. **Cross-domain enablement:** register Buildings first, then at least one second domain (Heroes is the lowest-risk existing consumer). Add Events/Troops/Research/etc. only through explicit registry entries and domain acceptance tests.
8. **Orphans:** foreign keys where the domain is known; registry validation plus publication-time referential checks for polymorphic references; archive/withdraw safeguards that block or explain impacted edges and usages.
9. **Replacement:** stable asset identity plus immutable versions and usage bindings. Never overwrite a URL that is the consumer’s only identity; keep the prior version addressable for rollback.
10. **Search and Forge Connections:** rebuild derived search/relationship projections after the authoritative publication transaction. Keep the previous projection active on failed refresh, mark it stale, and expose refresh evidence in operations.

## Phase 7 — proposed schema (not applied)

The following is a design proposal only. No migration was created or applied.

| Table | Purpose / key columns | Constraints and indexes | RLS, publication and rollback |
|---|---|---|---|
| `entity_type_registry` | Safe cross-domain registry; PK `entity_type`; resolver key, public route policy, enabled flag, owner capability | Unique entity type; index enabled/owner | Admin/service write; authenticated read as permitted; registry changes audited and versioned if they affect public resolution |
| `media_assets` | Stable identity; PK `asset_id`; asset key, current published version pointer, lifecycle status, created/updated actor | Unique stable key; indexes status and updated time | No public table write; public reads through published resolver; archive blocked while usages exist |
| `media_asset_versions` | Immutable editorial values; PK `asset_version_id`; asset FK, version, storage object key, MIME, dimensions, alt/caption/credit/source/licence, focal point, checksum, status | Unique `(asset_id, version)`; unique storage checksum where policy allows; asset/status indexes | Existing editorial head/version model may store the values, eliminating this table if the generic records can carry asset metadata. Published-only public resolver; rollback creates a new version pointing to prior object |
| `media_variants` | Derived crops/transformations; PK `variant_id`; asset/version FK, role, crop rectangle, focal point, object key, transform hash | Unique `(asset_version_id, role, transform_hash)`; indexes asset/role | Service-generated writes; public only if parent version published; regenerate/delete only when no published consumer depends on it |
| `media_usages` | Stable consumer binding; PK `usage_id`; asset FK, entity type/id, role, sort order, optional version policy | Unique `(entity_type, entity_id, role, asset_id)` as appropriate; indexes entity and asset | Draft binding in editorial record or usage head; public resolver joins only published consumer and asset; replacement changes pointer/version, not consumer identity |
| `tags` | Stable governed vocabulary; PK `tag_id`; namespace, canonical key, display name, status, visibility | Unique `(namespace, normalized_key)`; indexes status/name | Role-gated reference-data editing; public only visible/published tags; archive requires usage impact review |
| `tag_aliases` | Canonical alias mapping; PK `alias_id`; tag FK, normalized alias, locale/namespace, status | Unique `(namespace, locale, normalized_alias)`; index tag | Same governed lifecycle; alias changes audited; rollback restores prior mapping as a new version |
| `content_tags` | Content-to-tag binding; PK `content_tag_id`; entity type/id, tag FK, source/provenance, status | Unique `(entity_type, entity_id, tag_id)`; indexes entity/tag | Can reuse generic editorial heads/versions rather than a separate version table; public query only published content and visible tags |
| `relationship_types` | Governed type registry; PK `relationship_type`; label, directionality, allowed source/target types, reciprocal type, visibility | Unique type key; indexes source/target type | Capability-gated admin; type changes audit/version; block publication if a type becomes invalid |
| `content_relationships` | Stable authored edge identity; PK `relationship_id`; type FK, source/target entity refs, explanation, status | Unique `(type, source_type, source_id, target_type, target_id)`; indexes both endpoints/type/status; prevent self-edge unless allowed | Reuse generic editorial heads/versions for mutable values; public only published edge version and published endpoints; archive/rollback creates versions, never rewrites history |
| `content_relationship_versions` | Only required if generic editorial records cannot represent edge values. PK version id; relationship FK, version, values, status, actor | Unique relationship/version; relationship/status indexes | Prefer existing `editorial_record_versions` to avoid a second version system; same audit/publication semantics |

### RLS strategy

Use the existing server-authoritative role/capability boundary for all writes. Enable and force RLS on every exposed table. Revoke anon/authenticated table writes; public reads should normally be through security-invoker published views or server APIs, with explicit published/visible predicates. Authenticated admin reads require capabilities such as `cms.view`, `cms.history.view`, `media.manage`, `tags.manage` and `relationships.manage`; never use editable user metadata as authorization. If a view is exposed, use `security_invoker = true` where supported or keep it in a private schema/server boundary. Storage bucket policies must separately authorize upload, select and replacement; bucket object keys must not be the public editorial identity.

### Publication/versioning model

Use the existing editorial record head/version/audit workflow for metadata and authored edge state. A content publication transaction validates all referenced entity types, assets, tags, aliases and endpoints; records a publication manifest; updates published projections; then queues Search/Forge Connections refreshes. A failed refresh keeps the previous projection. Rollback creates a new published version (monotonic version numbers), preserving the old version and audit evidence. Buildings publication v1 is not rewritten.

## Phase 8 — UX and route gaps

### Admin additions

| Surface | Required for first release | Useful enhancement | Future |
|---|---|---|---|
| Media Library route | Library list/search/filter by status, domain usage and licence; role-protected | Bulk metadata edit, duplicate detection | Automated rights expiry workflows |
| Upload flow | Upload, validate MIME/size/dimensions, enter alt/caption/credit/source/licence, save draft | Drag/drop and batch upload | External DAM ingestion |
| Asset picker | Search existing assets, preview variants, choose usage role | Recently used/favorites | AI-assisted suggestions |
| Asset editor | Metadata, focal point, crop roles, replacement, usage/impact viewer | Non-destructive crop preview | Advanced transform presets |
| Content Studio | Media/tags/relationships tabs on a Building record; draft-only save | Relationship suggestions | Bulk relation editing |
| Tag manager | Create/archive, aliases, usage count, visibility and status | Merge tool with impact preview | Taxonomy governance dashboards |
| Relationship editor | Type/source/target validation, direction, explanation, draft preview | Graph canvas | Bulk graph operations |
| Data Studio | Contracts/import/review for controlled bulk asset/tag data | CSV diff and remediation | Scheduled feeds |
| Forge Connections | Published related-content preview and refresh status | Path explanation and filters | Full graph explorer |
| Search Explorer | Inspect tags/edges and refresh diagnostics | Impact simulation | Query tuning dashboards |

### Public additions

Buildings directory/detail need governed primary image/card/banner resolution, alt text, aliases, strategic guidance and a related-content section that queries published relationships only. Image failure must be an honest fallback state, not an invented URL. Mobile acceptance must cover the 390px editor/picker, keyboard focus, crop controls, long relationship labels and no horizontal overflow.

## Phase 9 — dependencies and risks

| Risk/dependency | Score | Mitigation |
|---|---|---|
| HOTFIX-001 promotion and branch ambiguity | Critical | Dedicated preview for `6d9bfd9`; accept before branching; retain production v1 untouched |
| Generic polymorphic references | Critical | Registry plus server validation, endpoint indexes, publication-time checks and no arbitrary table access |
| Published/public draft leakage | Critical | Published-only resolvers, RLS, negative tests with staged records, cache invalidation after atomic publish |
| Storage provider/bucket configuration | High | Inventory provider, private upload path, signed/admin operations, public transformed delivery only after publish |
| Asset replacement breaking consumers | High | Stable asset IDs, immutable versions, usage bindings, rollback tests |
| Copyright/licence metadata | High | Required provenance fields, licence enum/URL/expiry policy, moderation gate, audit |
| RLS and capability complexity | High | Server-authoritative writes, forced RLS, policy tests, security-invoker views, no broad authenticated writes |
| Search re-indexing | High | Rebuildable projections, refresh records, stale fallback, idempotent post-publication jobs |
| Existing image URLs/tag arrays | High | Inventory and explicit bridge migration; do not mutate legacy values silently |
| Cross-domain deletion | High | Archive-only semantics, usage/relationship impact blocking, registry validation |
| Relationship rollback | High | Edge versions reuse editorial history; publish/rollback as new versions |
| Audit volume | Medium | Append-only compact events, metadata limits, indexes by entity/time |
| Mobile editor usability | Medium | Dedicated 390px acceptance, keyboard and accessible crop/picker controls |
| Concurrent REL-005 analytics work | Low | No overlapping branch found; keep analytics files outside new CMS commits and verify merge diff |
| Storage quota/transforms | Medium | Enforce dimensions/size, deduplicate checksums, quota telemetry and variant lifecycle |

## Phase 10 — recommended delivery plan

Recommend **Option B: controlled Version 1.1 milestones**. The work is too cross-cutting for one reversible sprint, and publication/RLS/search failures would be difficult to isolate in a single change.

| Milestone | Objective and code/schema scope | Dependencies/tests/release gate | Complexity / commit boundary / rollback |
|---|---|---|---|
| 1. HOTFIX-001 production promotion | Deploy exact candidate, capture preview/browser evidence, then promote only with owner approval | Projection/publication/security/browser suites; 10/587/597 and zero fabricated/orphan gate | S / commits: preview evidence then promotion docs; rollback to existing production deployment |
| 2. Entity-reference foundation | Registry, safe references, capability keys, validation ports; no public feature | Unit, FK/registry, negative draft/public tests; architecture gate | M / registry, validation, tests separate; remove registry additions without data migration |
| 3. Media Library foundation | Asset identity, editorial metadata, storage abstraction, asset versions/usage proposal | RLS/storage policy tests, licence validation, publish-only resolver | L / schema and service; disable feature flag/restore migration before data promotion |
| 4. Shared tags foundation | Tags, aliases, bindings, governed lifecycle and search projection contract | Alias collision, usage/visibility, two-domain fixture | M / vocabulary then bindings; archive-only rollback |
| 5. Content relationships foundation | Types, authored edges, edge lifecycle and publication validation | Cycle/self-edge/orphan/rollback tests; two-domain edge fixture | L / type registry then edges; remove unpublished draft data only through approved cleanup |
| 6. Admin Media Library UX | Library, upload, picker, metadata, variants, usage impact | Owner/admin role tests, keyboard/mobile, storage failure | L / UX in slices; hide route/feature flag and preserve published assets |
| 7. Building editor integration | Building media/tag/relationship controls, draft-only save and preview | Existing Buildings contract plus draft leakage and concurrency tests | M / one control family per commit; revert UI without changing v1 |
| 8. Public Building media/related content | Published resolver, images/alt, aliases, guidance and related-content UI | Public/anon tests, missing-target tests, mobile acceptance | M / public projection then UI; retain old text-only page as fallback |
| 9. Search and Forge Connections | Index tags/relationships/media metadata and refresh evidence | Search relevance, stale refresh, graph path tests | M / projection and consumers separate; previous index remains active on failure |
| 10. Cross-domain enablement | Heroes first, then one additional domain; registry adapters and migration bridges | Two-domain acceptance, legacy array/URL compatibility | M / one domain per commit; disable adapter and keep old domain path |
| 11. Mobile/accessibility | Picker/editor/crop/relationship polish and responsive public pages | 390/768/1280, keyboard, screen reader, no overflow | M / UX-only commits; revert CSS/UI safely |
| 12. End-to-end validation | Full flow upload → draft → review → publish → public → search/graph → rollback | Full check, RLS, storage, cache, audit and browser evidence | M / validation-only; release blocked on any draft leak |
| 13. Production release | Owner-approved Version 1.1 promotion and monitoring | Release gate, migration backup/plan, post-deploy smoke | S / one release commit/tag; rollback deployment and published projections |

## Phase 11 — completion standard

The vertical slice is complete only when all of the following are evidenced in a controlled environment and then in production smoke tests:

- A role-protected Media Library uploads, validates, stores metadata/licence, selects and reuses assets across at least two domains.
- Stable asset references survive replacement; variants/crops/focal point and usage roles resolve without breaking consumers.
- Buildings publish primary/card/banner/progression media with alt text and honest missing-media behavior.
- Shared tags, aliases and content-tag bindings work across at least two domains, including create/archive, usage visibility, alias collision and search.
- Explicit directed relationships can be drafted, validated, previewed, published, searched and rolled back across at least two domains.
- Public related content, Search and Forge Connections consume only published, visible endpoints and edges; failed refreshes preserve the last good projection and report stale state.
- Admin media/tag/relationship controls are capability-protected; drafts cannot leak through public routes, Search, image URLs, caches or graph projections.
- Publication/version history/audit/rollback use the existing editorial heads/versions/audit system; no parallel CMS or uncontrolled direct table mutation exists.
- Orphaned targets, invalid types, self-edges/cycles where disallowed, licence failures and removed assets are blocked or explained before publication.
- Mobile and accessibility acceptance passes for editor, picker, crop, relationship preview and Buildings public pages.
- New workflows contain no direct uncontrolled image URL fields; all new images resolve through stable governed asset references.

## Return summary

- **Current branch:** `main`
- **Current HEAD:** `6d9bfd9`
- **Main HEAD:** local `main` is two commits ahead of `origin/main` V1.0 baseline; see Phase 1 for full SHAs
- **HOTFIX-001 HEAD:** local `6d9bfd9`; no remote HOTFIX branch
- **Working tree:** clean at discovery start; this document is the only intentional change from this task
- **HOTFIX recommendation:** needs exact-candidate preview verification before production promotion
- **Concurrent conflicts:** no REL-005 analytics development branch; open PR #11 is unrelated; local history includes REL-005 files
- **Matrix totals:** 29 complete, 28 partial, 43 missing, 0 superseded, 0 blocked, 0 needs verification
- **Live schema:** Buildings/editorial/Search foundations exist; no reusable media, shared tag or authored relationship tables/RPCs
- **Reusable foundations:** Data Studio, Content Studio editorial workflow, publication gates, audit, RLS/capabilities, Search and derived relationship projections, existing Hero Forge Connections consumer
- **Missing foundations:** asset lifecycle/storage binding, shared tags/aliases, authored relationship CMS, entity registry, cross-domain publication and UI controls
- **Proposed architecture:** existing editorial heads/versions/audit with safe entity registry and published-only projections
- **Proposed tables:** `entity_type_registry`, `media_assets`, `media_asset_versions` only if generic editorial records cannot carry values, `media_variants`, `media_usages`, `tags`, `tag_aliases`, `content_tags`, `relationship_types`, `content_relationships`; no schema applied
- **RLS:** forced RLS, server-authoritative capability-gated writes, published-only public resolvers, no broad client writes
- **UX gaps:** Media Library/picker/editor, tag manager/picker, relationship editor, impact/preview views, Building integrations and public media/related-content sections
- **Exact recommended next sprint:** HOTFIX-001 preview/promotion gate, then Milestone 2 entity-reference foundation; do not start Media Library UI or Version 1.1 cross-domain migration before that foundation is accepted
- **May implementation safely begin?** Planning and non-mutating test scaffolding may begin. Feature implementation, migrations, production publication and Version 1.1 enablement should wait until HOTFIX-001 exact-preview acceptance and the entity-reference architecture/schema review are approved.
# HOTFIX-001B boundary note

The Buildings editor hydration repair does not implement media. The reusable
Media Library, asset picker, and Building media controls remain unimplemented
and are planned for Version 1.1. Future Building images must use governed
Media Library assets; no direct image URL shortcut or Building-only upload path
is permitted.
