import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

import { loadPublishedOasisIslandDataset } from '../server/data-engine/loadPublishedOasisIslandDataset.ts'
import {
  assertOasisRollbackCandidateMatchesSnapshot,
  assertOasisPublicRecord,
  assertOasisPublicationPayload,
  buildOasisPublicDataset,
  deriveOasisRollbackRecords,
  hashOasisManifest,
  hashOasisRecordContent,
  hashOasisSourceFingerprint,
  OASIS_MEDIA_MANIFEST_SCHEMA_VERSION,
  OASIS_SOURCE_FINGERPRINT_VERSION,
  OASIS_FORBIDDEN_PUBLIC_FIELDS,
  OASIS_PUBLIC_RECORD_ALLOW_LIST,
  OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS,
  oasisPublicTrustLabel,
  stableOasisJson,
} from '../server/oasis-publication/publicProjection.ts'
import { buildOasisSearchRecords } from '../server/oasis-publication/searchAdapter.ts'

const root = process.cwd()
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const bytes = (path) => statSync(resolve(root, path)).size
const sha256 = (path) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')
const source = JSON.parse(read('server/data-engine/sources/kingshot_oasis_island_buildings.json'))
const manifest = JSON.parse(read('server/oasis-publication/oasis-media-manifest.json'))
const fixture = JSON.parse(read('fixtures/oasis-001a-publication/oasis-publication.fixture.json'))
const hashFixture = JSON.parse(read('fixtures/oasis-001a-publication/oasis-manifest-hash.fixture.json'))
const retiredIslandRoutePngSha256 = '482ba56cae6ca1fdf243c85c8c199965f10a901efaad460e8084e89792510922'

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
assert.equal(manifest.schemaVersion, OASIS_MEDIA_MANIFEST_SCHEMA_VERSION)
assert.equal(manifest.sourceFingerprintVersion, OASIS_SOURCE_FINGERPRINT_VERSION)
assert.equal(manifest.sourceFingerprint, hashOasisSourceFingerprint({ records: source.buildings, media: manifest.entries }))
assert.equal(built.recordContentHash, hashOasisRecordContent(built.records))
assert.equal(source.buildings.flatMap((record) => record.levels ?? []).length, 430)
assert.equal(built.records.flatMap((record) => record.levels).length, 430)
assert.equal(new Set(built.records.map((record) => record.id)).size, 55)
assert.deepEqual(Object.keys(built.records[0]).sort(), [...OASIS_PUBLIC_RECORD_ALLOW_LIST].sort())
for (const record of built.records) assertOasisPublicRecord(record)
assertOasisPublicationPayload({
  publicationId: built.publicationId,
  sourceFingerprint: manifest.sourceFingerprint,
  manifestHash: hashOasisManifest(manifest),
  manifest,
  records: built.records,
})

for (const record of source.buildings) {
  assert.equal(oasisPublicTrustLabel(record), OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS[record.verification.status])
}
assert.equal(built.records.find((record) => record.id === 'skating-rink').trustLabel, 'Partial source coverage')
assert.notEqual(built.records.find((record) => record.id === 'skating-rink').trustLabel, 'Owner verified in-game')
assert.equal(oasisPublicTrustLabel({ id: 'owner-proof', verification: { status: 'owner_direct_ingame_verified' } }), 'Owner verified in-game')
assert.throws(() => oasisPublicTrustLabel({ id: 'missing-status' }), /unsupported verification status/u)
assert.throws(() => oasisPublicTrustLabel({ id: 'invented-status', verification: { status: 'invented' } }), /unsupported verification status/u)
for (const [index, record] of built.records.entries()) {
  if (record.trustLabel === 'Owner verified in-game') assert.equal(source.buildings[index].verification.status, 'owner_direct_ingame_verified')
}

const immutableSource = {
  dataset: built.dataset,
  publicationId: built.publicationId,
  sourceFingerprint: manifest.sourceFingerprint,
  manifestHash: hashOasisManifest(manifest),
  recordContentHash: hashOasisRecordContent(built.records),
  manifest,
  records: built.records,
}
const rollbackIdentity = {
  publicationId: 'oasis-rollback-forward-2',
  publicationVersion: 2,
  publishedAt: '2026-08-16T20:00:00.000Z',
  updatedAt: '2026-08-16T20:00:00.000Z',
}
const rollbackRecords = deriveOasisRollbackRecords(immutableSource, rollbackIdentity)
const rollbackCandidate = { ...immutableSource, publicationId: rollbackIdentity.publicationId, records: rollbackRecords }
assertOasisRollbackCandidateMatchesSnapshot(rollbackCandidate, immutableSource)
const withoutPublicationIdentity = (record) => {
  const content = { ...record }
  for (const field of ['publicationId', 'publicationVersion', 'publishedAt', 'updatedAt']) delete content[field]
  return content
}
assert.deepEqual(
  rollbackRecords.map(withoutPublicationIdentity),
  built.records.map(withoutPublicationIdentity),
)
assert.equal(rollbackRecords.every((record) => record.publicationId === rollbackIdentity.publicationId && record.publicationVersion === 2), true)
assert.equal(hashOasisRecordContent(rollbackRecords), immutableSource.recordContentHash)
assert.equal(hashOasisRecordContent([...built.records].reverse()), immutableSource.recordContentHash)
assert.equal(hashOasisRecordContent(built.records.map((record) => ({ ...record, publishedAt: '2099-01-01T00:00:00.000Z', updatedAt: '2000-01-01T00:00:00.000Z' }))), immutableSource.recordContentHash)
assert.equal(hashOasisRecordContent(built.records.map((record) => ({ ...record, publicationId: 'another-publication', publicationVersion: 999 }))), immutableSource.recordContentHash)
for (const [name, mutate] of [
  ['name', (records) => { records[0].name = 'Changed name' }],
  ['level', (records) => { records[0].levels[0].level = 99 }],
  ['bonus', (records) => { records[0].levels[0].bonuses[0].valuePct = 31 }],
  ['trust', (records) => { records[0].trustLabel = 'Community corroborated' }],
  ['media', (records) => { records[1].media[0].alt = 'Changed alt' }],
  ['route', (records) => { records[0].canonicalRoute = '/changed' }],
]) {
  const changed = structuredClone(built.records)
  mutate(changed)
  assert.notEqual(hashOasisRecordContent(changed), immutableSource.recordContentHash, `${name} must affect record-content identity`)
}
assert.throws(() => assertOasisRollbackCandidateMatchesSnapshot(rollbackCandidate, null), /does not exist/u)
assert.throws(() => assertOasisRollbackCandidateMatchesSnapshot({ ...rollbackCandidate, dataset: 'another-dataset' }, immutableSource), /another dataset/u)
assert.throws(() => assertOasisRollbackCandidateMatchesSnapshot({ ...rollbackCandidate, records: rollbackRecords.map((record, index) => index ? record : { ...record, name: 'Altered' }) }, immutableSource), /does not match/u)
assert.throws(() => deriveOasisRollbackRecords({ ...immutableSource, dataset: 'another-dataset' }, rollbackIdentity), /another dataset/u)

function assertAdversarialRejection(name, mutate, expected) {
  const candidateManifest = structuredClone(manifest)
  const candidateRecords = structuredClone(built.records)
  const candidate = {
    publicationId: built.publicationId,
    sourceFingerprint: manifest.sourceFingerprint,
    manifestHash: '',
    manifest: candidateManifest,
    records: candidateRecords,
  }
  mutate(candidate)
  if (!candidate.manifestHash) candidate.manifestHash = hashOasisManifest(candidate.manifest)
  assert.throws(() => assertOasisPublicationPayload(candidate), expected, name)
}

assertAdversarialRejection('empty manifest entries with declared count 111', ({ manifest: value }) => { value.entries = [] }, /exactly 111 entries/u)
assertAdversarialRejection('duplicate derivative paths', ({ manifest: value }) => { value.entries[1].publicDerivativePath = value.entries[0].publicDerivativePath }, /derivative paths must be unique/u)
assertAdversarialRejection('duplicate private identities', ({ manifest: value }) => { value.entries[1].privateSourceFilename = value.entries[0].privateSourceFilename }, /private-source identities must be unique/u)
assertAdversarialRejection('incorrect manifest hash', (candidate) => { candidate.manifestHash = '0'.repeat(64) }, /manifest hash does not match/u)
assertAdversarialRejection('mismatched source fingerprint', (candidate) => { candidate.sourceFingerprint = '0'.repeat(64) }, /source fingerprint does not match/u)
assertAdversarialRejection('wrong placeholder list', ({ manifest: value }) => { value.missingArtworkRecordIds[0] = 'not-approved' }, /missing-artwork IDs are invalid/u)
assertAdversarialRejection('obsolete manifest contract', ({ manifest: value }) => { value.schemaVersion = 'oasis-media-manifest-v1' }, /v2 fingerprint contract/u)
assertAdversarialRejection('forbidden nested sourceText', ({ records }) => { records[0].levels[0].sourceText = 'private' }, /forbidden field: sourceText/u)
assertAdversarialRejection('forbidden nested verification', ({ records }) => { records[0].media[0].verification = { status: 'private' } }, /forbidden field: verification/u)
assertAdversarialRejection('extra top-level record fields', ({ records }) => { records[0].unexpected = true }, /non-allow-listed fields/u)
assertAdversarialRejection('invalid canonical route', ({ records }) => { records[0].canonicalRoute = '/wrong' }, /invalid canonical route/u)
assertAdversarialRejection('record/media mismatch', ({ records }) => { records[0].media[0].url = '/media/oasis-island/wrong/catalogue.webp' }, /public media does not match/u)
const placeholderRecordIndex = built.records.findIndex((record) => record.id === 'fountain-of-life')
const mappedRecordIndex = built.records.findIndex((record) => record.media.some((media) => media.role !== 'placeholder'))
assertAdversarialRejection('placeholder wrong alt', ({ records }) => { records[placeholderRecordIndex].media[0].alt = 'Artwork missing' }, /public media does not match/u)
assertAdversarialRejection('placeholder wrong level variant', ({ records }) => { records[placeholderRecordIndex].media[0].levelVariant = 1 }, /public media does not match/u)
assertAdversarialRejection('placeholder wrong width', ({ records }) => { records[placeholderRecordIndex].media[0].width += 1 }, /public media does not match/u)
assertAdversarialRejection('placeholder wrong height', ({ records }) => { records[placeholderRecordIndex].media[0].height += 1 }, /public media does not match/u)
assertAdversarialRejection('missing record arbitrary placeholder', ({ records }) => { records[placeholderRecordIndex].media[0].url = '/media/oasis-island/shared/arbitrary.webp' }, /public media does not match/u)
assertAdversarialRejection('nonmissing record placeholder', ({ records }) => { records[mappedRecordIndex].media = [structuredClone(built.records[placeholderRecordIndex].media[0])] }, /public media does not match/u)
assertAdversarialRejection('duplicate media mapping', ({ records }) => { records[mappedRecordIndex].media.push(structuredClone(records[mappedRecordIndex].media[0])) }, /public media does not match/u)
assertAdversarialRejection('extra media mapping', ({ records }) => { records[mappedRecordIndex].media.push({ ...structuredClone(records[mappedRecordIndex].media[0]), alt: 'Extra' }) }, /public media does not match/u)
assertAdversarialRejection('publication identity mismatch', ({ records }) => { records[0].publicationId = 'different-publication' }, /publication identity conflicts/u)

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
  assert.equal(entry.privateDerivativePath, `fixtures/oasis-001a-publication/${entry.publicDerivativePath}`)
  assert.equal(sha256(`server/data-engine/source-assets/oasis-island/${entry.privateSourceFilename}`), entry.sourceChecksum)
  assert.equal(sha256(entry.privateDerivativePath), entry.derivativeChecksum)
  assert.ok(entry.width > 0 && entry.height > 0)
}
assert.equal(manifest.placeholder.privateDerivativePath, `fixtures/oasis-001a-publication/${manifest.placeholder.publicDerivativePath}`)
assert.equal(sha256(manifest.placeholder.privateDerivativePath), manifest.placeholder.derivativeChecksum)
assert.equal(existsSync(resolve(root, 'public/media/oasis-island')), false)
assert.ok(manifest.derivativeAssetBytes < manifest.sourceAssetBytes * 0.25)
assert.ok(bytes('src/assets/island-route/oasis-island-header.webp') < 1024 * 1024)
assert.equal(existsSync(resolve(root, 'src/assets/island-route/oasis-island-header.png')), false)
assert.equal(read('src/features/island-route-optimizer/IslandRouteOptimizerPage.tsx').includes('oasis-island-header.webp'), true)
assert.doesNotMatch(read('src/App.tsx'), /OasisIslandPage|oasis-acceptance/u)
assert.doesNotMatch(read('src/App.tsx'), /path=["']\/oasis-island/u)
assert.doesNotMatch(read('src/main.tsx'), /oasis-acceptance/u)
assert.doesNotMatch(read('src/App.tsx'), /island-background-draft/u)
assert.equal(stableOasisJson(hashFixture.input), hashFixture.stableJson)
assert.equal(createHash('sha256').update(hashFixture.stableJson).digest('hex'), hashFixture.sha256)

const sourceFingerprint = () => hashOasisSourceFingerprint({ records: source.buildings, media: manifest.entries })
const assertSourceFingerprintChanges = (name, mutate) => {
  const records = structuredClone(source.buildings)
  const media = structuredClone(manifest.entries)
  mutate(records, media)
  assert.notEqual(hashOasisSourceFingerprint({ records, media }), sourceFingerprint(), `${name} must affect the source fingerprint`)
}
assertSourceFingerprintChanges('catalogue name', (records) => { records[0].name = 'Changed name' })
assertSourceFingerprintChanges('catalogue level', (records) => { records[0].levels[0].level = 99 })
assertSourceFingerprintChanges('catalogue prosperity', (records) => { records[0].levels[1].prosperityRequired = 151 })
assertSourceFingerprintChanges('catalogue bonus', (records) => { records[0].levels[0].buffsUnlocked[0].valuePct = 31 })
assertSourceFingerprintChanges('catalogue effect', (records) => { records[0].levels[0].buffsUnlocked[0].effect = 'changed' })
assertSourceFingerprintChanges('catalogue verification', (records) => { records[0].verification.status = 'needs_ingame_verification' })
assertSourceFingerprintChanges('private media checksum', (_records, media) => { media[0].sourceChecksum = '0'.repeat(64) })
assert.equal(hashOasisSourceFingerprint({ records: [...source.buildings].reverse(), media: [...manifest.entries].reverse() }), sourceFingerprint())
const reverseObjectKeys = (value) => Array.isArray(value)
  ? value.map(reverseObjectKeys)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reverseObjectKeys(item)]))
    : value
const reorderedKeys = source.buildings.map(reverseObjectKeys)
assert.equal(hashOasisSourceFingerprint({ records: reorderedKeys, media: manifest.entries }), sourceFingerprint())
assert.equal(hashOasisRecordContent(built.records.map(reverseObjectKeys)), immutableSource.recordContentHash)

const searchRecords = buildOasisSearchRecords(built)
assert.equal(searchRecords.length, 55)
assert.equal(searchRecords.every((record) => record.dataset === 'oasis-island' && record.status === 'published'), true)
assert.equal(searchRecords.every((record) => record.canonical_url === `/oasis-island/buildings/${record.id}`), true)
assert.equal(searchRecords.every((record) => record.image?.endsWith('.webp')), true)
assert.equal(searchRecords.every((record) => record.published_at === built.publishedAt && record.source_updated_at === built.updatedAt), true)
assert.throws(() => buildOasisSearchRecords({ ...built, publishedAt: '2099-01-01T00:00:00.000Z' }), /database-authoritative/u)
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
  "dataset_id text not null default 'oasis-island'", 'allowed_trust_labels',
]) assert.match(migration, new RegExp(required.replace(/[()]/gu, '\\$&'), 'u'))
assert.doesNotMatch(migration, /delete from public\.oasis_publication_versions|update public\.oasis_publication_versions/iu)
for (const requiredBoundary of [
  "jsonb_typeof(p_manifest) <> 'object'",
  "p_manifest->>'schemaVersion' <> 'oasis-media-manifest-v2'",
  "p_manifest->>'sourceFingerprintVersion' <> 'oasis-source-fingerprint-v2'",
  "p_manifest->>'sourceFingerprint' <> p_source_fingerprint",
  "jsonb_array_length(p_manifest->'entries') <> 111",
  "count(distinct entry->>'privateSourceFilename')",
  "count(distinct entry->>'publicDerivativePath')",
  "coalesce(entry->>'sourceChecksum', '') !~ '^[0-9a-f]{64}$'",
  "coalesce(entry->>'derivativeChecksum', '') !~ '^[0-9a-f]{64}$'",
  "array_agg(value order by value)",
  "Oasis placeholder metadata is incomplete or invalid.",
  "jsonb_array_length(p_records) <> 55",
  "count(distinct r->>'id')",
  'not (r ?& allowed_record_keys)',
  'public.oasis_json_has_forbidden_key(r)',
  "r->>'canonicalRoute' <> '/oasis-island/buildings/' || r->>'id'",
  "r->>'publicationId' <> p_publication_id",
  'Oasis public media does not match the approved manifest.',
  'Oasis public media contains missing, extra or duplicate mappings.',
  'public.oasis_manifest_sha256(p_manifest) <> p_manifest_hash',
  'pg_catalog.sha256',
  hashFixture.stableJson,
  hashFixture.sha256,
  'Rollback candidate does not match the referenced immutable publication.',
  "public_record - array['publicationId', 'publicationVersion', 'publishedAt', 'updatedAt']",
  "rollback_source.dataset_id <> 'oasis-island'",
  'existing.rollback_of_publication_id is distinct from p_rollback_of_publication_id',
  "p_records\n      from public.oasis_publication_records",
  "'rollbackSourceManifestHash'",
  "'rollbackSourceFingerprint'",
  "'rollbackSourceRecordContentHash'",
  'record_content_hash text not null',
  'public.oasis_record_content_sha256(p_records)',
  'existing.record_content_hash <> submitted_content_hash',
  "'recordContentHash', submitted_content_hash",
  "'publishedAt', publication_timestamp_text, 'updatedAt', publication_timestamp_text",
  "values (p_publication_id, 'pending', publication_timestamp, publication_timestamp)",
  'p_manifest#>>\'{placeholder,altText}\'',
  "jsonb_typeof(media->'levelVariant') = 'null'",
]) assert.ok(migration.includes(requiredBoundary), `Missing SQL publication guard: ${requiredBoundary}`)

const adversarialSqlCases = new Map([
  ['empty manifest entries with declared count 111', ["jsonb_array_length(p_manifest->'entries') <> 111"]],
  ['duplicate derivative paths', ["count(distinct entry->>'publicDerivativePath')"]],
  ['duplicate private identities', ["count(distinct entry->>'privateSourceFilename')"]],
  ['incorrect manifest hash', ['public.oasis_manifest_sha256(p_manifest) <> p_manifest_hash']],
  ['mismatched source fingerprint', ["p_manifest->>'sourceFingerprint' <> p_source_fingerprint"]],
  ['wrong placeholder list', ['expected_missing_ids', 'array_agg(value order by value)']],
  ['forbidden nested sourceText', ["'sourceText'", 'public.oasis_json_has_forbidden_key(r)']],
  ['forbidden nested verification', ["'verification'", 'public.oasis_json_has_forbidden_key(r)']],
  ['extra top-level record fields', ['jsonb_object_keys(r)', 'allowed_record_keys']],
  ['invalid canonical route', ["r->>'canonicalRoute' <> '/oasis-island/buildings/' || r->>'id'"]],
  ['record/media mismatch', ['Oasis public media does not match the approved manifest.']],
  ['placeholder exact metadata', ["media->>'alt' = p_manifest#>>'{placeholder,altText}'", "jsonb_typeof(media->'levelVariant') = 'null'", "media->'width' = p_manifest#>'{placeholder,width}'", "media->'height' = p_manifest#>'{placeholder,height}'"]],
  ['extra or duplicate media', ['Oasis public media contains missing, extra or duplicate mappings.']],
  ['publication identity mismatch', ['Oasis record publication identity conflicts with the publication being created.']],
])
for (const [name, guards] of adversarialSqlCases) {
  for (const guard of guards) assert.ok(migration.includes(guard), `${name}: missing structural SQL rejection guard ${guard}`)
}
const pointerMutationIndex = migration.indexOf('insert into public.oasis_publication_current')
for (const [name, guards] of adversarialSqlCases) {
  for (const guard of guards) assert.ok(migration.indexOf(guard) < pointerMutationIndex, `${name}: SQL rejection guard must precede current-pointer mutation`)
}
assert.ok(pointerMutationIndex > migration.indexOf('Oasis record publication identity conflicts with the publication being created.'))
assert.ok(pointerMutationIndex > migration.indexOf('Oasis public media does not match the approved manifest.'))
assert.ok(pointerMutationIndex > migration.indexOf('Rollback candidate does not match the referenced immutable publication.'))
assert.ok(migration.indexOf('select * into rollback_source') < migration.indexOf('Rollback candidate does not match the referenced immutable publication.'))
assert.ok(migration.indexOf('Rollback candidate does not match the referenced immutable publication.') < migration.indexOf('insert into public.oasis_publication_versions'))
assert.ok(migration.indexOf('existing.record_content_hash <> submitted_content_hash') < migration.indexOf('insert into public.oasis_publication_versions'))
assert.ok(migration.indexOf('Oasis public media contains missing, extra or duplicate mappings.') < migration.indexOf('insert into public.oasis_publication_versions'))
assert.ok(migration.includes("publication_timestamp timestamptz := date_trunc('milliseconds', statement_timestamp())"))
const recordHistoryInsertIndex = migration.indexOf('insert into public.oasis_publication_records')
const authoritativeRecordTimestampIndex = migration.indexOf("'publishedAt', publication_timestamp_text, 'updatedAt', publication_timestamp_text", recordHistoryInsertIndex)
assert.ok(recordHistoryInsertIndex < authoritativeRecordTimestampIndex && authoritativeRecordTimestampIndex < migration.indexOf('insert into public.oasis_publication_search_refreshes'))

const productionBuild = mkdtempSync(join(tmpdir(), 'oasis-production-build-'))
try {
  execFileSync(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', productionBuild, '--emptyOutDir'], { cwd: root, stdio: 'pipe' })
  const files = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)])
  const emitted = files(productionBuild)
  const emittedHashes = new Set(emitted.map((path) => createHash('sha256').update(readFileSync(path)).digest('hex')))
  const privateMediaHashes = [
    ...manifest.entries.map((entry) => entry.derivativeChecksum),
    manifest.placeholder.derivativeChecksum,
  ]
  assert.equal(privateMediaHashes.some((hash) => emittedHashes.has(hash)), false)
  const textOutput = emitted.filter((path) => ['.html', '.js', '.css', '.json'].includes(extname(path))).map((path) => readFileSync(path, 'utf8')).join('\n')
  assert.doesNotMatch(textOutput, /development-fixture-oasis-001a-pub-phase-1|oasis-acceptance|oasis-publication\.fixture/u)
  assert.equal(emitted.some((path) => basename(path) === 'oasis-acceptance.html'), false)
  const scenicDraft = resolve(root, 'src/assets/island-route/island-background-draft.png')
  if (existsSync(scenicDraft)) assert.equal(emittedHashes.has(createHash('sha256').update(readFileSync(scenicDraft)).digest('hex')), false)
  assert.equal(emittedHashes.has(retiredIslandRoutePngSha256), false)
} finally {
  rmSync(productionBuild, { recursive: true, force: true })
}

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
  record_content_hash: built.recordContentHash,
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
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: { ...publicationRow, manifest: { ...manifest, schemaVersion: 'oasis-media-manifest-v1' } }, error: null },
])), /manifest is invalid/u)
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: { ...publicationRow, record_content_hash: '0'.repeat(64) }, error: null },
  { data: built.records.map((record) => ({ record_id: record.id, public_record: record })), error: null },
])), /record-content verification failed/u)
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: publicationRow, error: null },
  { data: built.records.map((record, index) => ({ record_id: record.id, public_record: index ? record : { ...record, publishedAt: '2099-01-01T00:00:00.000Z' } })), error: null },
])), /timestamp mismatch/u)
const loaded = await loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: publicationRow, error: null },
  { data: built.records.map((record) => ({ record_id: record.id, public_record: record })), error: null },
]))
assert.deepEqual(loaded, built)

console.log(`OASIS-001A-PUB Phase 1 passed: 55 records, 430 levels, 111 private-to-planned-public media mappings, six placeholders, private acceptance assets, clean production build, fail-closed loader and inactive Search adapter verified. SQL adversarial guards were structurally verified; no disposable PostgreSQL runtime was used by this test.`)
