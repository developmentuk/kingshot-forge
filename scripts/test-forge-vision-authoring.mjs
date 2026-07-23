import assert from 'node:assert/strict'
import { assertGovernedFieldTarget, canEditVisionVersion, canSubmitVisionVersion } from '../shared/domains/vision-mapper/authoring.ts'

assert.equal(canEditVisionVersion('draft'), true)
assert.equal(canEditVisionVersion('testing'), true)
assert.equal(canEditVisionVersion('published'), false)
assert.equal(canEditVisionVersion('deprecated'), false)
assert.equal(canSubmitVisionVersion('draft'), true)
assert.equal(canSubmitVisionVersion('testing'), false)
assert.doesNotThrow(() => assertGovernedFieldTarget('player.power', [{ field_key: 'player.power', label: 'Power', description: '', domain_key: 'player', owning_service: 'player', value_type: 'integer', screenshot_import_allowed: true, user_confirmation_required: true, is_enabled: true }]))
assert.throws(() => assertGovernedFieldTarget('arbitrary.table.column', []))
console.log('Forge Vision authoring tests passed: lifecycle immutability, Draft submission and governed Field Registry targeting.')
