import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { VisionEvidenceStorageError, VisionEvidenceStorageService } from '../server/vision/evidenceStorageService.ts'
import { VisionImageMetadataError } from '../shared/platform/vision/imageMetadata.ts'
import { VISION_ACCEPTANCE_RECOVERY_EVIDENCE_ID, VISION_ACCEPTANCE_RECOVERY_INTENT_ID, VISION_ACCEPTANCE_RECOVERY_PATH, VISION_ACCEPTANCE_RECOVERY_SHA256, VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE } from '../shared/platform/vision/evidenceStorageContracts.ts'

globalThis.fetch = () => { throw new Error('Evidence storage tests must not access the network.') }

const ownerId = '11111111-1111-4111-8111-111111111111'
const otherOwnerId = '22222222-2222-4222-8222-222222222222'
const reviewerId = '33333333-3333-4333-8333-333333333333'
const now = new Date('2026-07-24T12:00:00.000Z')
const actor = (userId, permissions = []) => ({ userId, accountStatus: 'active', permissions })
const owner = actor(ownerId)
const reviewer = actor(reviewerId, ['vision.evidence.review'])
const anonymous = { userId: null, accountStatus: 'inactive', permissions: [] }
const image = { bytes: 1024, mimeType: 'image/png', sha256: 'a'.repeat(64), widthPx: 100, heightPx: 100 }

function createMocks() {
  const intents = new Map(); const evidence = new Map(); const objects = new Map(); const audits = []; const calls = { signedUpload: [], signedRead: [], deleted: [] }
  const repository = {
    async createUploadIntent(intent) { intents.set(intent.id, structuredClone(intent)) },
    async getUploadIntent(id) { return intents.get(id) ? structuredClone(intents.get(id)) : null },
    async markUploadAbandoned(id, abandonedAt) { const intent = intents.get(id); if (intent) { intent.status = 'abandoned'; intent.abandonedAt = abandonedAt } },
    async markUploadCompleted(id) { const intent = intents.get(id); if (intent) { intent.status = 'completed'; intent.completedAt = now.toISOString() } },
    async findActiveBySha256(sha256) { return [...evidence.values()].find(item => !item.deletedAt && item.sha256 === sha256) ?? null },
    async createVerifiedEvidence(metadata) { evidence.set(metadata.id, structuredClone(metadata)) },
    async getEvidence(id) { return evidence.get(id) ? structuredClone(evidence.get(id)) : null },
    async listActiveAcceptanceEvidenceForOwner(ownerUserId, limit) { return [...evidence.values()].filter(item => item.ownerUserId === ownerUserId && item.purpose === 'scan_source' && item.uploadPurpose === VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE && !item.deletedAt && !item.legalHold).sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt)).slice(0, limit).map(item => ({ evidenceId: item.id, uploadedAt: item.verifiedAt, mimeType: item.mimeType, byteLength: item.bytes, status: 'active' })) },
    async requestDeletion(id, requestedAt, reason) { const item = evidence.get(id); if (item) { item.deletionRequestedAt = requestedAt; item.deletionReason = reason } },
    async markDeleted(id, deletedAt) { const item = evidence.get(id); if (item) item.deletedAt = deletedAt },
    async recordAudit(input) { audits.push(structuredClone(input)) },
  }
  const provider = {
    async createSignedUploadUrl(input) { calls.signedUpload.push(input); return { url: null, token: 'mock-upload-token', bucket: input.bucket, path: input.path, providerLifetimeSeconds: 7200, expiresAt: new Date(now.getTime() + 7200000).toISOString() } },
    async headObject(input) { return objects.get(`${input.bucket}/${input.path}`) ?? null },
    async createSignedReadUrl(input) { calls.signedRead.push(input); return { url: `https://signed.invalid/read/${input.path}`, expiresAt: input.expiresAt } },
    async deleteObject(input) { calls.deleted.push(input); objects.delete(`${input.bucket}/${input.path}`) },
  }
  return { repository, provider, intents, evidence, objects, audits, calls }
}

function serviceWith(mocks, ids = ['44444444-4444-4444-8444-444444444444', '55555555-5555-4555-8555-555555555555']) {
  let index = 0
  return new VisionEvidenceStorageService({ repository: mocks.repository, provider: mocks.provider, now: () => new Date(now), createId: () => ids[index++] ?? '66666666-6666-4666-8666-666666666666' })
}

async function expectCode(operation, code) {
  await assert.rejects(operation, error => error instanceof VisionEvidenceStorageError && error.code === code)
}

const mocks = createMocks(); const service = serviceWith(mocks)
await expectCode(() => service.createUploadIntent(anonymous, { ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'test', mimeType: 'image/png', expectedBytes: 100 }), 'unauthorised')
await expectCode(() => service.createUploadIntent(owner, { ownerUserId: otherOwnerId, purpose: 'scan_source', uploadPurpose: 'test', mimeType: 'image/png', expectedBytes: 100, consentRecordedAt: now.toISOString() }), 'owner_mismatch')
await expectCode(() => service.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'test', mimeType: 'image/gif', expectedBytes: 100, consentRecordedAt: now.toISOString() }), 'unsupported_mime_type')
await expectCode(() => service.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'test', mimeType: 'image/png', expectedBytes: 16 * 1024 * 1024 + 1, consentRecordedAt: now.toISOString() }), 'file_too_large')
await expectCode(() => service.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'test', mimeType: 'image/png', expectedBytes: 100 }), 'consent_required')

const intentResult = await service.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'player supplied scan', mimeType: 'image/png', expectedBytes: image.bytes, consentRecordedAt: now.toISOString() })
assert.equal(intentResult.intent.storageBucket, 'vision-evidence'); assert.match(intentResult.intent.storagePath, new RegExp(`^${ownerId}/scan_source/`)); assert.equal(intentResult.upload.token, 'mock-upload-token'); assert.equal(intentResult.upload.providerLifetimeSeconds, 7200); assert.ok(new Date(intentResult.upload.expiresAt) > new Date(intentResult.intent.expiresAt)); assert.equal(mocks.calls.signedUpload[0].bucket, 'vision-evidence')
await expectCode(() => service.completeUpload(owner, intentResult.intent.id, image), 'object_unverified')
mocks.objects.set(`vision-evidence/${intentResult.intent.storagePath}`, { bucket: 'vision-evidence', path: intentResult.intent.storagePath, ...image })
const completed = await service.completeUpload(owner, intentResult.intent.id, image)
assert.equal(completed.verifiedAt, now.toISOString()); assert.equal(mocks.evidence.size, 1); assert.equal(mocks.audits.at(-1).eventType, 'vision.evidence.verified')
await expectCode(() => service.createShortLivedReadUrl(actor(otherOwnerId), completed.id), 'not_found')
const readUrl = await service.createShortLivedReadUrl(owner, completed.id, 300); assert.ok(readUrl.url.includes('signed.invalid')); assert.ok(new Date(readUrl.expiresAt) <= new Date(now.getTime() + 300000)); assert.equal(mocks.calls.signedRead.length, 1)
await expectCode(() => service.createShortLivedReadUrl(owner, completed.id, 301), 'invalid_url_expiry')
await expectCode(() => service.completeUpload(owner, intentResult.intent.id, image), 'intent_expired')

const malformed = await service.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'mapping_reference', uploadPurpose: 'reference', mimeType: 'image/png', expectedBytes: image.bytes })
mocks.intents.get(malformed.intent.id).storagePath = `../other/${malformed.intent.id}.png`
await expectCode(() => service.completeUpload(owner, malformed.intent.id, image), 'invalid_path')

async function validationCode(input, providerError) {
  const validationMocks = createMocks(); const validationService = serviceWith(validationMocks)
  const created = await validationService.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'test_case', uploadPurpose: 'validation', mimeType: 'image/png', expectedBytes: image.bytes })
  validationMocks.provider.headObject = async () => { if (providerError) throw providerError; return { bucket: 'vision-evidence', path: created.intent.storagePath, ...image } }
  await expectCode(() => validationService.completeUpload(owner, created.intent.id, { ...image, ...input }), input.sha256 && !/^[a-f0-9]{64}$/.test(input.sha256) ? 'invalid_hash' : input.widthPx === 0 ? 'invalid_dimensions' : providerError.code === 'pixel_limit_exceeded' ? 'excessive_pixels' : 'invalid_image')
}
await validationCode({ sha256: 'A'.repeat(64) })
await validationCode({ widthPx: 0 })
await validationCode({}, new VisionImageMetadataError('pixel_limit_exceeded', 'governed pixel limit'))
await validationCode({}, new VisionImageMetadataError('malformed_image', 'malformed image'))

const duplicate = await service.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'test_case', uploadPurpose: 'duplicate', mimeType: 'image/png', expectedBytes: image.bytes })
mocks.objects.set(`vision-evidence/${duplicate.intent.storagePath}`, { bucket: 'vision-evidence', path: duplicate.intent.storagePath, ...image })
await expectCode(() => service.completeUpload(owner, duplicate.intent.id, image), 'duplicate_evidence'); assert.equal(mocks.evidence.size, 1); assert.equal(mocks.calls.deleted.at(-1).path, duplicate.intent.storagePath)

const failing = createMocks(); const failingService = serviceWith(failing)
failing.provider.createSignedUploadUrl = async () => { throw new Error('provider unavailable') }
await expectCode(() => failingService.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'test_case', uploadPurpose: 'failure', mimeType: 'image/png', expectedBytes: 100 }), 'upload_intent_unavailable')
assert.equal([...failing.intents.values()][0].status, 'abandoned')
const abandoned = await service.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'test_case', uploadPurpose: 'abandon', mimeType: 'image/png', expectedBytes: 100 })
await service.abandonUpload(owner, abandoned.intent.id, 'user cancelled'); assert.equal(mocks.intents.get(abandoned.intent.id).status, 'abandoned'); assert.equal(mocks.audits.at(-1).eventType, 'vision.evidence.upload_abandoned')

const cancelMocks = createMocks(); const cancelService = serviceWith(cancelMocks)
const cancelIntent = await cancelService.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'account-linking cancellation', mimeType: 'image/png', expectedBytes: image.bytes, consentRecordedAt: now.toISOString() })
cancelMocks.objects.set(`vision-evidence/${cancelIntent.intent.storagePath}`, { bucket: 'vision-evidence', path: cancelIntent.intent.storagePath, ...image })
const cancelEvidence = await cancelService.completeUpload(owner, cancelIntent.intent.id, image)
await expectCode(() => cancelService.cancelOwnerScanEvidence(actor(otherOwnerId), cancelEvidence.id, 'wrong owner'), 'not_found')
await cancelService.cancelOwnerScanEvidence(owner, cancelEvidence.id, 'user cancelled after OCR')
assert.equal(cancelMocks.evidence.get(cancelEvidence.id).deletedAt, now.toISOString()); assert.equal(cancelMocks.objects.size, 0); assert.equal(cancelMocks.calls.deleted.length, 1); assert.equal(cancelMocks.audits.at(-1).eventType, 'vision.evidence.owner_cancelled'); assert.equal(cancelMocks.audits.at(-1).payload.exactObject, true)
await cancelService.cancelOwnerScanEvidence(owner, cancelEvidence.id, 'repeat cancellation'); assert.equal(cancelMocks.calls.deleted.length, 1); assert.equal(cancelMocks.audits.filter(event => event.eventType === 'vision.evidence.owner_cancelled').length, 1)
const unrelated = { ...cancelEvidence, id: '88888888-8888-4888-8888-888888888888', path: `${ownerId}/mapping_reference/88888888-8888-4888-8888-888888888888.png`, purpose: 'mapping_reference', deletedAt: null }; cancelMocks.evidence.set(unrelated.id, unrelated); cancelMocks.objects.set(`vision-evidence/${unrelated.path}`, { bucket: 'vision-evidence', path: unrelated.path, ...image })
await expectCode(() => cancelService.cancelOwnerScanEvidence(owner, unrelated.id, 'must not cancel unrelated evidence'), 'forbidden'); assert.equal(cancelMocks.objects.size, 1)

const recoveryMocks = createMocks(); const recoveryService = serviceWith(recoveryMocks); const recoveryOwner = actor('d245eb2e-b295-4c9b-bcef-cd134bfe981a', ['vision.scan.create'])
assert.deepEqual(await recoveryService.getActiveAcceptanceEvidence(recoveryOwner), { available: false, evidence: [] })
for (const item of [
  { id: '99999999-9999-4999-8999-999999999999', ownerUserId: recoveryOwner.userId, purpose: 'scan_source', uploadPurpose: VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE, mimeType: 'image/png', bytes: 100, verifiedAt: '2026-07-24T11:00:00.000Z', deletedAt: null, legalHold: false },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE, mimeType: 'image/png', bytes: 101, verifiedAt: '2026-07-24T12:00:00.000Z', deletedAt: null, legalHold: false },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', ownerUserId: recoveryOwner.userId, purpose: 'scan_source', uploadPurpose: VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE, mimeType: 'image/png', bytes: 102, verifiedAt: '2026-07-24T10:00:00.000Z', deletedAt: now.toISOString(), legalHold: false },
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', ownerUserId: recoveryOwner.userId, purpose: 'scan_source', uploadPurpose: VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE, mimeType: 'image/png', bytes: 103, verifiedAt: '2026-07-24T09:00:00.000Z', deletedAt: null, legalHold: true },
  { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', ownerUserId: recoveryOwner.userId, purpose: 'mapping_reference', uploadPurpose: VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE, mimeType: 'image/png', bytes: 104, verifiedAt: '2026-07-24T08:00:00.000Z', deletedAt: null, legalHold: false },
  { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', ownerUserId: recoveryOwner.userId, purpose: 'scan_source', uploadPurpose: 'other purpose', mimeType: 'image/png', bytes: 105, verifiedAt: '2026-07-24T07:00:00.000Z', deletedAt: null, legalHold: false },
]) recoveryMocks.evidence.set(item.id, item)
assert.deepEqual(await recoveryService.getActiveAcceptanceEvidence(recoveryOwner), { available: true, evidence: [{ evidenceId: '99999999-9999-4999-8999-999999999999', uploadedAt: '2026-07-24T11:00:00.000Z', mimeType: 'image/png', byteLength: 100, status: 'active' }] })
recoveryMocks.evidence.set(VISION_ACCEPTANCE_RECOVERY_EVIDENCE_ID, { id: VISION_ACCEPTANCE_RECOVERY_EVIDENCE_ID, uploadIntentId: VISION_ACCEPTANCE_RECOVERY_INTENT_ID, ownerUserId: recoveryOwner.userId, purpose: 'scan_source', bucket: 'vision-evidence', path: VISION_ACCEPTANCE_RECOVERY_PATH, bytes: image.bytes, mimeType: 'image/png', sha256: VISION_ACCEPTANCE_RECOVERY_SHA256, widthPx: image.widthPx, heightPx: image.heightPx, uploadPurpose: VISION_ACCEPTANCE_RECOVERY_UPLOAD_PURPOSE, consentRecordedAt: now.toISOString(), retentionUntil: new Date(now.getTime() + 86400000).toISOString(), deletionRequestedAt: null, deletedAt: null, legalHold: false, verifiedAt: now.toISOString() })
assert.deepEqual(await recoveryService.getAcceptanceRecovery(recoveryOwner), { available: true })
for (const field of ['uploadIntentId', 'path', 'sha256', 'uploadPurpose']) { const original = recoveryMocks.evidence.get(VISION_ACCEPTANCE_RECOVERY_EVIDENCE_ID)[field]; recoveryMocks.evidence.get(VISION_ACCEPTANCE_RECOVERY_EVIDENCE_ID)[field] = 'mismatch'; await expectCode(() => recoveryService.getAcceptanceRecovery(recoveryOwner), 'not_found'); recoveryMocks.evidence.get(VISION_ACCEPTANCE_RECOVERY_EVIDENCE_ID)[field] = original }
await expectCode(() => recoveryService.getAcceptanceRecovery(owner), 'forbidden')

await service.requestEvidenceDeletion(owner, completed.id, 'owner requested deletion'); assert.ok(mocks.evidence.get(completed.id).deletionRequestedAt)
await expectCode(() => service.executeRetentionDeletion(owner, completed.id), 'forbidden')
await service.executeRetentionDeletion(reviewer, completed.id); assert.equal(mocks.evidence.get(completed.id).deletedAt, now.toISOString()); assert.equal(mocks.audits.at(-1).eventType, 'vision.evidence.deleted'); assert.equal(mocks.audits.at(-1).payload.auditMetadataRetained, true)
await service.executeRetentionDeletion(reviewer, completed.id); assert.equal(mocks.calls.deleted.length, 2)

const held = { ...completed, id: '77777777-7777-4777-8777-777777777777', path: `${ownerId}/mapping_reference/77777777-7777-4777-8777-777777777777.png`, legalHold: true, deletedAt: null, deletionRequestedAt: now.toISOString() }; mocks.evidence.set(held.id, held)
await expectCode(() => service.executeRetentionDeletion(reviewer, held.id), 'legal_hold')
assert.doesNotMatch(readFileSync('src/features/admin/VisionStudioPage.tsx', 'utf8'), /vision-evidence|createUploadIntent|createSignedUploadUrl/)
assert.equal(mocks.audits.some(event => /canonical|player|profile|alliance|game/i.test(JSON.stringify(event.payload))), false)
console.log('Forge Vision evidence storage governance tests passed: mocked ownership, MIME/size/path/hash/object verification, signed URL limits, duplicate handling, abandonment, exact deletion, retention holds, audit retention, server-only boundary and canonical-write isolation.')
