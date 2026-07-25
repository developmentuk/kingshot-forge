import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { extractAccountLinkCandidates } from '../server/player-identity/accountLinkingOcrService.ts'
import { mapProfileRegion, prepareProfileRegion, profileRegionBindings } from '../server/player-identity/kingshotProfileOcr.ts'
import { KINGSHOT_PROFILE_V2_REGIONS } from '../shared/domains/player-identity/kingshotProfileMapping.ts'
import { parseAccountLinkCandidates } from '../shared/domains/player-identity/accountLinkingOcr.ts'

const base = new URL('../fixtures/vision/account-linking/', import.meta.url)
const provenance = { pluginKey: 'test', pluginVersion: '1', engineName: 'test', engineVersion: '1', executedAt: new Date().toISOString() }

for (const [file, width, height] of [['kingshot-profile-v1-1600x900.png', 1600, 900], ['kingshot-profile-v1-800x450.png', 800, 450]]) {
  const bytes = new Uint8Array(await readFile(new URL(file, base)))
  const manifest = JSON.parse(await readFile(new URL(file.replace('.png', '.manifest.json'), base), 'utf8'))
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  assert.equal(sha256, manifest.sha256)
  const result = await extractAccountLinkCandidates({ evidenceId: '22222222-2222-4222-8222-222222222222', bytes, sha256, mimeType: 'image/png', widthPx: width, heightPx: height, mappingVersion: 'account-linking-kingshot-profile-v1' })
  assert.equal(result.candidates.find((item) => item.field === 'playerId')?.value, manifest.expected.playerId)
  assert.equal(result.candidates.find((item) => item.field === 'displayName')?.value, manifest.expected.name)
  assert.equal(result.candidates.find((item) => item.field === 'kingdom')?.value, manifest.expected.kingdom)
  assert.equal(result.diagnostics?.mappingVersion, 'account-linking-kingshot-profile-v1')
}

for (const [file, mimeType, width, height] of [['kingshot-profile-v2-large.png', 'image/png', 1600, 900], ['kingshot-profile-v2-low-res.jpg', 'image/jpeg', 800, 450]]) {
  const bytes = new Uint8Array(await readFile(new URL(file, base)))
  const manifest = JSON.parse(await readFile(new URL(file.replace(/\.(png|jpg)$/, '.manifest.json'), base), 'utf8'))
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  assert.equal(sha256, manifest.sha256)
  const result = await extractAccountLinkCandidates({ evidenceId: '33333333-3333-4333-8333-333333333333', bytes, sha256, mimeType, widthPx: width, heightPx: height, mappingVersion: 'account-linking-kingshot-profile-v2' })
  assert.equal(result.candidates.find((item) => item.field === 'playerId')?.value, manifest.expected.playerId)
  assert.equal(result.candidates.find((item) => item.field === 'kingdom')?.value, manifest.expected.kingdom)
  assert.equal(result.candidates.find((item) => item.field === 'displayName')?.value, manifest.expected.name)
  assert.equal(result.diagnostics?.mappingVersion, 'account-linking-kingshot-profile-v2')
  assert.deepEqual(result.diagnostics?.regions.map((region) => region.field), ['displayName', 'playerId', 'kingdom'])
  const playerRegion = mapProfileRegion(KINGSHOT_PROFILE_V2_REGIONS.find((region) => region.field === 'playerId'), width, height)
  const prepared = await prepareProfileRegion({ bytes, mimeType, widthPx: width, heightPx: height, region: KINGSHOT_PROFILE_V2_REGIONS.find((region) => region.field === 'playerId') })
  assert.equal(prepared.scale, 3)
  assert.ok(prepared.widthPx > playerRegion.width && prepared.heightPx > playerRegion.height)
  assert.ok(prepared.widthPx * prepared.heightPx <= 8_000_000)
  assert.ok(prepared.bytes.length > 0)
}

assert.deepEqual(profileRegionBindings('account-linking-kingshot-profile-v2').map((region) => [region.regionKey, region.x, region.y, region.width, region.height]), KINGSHOT_PROFILE_V2_REGIONS.map((region) => [region.key, region.x, region.y, region.width, region.height]))

const mock = (regions) => ({ async extract() { return { rawText: regions.map((region) => region.rawText).join('\n'), engineConfidence: .9, provenance, regionObservations: regions, diagnostics: { mappingVersion: 'account-linking-kingshot-profile-v2', regions: regions.map(({ field, confidence, warnings }) => ({ field, attempted: true, recognized: true, confidence, warnings })) } } } })
const baseRegion = (field, rawText, confidence, extra = {}) => ({ field, rawText, confidence, warnings: [], ...extra })
const runMock = (regions) => extractAccountLinkCandidates({ evidenceId: '44444444-4444-4444-8444-444444444444', bytes: new Uint8Array([1]), sha256: 'a'.repeat(64), mimeType: 'image/png', widthPx: 1, heightPx: 1, mappingVersion: 'account-linking-kingshot-profile-v2', adapter: mock(regions) })
assert.equal((await runMock([baseRegion('displayName', 'EMBER FOX', .9), baseRegion('playerId', 'ID: 987654321', 0, { disposition: 'could_not_read' }), baseRegion('kingdom', 'Kingdom #42', .9)])).candidates.some((item) => item.field === 'playerId'), false)
assert.equal((await runMock([baseRegion('displayName', 'EMBER FOX', .9), baseRegion('playerId', 'ID: 987654321', .9, { disposition: 'recognised', acceptedValue: '987654321' }), baseRegion('kingdom', 'Town Center Level: 6', .9, { disposition: 'could_not_read' })])).candidates.some((item) => item.field === 'kingdom'), false)
assert.equal((await runMock([baseRegion('displayName', 'EMBER FOX', .9), baseRegion('playerId', 'ID: 987654321', .9, { disposition: 'conflicting_reads', agreement: 'disagree' }), baseRegion('kingdom', 'Kingdom #42', .9, { disposition: 'recognised', acceptedValue: '42' })])).candidates.some((item) => item.field === 'playerId'), false)
const partial = await runMock([baseRegion('displayName', '[FRG] EM', .4, { disposition: 'review_required', acceptedValue: '[FRG] EM', warnings: ['partial_or_normalised_name'] }), baseRegion('playerId', '', .0, { disposition: 'could_not_read' }), baseRegion('kingdom', '', .0, { disposition: 'could_not_read' })])
assert.equal(partial.candidates.find((item) => item.field === 'displayName')?.value, '[FRG] EM')
assert.equal(partial.candidates.some((item) => item.field === 'playerId'), false)

const parsed = parseAccountLinkCandidates('EMBER FOX\nID: 987 654 321\nKingdom # 42', '55555555-5555-4555-8555-555555555555', .9, { mappingVersion: 'account-linking-kingshot-profile-v1', regions: [baseRegion('displayName', 'EMBER FOX', .9), baseRegion('playerId', 'ID: 987 654 321', .9), baseRegion('kingdom', 'Kingdom # 42', .9)] })
assert.deepEqual(parsed.map((item) => [item.field, item.value]), [['playerId', '987654321'], ['displayName', 'EMBER FOX'], ['kingdom', '42']])
assert.equal(parseAccountLinkCandidates('', '66666666-6666-4666-8666-666666666666', .2).length, 0)
console.log('PASS kingshot-profile-ocr: v1 regression, v2 PNG/JPEG runtime, bounded preprocessing, trust gates, adversarial cases and format parsing')
