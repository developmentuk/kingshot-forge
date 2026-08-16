import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { loadPublishedOasisIslandDataset } from '../server/data-engine/loadPublishedOasisIslandDataset.ts'
import {
  assertOasisPublicRecord,
  buildOasisPublicDataset,
  hashOasisManifest,
  OASIS_FORBIDDEN_PUBLIC_FIELDS,
  OASIS_PUBLIC_RECORD_ALLOW_LIST,
} from '../server/oasis-publication/publicProjection.ts'
import { buildOasisSearchRecords } from '../server/oasis-publication/searchAdapter.ts'

const root = process.cwd()
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const bytes = (path) => statSync(resolve(root, path)).size
const sha256 = (path) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')
const source = JSON.parse(read('server/data-engine/sources/kingshot_oasis_island_buildings.json'))
const manifest = JSON.parse(read('server/oasis-publication/oasis-media-manifest.json'))
const fixture = JSON.parse(read('src/features/oasis-island/acceptance/oasis-publication.fixture.json'))

const built = buildOasisPublicDataset({
  records: source.buildings,
  manifest,
  publication: {
    publicationId: fixture.publicationId,
    publicationVersion: fixture.publicationVersion,
    publishedAt: fixture.publishedAt,
    updatedAt: fixture.updatedAt,
  },
})
assert.deepEqual(built, fixture)
assert.equal(built.recordCount, 55)
assert.equal(source.buildings.flatMap((record) => record.levels ?? []).length, 430)
assert.equal(built.records.flatMap((record) => record.levels).length, 430)
assert.equal(new Set(built.records.map((record) => record.id)).size, 55)
assert.deepEqual(Object.keys(built.records[0]).sort(), [...OASIS_PUBLIC_RECORD_ALLOW_LIST].sort())
for (const record of built.records) assertOasisPublicRecord(record)

const injected = buildOasisPublicDataset({
  records: source.buildings.map((record, index) => index === 0 ? { ...record, sourceText: 'private', repositoryPath: 'private', inventedValue: 42 } : record),
  manifest,
  publication: { publicationId: 'test', publicationVersion: 2, publishedAt: fixture.publishedAt, updatedAt: fixture.updatedAt },
})
assert.equal('sourceText' in injected.records[0], false)
assert.equal('repositoryPath' in injected.records[0], false)
assert.equal('inventedValue' in injected.records[0], false)
assert.throws(() => assertOasisPublicRecord({ ...built.records[0], sourceText: 'private' }), /non-allow-listed|forbidden/u)
for (const field of OASIS_FORBIDDEN_PUBLIC_FIELDS) assert.doesNotMatch(JSON.stringify(fixture.records), new RegExp(`"${field}"\\s*:`))
assert.equal(built.records.find((record) => record.id === 'dinosaur-fossils').footprint, null)

assert.equal(manifest.sourceAssetCount, 111)
assert.equal(manifest.derivativeAssetCount, 111)
assert.equal(manifest.entries.length, 111)
assert.equal(new Set(manifest.entries.map((entry) => entry.privateSourceFilename)).size, 111)
assert.equal(new Set(manifest.entries.map((entry) => entry.publicDerivativePath)).size, 111)
assert.equal(manifest.missingArtworkRecordIds.length, 6)
assert.equal(new Set(manifest.missingArtworkRecordIds).size, 6)
for (const entry of manifest.entries) {
  assert.match(entry.publicDerivativePath, /^media\/oasis-island\/[a-z0-9-]+\/(?:catalogue|level-[0-9]+)(?:-variant-[0-9]+)?\.webp$/u)
  assert.equal(sha256(`server/data-engine/source-assets/oasis-island/${entry.privateSourceFilename}`), entry.sourceChecksum)
  assert.equal(sha256(`public/${entry.publicDerivativePath}`), entry.derivativeChecksum)
  assert.ok(entry.width > 0 && entry.height > 0)
}
assert.equal(sha256(`public/${manifest.placeholder.publicDerivativePath}`), manifest.placeholder.derivativeChecksum)
assert.ok(manifest.derivativeAssetBytes < manifest.sourceAssetBytes * 0.25)
assert.ok(bytes('src/assets/island-route/oasis-island-header.webp') < 1024 * 1024)
assert.equal(existsSync(resolve(root, 'src/assets/island-route/oasis-island-header.png')), false)
assert.equal(read('src/features/island-route-optimizer/IslandRouteOptimizerPage.tsx').includes('oasis-island-header.webp'), true)
assert.doesNotMatch(read('src/App.tsx'), /OasisIslandPage|oasis-acceptance/u)
assert.doesNotMatch(read('src/App.tsx'), /path=["']\/oasis-island/u)
assert.doesNotMatch(read('src/main.tsx'), /oasis-acceptance/u)
assert.doesNotMatch(read('src/App.tsx'), /island-background-draft/u)

const searchRecords = buildOasisSearchRecords(built)
assert.equal(searchRecords.length, 55)
assert.equal(searchRecords.every((record) => record.dataset === 'oasis-island' && record.status === 'published'), true)
assert.equal(searchRecords.every((record) => record.canonical_url === `/oasis-island/buildings/${record.id}`), true)
assert.equal(searchRecords.every((record) => record.image?.endsWith('.webp')), true)
assert.throws(() => buildOasisSearchRecords({ ...built, status: 'source-staged' }), /current published/u)
assert.throws(() => buildOasisSearchRecords({ ...built, recordCount: 1, records: [{ ...built.records[0], sourceText: 'private' }] }), /non-allow-listed|forbidden/u)
assert.doesNotMatch(read('shared/data-engine/datasets.ts'), /oasis-island/u)
assert.doesNotMatch(read('server/search/runtime.ts'), /oasis-island/u)

const migration = read('supabase/migrations/20260816150042_oasis_001a_pub_phase_1_foundation.sql')
for (const required of [
  'oasis_publication_versions', 'oasis_publication_records', 'oasis_publication_current',
  'oasis_publication_audits', 'oasis_publication_search_refreshes', 'idempotency_key text not null unique',
  'pg_advisory_xact_lock', 'enable row level security', 'from public, anon, authenticated',
  'prevent_oasis_publication_history_mutation', 'rollback_published', 'on conflict (singleton) do update',
]) assert.match(migration, new RegExp(required.replace(/[()]/gu, '\\$&'), 'u'))
assert.doesNotMatch(migration, /delete from public\.oasis_publication_versions|update public\.oasis_publication_versions/iu)

function clientFor(results) {
  let call = 0
  return {
    from() {
      const result = results[call++]
      const query = {
        select() { return query },
        eq() { return query },
        order() { return Promise.resolve(result) },
        maybeSingle() { return Promise.resolve(result) },
      }
      return query
    },
  }
}

await assert.rejects(loadPublishedOasisIslandDataset(clientFor([{ data: null, error: { code: '42P01', message: 'missing' } }])), /schema is not installed/u)
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([{ data: null, error: null }])), /no current published version/u)
const publicationRow = {
  publication_id: built.publicationId,
  publication_version: built.publicationVersion,
  schema_version: built.schemaVersion,
  status: 'published',
  manifest,
  manifest_hash: hashOasisManifest(manifest),
  source_fingerprint: manifest.sourceFingerprint,
  record_count: 55,
  media_count: 111,
  published_at: built.publishedAt,
  updated_at: built.updatedAt,
}
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: { ...publicationRow, record_count: 54 }, error: null },
])), /counts are incomplete/u)
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: { ...publicationRow, manifest_hash: '0'.repeat(64) }, error: null },
])), /manifest verification failed/u)
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: { ...publicationRow, manifest: { ...manifest, derivativeAssetCount: 110 } }, error: null },
])), /manifest media counts are incomplete/u)
const loaded = await loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: publicationRow, error: null },
  { data: built.records.map((record) => ({ record_id: record.id, public_record: record })), error: null },
]))
assert.deepEqual(loaded, built)

console.log(`OASIS-001A-PUB Phase 1 passed: 55 records, 430 levels, 111 private-to-public media mappings, six placeholders, fail-closed loader and inactive Search adapter verified.`)
