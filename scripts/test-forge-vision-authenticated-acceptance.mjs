import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ACCEPTANCE, actionSequence, assertDeploymentBaseUrl, assertRepositoryState, redact } from './forge-vision-acceptance-controls.mjs'
import { runAcceptance } from './run-forge-vision-authenticated-acceptance.mjs'
import { cleanupAcceptance } from './cleanup-forge-vision-acceptance.mjs'

const sha = 'a'.repeat(40); const runId = 'c3a1-test-0001'; const baseUrl = 'https://forge-abc123-team.vercel.app/'
const environment = { FORGE_VISION_ACCEPTANCE_APPROVED: 'YES', FORGE_VISION_ACCEPTANCE_STORAGE_EXCLUDED: 'YES', FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN: 'test-token', VERCEL_AUTOMATION_BYPASS_SECRET: 'test-bypass', FORGE_VISION_ACCEPTANCE_EVIDENCE_DIR: mkdtempSync(join(tmpdir(), 'vision-acceptance-test-')) }
const args = ['--execute', '--run-id', runId, '--project-ref', ACCEPTANCE.projectRef, '--approved-sha', sha, '--base-url', baseUrl]
const repositoryCwd = process.cwd()
let requests = 0
const plan = await runAcceptance({ args: ['--plan', '--run-id', 'c3a1-plan-check'], fetchImpl: async () => { requests += 1; throw new Error('Plan mode must not fetch.') } })
assert.equal(plan.externalRequestMade, false); assert.equal(requests, 0); assert.equal(plan.fixture.gameKey, 'forge_acceptance')
assert.deepEqual(actionSequence(plan.fixture).map((step) => step.action), ['list', 'create-screen-type', 'create-version', 'update-metadata', 'submit-testing'])
assert.throws(() => assertDeploymentBaseUrl('http://forge-abc123-team.vercel.app/'), /HTTPS/)
assert.throws(() => assertDeploymentBaseUrl('https://forge-git-feature-vision.vercel.app/'), /branch alias/)
assert.throws(() => assertRepositoryState({ branch: ACCEPTANCE.branch, clean: true, sha }, undefined), /SHA/)
assert.throws(() => assertRepositoryState({ branch: 'wrong', clean: true, sha }, sha), /branch/)
assert.deepEqual(redact({ 'x-vercel-protection-bypass': 'bypass', 'x-vercel-set-bypass-cookie': 'cookie', Authorization: 'Bearer secret-token' }), { 'x-vercel-protection-bypass': '[REDACTED]', 'x-vercel-set-bypass-cookie': '[REDACTED]', Authorization: '[REDACTED]' })

const json = (data, status = 200, contentType = 'application/json') => ({ status, headers: { get: () => contentType }, json: async () => data })
const calls = []
const fetchImpl = async (_url, options) => { calls.push(options); const action = options.method === 'GET' ? 'list' : JSON.parse(options.body).action; if (action === 'list') return json({ status: 'success', data: { screenTypes: [], versions: [], extractors: [{ plugin_key: 'ocr.tesseract.cli' }] }, meta: { deploymentSha: sha, actor: { accountStatus: 'active', permissionKeys: ['vision.admin.read', 'vision.admin.edit', 'vision.admin.test'] } } }); if (action === 'create-screen-type') return json({ data: { id: '11111111-1111-4111-8111-111111111111' } }); if (action === 'create-version') return json({ data: { id: '22222222-2222-4222-8222-222222222222' } }); return json({ data: { id: '22222222-2222-4222-8222-222222222222' } }) }
const repositoryGate = () => ({ branch: ACCEPTANCE.branch, clean: true, sha })
const execution = await runAcceptance({ args, environment, fetchImpl, cwd: repositoryCwd, repositoryGate })
assert.equal(execution.status, 'submitted-testing'); assert.equal(execution.cleanupRequired, true)
assert.equal(calls.length, 5); assert.equal(calls[1].redirect, 'manual'); assert.equal(calls[1].headers['x-vercel-protection-bypass'], 'test-bypass')
for (const call of calls.slice(1)) { const body = JSON.parse(call.body); assert.ok(body.action); assert.equal(body.acceptanceRunId, runId); assert.match(body.correlationId, /^[0-9a-f-]{36}$/i) }
assert.doesNotMatch(JSON.stringify(redact(execution)), /test-token|test-bypass/i)

await assert.rejects(() => runAcceptance({ args: [...args.slice(0, -1), 'https://forge-git-feature-vision.vercel.app/'], environment, fetchImpl, cwd: repositoryCwd, repositoryGate }), /branch alias/)
await assert.rejects(() => cleanupAcceptance({ args: ['--execute-cleanup', '--project-ref', ACCEPTANCE.projectRef, '--run-id', runId, '--screen-type-id', '33333333-3333-4333-8333-333333333333', '--mapping-version-ids', '22222222-2222-4222-8222-222222222222', '--approved-sha', sha], environment: { ...environment, FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED: 'YES', SUPABASE_URL: `https://${ACCEPTANCE.projectRef}.supabase.co` }, cwd: repositoryCwd, adminFactory: async () => { throw new Error('Cleanup must reject checkpoint mismatch before DB access.') } }), /checkpoint/)
console.log('Forge Vision authenticated acceptance controls passed: plan isolation, explicit SHA/deployment guards, protected-preview requests, JSON preflight, checkpointing, and cleanup identity refusal.')
