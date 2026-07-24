import assert from 'node:assert/strict'
import { SupabaseVisionEvidenceProvider } from '../server/vision/evidence/supabaseVisionEvidenceProvider.ts'
import { SupabaseVisionEvidenceRepository } from '../server/vision/evidence/supabaseVisionEvidenceRepository.ts'
import { inspectVisionImage, VisionImageMetadataError } from '../shared/platform/vision/imageMetadata.ts'

globalThis.fetch = () => { throw new Error('Adapter tests must not access the network.') }

const ownerId = '11111111-1111-4111-8111-111111111111'
const intentId = '44444444-4444-4444-8444-444444444444'
const evidenceId = '55555555-5555-4555-8555-555555555555'
const path = `${ownerId}/scan_source/${intentId}.png`
const png = syntheticPng(320, 200)
const rowIntent = { id: intentId, owner_user_id: ownerId, purpose: 'scan_source', upload_purpose: 'adapter test', storage_bucket: 'vision-evidence', storage_path: path, expected_mime_type: 'image/png', expected_bytes: png.byteLength, consent_recorded_at: '2026-07-24T16:00:00.000Z', expires_at: '2026-07-24T16:15:00.000Z', status: 'created' }
const rowEvidence = { id: evidenceId, upload_intent_id: intentId, owner_user_id: ownerId, purpose: 'scan_source', storage_bucket: 'vision-evidence', storage_path: path, byte_length: png.byteLength, sha256: 'a'.repeat(64), width_px: 320, height_px: 200, mime_type: 'image/png', upload_purpose: 'adapter test', consent_recorded_at: rowIntent.consent_recorded_at, retention_until: '2026-07-31T16:00:00.000Z', deletion_requested_at: null, deleted_at: null, legal_hold: false, verified_at: '2026-07-24T16:01:00.000Z' }

const captured = { inserts: [], updates: [], storage: { signedUpload: [], downloads: [], signedReads: [], removed: [] } }
const client = createFakeClient(captured)
const repository = new SupabaseVisionEvidenceRepository({ client })
await repository.createUploadIntent({ id: intentId, ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'adapter test', storageBucket: 'vision-evidence', storagePath: path, expectedMimeType: 'image/png', expectedBytes: png.byteLength, consentRecordedAt: rowIntent.consent_recorded_at, expiresAt: rowIntent.expires_at, status: 'created' })
assert.equal(captured.inserts.at(-1).table, 'vision_evidence_upload_intents')
assert.deepEqual(await repository.getUploadIntent(intentId), { id: intentId, ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'adapter test', storageBucket: 'vision-evidence', storagePath: path, expectedMimeType: 'image/png', expectedBytes: png.byteLength, expiresAt: rowIntent.expires_at, consentRecordedAt: rowIntent.consent_recorded_at, status: 'created' })
await repository.markUploadCompleted(intentId); await repository.markUploadAbandoned(intentId, rowIntent.expires_at); assert.equal(captured.updates.length, 2)
await repository.createVerifiedEvidence({ id: evidenceId, uploadIntentId: intentId, ownerUserId: ownerId, purpose: 'scan_source', bucket: 'vision-evidence', path, bytes: png.byteLength, sha256: 'a'.repeat(64), widthPx: 320, heightPx: 200, mimeType: 'image/png', uploadPurpose: 'adapter test', consentRecordedAt: rowIntent.consent_recorded_at, retentionUntil: rowEvidence.retention_until, deletionRequestedAt: null, deletedAt: null, legalHold: false, verifiedAt: rowEvidence.verified_at })
assert.equal(captured.inserts.at(-1).table, 'vision_evidence_images'); assert.equal(captured.inserts.at(-1).row.byte_length, png.byteLength)
assert.equal((await repository.getEvidence(evidenceId)).bytes, png.byteLength); assert.equal((await repository.findActiveBySha256('a'.repeat(64))).id, evidenceId)
await repository.requestDeletion(evidenceId, rowEvidence.verified_at, 'adapter test'); await repository.markDeleted(evidenceId, rowEvidence.verified_at); await repository.recordAudit({ eventType: 'vision.evidence.deleted', entityId: evidenceId, actorId: ownerId, payload: { auditMetadataRetained: true } }); assert.equal(captured.inserts.at(-1).table, 'vision_audit_events')

const provider = new SupabaseVisionEvidenceProvider({ client: createStorageClient(captured, png), now: () => new Date('2026-07-24T16:00:00.000Z') })
const upload = await provider.createSignedUploadUrl({ bucket: 'vision-evidence', path, mimeType: 'image/png', maxBytes: png.byteLength, intentExpiresAt: '2026-07-24T16:15:00.000Z' }); assert.equal(upload.providerLifetimeSeconds, 7200); assert.equal(upload.token, 'provider-token'); assert.notEqual(upload.expiresAt, '2026-07-24T16:15:00.000Z')
const stored = await provider.headObject({ bucket: 'vision-evidence', path }); assert.equal(stored.widthPx, 320); assert.equal(stored.heightPx, 200); assert.equal(stored.mimeType, 'image/png'); assert.equal(stored.bytes, png.byteLength)
assert.deepEqual(inspectVisionImage(syntheticJpeg(640, 480), 'image/jpeg'), { mimeType: 'image/jpeg', widthPx: 640, heightPx: 480 })
assert.deepEqual(inspectVisionImage(syntheticWebp(800, 600), 'image/webp'), { mimeType: 'image/webp', widthPx: 800, heightPx: 600 })
assert.deepEqual(inspectVisionImage(syntheticTiff(1024, 768), 'image/tiff'), { mimeType: 'image/tiff', widthPx: 1024, heightPx: 768 })
await provider.createSignedReadUrl({ bucket: 'vision-evidence', path, expiresAt: '2026-07-24T16:05:00.000Z' }); await provider.deleteObject({ bucket: 'vision-evidence', path }); assert.deepEqual(captured.storage.removed.at(-1), [path])
await assert.rejects(() => provider.headObject({ bucket: 'other', path }), /unexpected bucket/); await assert.rejects(() => provider.headObject({ bucket: 'vision-evidence', path: '../other.png' }), /invalid exact object path/)
await assert.rejects(() => new SupabaseVisionEvidenceProvider({ client: createStorageClient(captured, png, 'image/jpeg') }).headObject({ bucket: 'vision-evidence', path }), (error) => error instanceof VisionImageMetadataError && error.code === 'mime_signature_mismatch')
await assert.rejects(() => provider.createSignedReadUrl({ bucket: 'vision-evidence', path, expiresAt: '2026-07-24T17:00:00.000Z' }), /expiry/)
assert.throws(() => inspectVisionImage(syntheticPng(10_000, 10_000), 'image/png'), (error) => error.code === 'pixel_limit_exceeded')
assert.throws(() => inspectVisionImage(png.subarray(0, 20), 'image/png'), (error) => error.code === 'truncated_image')
assert.throws(() => inspectVisionImage(png, 'image/jpeg'), (error) => error.code === 'mime_signature_mismatch')
assert.equal(captured.storage.downloads.at(-1).options.cache, 'no-store')
console.log('Forge Vision Supabase adapter tests passed: exact repository mappings, fixed bucket/path, true two-hour upload lifetime, no-network import, byte hashing, image signatures/dimensions, MIME/pixel/truncation rejection, signed-read bounds and exact Storage API deletion.')

function createFakeClient(capture) {
  const rows = { vision_evidence_upload_intents: rowIntent, vision_evidence_images: rowEvidence }
  return { from(table) { return query(table, rows, capture) } }
}
function query(table, rows, capture) { const state = { table, filters: {} }; const builder = { select() { return builder }, eq(key, value) { state.filters[key] = value; return builder }, is(key, value) { state.filters[key] = value; return builder }, insert(row) { capture.inserts.push({ table, row }); return Promise.resolve({ data: null, error: null }) }, update(row) { capture.updates.push({ table, row }); return builder }, maybeSingle() { return Promise.resolve({ data: state.filters.sha256 ? rowEvidence : state.filters.id === evidenceId ? rowEvidence : state.filters.id === intentId ? rowIntent : null, error: null }) }, single() { return Promise.resolve({ data: { id: state.filters.id ?? evidenceId }, error: null }) } }; return builder }
function createStorageClient(capture, bytes, mime = 'image/png') {
  return {
    storage: {
      from(bucket) {
        return {
          createSignedUploadUrl(pathValue) {
            capture.storage.signedUpload.push({ bucket, path: pathValue })
            return Promise.resolve({ data: { token: 'provider-token' }, error: null })
          },
          download(pathValue, _transform, options) {
            capture.storage.downloads.push({ bucket, path: pathValue, options })
            return Promise.resolve({ data: new Blob([bytes], { type: mime }), error: null })
          },
          createSignedUrl(pathValue, seconds) {
            capture.storage.signedReads.push({ bucket, path: pathValue, seconds })
            return Promise.resolve({ data: { signedUrl: 'https://signed.invalid/read' }, error: null })
          },
          remove(paths) {
            capture.storage.removed.push(paths)
            return Promise.resolve({ data: paths.map((pathValue) => ({ name: pathValue })), error: null })
          },
        }
      },
    },
  }
}
function syntheticPng(width, height) { const bytes = new Uint8Array(45); bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]); bytes.set([0,0,0,13,0x49,0x48,0x44,0x52], 8); bytes.set([(width >>> 24) & 255,(width >>> 16) & 255,(width >>> 8) & 255,width & 255,(height >>> 24) & 255,(height >>> 16) & 255,(height >>> 8) & 255,height & 255,8,6,0,0,0], 16); bytes.set([0x49,0x45,0x4e,0x44], 37); return bytes }
function syntheticJpeg(width, height) { const bytes = new Uint8Array(24); bytes.set([0xff,0xd8,0xff,0xc0,0,17,8,(height >>> 8) & 255,height & 255,(width >>> 8) & 255,width & 255,0,0,0,0,0,0,0,0,0,0xff,0xd9]); return bytes }
function syntheticWebp(width, height) { const bytes = new Uint8Array(30); bytes.set([0x52,0x49,0x46,0x46,22,0,0,0,0x57,0x45,0x42,0x50,0x56,0x50,0x38,0x58,10,0,0,0,0,0,0,0,0,0,0,0,0,0]); bytes[24] = (width - 1) & 255; bytes[25] = ((width - 1) >>> 8) & 255; bytes[26] = ((width - 1) >>> 16) & 255; bytes[27] = (height - 1) & 255; bytes[28] = ((height - 1) >>> 8) & 255; bytes[29] = ((height - 1) >>> 16) & 255; return bytes }
function syntheticTiff(width, height) { const bytes = new Uint8Array(38); bytes.set([0x49,0x49,42,0,8,0,0,0,2,0], 0); bytes.set([0,1,4,0,1,0,0,0,width & 255,(width >>> 8) & 255,(width >>> 16) & 255,(width >>> 24) & 255], 10); bytes.set([1,1,4,0,1,0,0,0,height & 255,(height >>> 8) & 255,(height >>> 16) & 255,(height >>> 24) & 255], 22); return bytes }
