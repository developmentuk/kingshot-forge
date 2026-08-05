# COMPANION-ADMIN-001 Stage 1A — Items Admin Browser Foundation

Status: **Partial — browser foundation only; environmental acceptance blocked**

Starting point: `origin/main` at `60209e0aea98e75d472b4d0a2bfe49a7cac85fbd`

Branch: `feature/companion-admin-001`

## Delivered

Stage 1A registers the published-only `items` dataset in the normal Admin dataset catalogue at `/admin/data/items`. The route remains behind the established `cms.view` boundary and uses the existing Data Engine fetch path.

The Admin adapter consumes the published Item Data Engine result from `server/data-engine/loadPublishedCompanionItemsDataset.ts`; it does not own or duplicate the Item projection. The browser exposes all 75 canonical records with:

- identity: name, immutable key, Forge ID and canonical/Search-only aliases;
- category, trust and derived research state;
- summary, source, source update date, verification and confidence;
- rights, governed media state/role/path/checksum/dimensions and planned media path;
- governed Companion relationships and the unchanged Player route.

Category, trust state, media state and media role filters are available alongside client-side text search over the loaded browser rows, sorting, pagination, loading, error and empty states. This Admin browser search is separate from persisted global Search publication. The generic record panel is retained as a partial viewer; no Item editor or mutation control is enabled.

## Evidence and invariants

- 75 unique Item identities and Forge IDs are loaded from the published projection.
- 66 records have published governed media: 59 full artwork and 7 compact icons.
- 9 records have no published media and no media role.
- `item.mithril` appears exactly once; `item.mythril` is absent; `mythril` remains Search-only.
- Admin browser text search is implemented through the shared `DatasetTable`, the Items adapter's browser rows and the focused Stage 1A contract.
- `relationships` remains empty in the Data Engine result. The browser displays only the published Companion relationship summary.
- Player routes remain `/companion/items/:key`; persisted global Search publication and Search v7 remain unchanged.
- Focused contracts are in `scripts/test-companion-admin-stage-1a.mjs`.
- The focused Stage 1A contract is included in the canonical `npm run check` chain.

## Explicitly not delivered

Stage 1A makes no Supabase migration, SQL, Storage, Search, publication, production, feature-flag, permission, PR or merge change. It does not add Item schema, import, drafts, review, approval, publication, rollback, relationship authoring or media authoring.

The Items readiness registry is intentionally Partial: the browser, adapter, client-side browser search and filters are implemented; the generic viewer and responsive contract are partial; import, Item editor, validation, publishing, version history, persisted global Search publication, verification and related authoring capabilities remain missing or outside this stage.

## Stage 2 blockers

Before any Item authoring or publication work, the project needs an approved Item schema and governance boundary, explicit rights/media policy, server-side mutation contracts, role/permission decisions using existing permissions, audit/version/publication semantics, and owner acceptance of the Admin browser and mobile experience.

## Environmental acceptance gate — 2026-08-05

Stage 1A acceptance remains blocked solely by the external Kingshot player provider. The Companion Admin implementation and the deployed player-resilience correction are not failing.

PLAYER-RESILIENCE-001 was completed through PR #40 and merged canonically. The production merge and deployment evidence is:

- merge commit and production SHA: `1c8145f2b6dcebb60478aa6a2c8136517cbbc151`;
- production deployment: `dpl_5H4MnbyAb5g56GSJcWHqwTnQmF1h`;
- deployment status: `READY`;
- production aliases: `https://ksforge.app/` and `https://kingshot-forge.vercel.app/`.

The resilience production smoke passed: `/admin/datasets`, `/admin/data/items` and `/companion/items/mithril` made zero automatic `/api/player/account` requests; `/admin/data/items` loaded 75 canonical records; `/my-forge` made one legitimate player-account request; authentication remained valid; and the browser console remained clean. The player lookup returned HTTP 503 with `PLAYER_API_UNAVAILABLE`. Cooldown suppression remains supported by the automated resilience tests; no repeated production provider probing was performed.

The current recovery gate is one bounded, non-mutating player-dependent application request. If the result remains HTTP 503 or `PLAYER_API_UNAVAILABLE`, retain this environmental block and stop. If the provider succeeds, rerun the complete authenticated Stage 1A acceptance against the current READY production deployment, record the exact SHA/deployment and zero-mutation evidence, and only then consider Stage 1A accepted. Stage 2 remains closed until that formal acceptance.
