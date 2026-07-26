import assert from 'node:assert/strict'
import { resolveVisionStudioGate } from '../shared/domains/vision-mapper/permissionTransition.ts'

assert.equal(resolveVisionStudioGate({ persistenceMigrationApplied: false, livePermissionVerified: false, authenticatedApiChecksPassed: false }), 'cms.view')
assert.equal(resolveVisionStudioGate({ persistenceMigrationApplied: true, livePermissionVerified: false, authenticatedApiChecksPassed: true }), 'cms.view')
assert.equal(resolveVisionStudioGate({ persistenceMigrationApplied: true, livePermissionVerified: true, authenticatedApiChecksPassed: true }), 'vision.admin.read')
console.log('Forge Vision permission transition tests passed: safe temporary gate and activation gate.')
