import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

import { loadPublishedOasisIslandDataset } from '../server/data-engine/loadPublishedOasisIslandDataset.ts'
import {
  assertOasisRollbackCandidateMatchesSnapshot,
  assertOasisPublicationCandidateRecord,
  assertOasisPublicRecord,
  assertOasisPublicationPayload,
  assertOasisStagedSourceRecords,
  buildOasisPublicDataset,
  buildOasisPublicationCandidateRecords,
  deriveOasisRollbackRecords,
  hashOasisManifest,
  hashOasisRecordContent,
  hashOasisSourceFingerprint,
  canonicalOasisNumber,
  OASIS_CANONICAL_JSON_VERSION,
  OASIS_CANONICAL_NUMBER_DECIMAL_PLACES,
  OASIS_CANONICAL_NUMBER_MAX_ABS,
  OASIS_MEDIA_MANIFEST_SCHEMA_VERSION,
  OASIS_RECORD_CONTENT_HASH_VERSION,
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
const canonicalNumberFixture = JSON.parse(read('fixtures/oasis-001a-publication/oasis-canonical-number.fixture.json'))
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
const candidateRecords = buildOasisPublicationCandidateRecords({
  records: source.buildings,
  publicationId: built.publicationId,
  manifest,
})
assert.equal(candidateRecords.every((record) => record.publicationVersion === null && record.publishedAt === null && record.updatedAt === null), true)
for (const record of candidateRecords) assertOasisPublicationCandidateRecord(record)
assertOasisPublicationPayload({
  publicationId: built.publicationId,
  sourceFingerprint: manifest.sourceFingerprint,
  manifestHash: hashOasisManifest(manifest),
  manifest,
  records: candidateRecords,
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
  publicationVersion: null,
  publishedAt: null,
  updatedAt: null,
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
assert.equal(rollbackRecords.every((record) => record.publicationId === rollbackIdentity.publicationId && record.publicationVersion === null && record.publishedAt === null && record.updatedAt === null), true)
assert.equal(hashOasisRecordContent(rollbackRecords), immutableSource.recordContentHash)
assert.equal(hashOasisRecordContent([...built.records].reverse()), immutableSource.recordContentHash)
assert.equal(hashOasisRecordContent(built.records.map((record) => ({ ...record, publishedAt: '2099-01-01T00:00:00.000Z', updatedAt: '2000-01-01T00:00:00.000Z' }))), immutableSource.recordContentHash)
assert.equal(hashOasisRecordContent(built.records.map((record) => ({ ...record, publicationId: 'another-publication', publicationVersion: 999 }))), immutableSource.recordContentHash)
assert.equal(hashOasisRecordContent(candidateRecords), immutableSource.recordContentHash)
assert.throws(() => assertOasisPublicationCandidateRecord({ ...candidateRecords[0], publicationVersion: 2 }), /database-owned version and timestamps null/u)
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
  const candidateRecords = structuredClone(buildOasisPublicationCandidateRecords({ records: source.buildings, publicationId: built.publicationId, manifest }))
  const candidate = {
    publicationId: built.publicationId,
    sourceFingerprint: manifest.sourceFingerprint,
    manifestHash: hashOasisManifest(candidateManifest),
    manifest: candidateManifest,
    records: candidateRecords,
  }
  mutate(candidate)
  assert.throws(() => assertOasisPublicationPayload(candidate), expected, name)
}

assertAdversarialRejection('empty manifest entries with declared count 111', ({ manifest: value }) => { value.entries = [] }, /exactly 111 entries/u)
assertAdversarialRejection('duplicate derivative paths', ({ manifest: value }) => { value.entries[1].publicDerivativePath = value.entries[0].publicDerivativePath }, /derivative paths must be unique/u)
assertAdversarialRejection('duplicate private identities', ({ manifest: value }) => { value.entries[1].privateSourceFilename = value.entries[0].privateSourceFilename }, /private-source identities must be unique/u)
assertAdversarialRejection('incorrect manifest hash', (candidate) => { candidate.manifestHash = '0'.repeat(64) }, /manifest hash does not match/u)
assertAdversarialRejection('mismatched source fingerprint', (candidate) => { candidate.sourceFingerprint = '0'.repeat(64) }, /source fingerprint does not match/u)
assertAdversarialRejection('wrong placeholder list', ({ manifest: value }) => { value.missingArtworkRecordIds[0] = 'not-approved' }, /missing-artwork IDs are invalid/u)
assertAdversarialRejection('obsolete manifest contract', ({ manifest: value }) => { value.schemaVersion = 'oasis-media-manifest-v1' }, /v2 fingerprint contract/u)

const nonStringTextValues = [
  ['number', 7],
  ['boolean', true],
  ['object', { value: 'text' }],
  ['array', ['text']],
  ['null', null],
]
const inputTextCases = [
  ['input publicationId', (candidate) => candidate.publicationId, (candidate, replacement) => { candidate.publicationId = replacement }, /publication input text metadata/u],
  ['input sourceFingerprint', (candidate) => candidate.sourceFingerprint, (candidate, replacement) => { candidate.sourceFingerprint = replacement }, /source fingerprint does not match/u],
  ['input manifestHash', (candidate) => candidate.manifestHash, (candidate, replacement) => { candidate.manifestHash = replacement }, /manifest hash does not match/u],
]
for (const [field, readValue, mutate, expected] of inputTextCases) {
  for (const [kind, replacement] of nonStringTextValues) {
    assertAdversarialRejection(`${field} rejects JSON ${kind}`, (candidate) => {
      mutate(candidate, structuredClone(replacement))
    }, expected)
  }
  assertAdversarialRejection(`${field} rejects coercion-equivalent array`, (candidate) => {
    mutate(candidate, [readValue(candidate)])
  }, expected)
}
const manifestTextCases = [
  ['top-level schemaVersion', (value) => value.schemaVersion, (value, replacement) => { value.schemaVersion = replacement }, /v2 fingerprint contract/u],
  ['top-level sourceFingerprintVersion', (value) => value.sourceFingerprintVersion, (value, replacement) => { value.sourceFingerprintVersion = replacement }, /v2 fingerprint contract/u],
  ['top-level sourceFingerprint', (value) => value.sourceFingerprint, (value, replacement) => { value.sourceFingerprint = replacement }, /source fingerprint does not match/u],
  ['entry recordId', (value) => value.entries[0].recordId, (value, replacement) => { value.entries[0].recordId = replacement }, /entry metadata/u],
  ['entry privateSourceFilename', (value) => value.entries[0].privateSourceFilename, (value, replacement) => { value.entries[0].privateSourceFilename = replacement }, /entry metadata/u],
  ['entry sourceChecksum', (value) => value.entries[0].sourceChecksum, (value, replacement) => { value.entries[0].sourceChecksum = replacement }, /entry metadata/u],
  ['entry publicDerivativePath', (value) => value.entries[0].publicDerivativePath, (value, replacement) => { value.entries[0].publicDerivativePath = replacement }, /entry metadata/u],
  ['entry privateDerivativePath', (value) => value.entries[0].privateDerivativePath, (value, replacement) => { value.entries[0].privateDerivativePath = replacement }, /entry metadata/u],
  ['entry derivativeChecksum', (value) => value.entries[0].derivativeChecksum, (value, replacement) => { value.entries[0].derivativeChecksum = replacement }, /entry metadata/u],
  ['entry mediaRole', (value) => value.entries[0].mediaRole, (value, replacement) => { value.entries[0].mediaRole = replacement }, /entry metadata/u],
  ['entry altText', (value) => value.entries[0].altText, (value, replacement) => { value.entries[0].altText = replacement }, /entry metadata/u],
  ['placeholder publicDerivativePath', (value) => value.placeholder.publicDerivativePath, (value, replacement) => { value.placeholder.publicDerivativePath = replacement }, /placeholder metadata/u],
  ['placeholder privateDerivativePath', (value) => value.placeholder.privateDerivativePath, (value, replacement) => { value.placeholder.privateDerivativePath = replacement }, /placeholder metadata/u],
  ['placeholder derivativeChecksum', (value) => value.placeholder.derivativeChecksum, (value, replacement) => { value.placeholder.derivativeChecksum = replacement }, /placeholder metadata/u],
  ['placeholder altText', (value) => value.placeholder.altText, (value, replacement) => { value.placeholder.altText = replacement }, /placeholder metadata/u],
  ['missingArtworkRecordIds member', (value) => value.missingArtworkRecordIds[0], (value, replacement) => { value.missingArtworkRecordIds[0] = replacement }, /missing-artwork IDs are invalid/u],
]
for (const [field, readValue, mutate, expected] of manifestTextCases) {
  for (const [kind, replacement] of nonStringTextValues) {
    assertAdversarialRejection(`${field} rejects JSON ${kind}`, ({ manifest: value }) => mutate(value, structuredClone(replacement)), expected)
  }
  assertAdversarialRejection(`${field} rejects coercion-equivalent array`, ({ manifest: value }) => {
    mutate(value, [readValue(value)])
  }, expected)
}
assertAdversarialRejection('sourceFingerprint rejects shared-reference coercion-equivalent array', (candidate) => {
  const shared = [candidate.sourceFingerprint]
  candidate.manifest.sourceFingerprint = shared
  candidate.sourceFingerprint = shared
}, /source fingerprint does not match/u)
assertAdversarialRejection('entry privateSourceFilename rejects shared-reference array before uniqueness', ({ manifest: value }) => {
  const shared = [value.entries[0].privateSourceFilename]
  value.entries[0].privateSourceFilename = shared
  value.entries[1].privateSourceFilename = shared
}, /entry metadata/u)
assertAdversarialRejection('input manifestHash rejects before regex coercion', (candidate) => {
  candidate.manifestHash = { [Symbol.toPrimitive]: () => { throw new Error('manifest hash coercion reached') } }
}, /manifest hash does not match/u)

assertAdversarialRejection('forbidden nested sourceText', ({ records }) => { records[0].levels[0].sourceText = 'private' }, /forbidden field: sourceText/u)
assertAdversarialRejection('forbidden nested verification', ({ records }) => { records[0].media[0].verification = { status: 'private' } }, /forbidden field: verification/u)
assertAdversarialRejection('extra top-level record fields', ({ records }) => { records[0].unexpected = true }, /non-allow-listed fields/u)
assertAdversarialRejection('invalid canonical route', ({ records }) => { records[0].canonicalRoute = '/wrong' }, /invalid canonical route/u)
assertAdversarialRejection('record/media mismatch', ({ records }) => { records[0].media[0].url = '/media/oasis-island/wrong/catalogue.webp' }, /public media does not match/u)
const placeholderRecordIndex = built.records.findIndex((record) => record.id === 'fountain-of-life')
const mappedRecordIndex = built.records.findIndex((record) => record.media.some((media) => media.role !== 'placeholder'))
assertAdversarialRejection('placeholder wrong alt', ({ records }) => { records[placeholderRecordIndex].media[0].alt = 'Artwork missing' }, /public media does not match/u)
assertAdversarialRejection('placeholder wrong role', ({ records }) => { records[placeholderRecordIndex].media[0].role = 'catalogue' }, /public media does not match/u)
assertAdversarialRejection('placeholder wrong level variant', ({ records }) => { records[placeholderRecordIndex].media[0].levelVariant = 1 }, /levelVariant|public media does not match/u)
assertAdversarialRejection('placeholder wrong width', ({ records }) => { records[placeholderRecordIndex].media[0].width += 1 }, /public media does not match/u)
assertAdversarialRejection('placeholder wrong height', ({ records }) => { records[placeholderRecordIndex].media[0].height += 1 }, /public media does not match/u)
assertAdversarialRejection('missing record arbitrary placeholder', ({ records }) => { records[placeholderRecordIndex].media[0].url = '/media/oasis-island/shared/arbitrary.webp' }, /planned Oasis WebP boundary|public media does not match/u)
assertAdversarialRejection('nonmissing record placeholder', ({ records }) => { records[mappedRecordIndex].media = [structuredClone(built.records[placeholderRecordIndex].media[0])] }, /public media does not match/u)
assertAdversarialRejection('duplicate media mapping', ({ records }) => { records[mappedRecordIndex].media.push(structuredClone(records[mappedRecordIndex].media[0])) }, /public media does not match/u)
assertAdversarialRejection('extra media mapping', ({ records }) => { records[mappedRecordIndex].media.push({ ...structuredClone(records[mappedRecordIndex].media[0]), alt: 'Extra' }) }, /public media does not match/u)
assertAdversarialRejection('publication identity mismatch', ({ records }) => { records[0].publicationId = 'different-publication' }, /publication identity conflicts/u)

const byteMutationCases = [
  ['missing', (target, field) => { delete target[field] }],
  ['JSON null', (target, field) => { target[field] = null }],
  ['wrong type', (target, field) => { target[field] = '100' }],
  ['zero', (target, field) => { target[field] = 0 }],
  ['negative', (target, field) => { target[field] = -1 }],
  ['fractional', (target, field) => { target[field] = 1.5 }],
]
for (const field of ['sourceAssetBytes', 'derivativeAssetBytes']) {
  for (const [condition, mutate] of byteMutationCases) {
    assertAdversarialRejection(`top-level ${field} ${condition}`, ({ manifest: value }) => mutate(value, field), /positive integer|byte totals/u)
  }
  assertAdversarialRejection(`top-level ${field} inconsistent total`, ({ manifest: value }) => { value[field] += 1 }, /byte totals do not match/u)
}
for (const field of ['sourceBytes', 'derivativeBytes']) {
  for (const [condition, mutate] of byteMutationCases) {
    assertAdversarialRejection(`entry ${field} ${condition}`, ({ manifest: value }) => mutate(value.entries[0], field), /entry metadata/u)
  }
  assertAdversarialRejection(`entry ${field} inconsistent aggregate`, ({ manifest: value }) => { value.entries[0][field] += 1 }, /byte totals do not match/u)
}
for (const [condition, mutate] of byteMutationCases) {
  assertAdversarialRejection(`placeholder derivativeBytes ${condition}`, ({ manifest: value }) => mutate(value.placeholder, 'derivativeBytes'), /placeholder metadata/u)
}

const levelRecordIndex = built.records.findIndex((record) => record.levels.some((item) => item.bonuses.length > 0))
const footprintRecordIndex = built.records.findIndex((record) => record.footprint !== null)
const unlockRecordIndex = built.records.findIndex((record) => record.unlock !== null)
const upgradeRecordIndex = built.records.findIndex((record) => record.upgrade !== null)
const maxEffectsRecordIndex = built.records.findIndex((record) => record.maxEffects.length > 0)
assert.ok([levelRecordIndex, footprintRecordIndex, unlockRecordIndex, upgradeRecordIndex, maxEffectsRecordIndex].every((index) => index >= 0))

const nestedContractCases = [
  ['levels containing null', (records) => { records[levelRecordIndex].levels = [null] }, /levels\[0\].*non-null object/u],
  ['level as string', (records) => { records[levelRecordIndex].levels = ['invalid'] }, /levels\[0\].*non-null object/u],
  ['level as number', (records) => { records[levelRecordIndex].levels = [42] }, /levels\[0\].*non-null object/u],
  ['level as array', (records) => { records[levelRecordIndex].levels = [[]] }, /levels\[0\].*non-null object/u],
  ['level missing bonuses', (records) => { delete records[levelRecordIndex].levels[0].bonuses }, /missing required fields: bonuses/u],
  ['bonuses set to null', (records) => { records[levelRecordIndex].levels[0].bonuses = null }, /bonuses must be an array/u],
  ['bonuses containing null', (records) => { records[levelRecordIndex].levels[0].bonuses = [null] }, /bonuses\[0\].*non-null object/u],
  ['malformed bonus field types', (records) => { records[levelRecordIndex].levels[0].bonuses[0].valuePct = '30' }, /valuePct must be a finite number or null/u],
  ['missing bonus keys', (records) => { delete records[levelRecordIndex].levels[0].bonuses[0].effect }, /missing required fields: effect/u],
  ['extra bonus keys', (records) => { records[levelRecordIndex].levels[0].bonuses[0].privateNote = 'no' }, /unexpected fields: privateNote/u],
  ['knownEffects set to null', (records) => { records[levelRecordIndex].levels[0].knownEffects = null }, /knownEffects must be an array/u],
  ['non-string known effect', (records) => { records[levelRecordIndex].levels[0].knownEffects = [7] }, /knownEffects\[0\].*trimmed string/u],
  ['malformed alias member', (records) => { records[0].aliases = [null] }, /aliases\[0\].*trimmed string/u],
  ['duplicate alias member', (records) => { records[0].aliases = ['Alias', 'Alias'] }, /aliases must be unique/u],
  ['malformed footprint', (records) => { records[footprintRecordIndex].footprint = [] }, /footprint must be an object or null/u],
  ['footprint missing field', (records) => { delete records[footprintRecordIndex].footprint.display }, /missing required fields: display/u],
  ['footprint extra field', (records) => { records[footprintRecordIndex].footprint.depth = 1 }, /unexpected fields: depth/u],
  ['malformed unlock', (records) => { records[unlockRecordIndex].unlock = 'invalid' }, /unlock must be an object or null/u],
  ['unlock missing field', (records) => { delete records[unlockRecordIndex].unlock.requirement }, /missing required fields: requirement/u],
  ['unlock extra field', (records) => { records[unlockRecordIndex].unlock.privateNote = 'no' }, /unexpected fields: privateNote/u],
  ['malformed upgrade', (records) => { records[upgradeRecordIndex].upgrade = 7 }, /upgrade must be an object or null/u],
  ['upgrade missing field', (records) => { delete records[upgradeRecordIndex].upgrade.currency }, /missing required fields: currency/u],
  ['upgrade extra field', (records) => { records[upgradeRecordIndex].upgrade.privateNote = 'no' }, /unexpected fields: privateNote/u],
  ['malformed maxEffects collection', (records) => { records[maxEffectsRecordIndex].maxEffects = null }, /maxEffects must be an array/u],
  ['malformed maxEffects member', (records) => { records[maxEffectsRecordIndex].maxEffects = [null] }, /maxEffects\[0\].*non-null object/u],
  ['incorrect nullable string type', (records) => { records[0].rarity = 7 }, /rarity must be a non-empty trimmed string/u],
  ['incorrect nullable numeric type', (records) => { records[0].maxProsperity = '1000' }, /maxProsperity must be a finite number or null/u],
  ['missing nested required level key', (records) => { delete records[levelRecordIndex].levels[0].exactOutputKnown }, /missing required fields: exactOutputKnown/u],
  ['unexpected nested level key', (records) => { records[levelRecordIndex].levels[0].privateNote = 'no' }, /unexpected fields: privateNote/u],
]

for (const [name, mutate, expected] of nestedContractCases) {
  const records = structuredClone(built.records)
  mutate(records)
  assert.throws(() => records.forEach((record) => assertOasisPublicRecord(record)), expected, `${name}: shared record validator`)
  assertAdversarialRejection(name, ({ records: candidateRecords }) => mutate(candidateRecords), expected)
}

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
assert.equal(canonicalNumberFixture.canonicalJsonVersion, OASIS_CANONICAL_JSON_VERSION)
assert.equal(canonicalNumberFixture.recordContentHashVersion, OASIS_RECORD_CONTENT_HASH_VERSION)
assert.equal(canonicalNumberFixture.maximumAbsoluteValue, OASIS_CANONICAL_NUMBER_MAX_ABS)
assert.equal(canonicalNumberFixture.decimalPlaces, OASIS_CANONICAL_NUMBER_DECIMAL_PLACES)
for (const vector of canonicalNumberFixture.accepted) {
  assert.equal(canonicalOasisNumber(vector.input), vector.canonical, vector.name)
  assert.doesNotMatch(vector.canonical, /[eE]/u, `${vector.name} must not use exponent notation`)
}
for (const vector of canonicalNumberFixture.rejected) {
  assert.throws(() => canonicalOasisNumber(vector.input), /exceed|magnitude|decimal places/u, vector.name)
}
assert.throws(() => canonicalOasisNumber(Number.NaN), /finite/u, 'NaN rejection')
assert.throws(() => canonicalOasisNumber(Number.POSITIVE_INFINITY), /finite/u, 'positive infinity rejection')
assert.throws(() => canonicalOasisNumber(Number.NEGATIVE_INFINITY), /finite/u, 'negative infinity rejection')
assert.equal(stableOasisJson(canonicalNumberFixture.nestedInput), canonicalNumberFixture.nestedStableJson)
assert.equal(hashOasisRecordContent(canonicalNumberFixture.recordHashRecords), canonicalNumberFixture.recordContentSha256)
const canonicalRecordPayload = canonicalNumberFixture.recordHashRecords
  .map(({ publicationId: _publicationId, publicationVersion: _publicationVersion, publishedAt: _publishedAt, updatedAt: _updatedAt, ...record }) => record)
  .sort((left, right) => left.id.localeCompare(right.id))
assert.equal(stableOasisJson(canonicalRecordPayload), canonicalNumberFixture.recordHashCanonicalJson)

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

const stagedLevelRecordIndex = source.buildings.findIndex((record) => record.levels.some((item) => Array.isArray(item.buffs) && item.buffs.length > 0))
const stagedKnownEffectsRecordIndex = source.buildings.findIndex((record) => record.levels.some((item) => Array.isArray(item.knownEffects) && item.knownEffects.length > 0))
const stagedFootprintRecordIndex = source.buildings.findIndex((record) => record.footprint)
const stagedUnlockRecordIndex = source.buildings.findIndex((record) => record.unlock)
const stagedUpgradeRecordIndex = source.buildings.findIndex((record) => record.upgradeMechanic)
assert.ok([stagedLevelRecordIndex, stagedKnownEffectsRecordIndex, stagedFootprintRecordIndex, stagedUnlockRecordIndex, stagedUpgradeRecordIndex].every((index) => index >= 0))

function assertStagedSourceRejection(name, mutate, expected) {
  const records = structuredClone(source.buildings)
  mutate(records)
  assert.throws(() => assertOasisStagedSourceRecords(records), expected, `${name}: staged validator`)
  assert.throws(() => hashOasisSourceFingerprint({ records, media: manifest.entries }), expected, `${name}: source fingerprint`)
  assert.throws(() => buildOasisPublicDataset({ records, manifest, publication: {
    publicationId: built.publicationId,
    publicationVersion: built.publicationVersion,
    publishedAt: built.publishedAt,
    updatedAt: built.updatedAt,
  } }), expected, `${name}: projection`)
}

assertStagedSourceRejection('staged levels containing null', (records) => { records[stagedLevelRecordIndex].levels = [null] }, /levels\[0\].*non-null object/u)
assertStagedSourceRejection('staged levels non-array', (records) => { records[stagedLevelRecordIndex].levels = {} }, /levels must be an array/u)
assertStagedSourceRejection('staged malformed level object', (records) => { records[stagedLevelRecordIndex].levels[0] = {} }, /levels\[0\].level is required/u)
assertStagedSourceRejection('staged buffs null', (records) => { records[stagedLevelRecordIndex].levels[0].buffs = null }, /buffs must be an array/u)
assertStagedSourceRejection('staged buffs scalar', (records) => { records[stagedLevelRecordIndex].levels[0].buffs = 'invalid' }, /buffs must be an array/u)
assertStagedSourceRejection('staged buffs mixed members', (records) => { records[stagedLevelRecordIndex].levels[0].buffs.push(null) }, /buffs\[[0-9]+\].*non-null object/u)
assertStagedSourceRejection('staged buffsUnlocked null', (records) => { records[stagedLevelRecordIndex].levels[0].buffsUnlocked = null }, /buffsUnlocked must be an array/u)
assertStagedSourceRejection('staged buffsUnlocked mixed members', (records) => { records[stagedLevelRecordIndex].levels[0].buffsUnlocked = [{ stat: 'valid', valuePct: 1 }, 7] }, /buffsUnlocked\[1\].*non-null object/u)
assertStagedSourceRejection('staged malformed bonus', (records) => { records[stagedLevelRecordIndex].levels[0].buffs[0] = { label: 'missing fields' } }, /\.stat is required/u)
assertStagedSourceRejection('staged numeric string bonus', (records) => { records[stagedLevelRecordIndex].levels[0].buffs[0].valuePct = '30' }, /valuePct must be a finite number/u)
assertStagedSourceRejection('staged malformed aliases', (records) => { records[0].aliases = ['valid', null] }, /aliases\[1\].*trimmed string/u)
assertStagedSourceRejection('staged malformed known effects', (records) => { records[stagedKnownEffectsRecordIndex].levels.find((item) => item.knownEffects).knownEffects.push(7) }, /knownEffects\[[0-9]+\].*trimmed string/u)
assertStagedSourceRejection('staged malformed footprint', (records) => { records[stagedFootprintRecordIndex].footprint.width = '2' }, /footprint.width must be a positive integer/u)
assertStagedSourceRejection('staged malformed unlock', (records) => { records[stagedUnlockRecordIndex].unlock.requirement = ' padded ' }, /unlock.requirement.*trimmed string/u)
assertStagedSourceRejection('staged malformed upgrade', (records) => { records[stagedUpgradeRecordIndex].upgradeMechanic.currency = [] }, /upgradeMechanic.currency.*trimmed string/u)
assertStagedSourceRejection('staged invalid verification status', (records) => { records[0].verification.status = 'invented' }, /verification.status is unsupported/u)
assertStagedSourceRejection('staged non-finite number', (records) => { records[0].maxProsperity = Number.POSITIVE_INFINITY }, /finite number/u)
assertStagedSourceRejection('staged excessive-precision number', (records) => { records[0].maxProsperity = 0.00000001 }, /decimal places/u)
assertStagedSourceRejection('staged out-of-range number', (records) => { records[0].maxProsperity = 100000001 }, /must not exceed/u)
assertStagedSourceRejection('staged missing required consumed field', (records) => { delete records[0].name }, /\.name is required/u)
const validOptionalSource = structuredClone(source.buildings)
delete validOptionalSource[0].availabilityCategory
delete validOptionalSource[0].function
delete validOptionalSource[0].maxEffects
validOptionalSource[0].maxProsperity = null
validOptionalSource[0].levels[0].exactOutputKnown = null
assert.doesNotThrow(() => assertOasisStagedSourceRecords(validOptionalSource), 'valid optional and null staged values')
assert.equal(buildOasisPublicDataset({ records: validOptionalSource, manifest, publication: {
  publicationId: built.publicationId,
  publicationVersion: built.publicationVersion,
  publishedAt: built.publishedAt,
  updatedAt: built.updatedAt,
} }).records.length, 55)
assert.match(read('scripts/generate-oasis-publication-media.mjs'), /assertOasisStagedSourceRecords\(source\.buildings\)/u)

const searchRecords = buildOasisSearchRecords(built)
assert.equal(searchRecords.length, 55)
assert.equal(searchRecords.every((record) => record.dataset === 'oasis-island' && record.status === 'published'), true)
assert.equal(searchRecords.every((record) => record.canonical_url === `/oasis-island/buildings/${record.id}`), true)
assert.equal(searchRecords.every((record) => record.image?.endsWith('.webp')), true)
assert.equal(searchRecords.every((record) => record.published_at === built.publishedAt && record.source_updated_at === built.updatedAt), true)
assert.throws(() => buildOasisSearchRecords({ ...built, publishedAt: '2099-01-01T00:00:00.000Z' }), /database-authoritative/u)
assert.throws(() => buildOasisSearchRecords({ ...built, status: 'source-staged' }), /current published/u)
assert.throws(() => buildOasisSearchRecords({ ...built, recordCount: 1, records: [{ ...built.records[0], sourceText: 'private' }] }), /non-allow-listed|forbidden/u)
assert.throws(() => buildOasisSearchRecords({ ...built, records: built.records.map((record, index) => index ? record : { ...record, levels: [null] }) }), /levels\[0\].*non-null object/u)
function assertSearchIntegrityRejection(name, mutate, expected = /record-content integrity/u) {
  const dataset = structuredClone(built)
  mutate(dataset.records)
  let output
  assert.throws(() => { output = buildOasisSearchRecords(dataset) }, expected, name)
  assert.equal(output, undefined, `${name}: no Search output may be returned`)
}
assertSearchIntegrityRejection('Search rejects valid-shaped top-level mutation', (records) => { records[0].name = 'Changed name' })
assertSearchIntegrityRejection('Search rejects valid-shaped nested level mutation', (records) => { records[0].levels[0].prosperity = (records[0].levels[0].prosperity ?? 0) + 1 })
assertSearchIntegrityRejection('Search rejects valid-shaped nested bonus mutation', (records) => { records[levelRecordIndex].levels[0].bonuses[0].label = 'Changed bonus' })
assertSearchIntegrityRejection('Search rejects media mutation', (records) => { records[mappedRecordIndex].media[0].alt = 'Changed artwork alt' })
assertSearchIntegrityRejection('Search rejects route mutation', (records) => { records[0].id = 'changed-id'; records[0].canonicalRoute = '/oasis-island/buildings/changed-id' })
assertSearchIntegrityRejection('Search rejects trust-label mutation', (records) => { records[0].trustLabel = records[0].trustLabel === 'Community corroborated' ? 'Partial source coverage' : 'Community corroborated' })
assertSearchIntegrityRejection('Search rejects alias mutation', (records) => { records[0].aliases.push('Changed alias') })
assert.equal(buildOasisSearchRecords({ ...built, records: [...built.records].reverse() }).length, 55)
assert.throws(() => buildOasisSearchRecords({ ...built, recordContentHash: '0'.repeat(64) }), /record-content integrity/u)
assert.throws(() => buildOasisSearchRecords({ ...built, recordContentHash: 'malformed' }), /valid record-content hash/u)
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
  "jsonb_typeof(p_manifest) is distinct from 'object'",
  "jsonb_typeof(p_manifest->'schemaVersion') is distinct from 'string'",
  "jsonb_typeof(p_manifest->'sourceFingerprintVersion') is distinct from 'string'",
  "jsonb_typeof(p_manifest->'sourceFingerprint') is distinct from 'string'",
  "p_manifest->>'schemaVersion' is distinct from 'oasis-media-manifest-v2'",
  "p_manifest->>'sourceFingerprintVersion' is distinct from 'oasis-source-fingerprint-v2'",
  "p_manifest->>'sourceFingerprint' is distinct from p_source_fingerprint",
  "jsonb_array_length(p_manifest->'entries') <> 111",
  "jsonb_typeof(entry->'recordId') is distinct from 'string'",
  "jsonb_typeof(entry->'privateSourceFilename') is distinct from 'string'",
  "jsonb_typeof(entry->'sourceChecksum') is distinct from 'string'",
  "jsonb_typeof(entry->'publicDerivativePath') is distinct from 'string'",
  "jsonb_typeof(entry->'privateDerivativePath') is distinct from 'string'",
  "jsonb_typeof(entry->'derivativeChecksum') is distinct from 'string'",
  "jsonb_typeof(entry->'mediaRole') is distinct from 'string'",
  "jsonb_typeof(entry->'altText') is distinct from 'string'",
  "count(distinct entry->>'privateSourceFilename')",
  "count(distinct entry->>'publicDerivativePath')",
  "coalesce(entry->>'sourceChecksum', '') !~ '^[0-9a-f]{64}$'",
  "coalesce(entry->>'derivativeChecksum', '') !~ '^[0-9a-f]{64}$'",
  "array_agg(value order by value)",
  "jsonb_typeof(missing) is distinct from 'string'",
  "jsonb_typeof(p_manifest#>'{placeholder,publicDerivativePath}') is distinct from 'string'",
  "jsonb_typeof(p_manifest#>'{placeholder,privateDerivativePath}') is distinct from 'string'",
  "jsonb_typeof(p_manifest#>'{placeholder,derivativeChecksum}') is distinct from 'string'",
  "jsonb_typeof(p_manifest#>'{placeholder,altText}') is distinct from 'string'",
  "Oasis placeholder metadata is incomplete or invalid.",
  "jsonb_array_length(p_records) <> 55",
  "count(distinct r->>'id')",
  'not (r ?& allowed_record_keys)',
  'public.oasis_json_has_forbidden_key(r)',
  "r->>'canonicalRoute' <> '/oasis-island/buildings/' || r->>'id'",
  "r->>'publicationId' <> p_publication_id",
  "jsonb_typeof(r->'publicationVersion') <> 'null'",
  "jsonb_typeof(r->'publishedAt') <> 'null'",
  "jsonb_typeof(r->'updatedAt') <> 'null'",
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
  "'oasis-record-content-sha256-v2' || chr(10)",
  'public.oasis_canonical_number',
  'abs(p_value) > 100000000',
  "p_value::text in ('NaN', 'Infinity', '-Infinity')",
  'p_value <> trunc(p_value, 7)',
  'public.oasis_positive_integer_json_number',
  "not (p_manifest ? 'sourceAssetBytes')",
  "not (p_manifest ? 'derivativeAssetBytes')",
  "not (entry ? 'sourceBytes')",
  "not (entry ? 'derivativeBytes')",
  "not ((p_manifest->'placeholder') ? 'derivativeBytes')",
  'Oasis manifest byte totals do not match its entries.',
  'existing.record_content_hash <> submitted_content_hash',
  "'recordContentHash', submitted_content_hash",
  "'publishedAt', publication_timestamp_text, 'updatedAt', publication_timestamp_text",
  "values (p_publication_id, 'pending', publication_timestamp, publication_timestamp)",
  'p_manifest#>>\'{placeholder,altText}\'',
  "jsonb_typeof(media->'levelVariant') = 'null'",
]) assert.ok(migration.includes(requiredBoundary), `Missing SQL publication guard: ${requiredBoundary}`)

const topLevelManifestTypeGuard = migration.indexOf("jsonb_typeof(p_manifest->'schemaVersion') is distinct from 'string'")
const topLevelManifestTextExtraction = migration.indexOf("p_manifest->>'schemaVersion' is distinct from 'oasis-media-manifest-v2'")
const entryManifestTypeGuard = migration.indexOf("jsonb_typeof(entry->'privateSourceFilename') is distinct from 'string'")
const entryManifestUniqueness = migration.indexOf("count(distinct entry->>'privateSourceFilename')")
const missingArtworkTypeGuard = migration.indexOf("jsonb_typeof(missing) is distinct from 'string'")
const missingArtworkTextExtraction = migration.indexOf("jsonb_array_elements_text(p_manifest->'missingArtworkRecordIds')")
const placeholderTypeGuard = migration.indexOf("jsonb_typeof(p_manifest#>'{placeholder,publicDerivativePath}') is distinct from 'string'")
const placeholderTextExtraction = migration.indexOf("p_manifest#>>'{placeholder,publicDerivativePath}'")
assert.ok(topLevelManifestTypeGuard >= 0 && topLevelManifestTypeGuard < topLevelManifestTextExtraction)
assert.ok(entryManifestTypeGuard >= 0 && entryManifestTypeGuard < entryManifestUniqueness)
assert.ok(missingArtworkTypeGuard >= 0 && missingArtworkTypeGuard < missingArtworkTextExtraction)
assert.ok(placeholderTypeGuard >= 0 && placeholderTypeGuard < placeholderTextExtraction)

const adversarialSqlCases = new Map([
  ['empty manifest entries with declared count 111', ["jsonb_array_length(p_manifest->'entries') <> 111"]],
  ['duplicate derivative paths', ["count(distinct entry->>'publicDerivativePath')"]],
  ['duplicate private identities', ["count(distinct entry->>'privateSourceFilename')"]],
  ['incorrect manifest hash', ['public.oasis_manifest_sha256(p_manifest) <> p_manifest_hash']],
  ['mismatched source fingerprint', ["p_manifest->>'sourceFingerprint' is distinct from p_source_fingerprint"]],
  ['top-level sourceAssetBytes missing or null', ["not (p_manifest ? 'sourceAssetBytes')", "public.oasis_positive_integer_json_number(p_manifest->'sourceAssetBytes') is distinct from true"]],
  ['top-level derivativeAssetBytes missing or null', ["not (p_manifest ? 'derivativeAssetBytes')", "public.oasis_positive_integer_json_number(p_manifest->'derivativeAssetBytes') is distinct from true"]],
  ['entry sourceBytes missing or null', ["not (entry ? 'sourceBytes')", "public.oasis_positive_integer_json_number(entry->'sourceBytes') is distinct from true"]],
  ['entry derivativeBytes missing or null', ["not (entry ? 'derivativeBytes')", "public.oasis_positive_integer_json_number(entry->'derivativeBytes') is distinct from true"]],
  ['placeholder derivativeBytes missing or null', ["not ((p_manifest->'placeholder') ? 'derivativeBytes')", "public.oasis_positive_integer_json_number(p_manifest#>'{placeholder,derivativeBytes}') is distinct from true"]],
  ['byte values wrong zero negative or fractional', ['public.oasis_positive_integer_json_number', 'Oasis manifest entry metadata is incomplete or invalid.']],
  ['inconsistent byte totals', ["sum((entry->>'sourceBytes')::numeric)", "sum((entry->>'derivativeBytes')::numeric)", 'Oasis manifest byte totals do not match its entries.']],
  ['wrong placeholder list', ['expected_missing_ids', 'array_agg(value order by value)']],
  ['forbidden nested sourceText', ["'sourceText'", 'public.oasis_json_has_forbidden_key(r)']],
  ['forbidden nested verification', ["'verification'", 'public.oasis_json_has_forbidden_key(r)']],
  ['extra top-level record fields', ['jsonb_object_keys(case when jsonb_typeof(r)', 'allowed_record_keys']],
  ['invalid canonical route', ["r->>'canonicalRoute' <> '/oasis-island/buildings/' || r->>'id'"]],
  ['record/media mismatch', ['Oasis public media does not match the approved manifest.']],
  ['placeholder exact metadata', ["media->>'alt' = p_manifest#>>'{placeholder,altText}'", "jsonb_typeof(media->'levelVariant') = 'null'", "media->'width' = p_manifest#>'{placeholder,width}'", "media->'height' = p_manifest#>'{placeholder,height}'"]],
  ['extra or duplicate media', ['Oasis public media contains missing, extra or duplicate mappings.']],
  ['publication identity mismatch', ["r->>'publicationId' <> p_publication_id"]],
  ['candidate numeric publication version', ["jsonb_typeof(r->'publicationVersion') <> 'null'"]],
  ['candidate timestamp injection', ["jsonb_typeof(r->'publishedAt') <> 'null'", "jsonb_typeof(r->'updatedAt') <> 'null'"]],
  ['levels containing null', ['allowed_level_keys', 'Oasis levels are incomplete or invalid.']],
  ['level as string', ['allowed_level_keys', 'Oasis levels are incomplete or invalid.']],
  ['level as number', ['allowed_level_keys', 'Oasis levels are incomplete or invalid.']],
  ['level as array', ['allowed_level_keys', 'Oasis levels are incomplete or invalid.']],
  ['level missing bonuses', ['level_value ?& allowed_level_keys', 'Oasis levels are incomplete or invalid.']],
  ['bonuses set to null', ["jsonb_typeof(level_value->'bonuses') <> 'array'"]],
  ['bonuses containing null', ['allowed_bonus_keys', 'Oasis level bonuses are incomplete or invalid.']],
  ['malformed bonus field types', ["jsonb_typeof(bonus_value->'valuePct') not in ('number', 'null')"]],
  ['missing bonus keys', ['bonus_value ?& allowed_bonus_keys']],
  ['extra bonus keys', ['jsonb_object_keys(case when jsonb_typeof(bonus_value)']],
  ['knownEffects set to null', ["jsonb_typeof(level_value->'knownEffects') <> 'array'"]],
  ['non-string known effect', ['Oasis known effects must contain non-empty trimmed strings.']],
  ['malformed alias member', ['Oasis aliases must contain unique non-empty trimmed strings.']],
  ['duplicate alias member', ["count(distinct alias_value#>>'{}')"]],
  ['malformed footprint', ["jsonb_typeof(r->'footprint') not in ('object', 'null')"]],
  ['footprint missing field', ["r->'footprint' ?& allowed_footprint_keys"]],
  ['footprint extra field', ["jsonb_object_keys(r->'footprint')"]],
  ['malformed unlock', ["jsonb_typeof(r->'unlock') not in ('object', 'null')"]],
  ['unlock missing field', ["r->'unlock' ?& allowed_unlock_keys"]],
  ['unlock extra field', ["jsonb_object_keys(r->'unlock')"]],
  ['malformed upgrade', ["jsonb_typeof(r->'upgrade') not in ('object', 'null')"]],
  ['upgrade missing field', ["r->'upgrade' ?& allowed_upgrade_keys"]],
  ['upgrade extra field', ["jsonb_object_keys(r->'upgrade')"]],
  ['malformed maxEffects collection', ["jsonb_typeof(r->'maxEffects') <> 'array'"]],
  ['malformed maxEffects member', ['Oasis maximum effects are incomplete or invalid.']],
  ['incorrect nullable string type', ["jsonb_typeof(r->'rarity') not in ('string', 'null')"]],
  ['incorrect nullable numeric type', ["jsonb_typeof(r->'maxProsperity') not in ('number', 'null')"]],
  ['missing nested required level key', ['level_value ?& allowed_level_keys']],
  ['unexpected nested level key', ['jsonb_object_keys(case when jsonb_typeof(level_value)']],
])
for (const [name, guards] of adversarialSqlCases) {
  for (const guard of guards) assert.ok(migration.includes(guard), `${name}: missing structural SQL rejection guard ${guard}`)
}
const pointerMutationIndex = migration.indexOf('insert into public.oasis_publication_current')
for (const [name, guards] of adversarialSqlCases) {
  for (const guard of guards) assert.ok(migration.indexOf(guard) < pointerMutationIndex, `${name}: SQL rejection guard must precede current-pointer mutation`)
}
assert.ok(pointerMutationIndex > migration.indexOf("jsonb_typeof(r->'publicationVersion') <> 'null'"))
assert.ok(pointerMutationIndex > migration.indexOf('Oasis public media does not match the approved manifest.'))
assert.ok(pointerMutationIndex > migration.indexOf('Rollback candidate does not match the referenced immutable publication.'))
assert.ok(migration.indexOf('select * into rollback_source') < migration.indexOf('Rollback candidate does not match the referenced immutable publication.'))
assert.ok(migration.indexOf('Rollback candidate does not match the referenced immutable publication.') < migration.indexOf('insert into public.oasis_publication_versions'))
assert.ok(migration.indexOf('existing.record_content_hash <> submitted_content_hash') < migration.indexOf('insert into public.oasis_publication_versions'))
assert.ok(migration.indexOf('Oasis public media contains missing, extra or duplicate mappings.') < migration.indexOf('insert into public.oasis_publication_versions'))
assert.ok(migration.includes('publication_timestamp timestamptz;'))
assert.doesNotMatch(migration, /statement_timestamp\(\)|transaction_timestamp\(\)/u)
const publicationLockIndex = migration.indexOf("perform pg_advisory_xact_lock(hashtext('forge-oasis-publication'))")
const postLockClockIndex = migration.indexOf("publication_timestamp := date_trunc('milliseconds', clock_timestamp())")
assert.ok(publicationLockIndex > 0 && postLockClockIndex > publicationLockIndex)
assert.ok(migration.indexOf('submitted_content_hash := public.oasis_record_content_sha256(p_records)') < publicationLockIndex)
assert.ok(migration.indexOf('Oasis manifest byte totals do not match its entries.') < publicationLockIndex)
assert.equal(migration.match(/clock_timestamp\(\)/gu)?.length, 1)
assert.ok(migration.indexOf('select versions.published_at into current_publication_timestamp') > publicationLockIndex)
assert.ok(migration.indexOf("publication_timestamp := current_publication_timestamp + interval '1 millisecond'") > postLockClockIndex)
assert.ok(migration.indexOf('select * into existing') > postLockClockIndex)
assert.ok(migration.indexOf("return jsonb_build_object('publicationId', existing.publication_id", postLockClockIndex) > postLockClockIndex)
const recordHistoryInsertIndex = migration.indexOf('insert into public.oasis_publication_records')
const authoritativeRecordTimestampIndex = migration.indexOf("'publishedAt', publication_timestamp_text, 'updatedAt', publication_timestamp_text", recordHistoryInsertIndex)
assert.ok(recordHistoryInsertIndex < authoritativeRecordTimestampIndex && authoritativeRecordTimestampIndex < migration.indexOf('insert into public.oasis_publication_search_refreshes'))
for (const write of [
  'insert into public.oasis_publication_versions',
  'insert into public.oasis_publication_records',
  'insert into public.oasis_publication_search_refreshes',
  'insert into public.oasis_publication_audits',
  'insert into public.oasis_publication_current',
]) assert.ok(migration.indexOf(write) > postLockClockIndex, `${write} must use the captured post-lock timestamp`)
const rollbackCandidateIndex = migration.indexOf("'publishedAt', null", migration.indexOf('if p_rollback_of_publication_id is not null'))
assert.ok(rollbackCandidateIndex > postLockClockIndex && rollbackCandidateIndex < migration.indexOf('insert into public.oasis_publication_versions'))
assert.match(migration, /publication_version bigint generated always as identity unique not null/u)
assert.match(migration, /sequence allocations can retain gaps after rolled-back inserts/u)
assert.doesNotMatch(migration, /max\s*\(\s*publication_version\s*\)\s*\+\s*1/iu)
assert.doesNotMatch(migration, /publicationVersion'\) = 'number'.*existing\.publication_version/su)
assert.doesNotMatch(migration, /publicationVersion'\) = 'number'.*version_value/su)
assert.ok(migration.indexOf('returning publication_version into version_value') < migration.indexOf("'publicationVersion', version_value"))
assert.ok(migration.indexOf("return jsonb_build_object('publicationId', existing.publication_id, 'publicationVersion', existing.publication_version") > migration.indexOf('select * into existing'))
assert.ok(publicationLockIndex < migration.indexOf('insert into public.oasis_publication_versions'))
assert.ok(migration.indexOf('returning publication_version into version_value') < recordHistoryInsertIndex)

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
  { data: { ...publicationRow, publication_version: null }, error: null },
  { data: built.records.map((record) => ({ record_id: record.id, public_record: record })), error: null },
])), /invalid publication_version/u)
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: publicationRow, error: null },
  { data: built.records.map((record, index) => ({ record_id: record.id, public_record: index ? record : { ...record, publicationVersion: null } })), error: null },
])), /invalid publication identity/u)
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: publicationRow, error: null },
  { data: built.records.map((record, index) => ({ record_id: record.id, public_record: index ? record : { ...record, publicationVersion: record.publicationVersion + 1 } })), error: null },
])), /record identity mismatch/u)
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: publicationRow, error: null },
  { data: built.records.map((record, index) => ({ record_id: record.id, public_record: index ? record : { ...record, publishedAt: '2099-01-01T00:00:00.000Z' } })), error: null },
])), /timestamp mismatch/u)
await assert.rejects(loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: publicationRow, error: null },
  { data: built.records.map((record, index) => ({ record_id: record.id, public_record: index ? record : { ...record, levels: [null] } })), error: null },
])), /levels\[0\].*non-null object/u)
const loaded = await loadPublishedOasisIslandDataset(clientFor([
  { data: { singleton: true, publication_id: built.publicationId }, error: null },
  { data: publicationRow, error: null },
  { data: built.records.map((record) => ({ record_id: record.id, public_record: record })), error: null },
]))
assert.deepEqual(loaded, built)
assert.equal(Object.isFrozen(loaded), true)
assert.equal(Object.isFrozen(loaded.records), true)
assert.equal(Object.isFrozen(loaded.records[0]), true)
assert.equal(Object.isFrozen(loaded.records[0].aliases), true)
assert.equal(Object.isFrozen(loaded.records[levelRecordIndex].levels), true)
assert.equal(Object.isFrozen(loaded.records[levelRecordIndex].levels[0]), true)
assert.equal(Object.isFrozen(loaded.records[levelRecordIndex].levels[0].bonuses), true)
assert.equal(Object.isFrozen(loaded.records[levelRecordIndex].levels[0].bonuses[0]), true)
assert.equal(Object.isFrozen(loaded.records[mappedRecordIndex].media), true)
assert.equal(Object.isFrozen(loaded.records[mappedRecordIndex].media[0]), true)

console.log(`OASIS-001A-PUB Phase 1 passed: 55 records, 430 levels, 111 private-to-planned-public media mappings, six placeholders, private acceptance assets, clean production build, fail-closed loader and inactive Search adapter verified. SQL adversarial guards were structurally verified; no disposable PostgreSQL runtime was used by this test.`)
