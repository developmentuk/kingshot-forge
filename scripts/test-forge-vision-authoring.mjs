import assert from 'node:assert/strict'
import { assertGovernedFieldTarget, canEditVisionVersion, canSubmitVisionVersion } from '../shared/domains/vision-mapper/authoring.ts'
import { acceptanceAuditContext, buildVisionAuditPayload } from '../server/vision/authoringService.ts'

assert.equal(canEditVisionVersion('draft'), true)
assert.equal(canEditVisionVersion('testing'), true)
assert.equal(canEditVisionVersion('published'), false)
assert.equal(canEditVisionVersion('deprecated'), false)
assert.equal(canSubmitVisionVersion('draft'), true)
assert.equal(canSubmitVisionVersion('testing'), false)
assert.doesNotThrow(() => assertGovernedFieldTarget('player.power', [{ field_key: 'player.power', label: 'Power', description: '', domain_key: 'player', owning_service: 'player', value_type: 'integer', screenshot_import_allowed: true, user_confirmation_required: true, is_enabled: true }]))
assert.throws(() => assertGovernedFieldTarget('arbitrary.table.column', []))
const auditContext = acceptanceAuditContext({ acceptanceRunId: 'c3a1-test-0001', correlationId: '11111111-1111-4111-8111-111111111111' })
const auditPayload = buildVisionAuditPayload({ userId: 'actor-id', accountStatus: 'active', role: 'owner', roles: ['owner'], permissionKeys: ['vision.admin.edit'], capabilities: ['vision.admin.edit'] }, auditContext)
assert.deepEqual(auditPayload, { actorId: 'actor-id', accountStatus: 'active', roles: ['owner'], acceptanceRunId: 'c3a1-test-0001', correlationId: '11111111-1111-4111-8111-111111111111' })
assert.throws(() => acceptanceAuditContext({ correlationId: 'not-a-uuid' }), /correlation/)
assert.doesNotMatch(JSON.stringify(auditPayload), /token|secret|cookie|authorization/i)
console.log('Forge Vision authoring tests passed: lifecycle immutability, Draft submission, governed Field Registry targeting and safe acceptance audit context.')
