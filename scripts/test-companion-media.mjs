import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const manifest = JSON.parse(readFileSync(
  'docs/companion/assets/ITEM-MEDIA-MANIFEST-2026-08-03.json',
  'utf8',
))

const expectedArchives = {
  'items.zip': {
    path: process.env.KS_ITEMS_ARCHIVE ?? 'C:/Users/clark/Downloads/items.zip',
    sha256: '7ad7c36474089a683501292ebd849689bb41aa6f9daec14357d0d5984439e233',
    count: 59,
    role: 'full_artwork',
  },
  'icons.zip': {
    path: process.env.KS_ICONS_ARCHIVE ?? 'C:/Users/clark/Downloads/icons.zip',
    sha256: 'cab698d9d984d4ebb1413b0e27a14e8ac0d297a6d2c8a2d958dc6061c543e26e',
    count: 7,
    role: 'compact_icon',
  },
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function webpInfo(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
  const chunk = bytes.indexOf(Buffer.from('VP8X'))
  assert.ok(chunk >= 0, 'expected VP8X WebP metadata')
  const flags = bytes[chunk + 8]
  return {
    width: 1 + bytes[chunk + 12] + (bytes[chunk + 13] << 8) + (bytes[chunk + 14] << 16),
    height: 1 + bytes[chunk + 15] + (bytes[chunk + 16] << 8) + (bytes[chunk + 17] << 16),
    hasAlpha: Boolean(flags & 0x10),
  }
}

assert.equal(manifest.full_artwork_count, 59)
assert.equal(manifest.compact_icon_count, 7)
assert.equal(manifest.total_asset_count, 66)
assert.equal(manifest.assets.length, 66)
assert.equal(new Set(manifest.assets.map((asset) => asset.source_sha256)).size, 66)
assert.equal(manifest.rights_basis, 'owner_declared_creative_commons')

for (const [archiveName, expected] of Object.entries(expectedArchives)) {
  assert.ok(existsSync(expected.path), `${archiveName} is missing`)
  assert.equal(sha256(readFileSync(expected.path)), expected.sha256, `${archiveName} checksum`)
  assert.equal(manifest.assets.filter((asset) => asset.source_archive === archiveName).length, expected.count)
  assert.ok(manifest.assets.filter((asset) => asset.source_archive === archiveName)
    .every((asset) => asset.media_role === expected.role))
}

for (const asset of manifest.assets) {
  const publishedPath = join('public', asset.immutable_media_path)
  const bytes = readFileSync(publishedPath)
  const info = webpInfo(bytes)
  assert.equal(bytes.length, asset.byte_length, asset.canonical_item_key)
  assert.equal(sha256(bytes), asset.source_sha256, asset.canonical_item_key)
  assert.equal(info.width, asset.width, asset.canonical_item_key)
  assert.equal(info.height, asset.height, asset.canonical_item_key)
  assert.equal(info.hasAlpha, true, asset.canonical_item_key)
  assert.equal(asset.canonical_forge_id, `item.${asset.canonical_item_key}`)
  assert.equal(asset.immutable_media_path.endsWith(asset.canonical_filename), true)
  assert.match(asset.alt_text, /\S/u)
  assert.doesNotMatch(asset.provenance_limitations, /official(?! ownership)/iu)
}

assert.equal(manifest.assets.some((asset) => asset.canonical_item_key === 'mythril'), false)
assert.equal(manifest.assets.find((asset) => asset.original_archive_entry.endsWith('/mythril.webp'))?.canonical_item_key, 'mithril')
assert.equal(existsSync('server/companion/media/atlasChunk00.ts'), false)

console.log('Companion media archive, manifest, WebP, checksum, naming and publication integrity passed.')
