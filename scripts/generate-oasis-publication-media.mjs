import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import sharp from 'sharp'

import {
  assertOasisStagedSourceRecords,
  buildOasisPublicDataset,
  hashOasisSourceFingerprint,
  OASIS_MEDIA_MANIFEST_SCHEMA_VERSION,
  OASIS_SOURCE_FINGERPRINT_VERSION,
} from '../server/oasis-publication/publicProjection.ts'

const root = process.cwd()
const sourceJsonPath = resolve(root, 'server/data-engine/sources/kingshot_oasis_island_buildings.json')
const privateAssetRoot = resolve(root, 'server/data-engine/source-assets/oasis-island')
const privateDerivativeRoot = resolve(root, 'fixtures/oasis-001a-publication')
const manifestPath = resolve(root, 'server/oasis-publication/oasis-media-manifest.json')
const fixturePath = resolve(root, 'fixtures/oasis-001a-publication/oasis-publication.fixture.json')
const headerPngPath = resolve(root, 'src/assets/island-route/oasis-island-header.png')
const headerWebpPath = resolve(root, 'src/assets/island-route/oasis-island-header.webp')

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')
const metadataOnly = process.argv.includes('--metadata-only')
const source = JSON.parse(await readFile(sourceJsonPath, 'utf8'))
if (!Array.isArray(source.buildings)) throw new Error('Oasis staged source must contain a buildings array.')
assertOasisStagedSourceRecords(source.buildings)
const inventory = (await readdir(privateAssetRoot)).filter((name) => name.toLowerCase().endsWith('.png')).sort()
const ownership = new Map()

for (const record of source.buildings) {
  const levelsByFile = new Map()
  for (const [level, names] of Object.entries(record.images?.levelVariants ?? {})) {
    for (const name of Array.isArray(names) ? names : [names]) levelsByFile.set(name, Number(level))
  }
  for (const name of record.images?.files ?? []) {
    const previous = ownership.get(name)
    if (previous && previous.recordId !== record.id) throw new Error(`Private Oasis image has multiple record owners: ${name}`)
    ownership.set(name, { recordId: record.id, recordName: record.name, levelVariant: levelsByFile.get(name) ?? null })
  }
  for (const [name, levelVariant] of levelsByFile) {
    const previous = ownership.get(name)
    if (previous && previous.recordId !== record.id) throw new Error(`Private Oasis image has multiple record owners: ${name}`)
    ownership.set(name, { recordId: record.id, recordName: record.name, levelVariant })
  }
}

if (inventory.length !== 111 || ownership.size !== inventory.length) throw new Error(`Expected 111 uniquely mapped private PNGs; found ${inventory.length} files and ${ownership.size} mappings.`)
for (const name of inventory) if (!ownership.has(name)) throw new Error(`Unmapped private Oasis image: ${name}`)

const variantCounters = new Map()
const entries = []
for (const name of inventory) {
  const owner = ownership.get(name)
  const sourcePath = resolve(privateAssetRoot, name)
  const sourceBuffer = await readFile(sourcePath)
  const variantKey = `${owner.recordId}:${owner.levelVariant ?? 'catalogue'}`
  const variantNumber = (variantCounters.get(variantKey) ?? 0) + 1
  variantCounters.set(variantKey, variantNumber)
  const identity = owner.levelVariant === null ? 'catalogue' : `level-${owner.levelVariant}`
  const suffix = variantNumber === 1 ? '' : `-variant-${variantNumber}`
  const publicDerivativePath = `media/oasis-island/${owner.recordId}/${identity}${suffix}.webp`
  const privateDerivativePath = `fixtures/oasis-001a-publication/${publicDerivativePath}`
  const privatePath = resolve(root, privateDerivativePath)
  await mkdir(dirname(privatePath), { recursive: true })
  const derivative = metadataOnly
    ? await readFile(privatePath)
    : await sharp(sourceBuffer).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toBuffer()
  if (!metadataOnly) await writeFile(privatePath, derivative)
  const metadata = await sharp(derivative).metadata()
  entries.push({
    recordId: owner.recordId,
    privateSourceFilename: name,
    sourceChecksum: sha256(sourceBuffer),
    publicDerivativePath,
    privateDerivativePath,
    derivativeChecksum: sha256(derivative),
    sourceBytes: sourceBuffer.byteLength,
    derivativeBytes: derivative.byteLength,
    width: metadata.width,
    height: metadata.height,
    mediaRole: owner.levelVariant === null ? 'catalogue' : 'level',
    levelVariant: owner.levelVariant,
    altText: `${owner.recordName}${owner.levelVariant === null ? '' : ` level ${owner.levelVariant}`} Oasis Island artwork`,
  })
}

const placeholderPath = 'media/oasis-island/shared/artwork-unavailable.webp'
const placeholderPrivatePath = `fixtures/oasis-001a-publication/${placeholderPath}`
const placeholderOutput = resolve(privateDerivativeRoot, placeholderPath)
await mkdir(dirname(placeholderOutput), { recursive: true })
const placeholderSvg = Buffer.from(`<svg width="720" height="720" viewBox="0 0 720 720" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eaf7f2"/><stop offset="1" stop-color="#badfd4"/></linearGradient></defs><rect width="720" height="720" rx="64" fill="url(#g)"/><path d="M360 178 516 360 360 542 204 360Z" fill="none" stroke="#276c61" stroke-width="24"/><circle cx="360" cy="360" r="54" fill="#276c61"/><text x="360" y="632" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" fill="#1f514a">Artwork unavailable</text></svg>`)
const placeholderBuffer = metadataOnly
  ? await readFile(placeholderOutput)
  : await sharp(placeholderSvg).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toBuffer()
if (!metadataOnly) await writeFile(placeholderOutput, placeholderBuffer)
const placeholderMetadata = await sharp(placeholderBuffer).metadata()

const sourceFingerprint = hashOasisSourceFingerprint({ records: source.buildings, media: entries })
const manifest = {
  schemaVersion: OASIS_MEDIA_MANIFEST_SCHEMA_VERSION,
  sourceFingerprintVersion: OASIS_SOURCE_FINGERPRINT_VERSION,
  sourceFingerprint,
  sourceAssetCount: entries.length,
  derivativeAssetCount: entries.length,
  sourceAssetBytes: entries.reduce((total, entry) => total + entry.sourceBytes, 0),
  derivativeAssetBytes: entries.reduce((total, entry) => total + entry.derivativeBytes, 0),
  entries,
  missingArtworkRecordIds: ['fountain-of-life', 'reservoir', 'purifier', 'golden-sunset', 'skating-rink', 'construction-hut'],
  placeholder: {
    publicDerivativePath: placeholderPath,
    privateDerivativePath: placeholderPrivatePath,
    derivativeChecksum: sha256(placeholderBuffer),
    derivativeBytes: placeholderBuffer.byteLength,
    width: placeholderMetadata.width,
    height: placeholderMetadata.height,
    altText: 'Oasis Island artwork unavailable',
  },
}

await mkdir(dirname(manifestPath), { recursive: true })
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
const fixture = buildOasisPublicDataset({
  records: source.buildings,
  manifest,
  publication: {
    publicationId: 'development-fixture-oasis-001a-pub-phase-1',
    publicationVersion: 1,
    publishedAt: '2026-08-16T00:00:00.000Z',
    updatedAt: '2026-08-16T00:00:00.000Z',
  },
})
await mkdir(dirname(fixturePath), { recursive: true })
await writeFile(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`)

if (!metadataOnly) try {
  const headerBuffer = await readFile(headerPngPath)
  const header = await sharp(headerBuffer).webp({ quality: 84, effort: 6 }).toBuffer()
  await writeFile(headerWebpPath, header)
  console.log(`Island Route header: ${headerBuffer.byteLength} -> ${header.byteLength} bytes.`)
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
  await stat(headerWebpPath)
}

console.log(`Oasis media: ${entries.length} private PNGs, ${manifest.sourceAssetBytes} -> ${manifest.derivativeAssetBytes} derivative bytes, six deliberate placeholder records.`)
