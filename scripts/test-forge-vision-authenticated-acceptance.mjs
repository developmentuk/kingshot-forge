import assert from 'node:assert/strict'
import { ACCEPTANCE, actionSequence, assertExecutionGuards, assertRepositoryState, redact } from './forge-vision-acceptance-controls.mjs'
import { runAcceptance } from './run-forge-vision-authenticated-acceptance.mjs'
import { cleanupAcceptance } from './cleanup-forge-vision-acceptance.mjs'

let requests = 0
const plan = await runAcceptance({ args: ['--plan', '--run-id', 'c3a-plan-0001'], fetchImpl: async () => { requests += 1; throw new Error('Plan mode must not fetch.') } })
assert.equal(plan.mode, '--plan')
assert.equal(plan.externalRequestMade, false)
assert.equal(plan.databaseConnectionMade, false)
assert.equal(requests, 0)
assert.equal(plan.fixture.screenKey, 'acceptance-vision-c3a-plan-0001')
assert.equal(plan.fixture.gameKey, 'forge_acceptance')
assert.match(plan.fixture.changeNote, /VISION-001C3 ACCEPTANCE — DISPOSABLE/)
assert.deepEqual(actionSequence(plan.fixture).map((step) => step.action), ['list', 'create-screen-type', 'create-version', 'update-metadata', 'submit-testing'])
assert.throws(() => assertExecutionGuards({ execute: false, values: {} }), /--execute/)
assert.throws(() => assertExecutionGuards({ execute: true, environment: {}, values: { projectRef: ACCEPTANCE.projectRef, baseUrl: 'https://example.test', runId: 'c3a-execute-0001' } }), /APPROVED/)
assert.rejects(() => cleanupAcceptance({ args: [], adminFactory: async () => { throw new Error('Cleanup must not connect before guards.') } }), /--execute-cleanup/)
assert.rejects(() => cleanupAcceptance({ args: ['--execute-cleanup', '--project-ref', ACCEPTANCE.projectRef, '--run-id', 'c3a-cleanup-0001', '--screen-type-id', '*', '--mapping-version-ids', '*'], environment: { FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED: 'YES', SUPABASE_URL: `https://${ACCEPTANCE.projectRef}.supabase.co` }, adminFactory: async () => { throw new Error('Wildcard cleanup must not connect.') } }), /screen-type UUID/)
assert.throws(() => assertRepositoryState({ branch: 'wrong', clean: true, sha: ACCEPTANCE.approvedSha }), /branch/)
assert.throws(() => assertRepositoryState({ branch: ACCEPTANCE.branch, clean: false, sha: ACCEPTANCE.approvedSha }), /dirty/)
assert.throws(() => assertRepositoryState({ branch: ACCEPTANCE.branch, clean: true, sha: 'not-the-approved-sha' }), /SHA/)
assert.deepEqual(redact({ Authorization: 'Bearer secret-token', cookie: 'session=secret', nested: { accessToken: 'eyJabc.def.ghi' } }), { Authorization: '[REDACTED]', cookie: '[REDACTED]', nested: { accessToken: '[REDACTED]' } })
assert.doesNotMatch(JSON.stringify(plan), /Bearer|eyJ|service_role|secret-token/i)
console.log('Forge Vision authenticated acceptance controls passed: plan isolation, execution/cleanup guards, synthetic fixture, action sequence, repository gate and redaction.')
