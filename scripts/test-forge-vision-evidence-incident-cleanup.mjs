import assert from 'node:assert/strict'
import { runVisionIncidentCleanup, VisionIncidentCleanupError, VISION_INCIDENT } from '../server/vision/evidenceIncidentCleanup.ts'

const valid = { execute: true, approval: true, projectRef: VISION_INCIDENT.projectRef, repositorySha: VISION_INCIDENT.approvedSha, checkpoint: VISION_INCIDENT.checkpoint, providerCredentialExpiresAt: '2026-07-24T15:00:00.000Z', now: new Date('2026-07-24T14:00:00.000Z') }
const baseState = () => ({ intents: [{ id: VISION_INCIDENT.createdIntentId, status: 'created', ownerUserId: 'd245eb2e-b295-4c9b-bcef-cd134bfe981a', storageBucket: VISION_INCIDENT.bucket, storagePath: VISION_INCIDENT.objectPath }, { id: VISION_INCIDENT.abandonedIntentId, status: 'abandoned', ownerUserId: 'd245eb2e-b295-4c9b-bcef-cd134bfe981a', storageBucket: VISION_INCIDENT.bucket, storagePath: 'd245eb2e-b295-4c9b-bcef-cd134bfe981a/scan_source/cb239170-c310-45eb-9999-9eaa637f0a7a.png' }], evidenceCount: 0, auditCount: 7, bucketActive: true, migrationsActive: true, policiesUnchanged: true, grantsUnchanged: true, rlsUnchanged: true, constraintsUnchanged: true })
const calls = []
const gateway = { state: baseState(), object: {}, async readState() { return this.state }, async headObject(bucket, path) { calls.push(['head', bucket, path]); const object = this.object; this.object = null; return object }, async markAbandoned(id) { calls.push(['abandon', id]) }, async deleteObject(bucket, path) { calls.push(['remove', bucket, path]) }, async deleteIntent(id) { calls.push(['delete-intent', id]); this.state.intents = this.state.intents.filter((intent) => intent.id !== id) } }

assert.deepEqual(await runVisionIncidentCleanup({}), { mutationPerformed: false, objectWasPresent: false })
await assert.rejects(() => runVisionIncidentCleanup({ ...valid, providerCredentialExpiresAt: '2026-07-24T14:03:00.000Z' }), VisionIncidentCleanupError)
await assert.rejects(() => runVisionIncidentCleanup({ ...valid, gateway: { ...gateway, state: { ...baseState(), intents: [] } } }), VisionIncidentCleanupError)
gateway.object = { exact: true }
assert.deepEqual(await runVisionIncidentCleanup({ ...valid, gateway }), { mutationPerformed: true, objectWasPresent: true })
assert.deepEqual(calls.slice(-5), [['abandon', VISION_INCIDENT.createdIntentId], ['remove', VISION_INCIDENT.bucket, VISION_INCIDENT.objectPath], ['head', VISION_INCIDENT.bucket, VISION_INCIDENT.objectPath], ['delete-intent', VISION_INCIDENT.createdIntentId], ['delete-intent', VISION_INCIDENT.abandonedIntentId]])
assert.equal(JSON.stringify(await import('../server/vision/evidenceIncidentCleanup.ts')).includes('.list('), false)
console.log('forge vision evidence incident cleanup tests: 5 passed')
