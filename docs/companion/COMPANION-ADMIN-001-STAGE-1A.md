# COMPANION-ADMIN-001 Stage 1A — Items Admin Browser Foundation

Status: **Partial — browser foundation only**

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

Category, trust state, media state and media role filters are available alongside the existing text search, sorting, pagination, loading, error and empty states. The generic record panel is retained as a partial viewer; no Item editor or mutation control is enabled.

## Evidence and invariants

- 75 unique Item identities and Forge IDs are loaded from the published projection.
- 66 records have published governed media: 59 full artwork and 7 compact icons.
- 9 records have no published media and no media role.
- `item.mithril` appears exactly once; `item.mythril` is absent; `mythril` remains Search-only.
- `relationships` remains empty in the Data Engine result. The browser displays only the published Companion relationship summary.
- Player routes remain `/companion/items/:key`; Search v7 and Player source ownership are unchanged.
- Focused contracts are in `scripts/test-companion-admin-stage-1a.mjs`.

## Explicitly not delivered

Stage 1A makes no Supabase migration, SQL, Storage, Search, publication, production, feature-flag, permission, PR or merge change. It does not add Item schema, import, drafts, review, approval, publication, rollback, relationship authoring or media authoring.

The Items readiness registry is intentionally Partial: the browser, adapter and filters are implemented; the generic viewer and responsive contract are partial; import, Item editor, validation, publishing, version history, Search, verification and related authoring capabilities remain missing or outside this stage.

## Stage 2 blockers

Before any Item authoring or publication work, the project needs an approved Item schema and governance boundary, explicit rights/media policy, server-side mutation contracts, role/permission decisions using existing permissions, audit/version/publication semantics, and owner acceptance of the Admin browser and mobile experience.
