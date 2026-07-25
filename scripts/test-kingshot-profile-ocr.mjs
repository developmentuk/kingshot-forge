import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { extractAccountLinkCandidates } from '../server/player-identity/accountLinkingOcrService.ts'
import { mapProfileRegion, prepareProfileRegion, profileRegionBindings } from '../server/player-identity/kingshotProfileOcr.ts'
import { KINGSHOT_PROFILE_V2_REGIONS, KINGSHOT_PROFILE_V3_REGIONS, KINGSHOT_PROFILE_V4_REGIONS } from '../shared/domains/player-identity/kingshotProfileMapping.ts'
import { consensusPlayerId, consensusComponentDigits } from '../shared/domains/player-identity/kingshotProfileConsensus.ts'
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
const v3Bindings = profileRegionBindings('v3')
const v3Line = KINGSHOT_PROFILE_V3_REGIONS.find((region) => region.key === 'playerId')
const v3Numeric = KINGSHOT_PROFILE_V3_REGIONS.find((region) => region.key === 'playerIdNumeric')
assert.ok(v3Line && v3Numeric)
assert.equal(v3Line.x + v3Line.width, 0.70)
assert.ok(Math.abs(v3Numeric.x + v3Numeric.width - 0.66) < 0.0001)
assert.ok(v3Numeric.x > v3Line.x && v3Numeric.x + v3Numeric.width < 0.72)
assert.deepEqual(v3Bindings.map((region) => [region.regionKey, region.x, region.y, region.width, region.height]), KINGSHOT_PROFILE_V3_REGIONS.map((region) => [region.key, region.x, region.y, region.width, region.height]))

const v4Bindings = profileRegionBindings('v4')
assert.deepEqual(v4Bindings.map((item) => [item.regionKey, item.x, item.y, item.width, item.height]), KINGSHOT_PROFILE_V4_REGIONS.map((item) => [item.key, item.x, item.y, item.width, item.height]))
const v4 = (key) => KINGSHOT_PROFILE_V4_REGIONS.find((item) => item.key === key)
const idDigits = v4('playerIdDigits'); const idLabel = v4('playerIdLabel'); const clipboard = v4('clipboardIcon'); const kingdomDigits = v4('kingdomDigits')
assert.ok(idDigits && idLabel && clipboard && kingdomDigits)
assert.ok(idDigits.x < 0.39 && idDigits.x + idDigits.width < clipboard.x)
assert.ok(idLabel.x + idLabel.width <= idDigits.x)
assert.equal(idDigits.componentRole, 'ocr'); assert.equal(clipboard.componentRole, 'exclusion')
assert.ok(kingdomDigits.y > v4('townCenterBadge').y + v4('townCenterBadge').height)

assert.ok((await readFile(new URL('kingshot-profile-v4-low-res.jpg', base))).length > 0)
for (const [file, mimeType, width, height] of [['kingshot-profile-v4-large.png', 'image/png', 1600, 900]]) {
  const bytes = new Uint8Array(await readFile(new URL(file, base)))
  const manifest = JSON.parse(await readFile(new URL(file.replace(/\.(png|jpg)$/, '.manifest.json'), base), 'utf8'))
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  assert.equal(sha256, manifest.sha256); assert.equal(manifest.realAccountData, false)
  const result = await extractAccountLinkCandidates({ evidenceId: '88888888-8888-4888-8888-888888888888', bytes, sha256, mimeType, widthPx: width, heightPx: height, mappingVersion: 'account-linking-kingshot-profile-v4' })
  assert.equal(result.candidates.find((item) => item.field === 'playerId')?.value, manifest.expected.playerId)
  assert.equal(result.candidates.find((item) => item.field === 'kingdom')?.value, manifest.expected.kingdom)
  assert.equal(result.candidates.find((item) => item.field === 'displayName')?.value, manifest.expected.name)
  assert.equal(result.candidates.find((item) => item.field === 'allianceTag')?.value, manifest.expected.allianceTag)
  assert.equal(result.diagnostics?.passes?.filter((pass) => pass.field === 'playerId').length, 6)
  assert.equal(result.diagnostics?.mappingVersion, 'account-linking-kingshot-profile-v4')
}

assert.equal(consensusComponentDigits([
  { passType: 'single_word', variant: 'greyscale', digits: '111111111111', confidence: .8 },
  { passType: 'single_line', variant: 'greyscale', digits: '111111111111', confidence: .57 },
  { passType: 'single_word', variant: 'threshold', digits: '111111111111', confidence: .45 },
  { passType: 'single_line', variant: 'threshold', confidence: 0 },
], true).value, '111111111111')
assert.equal(consensusComponentDigits([{ passType: 'single_word', variant: 'greyscale', digits: '111111111111', confidence: .9 }, { passType: 'single_line', variant: 'greyscale', digits: '111111111111', confidence: .8 }], false).disposition, 'could_not_read')
assert.equal(consensusComponentDigits([{ passType: 'single_word', variant: 'greyscale', digits: '111111111111', confidence: .9 }, { passType: 'single_line', variant: 'greyscale', digits: '222222222222', confidence: .8 }], true).disposition, 'conflicting_reads')

for (const [file, mimeType, width, height] of [['kingshot-profile-v2-large.png', 'image/png', 1600, 900], ['kingshot-profile-v2-low-res.jpg', 'image/jpeg', 800, 450]]) {
  const bytes = new Uint8Array(await readFile(new URL(file, base)))
  const manifest = JSON.parse(await readFile(new URL(file.replace(/\.(png|jpg)$/, '.manifest.json'), base), 'utf8'))
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const result = await extractAccountLinkCandidates({ evidenceId: '77777777-7777-4777-8777-777777777777', bytes, sha256, mimeType, widthPx: width, heightPx: height, mappingVersion: 'account-linking-kingshot-profile-v3' })
  assert.equal(result.candidates.find((item) => item.field === 'playerId')?.value, manifest.expected.playerId)
  assert.equal(result.candidates.find((item) => item.field === 'kingdom')?.value, manifest.expected.kingdom)
  assert.equal(result.diagnostics?.mappingVersion, 'account-linking-kingshot-profile-v3')
  assert.equal(result.diagnostics?.passes?.filter((pass) => pass.field === 'playerId').length, 4)
  assert.ok(result.diagnostics?.passes?.some((pass) => pass.variant === 'threshold'))
  const grayPrepared = await prepareProfileRegion({ bytes, mimeType, widthPx: width, heightPx: height, region: v3Line, variant: 'greyscale' })
  const thresholdPrepared = await prepareProfileRegion({ bytes, mimeType, widthPx: width, heightPx: height, region: v3Line, variant: 'threshold' })
  assert.notDeepEqual(Buffer.from(grayPrepared.bytes), Buffer.from(thresholdPrepared.bytes))
}

assert.equal(consensusPlayerId([
  { passType: 'labelled_line', variant: 'greyscale', digits: '111111111111', confidence: .91, labelContext: true },
  { passType: 'labelled_line', variant: 'threshold', digits: '111111111111', confidence: .88, labelContext: true },
  { passType: 'numeric_only', variant: 'greyscale', digits: '111111111111', confidence: .79, labelContext: false },
  { passType: 'numeric_only', variant: 'threshold', confidence: 0, labelContext: false },
]).value, '111111111111')
assert.equal(consensusPlayerId([
  { passType: 'labelled_line', variant: 'greyscale', digits: '987654321', confidence: .9, labelContext: true },
  { passType: 'labelled_line', variant: 'threshold', digits: '987654321', confidence: .86, labelContext: true },
  { passType: 'numeric_only', variant: 'greyscale', digits: '987654321', confidence: .75, labelContext: false },
  { passType: 'numeric_only', variant: 'threshold', digits: '98765432', confidence: .75, labelContext: false },
]).value, '987654321')
assert.equal(consensusPlayerId([
  { passType: 'numeric_only', variant: 'greyscale', digits: '987654321', confidence: .9, labelContext: false },
  { passType: 'numeric_only', variant: 'threshold', digits: '987654321', confidence: .8, labelContext: false },
]).disposition, 'could_not_read')
assert.equal(consensusPlayerId([
  { passType: 'labelled_line', variant: 'greyscale', digits: '123456789', confidence: .9, labelContext: true },
  { passType: 'numeric_only', variant: 'greyscale', digits: '987654321', confidence: .9, labelContext: false },
]).disposition, 'conflicting_reads')

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
console.log('PASS kingshot-profile-ocr: v1/v2 regression, v3 PNG/JPEG four-pass runtime, shared geometry, threshold execution, consensus gates and adversarial cases')
