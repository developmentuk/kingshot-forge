import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import {
  COMPANION_ITEM_PROJECTION,
} from '../shared/companion/itemProjection.ts'
import {
  COMPANION_MEDIA_MANIFEST,
} from '../shared/companion/generatedMediaManifest.ts'
import {
  loadPublishedCompanionItemsDataset,
} from '../server/data-engine/loadPublishedCompanionItemsDataset.ts'
import {
  getPublishedDatasetCapabilities,
} from '../shared/data-engine/dataset-capabilities.ts'
import {
  getDatasetCapabilityReadiness,
  getDatasetReadinessDefinition,
} from '../shared/data-engine/readiness-registry.ts'
import {
  getAdminDatasetRegistration,
} from '../src/features/admin/datasetDefinitions.ts'
import {
  getDatasetAdapter,
} from '../src/features/admin/datasetAdapterRegistry.ts'

const app = readFileSync('src/App.tsx', 'utf8')
const adminAdapter = readFileSync('src/features/admin/itemsDatasetAdapter.ts', 'utf8')
const adminDetail = readFileSync('src/features/admin/AdminDatasetDetailPage.tsx', 'utf8')
const adminTable = readFileSync('src/features/admin/DatasetTable.tsx', 'utf8')
const adminStyles = readFileSync('src/styles/legacy/08-admin.css', 'utf8')
const itemLoader = readFileSync('server/data-engine/loadPublishedCompanionItemsDataset.ts', 'utf8')

const capabilities = getPublishedDatasetCapabilities('items')
assert.equal(capabilities.browsing, true)
assert.equal(capabilities.creation, false)
assert.equal(capabilities.editing, false)
assert.equal(capabilities.importing, false)
assert.equal(capabilities.search, true)
assert.equal(capabilities.publishing, false)
assert.equal(capabilities.validation, false)
assert.equal(capabilities.versionHistory, false)
assert.equal(capabilities.archive, false)
assert.equal(capabilities.restore, false)
assert.equal(capabilities.rollback, false)

const registration = getAdminDatasetRegistration('items')
assert.ok(registration)
assert.equal(registration.category, 'content')
assert.equal(registration.route, '/admin/data/items')
assert.equal(registration.capabilities?.browsing, true)
assert.equal(registration.capabilities?.importing, false)
assert.equal(registration.capabilities?.search, true)
assert.equal(registration.capabilities?.editing, false)
assert.equal(registration.capabilities?.publishing, false)

const readiness = getDatasetReadinessDefinition('items')
assert.ok(readiness)
assert.equal(readiness.importMode, 'published-projection')
assert.ok(readiness.capabilities.some(({ capability, status }) => capability === 'browser' && status === 'implemented'))
assert.ok(readiness.capabilities.some(({ capability, status }) => capability === 'filters' && status === 'implemented'))
assert.ok(readiness.capabilities.some(({ capability, status }) => capability === 'search' && status === 'implemented'))
assert.ok(readiness.capabilities.some(({ capability, status }) => capability === 'viewer' && status === 'partial'))
assert.ok(readiness.capabilities.some(({ capability, status }) => capability === 'import' && status === 'missing'))
assert.ok(readiness.capabilities.some(({ capability, status }) => capability === 'publishing' && status === 'missing'))
assert.ok(readiness.capabilities.some(({ capability, status }) => capability === 'verification' && status === 'missing'))
assert.ok(readiness.capabilities.some(({ capability, status }) => capability === 'mobile' && status === 'partial'))
assert.ok(getDatasetCapabilityReadiness('items', 'browser').evidence)
assert.ok(readiness.capabilities.some(({ status }) => status === 'missing'))

const loaded = await loadPublishedCompanionItemsDataset()
assert.equal(loaded.dataset, 'items')
assert.equal(loaded.recordCount, 75)
assert.equal(loaded.records.length, 75)
assert.equal(COMPANION_ITEM_PROJECTION.length, 75)
assert.equal(COMPANION_MEDIA_MANIFEST.length, 66)
assert.equal(COMPANION_MEDIA_MANIFEST.filter(({ media_role }) => media_role === 'full_artwork').length, 59)
assert.equal(COMPANION_MEDIA_MANIFEST.filter(({ media_role }) => media_role === 'compact_icon').length, 7)
assert.ok(loaded.records.every((record) => Array.isArray(record.relationships) && record.relationships.length === 0))

const adapter = getDatasetAdapter('items')
assert.ok(adapter)
const browser = adapter.createBrowserDefinition(loaded)
assert.equal(browser.rows.length, 75)
assert.deepEqual(
  browser.filters?.map(({ key }) => key),
  ['category', 'trustState', 'mediaState', 'mediaRole'],
)
assert.deepEqual(
  browser.columns.map(({ key }) => key),
  [
    'name', 'key', 'forgeId', 'aliases', 'category', 'trustState', 'researchState',
    'summary', 'source', 'sourceUpdatedAt', 'verification', 'mediaState', 'mediaRole',
    'confidence', 'rights', 'rightsNote', 'mediaPath', 'plannedMediaPath', 'mediaChecksum',
    'mediaDimensions', 'relationships', 'playerRoute',
  ],
)
assert.equal(new Set(browser.rows.map(({ id }) => id)).size, 75)
assert.equal(new Set(browser.rows.map(({ values }) => values.forgeId)).size, 75)
assert.equal(browser.rows.filter(({ values }) => values.mediaState === 'Published governed media').length, 66)
assert.equal(browser.rows.filter(({ values }) => values.mediaState === 'No published media').length, 9)
assert.equal(browser.rows.filter(({ values }) => values.mediaRole === 'full_artwork').length, 59)
assert.equal(browser.rows.filter(({ values }) => values.mediaRole === 'compact_icon').length, 7)
assert.equal(browser.rows.filter(({ values }) => values.mediaRole === 'No media role').length, 9)

const mithrilRows = browser.rows.filter(({ values }) => values.forgeId === 'item.mithril')
assert.equal(mithrilRows.length, 1)
assert.equal(browser.rows.filter(({ values }) => values.forgeId === 'item.mythril').length, 0)
assert.match(String(mithrilRows[0].values.aliases), /Search-only: mythril/u)
assert.match(String(mithrilRows[0].values.playerRoute), /^\/companion\/items\/mithril$/u)
assert.ok(browser.rows.every(({ values }) => typeof values.source === 'string' && typeof values.verification === 'string'))
assert.ok(browser.rows.every(({ values }) => typeof values.relationships === 'string'))
assert.ok(browser.rows.every(({ values }) => !String(values.relationships).includes('search_relationship_projections')))

assert.doesNotMatch(adminAdapter, /COMPANION_ITEM_PROJECTION/u)
assert.match(adminAdapter, /result\.records/u)
assert.doesNotMatch(adminAdapter, /createEditorRecord/u)
assert.match(itemLoader, /relationships: \[\]/u)
assert.match(app, /path="admin\/data\/:datasetId" element=\{<ProtectedRoute permission="cms\.view">/u)
assert.match(adminDetail, /Loading \{dataset\.name\}/u)
assert.match(adminDetail, /Dataset unavailable/u)
assert.match(adminDetail, /source loaded successfully, but it contains no records/u)
assert.match(adminDetail, /filters=\{/u)
assert.match(adminTable, /No records match the current search or filters/u)
assert.match(adminTable, /Clear search and filters/u)
assert.match(adminTable, /<input[\s\S]*type="search"/u)
assert.match(adminTable, /Object\.values\([\s\S]*row\.values/u)
assert.match(adminTable, /normalisedSearchTerm/u)
assert.doesNotMatch(`${adminAdapter}\n${adminTable}`, /search_refresh_runs|search_relationship_projections|persisted Search projections|supabase/u)
assert.match(adminStyles, /\.dataset-table-filter/u)
assert.match(adminStyles, /@media \(max-width: 700px\)/u)
assert.match(adminStyles, /focus-visible/u)
assert.ok(existsSync('docs/companion/COMPANION-ADMIN-001-STAGE-1A.md'))

console.log('COMPANION-ADMIN-001 Stage 1A published-only Items browser contracts passed.')
