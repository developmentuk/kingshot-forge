import assert from 'node:assert/strict'
import { extractAccountLinkCandidates } from '../server/player-identity/accountLinkingOcrService.ts'
import { parseAccountLinkCandidates } from '../shared/domains/player-identity/accountLinkingOcr.ts'

const originalFetch = globalThis.fetch
let fetchCalls = 0
globalThis.fetch = async () => { fetchCalls += 1; throw new Error('network access is not allowed in this test') }

const result = parseAccountLinkCandidates('Player ID: 123456789 Name: Ember Fox Kingdom: 42', '11111111-1111-4111-8111-111111111111', 0.92)
assert.deepEqual(result.map((candidate) => candidate.field), ['playerId', 'displayName', 'kingdom'])
assert.equal(result[0].value, '123456789')
assert.equal(result[0].evidenceId, '11111111-1111-4111-8111-111111111111')
assert.ok(result.every((candidate) => candidate.confidence >= 0 && candidate.confidence <= 1))

const extracted = await extractAccountLinkCandidates({
  evidenceId: '11111111-1111-4111-8111-111111111111',
  bytes: new Uint8Array([1, 2, 3]),
  sha256: 'a'.repeat(64),
  mimeType: 'image/png',
  widthPx: 100,
  heightPx: 100,
  adapter: { async extract() { return { rawText: 'Player ID: 987654 Name: Nova Kingdom: 7', engineConfidence: 0.81, provenance: { pluginKey: 'mock.ocr', pluginVersion: 'test', engineName: 'Mock OCR', engineVersion: '1', executedAt: '2026-07-24T00:00:00.000Z' } } } },
})
assert.equal(extracted.candidates[0].value, '987654')
assert.equal(extracted.provenance.pluginKey, 'mock.ocr')
assert.equal(fetchCalls, 0)
globalThis.fetch = originalFetch
console.log('PASS player-linking-ocr: 2 assertions groups, no network access')
