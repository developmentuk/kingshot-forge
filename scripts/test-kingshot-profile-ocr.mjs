import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { extractAccountLinkCandidates } from '../server/player-identity/accountLinkingOcrService.ts'
import { parseAccountLinkCandidates } from '../shared/domains/player-identity/accountLinkingOcr.ts'

const base = new URL('../fixtures/vision/account-linking/', import.meta.url)
for (const [file, width, height] of [['kingshot-profile-v1-1600x900.png', 1600, 900], ['kingshot-profile-v1-800x450.png', 800, 450]]) {
  const bytes = new Uint8Array(await readFile(new URL(file, base)))
  const manifest = JSON.parse(await readFile(new URL(file.replace('.png', '.manifest.json'), base), 'utf8'))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.sha256)
  const result = await extractAccountLinkCandidates({ evidenceId: '22222222-2222-4222-8222-222222222222', bytes, sha256: manifest.sha256, mimeType: 'image/png', widthPx: width, heightPx: height })
  assert.equal(result.candidates.find((item) => item.field === 'playerId')?.value, manifest.expected.playerId)
  assert.equal(result.candidates.find((item) => item.field === 'displayName')?.value, manifest.expected.name)
  assert.equal(result.candidates.find((item) => item.field === 'kingdom')?.value, manifest.expected.kingdom)
  assert.equal(result.diagnostics?.mappingVersion, 'account-linking-kingshot-profile-v1')
  assert.deepEqual(result.diagnostics?.regions.map((region) => region.field), ['displayName', 'playerId', 'kingdom'])
}

const parsed = parseAccountLinkCandidates('EMBER FOX\nID: 987 654 321\nKingdom # 42', '33333333-3333-4333-8333-333333333333', 0.9, {
  mappingVersion: 'account-linking-kingshot-profile-v1',
  regions: [
    { field: 'displayName', rawText: 'EMBER FOX', confidence: 0.9, warnings: [] },
    { field: 'playerId', rawText: 'ID: 987 654 321', confidence: 0.9, warnings: [] },
    { field: 'kingdom', rawText: 'Kingdom # 42', confidence: 0.9, warnings: [] },
  ],
})
assert.deepEqual(parsed.map((item) => [item.field, item.value]), [['playerId', '987654321'], ['displayName', 'EMBER FOX'], ['kingdom', '42']])
assert.equal(parseAccountLinkCandidates('', '44444444-4444-4444-8444-444444444444', 0.2).length, 0)
console.log('PASS kingshot-profile-ocr: two deterministic layout fixtures, regional parsing, ID/Kingdom formats and explicit empty result')
