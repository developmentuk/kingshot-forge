import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'

import {
  COMPANION_ITEM_PROJECTION,
} from '../shared/companion/itemProjection.ts'
import { COMPANION_MEDIA_MANIFEST } from '../shared/companion/generatedMediaManifest.ts'
import {
  loadPublishedCompanionItemsDataset,
} from '../server/data-engine/loadPublishedCompanionItemsDataset.ts'
import { createSearchEngine } from '../server/search/runtime.ts'
import {
  buildPublicRoute,
  entityTypeRegistry,
} from '../shared/entity-identity/registry.ts'

const intake = JSON.parse(readFileSync(
  'docs/companion/assets/ITEM-ASSET-INTAKE-2026-08-03.json',
  'utf8',
))
const app = readFileSync('src/App.tsx', 'utf8')
const navigation = readFileSync('src/navigation/workspaceRegistry.ts', 'utf8')
const indexPage = readFileSync('src/pages/CompanionIndexPage.tsx', 'utf8')
const itemPage = readFileSync('src/pages/CompanionItemPage.tsx', 'utf8')
const clientAdapter = readFileSync('src/features/companion/itemData.ts', 'utf8')
const itemHook = readFileSync('src/features/companion/useCompanionItems.ts', 'utf8')
const dataApi = readFileSync('api/data-engine/dataset.ts', 'utf8')
const searchApi = readFileSync('api/search.ts', 'utf8')
const adminSearchApi = readFileSync('api/admin/search.ts', 'utf8')
const searchRuntime = readFileSync('server/search/runtime.ts', 'utf8')
const datasets = readFileSync('shared/data-engine/datasets.ts', 'utf8')
const styles = readFileSync('src/styles/companionIndex.css', 'utf8')
const mediaManifest = JSON.parse(readFileSync(
  'docs/companion/assets/ITEM-MEDIA-MANIFEST-2026-08-03.json',
  'utf8',
))

assert.equal(intake.intake_id, 'COMPANION-ITEM-ASSET-2026-08-03')
assert.equal(intake.publication_state, 'intake_staged')
assert.equal(intake.rights_status, 'owner_supplied_unverified_rights')
assert.equal(intake.assets.length, 10)
assert.equal(mediaManifest.full_artwork_count, 59)
assert.equal(mediaManifest.compact_icon_count, 7)
assert.equal(mediaManifest.total_asset_count, 66)
assert.equal(COMPANION_MEDIA_MANIFEST.length, 66)
assert.equal(COMPANION_ITEM_PROJECTION.length, 75)
assert.equal(new Set(COMPANION_MEDIA_MANIFEST.map((asset) => asset.source_sha256)).size, 66)
assert.ok(COMPANION_MEDIA_MANIFEST.every((asset) => asset.decoded_format === 'webp' && asset.has_alpha))
assert.ok(COMPANION_MEDIA_MANIFEST.every((asset) => existsSync(`public${asset.immutable_media_path}`)))
assert.ok(COMPANION_MEDIA_MANIFEST.every((asset) => asset.rights_status === 'owner_declared_creative_commons'))
assert.equal(COMPANION_MEDIA_MANIFEST.find((asset) => asset.original_archive_entry.endsWith('/mythril.webp'))?.canonical_item_key, 'mithril')
assert.equal(COMPANION_MEDIA_MANIFEST.some((asset) => asset.canonical_item_key === 'mythril'), false)
assert.equal(COMPANION_ITEM_PROJECTION.some((item) => item.forge_id === 'item.mythril'), false)
const mithril = COMPANION_ITEM_PROJECTION.find((item) => item.forge_id === 'item.mithril')
assert.ok(mithril)
assert.deepEqual(mithril.aliases, [])
assert.deepEqual(mithril.search_aliases, ['mythril'])

const intakeByKey = new Map(intake.assets.map((asset) => [
  asset.entity_key.replace(/^item:/u, ''),
  asset,
]))

for (const item of COMPANION_ITEM_PROJECTION) {
  const source = intakeByKey.get(item.key)
  if (!source) {
    const media = COMPANION_MEDIA_MANIFEST.find((asset) => asset.canonical_item_key === item.key)
    assert.ok(media)
    assert.equal(item.image_url, media.immutable_media_path)
    assert.equal(item.media_role, media.media_role)
    assert.equal(item.media_sha256, media.source_sha256)
    assert.equal(item.companion_relationships.length, 0)
    continue
  }
  assert.ok(source, `Published item ${item.key} is missing from the governed intake.`)
  assert.equal(item.name, source.canonical_name)
  assert.equal(item.forge_id, `item.${item.key}`)
  assert.equal(item.canonical_url, `/companion/items/${item.key}`)
  if (item.key === 'mithril') {
    assert.equal(item.image_url, '/media/companion/items/mithril.webp')
    assert.equal(item.media_state, 'published_preview_candidate')
    assert.equal(item.rights_status, 'owner_declared_creative_commons')
  } else {
    assert.equal(item.image_url, null)
    assert.equal(item.media_state, 'withheld_pending_rights')
    assert.equal(item.rights_status, 'owner_supplied_unverified_rights')
  }
  assert.equal(item.image_alt_text, source.alt_text)
  assert.equal(item.planned_media_path, source.planned_path)
  assert.equal(item.relationships.length, 0)
  assert.ok(item.companion_relationships.length > 0)
  assert.ok(item.companion_relationships.every((relationship) => (
    relationship.targetForgeId.includes('.')
    && !relationship.targetForgeId.includes(':')
  )))
  assert.equal(buildPublicRoute(item.forge_id), item.canonical_url)
}

const itemDefinition = entityTypeRegistry.get('item')
assert.ok(itemDefinition)
assert.equal(itemDefinition.namespace, 'item')
assert.equal(itemDefinition.routePolicy, '/companion/items/:slug')
assert.equal(itemDefinition.mediaEligible, true)
assert.equal(itemDefinition.relationshipEligible, true)

const loaded = await loadPublishedCompanionItemsDataset()
assert.equal(loaded.dataset, 'items')
assert.equal(loaded.recordCount, 75)
assert.equal(loaded.records.length, 75)
assert.equal(loaded.metadata?.provenance?.recordCount, 75)
assert.match(loaded.payloadHash, /^[a-f0-9]{64}$/u)

const itemSearch = await createSearchEngine(['items'])
assert.deepEqual(
  itemSearch.query({ text: 'mythril' }).results.map(({ record }) => record.forge_id),
  ['item.mithril'],
)

assert.match(datasets, /PUBLISHED_DATASET_KEYS[\s\S]*'items'/u)
assert.doesNotMatch(datasets.match(/export const DATASET_KEYS[\s\S]*?\] as const/u)?.[0] ?? '', /'items'/u)
assert.match(dataApi, /"items"/u)
assert.match(searchApi, /PUBLISHED_DATASET_KEYS/u)
assert.match(adminSearchApi, /import \{ PUBLISHED_DATASET_KEYS \}/u)
assert.match(adminSearchApi, /\.\.\.PUBLISHED_DATASET_KEYS/u)
assert.match(adminSearchApi, /!PUBLISHED_DATASET_KEYS\.includes/u)
assert.doesNotMatch(adminSearchApi, /import \{ DATASET_KEYS \}/u)
assert.match(searchRuntime, /items: 'item'/u)
assert.match(searchRuntime, /PUBLISHED_DATASET_KEYS\.map\(createProvider\)/u)
assert.match(searchRuntime, /keywords:[\s\S]*\.\.\.aliases[\s\S]*trust_label/u)
assert.match(searchRuntime, /stringList\(record\.aliases\)/u)
assert.match(searchRuntime, /stringList\(record\.search_aliases\)/u)

assert.match(app, /path="companion" element=\{<CompanionIndexPage/u)
assert.match(app, /path="companion\/items\/:itemKey" element=\{<CompanionItemPage/u)
assert.match(navigation, /label: 'Companion Index'[\s\S]*path: '\/companion'/u)
assert.match(indexPage, /useCompanionItems/u)
assert.match(indexPage, /Search items/u)
assert.match(indexPage, /Trust state/u)
assert.match(indexPage, /CompanionItemMedia/u)
assert.match(itemPage, /Governed relationships/u)
assert.match(itemPage, /Not yet published/u)
assert.match(itemPage, /checksum-backed intake evidence/u)
assert.match(clientAdapter, /normaliseCompanionItems/u)
assert.match(itemHook, /fetchDataset\('items'/u)
assert.doesNotMatch(indexPage, /supabase/u)
assert.doesNotMatch(itemPage, /supabase/u)
assert.doesNotMatch(itemHook, /supabase/u)

assert.match(styles, /@media \(max-width: 980px\)/u)
assert.match(styles, /@media \(max-width: 680px\)/u)
assert.match(styles, /focus-visible/u)
assert.match(styles, /companion-trust--research_needed/u)
assert.equal(existsSync('server/companion/media/atlasChunk00.ts'), false)

console.log(
  'Companion Index identity, projection, rights, persisted aliases, Search refresh and responsive route contracts passed.',
)
