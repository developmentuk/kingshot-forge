import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createSyntheticAccountProfilePng, SYNTHETIC_ACCOUNT_PROFILE } from './synthetic-account-profile-fixture.mjs'
import { extractAccountLinkCandidates } from '../server/player-identity/accountLinkingOcrService.ts'
import { parseAccountLinkCandidates } from '../shared/domains/player-identity/accountLinkingOcr.ts'
import { TesseractJsAccountLinkOcrAdapter } from '../server/player-identity/tesseractJsAccountLinkOcrAdapter.ts'
import { toVisionWorkerFailure, VisionRuntimeError } from '../server/vision/runtime/errors.ts'

globalThis.fetch = () => { throw new Error('Bundled OCR tests must not access the network.') }
const bytes = createSyntheticAccountProfilePng(); const sha256 = createHash('sha256').update(bytes).digest('hex')
const result = await extractAccountLinkCandidates({ evidenceId: '99999999-9999-4999-8999-999999999999', bytes, sha256, mimeType: 'image/png', widthPx: SYNTHETIC_ACCOUNT_PROFILE.widthPx, heightPx: SYNTHETIC_ACCOUNT_PROFILE.heightPx })
assert.equal(result.provenance.pluginKey, 'ocr.tesseract.js.wasm')
assert.equal(result.provenance.pluginVersion, '1.0.0')
assert.ok(result.rawText)
const parsed = parseAccountLinkCandidates('PLAYER ID: 987654321\nNAME: EMBER FOX\nKINGDOM: 42', '99999999-9999-4999-8999-999999999999', 0.95)
assert.equal(parsed.find((candidate) => candidate.field === 'playerId')?.value, SYNTHETIC_ACCOUNT_PROFILE.playerId)
assert.equal(parsed.find((candidate) => candidate.field === 'displayName')?.value, SYNTHETIC_ACCOUNT_PROFILE.name)
assert.equal(parsed.find((candidate) => candidate.field === 'kingdom')?.value, SYNTHETIC_ACCOUNT_PROFILE.kingdom)
const { rawText: _rawText, ...safeProjection } = result
assert.ok(!('rawText' in safeProjection))

let terminated = 0
const mockAdapter = new TesseractJsAccountLinkOcrAdapter({ timeoutMs: 10, workerFactory: { async create() { return { async setParameters() {}, async recognize() { await new Promise(() => {}) }, async terminate() { terminated += 1 } } } } })
await assert.rejects(() => mockAdapter.extract({ runId:'r', mappingVersionId:'m', mappingId:'m', fieldKey:'f', image:{ evidenceId:'99999999-9999-4999-8999-999999999999', bytes:new Uint8Array([1]), sha256:createHash('sha256').update(new Uint8Array([1])).digest('hex'), mimeType:'image/png', widthPx:1, heightPx:1 }, region:null, configuration:{} }), (error) => error instanceof VisionRuntimeError && error.code === 'extraction_timeout')
assert.equal(terminated, 1)
const failure = toVisionWorkerFailure(new VisionRuntimeError('extraction_failed', 'extraction', 'safe', { cause: new Error('private') }), 'extraction')
assert.deepEqual(failure, { code:'extraction_failed', stage:'extraction', retryable:false, message:'safe', detail:null })
const cause = new Error('private')
const errorWithCause = new VisionRuntimeError('extraction_failed', 'extraction', 'safe', { cause })
assert.equal(errorWithCause.cause, cause)
assert.equal(Object.prototype.propertyIsEnumerable.call(errorWithCause, 'cause'), false)
console.log('PASS bundled tesseract.js runtime: synthetic candidates, no network, timeout termination and safe failure projection')
