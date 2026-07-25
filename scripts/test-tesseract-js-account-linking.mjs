import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { extractAccountLinkCandidates } from '../server/player-identity/accountLinkingOcrService.ts'
import { TesseractJsAccountLinkOcrAdapter } from '../server/player-identity/tesseractJsAccountLinkOcrAdapter.ts'
import { toVisionWorkerFailure, VisionRuntimeError } from '../server/vision/runtime/errors.ts'

const fixturePath = fileURLToPath(new URL('../fixtures/vision/account-linking/synthetic-profile.png', import.meta.url))
const manifestPath = fileURLToPath(new URL('../fixtures/vision/account-linking/synthetic-profile.manifest.json', import.meta.url))
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const bytes = new Uint8Array(await readFile(fixturePath))
const sha256 = createHash('sha256').update(bytes).digest('hex')
assert.equal(sha256, manifest.sha256)

globalThis.fetch = () => { throw new Error('Bundled OCR tests must not access the network.') }
const started = performance.now()
const result = await extractAccountLinkCandidates({
  evidenceId: '99999999-9999-4999-8999-999999999999',
  bytes,
  sha256,
  mimeType: manifest.mimeType,
  widthPx: manifest.widthPx,
  heightPx: manifest.heightPx,
  mappingVersion: 'account-linking-kingshot-profile-v1',
})
const durationMs = Math.round(performance.now() - started)
assert.equal(result.provenance.pluginKey, 'ocr.tesseract.js.wasm')
assert.equal(result.provenance.pluginVersion, '1.0.0')
assert.equal(result.provenance.engineVersion, '7.0.0')
assert.ok(result.rawText)
const actualPlayerId = result.candidates.find((candidate) => candidate.field === 'playerId')?.value
assert.equal(actualPlayerId, manifest.expected.playerId)
const actualName = result.candidates.find((candidate) => candidate.field === 'displayName')?.value ?? null
const actualKingdom = result.candidates.find((candidate) => candidate.field === 'kingdom')?.value ?? null
if (actualName !== null) assert.equal(actualName, manifest.expected.name)
if (actualKingdom !== null) assert.equal(actualKingdom, manifest.expected.kingdom)
const { rawText: _rawText, ...safeProjection } = result
assert.ok(!('rawText' in safeProjection))
assert.ok(!JSON.stringify(safeProjection).includes('PLAYER ID'))

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
console.log(JSON.stringify({ status: 'PASS', runtime: 'tesseract.js', durationMs, actualPlayerId, actualName, actualKingdom, noNetwork: true, timeoutTermination: true }))
