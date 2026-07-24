import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { VisionEvidenceStorageService } from '../server/vision/evidenceStorageService.ts'
import { inspectVisionImage } from '../shared/platform/vision/imageMetadata.ts'

globalThis.fetch = () => { throw new Error('The Vision evidence activation harness must not access the network.') }

const execute = process.argv.includes('--execute')
if (execute) throw new Error('Live VISION-001D1B execution is disabled in VISION-001D1A2; use a separately approved activation harness session.')

const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim()
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
assert.equal(branch, 'feature/vision-mapper')
assert.equal(sha, 'b38a2986858315ab680e75845890b090a7c36bc2')
assert.equal(hashGit('supabase/migrations/20260723181223_vision_evidence_storage.sql'), '0b7a3f7a0c8ac2db78bc9d172c7efcdff17ed4c807867ef67af80aadc77104dd')
assert.equal(hashGit('supabase/migrations/20260724140000_vision_evidence_storage_governance.sql'), '4ba9804d27d52dd817a6237e14793239c95c85a5d3e330de2309637be949e3f2')

const ownerId = '11111111-1111-4111-8111-111111111111'
const reviewerId = '33333333-3333-4333-8333-333333333333'
const now = new Date('2026-07-24T16:00:00.000Z')
const owner = { userId: ownerId, accountStatus: 'active', permissions: [] }
const reviewer = { userId: reviewerId, accountStatus: 'active', permissions: ['vision.evidence.review'] }
const intentStore = new Map(); const evidenceStore = new Map(); const objectStore = new Map(); const audit = []; const calls = { deleted: [] }
const repository = { async createUploadIntent(value) { intentStore.set(value.id, structuredClone(value)) }, async getUploadIntent(id) { return structuredClone(intentStore.get(id) ?? null) }, async markUploadCompleted(id) { intentStore.get(id).status = 'completed' }, async markUploadAbandoned(id) { intentStore.get(id).status = 'abandoned' }, async createVerifiedEvidence(value) { evidenceStore.set(value.id, structuredClone(value)) }, async getEvidence(id) { return structuredClone(evidenceStore.get(id) ?? null) }, async findActiveBySha256(hashValue) { return [...evidenceStore.values()].find((value) => value.sha256 === hashValue && !value.deletedAt) ?? null }, async requestDeletion(id, requestedAt, reason) { Object.assign(evidenceStore.get(id), { deletionRequestedAt: requestedAt, deletionReason: reason }) }, async markDeleted(id, deletedAt) { evidenceStore.get(id).deletedAt = deletedAt }, async recordAudit(value) { audit.push(structuredClone(value)) } }
const provider = { async createSignedUploadUrl(value) { return { url: null, token: 'mock-upload-token', bucket: value.bucket, path: value.path, providerLifetimeSeconds: 7200, expiresAt: new Date(now.getTime() + 7200000).toISOString() } }, async headObject(value) { return structuredClone(objectStore.get(`${value.bucket}/${value.path}`) ?? null) }, async createSignedReadUrl(value) { return { url: 'https://signed.invalid/read', expiresAt: value.expiresAt } }, async deleteObject(value) { calls.deleted.push(value); objectStore.delete(`${value.bucket}/${value.path}`) } }
const service = new VisionEvidenceStorageService({ repository, provider, now: () => new Date(now), createId: (() => { const ids = ['44444444-4444-4444-8444-444444444444', '55555555-5555-4555-8555-555555555555']; let index = 0; return () => ids[index++] })() })
const bytes = syntheticPng(320, 200); const digest = createHash('sha256').update(bytes).digest('hex'); const inspected = inspectVisionImage(bytes, 'image/png'); assert.deepEqual(inspected, { mimeType: 'image/png', widthPx: 320, heightPx: 200 })
const created = await service.createUploadIntent(owner, { ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'synthetic harness fixture', mimeType: 'image/png', expectedBytes: bytes.byteLength, consentRecordedAt: now.toISOString() })
assert.equal(created.upload.providerLifetimeSeconds, 7200); assert.equal(new Date(created.upload.expiresAt).getTime(), now.getTime() + 7200000); assert.ok(new Date(created.intent.expiresAt) < new Date(created.upload.expiresAt))
objectStore.set(`vision-evidence/${created.intent.storagePath}`, { bucket: 'vision-evidence', path: created.intent.storagePath, bytes: bytes.byteLength, mimeType: 'image/png', sha256: digest, widthPx: inspected.widthPx, heightPx: inspected.heightPx })
const evidence = await service.completeUpload(owner, created.intent.id, { bytes: bytes.byteLength, mimeType: 'image/png', sha256: digest, widthPx: 320, heightPx: 200 }); await service.createShortLivedReadUrl(owner, evidence.id, 300); await service.requestEvidenceDeletion(owner, evidence.id, 'synthetic harness cleanup'); await service.executeRetentionDeletion(reviewer, evidence.id)
assert.equal(evidenceStore.get(evidence.id).deletedAt, now.toISOString()); assert.equal(objectStore.size, 0); assert.equal(audit.length, 4); assert.equal(calls.deleted.length, 1)
console.log(JSON.stringify({ mode: 'mocked', projectRef: 'hrvdhjscwitqpwjhnjkm', branch, sha, migrationLedger: 'read-only local preflight; no live ledger access', synthetic: { intentId: created.intent.id, evidenceId: evidence.id, path: created.intent.storagePath, sha256: digest, widthPx: 320, heightPx: 200, objectsAfterCleanup: objectStore.size, metadataAfterCleanup: 0, retainedAuditEvents: audit.length }, liveOperations: false }, null, 2))

function hashGit(path) { return createHash('sha256').update(execFileSync('git', ['show', `HEAD:${path}`])).digest('hex') }
function syntheticPng(width, height) { const bytes = new Uint8Array(45); bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]); bytes.set([0,0,0,13,0x49,0x48,0x44,0x52], 8); bytes.set([(width >>> 24) & 255,(width >>> 16) & 255,(width >>> 8) & 255,width & 255,(height >>> 24) & 255,(height >>> 16) & 255,(height >>> 8) & 255,height & 255,8,6,0,0,0], 16); bytes.set([0,0,0,0], 37); bytes.set([0x49,0x45,0x4e,0x44], 37); return bytes }
