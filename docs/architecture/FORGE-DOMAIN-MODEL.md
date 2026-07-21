# Forge Domain Model v1.0

Community Art rendering is a projection concern within the existing editorial
domain: raw submissions remain immutable, approved text payloads are versioned,
and public consumers resolve the published payload/profile pair. The Render
Engine is shared diagnostics infrastructure, not a second content system.

**Status:** Proposed canonical architecture; documentation only  
**Date:** 21 July 2026  
**Repository:** `developmentuk/kingshot-forge`  
**Baseline:** `hotfix/1.0.1-player-buildings-connections` at `a833d2c979bae70704ba297df577b44ac57988d9`

## 1. Purpose and current-state boundary

This is the shared vocabulary and contract for future Forge domains. It does not create tables, change migrations, publish data, or make the planned Media Library, tag CMS, authored relationship CMS or Entity Engine complete.

The model is grounded in the current platform: Supabase is persistent canonical storage; Content Studio uses `editorial_record_heads`, immutable `editorial_record_versions`, `editorial_audit_events` and `publication_queue`; Data Studio stages imports in `forge_dataset_contracts`, `forge_import_runs` and `forge_import_records`; Buildings is a published projection with `buildings` and `building_progression`; Search stores rebuildable published projections and relationship projections; Forge Connections consumes published Search relationships. There is no current shared media, tag or authored relationship table.

Current important inconsistencies are intentional boundaries to resolve incrementally:

| Area | Current evidence | v1.0 decision |
| --- | --- | --- |
| Identity | Player/profile `forge_id` exists; Search uses dataset + record ID; Buildings uses `building_key`; route aliases exist | Add a stable, namespace-qualified Forge ID adapter. Do not replace database keys or routes in this sprint. |
| Progression | Buildings has `progression_phase`, `base_level`, `truegold_tier`, `stage`, `level_label`; legacy datasets use T1–T6 or domain-specific fields | Preserve source fields through a semantic progression row. Sort fields, never labels. |
| Editorial | Generic heads/versions/audit/queue coexist with Buildings-specific publication history | Reuse the generic editorial engine; retain domain-specific adapters until parity is proven. |
| Relationships | `search_relationship_projections` is derived; Hero relationships are consumed by Forge Connections | Reserve authored relationships for a future canonical store; never write editorial state into Search projections. |
| Media | Direct image/source fields and a private/unused image bucket exist; no reusable asset model | Design stable assets and immutable versions before any migration. |
| Tags | Search contracts accept tags and domains have arrays/fields; no governed shared tag store | Treat tags as governed reference data, not free text. |
| Public data | Published projections and RLS are the public boundary | Public resolution is published-only and permission-aware. |

## 2. Domain map

The domain model has four layers:

1. **Identity layer** — Forge IDs, entity types, aliases and route resolution.
2. **Canonical/editorial layer** — domain records, governed references, progression, relationships, media bindings, provenance and immutable versions.
3. **Publication/projection layer** — publication manifests, published projections, Search projections and consumer adapters.
4. **Experience layer** — web, admin, Search, Forge Connections, Creator Centre, Discord, mobile and API clients.

Consumers depend on published contracts, never on draft rows or mutable editor payloads. Personal Progression remains player-owned snapshots that reference published canonical entities; it is not a second canonical progression database.

## 3. Current domain inventory

| Domain | Canonical identity/table or current source | Published projection | Editorial/versioning | Relationships/media/tags | Search/routes |
| --- | --- | --- | --- | --- | --- |
| Players | `player_accounts`, profiles and existing `forge_id` projection | Public player/profile reads with visibility filters | Player-owned records and existing audit/RLS; not editorial facts | Player-owned links; no shared media/tag binding | `/player/:forgeId`, `/players/:forgeId`; public player adapter |
| Alliances | Alliance and membership services/tables; `forge_id` references | Public directory/community reads | Operational ownership and existing RLS | Membership/kingdom links; shared bindings future | Alliance directory/community routes; Search adapter future |
| Kingdoms | Kingdom services/tables and KvK data | Public kingdom/community projections | Operational/editorial boundary varies by dataset | KvK and alliance links; media/tags future | Kingdom routes; dataset/Search adapters |
| Heroes | Existing hero catalogue/service and `heroes` dataset contract | Published hero records | Content Studio/editorial versions and Hero governance | Existing Hero relationships; media/tags future | `/companion/heroes`; Forge Connections and Search |
| Hero skills | `hero_skills` plus source evidence/progression tables | Published Hero Skill projection | Source evidence, verification and editorial history | Belongs to hero; media/tags future | Admin dataset route and Hero surface |
| Hero gear/widgets | Hero gear fields and player-owned showcase/widget structures | Published hero/gear data and private player state | Domain/editorial or player-owned depending on record | Hero attachment; media/tag binding future | Hero Companion/My Forge routes |
| Buildings | `buildings`, `building_progression` | Published-only tables; 10 catalogue and 587 progression baseline | Data Studio import plus Buildings publication/version/rollback records | Prerequisite graph exists; authored content edges/media/tags absent | `/buildings`, `/buildings/:slug`, Search adapter |
| Troops | Data Engine registrations and existing troop/truegold definitions | Published dataset projection | Dataset import/editorial workflow | Building trains troop and tier hierarchy are future authored/derived edges | Admin dataset, player progression, Search |
| Gear/charms | Registered Gear/Charm datasets and player score snapshots | Published dataset projections | Dataset/editorial workflow; player scores are snapshots | Enhancement progression; media/tags future | Admin datasets, Personal Progression |
| Research/War Academy | Registered Research/War Academy/Truegold datasets | Published dataset projections | Dataset/editorial workflow | Requirements and unlocks; generic progression adapter future | Admin datasets, Search |
| Events | Registered Events/KvK dataset definitions | Published event projection | Dataset/editorial workflow | Guides/videos/creator relationships future | Admin dataset, public event routes future |
| Guides/articles/videos | Guide/article/video are registry entity types; no single shared CMS record is assumed | Published content projections when implemented | Reuse editorial engine; creator attribution governed | Authored/attributed relationships and media bindings future | Content routes and Search |
| Creators | Creator profile/attribution surfaces and community art attribution | Public-safe creator projection | Creator-controlled profile plus editorial moderation boundary | Authored creator relationships; media bindings future | Creator Centre/Search |
| Tools/calculators | Product registry and future dataset consumers | Published tool metadata; calculations use published inputs | Editorial metadata/versioning; formulas are code-reviewed | Calculator uses dataset relationship future | Tool routes/API |
| Media/tags/relationships | No shared canonical tables currently | None; Search projections only are derived | Future governed editorial entities | Not implemented; design in sections 7–9 | Future CMS and Search adapters |
| Search | `search_projections`, `search_relationship_projections`, refresh/index metadata | Rebuildable published-only index | Derived; never canonical or editable | Derived edges only | `/search`, `/api/search`, admin Search Explorer |
| Publications/audit | `editorial_*`, `publication_queue`, dataset import/publication records | Published projections/manifests | Immutable versions/events; rollback creates new state | Must include future cross-entity bindings | Admin Content/Data/Publish surfaces |

## 4. Forge stable entity identity

The canonical format is `namespace.local-key`, for example `hero.amadeus`, `building.town-center`, `event.kingdom-vs-kingdom`, `troop.infantry.tg6`, `research.military-drill`, `guide.bear-trap` and `creator.kinghunter`.

Rules:

- Namespace and key are lowercase ASCII; separator is one dot; key words use single hyphens.
- Namespace is the registered `entity_type` key, not an arbitrary dataset name.
- The local key is stable, human-readable and opaque to database implementation. It may be allocated from a source key, but is not a temporary import key.
- Uniqueness is global for the pair `(namespace, local-key)` and case-insensitive after normalisation.
- A Forge ID is permanent once published. Renames keep the ID and change display metadata.
- Aliases are separately governed references. Old URLs may redirect to a route resolved by Forge ID, but a URL slug is not identity.
- Deprecation archives or suppresses an entity; it does not recycle the ID. A replacement may point to it through an editorial relationship/redirect record.
- Database UUIDs, URLs, display names, editable slugs and temporary import IDs are not Forge IDs.
- Versioning is independent: a new editorial version or publication does not change the Forge ID.

Suggested internal reference shape: `{ forge_id, entity_type, database_id?, dataset_key?, record_key?, alias_keys[] }`. The optional implementation fields are adapters, not public identity.

## 5. Entity-type registry

The registry is governed reference data in code/config first and may later be mirrored in a database read model. An unknown type fails closed; it never receives generic routes or permissions.

| Type | Resolver / current source | Published test | Route/search | Permissions and eligibility |
| --- | --- | --- | --- | --- |
| player | public player projection by `forge_id` | public visibility + account/profile policy | `/player/:forgeId`; player adapter | owner/admin writes; relationships/tags/media only through approved public-safe bindings; progression player-owned |
| alliance | alliance public projection | published/public membership state | alliance route; directory adapter | leaders/admins write; relationships/tags/media governed |
| kingdom | kingdom/KvK projection | published/public state | kingdom route; dataset adapter | owner/admin/editorial by field; relationships/tags/media governed |
| hero | Hero catalogue/editorial adapter | `published` version/projection | Hero route; Search adapter | editor/contributor capability; relationships/tags/media/progression allowed |
| hero_skill | `hero_skills`/source-governance adapter | published verified skill | hero-skill route; Search adapter | editor; belongs-to hero; progression/media/tags allowed |
| hero_gear | Hero gear dataset adapter | published dataset row | gear route; Search adapter | editor; hero relationship; progression/media/tags allowed |
| hero_widget | widget/player showcase adapter | published canonical widget or owner-visible state | hero/player route; limited Search | owner for player state; editorial for canonical widget; media/tag policy by subtype |
| building | `buildings` adapter | `published_version is not null` | `/buildings/:slug`; Search adapter | editor publication; requirements/relationships/media/tags allowed |
| building_progression | `building_progression` adapter | `published_version is not null` | nested building route; Search only where useful | editor publication; progression only; media/tags/edges through parent policy |
| troop / troop_tier | Data Engine troop adapter | published dataset row | troop route; Search adapter | editor; progression/relationships/media/tags allowed |
| charm / research / war_academy | registered dataset adapters | published verified row | dataset route; Search adapter | editor; progression/requirements/media/tags allowed |
| event | Events/KvK dataset adapter | published dataset row | event route; Search adapter | editor; relationships/media/tags/progression if contract permits |
| guide / article / video | future content adapter over existing editorial engine | published content version | content route; Search adapter | contributor/editor workflow; media/tags/relationships allowed |
| creator | public-safe creator projection | profile moderation/publication state | creator route; Search adapter | creator owns profile; editorial controls publication; media/tags allowed |
| tool / calculator | registered product adapter | published metadata and enabled status | tool route/API; Search adapter | code owner/editorial metadata; consumes published datasets |
| dataset | `forge_dataset_contracts` + registry | enabled and published source contract | admin dataset route; admin Search | admin/editor; no public entity unless contract exposes it |
| media_asset | future asset resolver | published asset version + usage policy | no direct arbitrary route; signed/public delivery | media/editor roles; tags/relationships limited; progression no |
| tag | future governed reference data | active, visible, published | no content route; Search filter | tag governors; no self-service authorization |
| relationship | future authored edge resolver | published edge and both endpoints visible | Connections/Search expansion | editor/contributor by relationship policy; no generic public write |

Every registry entry must provide resolver, canonical source, published-state predicate, route builder, Search adapter, permission capability, relationship/media/tag/progression eligibility, audit events and archive behavior. These are required implementation fields even when an adapter currently returns “not available”.

## 6. Progression Engine

Progression is a semantic row model, not a label parser. A row belongs to an entity and a named progression system. Required fields:

```text
progression_id, entity_id, progression_phase, progression_tier, progression_stage,
progression_sequence, display_label, row_kind, parent_progression_id,
costs, time, power, requirements, effects, source_metadata, verification_state
```

`progression_phase` identifies the phase (`base`, `standard`, `truegold`, `awakening`, `stars`, `rank`, `research`, `enhancement`, or a registered future key). `progression_tier` is a tier within a phase. `progression_stage` is a data value inside that tier. `progression_sequence` is the authoritative source order or explicit semantic ordinal. `row_kind` distinguishes `base_state`, `level`, `tier`, `sub_stage`, `awakening`, `star`, `rank`, `enhancement` and `transition`.

`parent_progression_id` is explicit when a row is nested. It is not inferred from `display_label`, `base_level` or a string prefix. A base state such as `town-center:0` remains a base-state row; it is not an upgrade level.

Deterministic sort order:

1. entity/domain order from the contract;
2. phase ordinal from the registered progression phase;
3. tier numeric/semantic ordinal, nulls last;
4. row-kind ordinal (`base_state`, `level`, `tier`, `sub_stage`, then domain-defined kinds);
5. stage numeric/semantic ordinal, nulls last;
6. explicit `progression_sequence`;
7. stable `progression_id` as the final tie-breaker.

Never sort by display label. Labels are generated by a renderer from semantic fields: standard level `30`; Truegold tier `TG1`; Truegold sub-stage `TG1-1`; later examples `TG2`, `TG2-1`, `TG2-2`. A source label may be retained in `source_metadata`, but cannot establish hierarchy.

Variable-stage rule: each `(entity_id, progression_phase, progression_tier)` owns its own ordered set of stages. TG1 may have four sub-stages, TG2 two, and another tier any other count. No renderer, validator or API may assume a fixed count. Empty stage is valid only for a tier row whose `row_kind` is `tier`.

Compatibility adapters map `base_level` to standard level, `truegold_tier` and `stage` to Truegold semantics, and legacy T1–T6 values to a domain contract. Existing Buildings records are read through an adapter preserving `progression_phase`, `level_label`, `base_level`, `truegold_tier` and `stage`; no migration is implied. Numeric and duration values remain source values with units defined by the dataset contract.

## 7. Authored relationships

An authored relationship is a governed directional edge: `relationship_id`, `relationship_type`, `source_entity_id`, `target_entity_id`, `directionality`, `reciprocal_relationship_id?`, `explanation`, `editorial_status`, `publication_state`, `validation_state`, `visibility`, `valid_from/to`, `created_by`, `updated_by`, version/audit metadata. The identity deduplication key is `(source, type, target, effective version)`; repeated imports update a draft, not create duplicate edges.

The relationship registry defines allowed source/target types, whether an edge is directional, reciprocal or acyclic, required explanation, permission, and whether it is public-visible. Examples include `requires`, `unlocks`, `trains`, `explains`, `covers`, `authored_by`, `uses_dataset` and `synergises_with`.

Validation rejects missing endpoints, endpoints that are not eligible, self-edges where prohibited, unpublished targets at publication time, duplicate identities, invalid reciprocal pairs and cycles for acyclic types such as prerequisites. Orphan prevention is a publication gate and a foreign-resolution check; deleting/archiving an endpoint archives or blocks the edge rather than leaving a public broken link. Rollback restores the prior published edge set through a new publication version.

Authored relationships are different from tags, aliases, prerequisites and recommendations. Tags classify; aliases resolve alternate names; prerequisites are typed dependency semantics and may also produce a relationship; recommendations are ranked/derived advice; authored relationships assert an editorially governed connection. Search edges are derived projections and may include only published authored edges plus explicitly documented domain-derived edges.

Forge Connections groups published edges by domain tab, resolves both endpoints through the registry, deduplicates by canonical entity/type/target, and renders a card with icon/type, title, description, explanation, tags and a supported deep link. It never invents an edge, shows drafts, concatenates raw fields, renders a generic broken link or exposes an unpublished target.

## 8. Tags and taxonomy

Tags are governed reference data: `tag_id`, namespace, canonical key, display names by locale, aliases, description, editorial status, visibility, usage count (derived), archive/merge metadata, audit/version metadata. A binding is explicit and versioned: `(entity_id, tag_id, role?, locale?, publication state)`.

Tag keys are namespaced and normalised; aliases cannot collide with a canonical key in the same namespace. Merge archives the old tag and records a redirect to the survivor; it does not silently rewrite history. Usage counts are rebuildable diagnostics, never permissions. Search indexes canonical tags and approved aliases only on published projections.

Use a tag for many-to-many classification (`truegold`, `infantry`, `beginner`). Use a relationship for a meaningful source-to-target assertion (`guide explains building`). Use an alias for alternate spelling/name resolution. Use a category for a single governed navigation dimension. Use a progression phase for ordered lifecycle semantics. A tag must not be used to imply prerequisites, authorship or recommendation.

## 9. Media Library (future architecture)

Media identity is stable: `media_asset_id` remains constant across replacements. Each immutable `media_asset_version` records original file metadata, checksum, MIME/type, byte size, source, licence, credit, usage permission, alt text, caption, focal point and verification. Variants/crops are immutable derivatives of a version and have a role such as `original`, `card`, `header`, `portrait` or `gallery`.

Content binds to an asset through an explicit usage record containing entity ID, usage role, variant/crop, gallery order, focal override and publication state. Replacement creates a new asset version and a new published binding; consumers never point at uncontrolled direct image URLs. Existing Buildings, Heroes, Events, Guides and Creator content reference media only through the binding adapter, with legacy `image`/`source_url` fields retained as compatibility input until explicitly migrated.

Private upload is owner/editor capability-gated and stored in a private bucket. Public delivery resolves only a published, permitted version and approved variant through a controlled URL/signing service. RLS protects metadata and usage bindings; Storage policies protect object paths; service-role functions are limited, capability-checked, schema-qualified and never exposed to the browser. Archive removes public resolution but preserves immutable history. Rollback selects the previous published binding/version.

## 10. Editorial and publication mapping

An editorial entity is a canonical domain record or governed shared record whose material facts require provenance, review, versioning, audit and publication. Tags, aliases, relationship types and media metadata are governed reference data and still require lifecycle/audit; Search rows, usage counts, relationship projections and index metadata are derived and rebuildable. A player snapshot is owner data, not editorial canonical data.

The existing `editorial_record_heads` is the optimistic mutable pointer; `editorial_record_versions` is immutable content/version state; `editorial_audit_events` is append-only history; `publication_queue` is an explicit request/operation boundary. Data import runs and publication manifests preserve source fingerprints, validation, warning identities and refresh outcomes. Domain-specific Buildings publication records remain an adapter until a generic equivalent reaches parity.

Version and source evidence, editorial decisions, relationships, media versions and publication manifests are immutable. Search projections, relationship projections, usage counts and caches can be rebuilt. Rollback is a new publication/version referencing an earlier valid snapshot, never an update/delete of history. Cross-entity publication publishes a manifest containing all records/bindings/edges and refresh stages; failure leaves the prior published set intact and marks the operation failed/stale. No second CMS is introduced.

## 11. Search

Search consumes the universal published projection: Forge ID, entity type, display title, aliases, tags, relationship summaries, progression labels, creator attribution, approved media metadata, canonical route and publication/version metadata. Providers remain domain adapters. The persisted `search_projections` and `search_relationship_projections` are derived, published-only and rebuildable.

Ranking inputs are exact Forge ID, exact alias, title, token/keyword match, tag match, entity-type/domain prior, relationship context, verified/published freshness and explicit search weight. Public queries cannot opt into unpublished data. Zero-result queries log privacy-minimised diagnostics (length/hashed session and safe aggregate properties, not raw sensitive input). A failed refresh keeps the previous index and marks it stale; a successful manifest publication schedules/invokes an idempotent rebuild. Rebuilds are replace-per-source or atomic by publication manifest.

Result cards carry entity type, title, verified status, tags, safe media variant, relationship explanation and a resolved deep link. Route resolution uses the registry and Forge ID; it does not trust a concatenated user-provided URL. Relationship expansion is bounded, cycle-safe, deduplicated and permission-aware.

## 12. Universal dataset contract

Required envelope fields: `contract_version`, `dataset_key`, `entity_type`, `forge_id`, `record_key`, `display_name`, `source`, `provenance`, `verification`, `editorial_status`, `publication_state`, `validation`, `audit_metadata`.

Optional shared fields: `aliases`, `tags`, `relationships`, `media_references`, `progression`, `search_metadata`, `description`, `route_hint`, `locale`, `deprecated_by`, `source_updated_at`. Domain contracts may add fields but may not redefine shared semantics or use display labels as identity/order.

Import validation requires schema/type checks, stable identity, namespace/key normalisation, duplicate detection, required provenance, verification status, valid relationship endpoints/types, valid media references/licences, progression semantic checks, warning identity preservation, orphan detection and deterministic manifest hashing. Imports are staged; invalid or unverified records cannot publish. Domain extensions document required/optional fields, units, source sequence, row kinds and compatibility mappings.

## 13. API and integrations

The public API uses stable Forge IDs and a versioned envelope:

```json
{ "data": {}, "meta": { "apiVersion": "v1", "schemaVersion": 1, "publishedAt": "...", "sourceVersion": "..." }, "errors": [] }
```

Public responses are published-only and cacheable by publication/version; authenticated responses add only permission-visible data. Admin/editor APIs expose draft and audit data only with capability checks. Discord, mobile, AI, Creator Centre and Alliance Hub consume the same public/API adapters, not database tables. API versions are additive where possible; deprecation uses a documented sunset and stable ID. Rate limiting is per IP/account/client and stricter for Search, relationship expansion, media signing and admin mutations. Publication manifests provide the consistency guarantee and cache invalidation key.

## 14. Security and RLS

Public published reads use explicit `anon`/`authenticated` grants plus RLS predicates for publication state and visibility. Authenticated reads are not authorised merely by `TO authenticated`; ownership, membership, capability or public visibility is required. Owner/admin writes go through server-authorized operations; contributor/editor scopes are capability-based. Service-role execution is limited to internal publication, rebuild and audit operations and is never placed in browser code.

RLS is enabled on every exposed table. Drafts, staging, audit and private media metadata are isolated from public roles. Storage policies constrain bucket/path and owner/capability. Relationship and tag authoring requires the relevant domain/editor capability; media upload requires media capability. Authorization never depends on user-editable metadata (`raw_user_meta_data`); use server capability checks and trusted app-level role data. Views exposed to clients must use invoker semantics or be protected in a non-exposed schema.

## 15. Adoption plan

| Stage | Dependencies / risk | Compatibility, tests and rollback | Gate |
| --- | --- | --- | --- |
| 1 HOTFIX-002 acceptance | protected preview and owner/player evidence; no model change | current Buildings/TG/Search adapters; rerun release gate; revert docs/code candidate only | accept exact preview before branching |
| 2 stable identity foundation | registry and collision policy; route compatibility risk | dual-read IDs, alias/route tests, no data rewrite; disable adapter | registry contract and uniqueness tests |
| 3 progression semantics | label/order regressions | semantic adapter for legacy fields; comparator fixtures; revert adapter | variable-stage contract tests |
| 4 Buildings adapter | existing publication/history complexity | preserve tables/RPCs; shadow projection and manifest diff; rollback to current adapter | 10/587 and publication integrity unchanged |
| 5 Heroes adapter | hero skill/source evidence differences | bridge existing relationships; focused publication/Search tests | published Hero/Skill parity |
| 6 shared tags | collision/merge and taxonomy governance | no binding until published; rebuild tag index; archive/merge rollback | governed tag lifecycle |
| 7 authored relationships | cycles/orphans and cross-domain atomicity | shadow edges beside Search projections; publish manifest; rollback edge set | no draft/unpublished/broken edges |
| 8 Media Library | storage/RLS and licence risk | stable asset IDs, immutable versions, legacy image adapter; private bucket rollback | public delivery and permission tests |
| 9 Search integration | stale index and ranking changes | rebuildable per-source projections; retain prior index on failure | published-only Search parity |
| 10 Forge Connections | route and dedupe regressions | consume published edges only; fallback to empty state; UI tests | grouped cards and deep links |
| 11 Creator content | attribution/consent boundary | public-safe creator projection; moderation rollback | attribution and media policy |
| 12 Discord/mobile/API | rate/cache/version compatibility | API v1 adapter and contract tests; client feature flags | consumer conformance and rate limits |

No stage marks future capabilities complete until implementation, publication, security, responsive and owner acceptance gates pass.

## 16. ADR index and implementation readiness

ADRs `ADR-001` through `ADR-008` record the decisions that constrain future implementation. The exact first implementation sprint is **Stable Entity Identity Foundation** after HOTFIX-002 protected-preview acceptance: define registry contracts, normalise/validate IDs in adapters, add collision/alias/route-resolution tests, and produce a shadow identity report. It must not create a new table or migrate published data in that sprint unless a separately approved schema change follows this document.

Implementation of the Entity Engine, Media Library and Relationship CMS may **not safely begin yet**. Architecture work may begin; feature implementation is gated on HOTFIX-002 acceptance, owner approval of this model, and a reviewed migration/API contract for the first slice. The shared Render Engine Core is an independent platform service and may be consumed by future text generators without introducing Community Art-specific logic.
