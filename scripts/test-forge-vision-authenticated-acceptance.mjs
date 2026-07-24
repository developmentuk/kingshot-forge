import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ACCEPTANCE, actionSequence, assertDeploymentBaseUrl, assertRepositoryState, redact, writeCheckpoint } from './forge-vision-acceptance-controls.mjs'
import { runAcceptance } from './run-forge-vision-authenticated-acceptance.mjs'
import { cleanupAcceptance } from './cleanup-forge-vision-acceptance.mjs'

const sha = 'a'.repeat(40)
const baseUrl = 'https://forge-abc123-team.vercel.app/'
const screenTypeId = '11111111-1111-4111-8111-111111111111'
const mappingVersionId = '22222222-2222-4222-8222-222222222222'
const runId = 'c3a2-test-0001'
const fixture = { ...((await import('./forge-vision-acceptance-controls.mjs')).fixtureFor(runId)) }

function environmentFor(prefix = 'vision-acceptance-test-') {
  return { FORGE_VISION_ACCEPTANCE_APPROVED: 'YES', FORGE_VISION_ACCEPTANCE_STORAGE_EXCLUDED: 'YES', FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN: 'test-token', VERCEL_AUTOMATION_BYPASS_SECRET: 'test-bypass', FORGE_VISION_ACCEPTANCE_EVIDENCE_DIR: mkdtempSync(join(tmpdir(), prefix)) }
}
function repositoryGate() { return { branch: ACCEPTANCE.branch, clean: true, sha } }
function response(data, status = 200) { return { status, headers: { get: () => 'application/json' }, json: async () => data } }
function listPayload({ screens = [], versions = [], actor = ['vision.admin.read', 'vision.admin.edit', 'vision.admin.test'] } = {}) { return { data: { screenTypes: screens, versions, extractors: [{ plugin_key: 'ocr.tesseract.cli' }] }, meta: { deploymentSha: sha, actor: { accountStatus: 'active', permissionKeys: actor } } } }
function screen(overrides = {}) { return { id: screenTypeId, screen_key: fixture.screenKey, game_key: fixture.gameKey, ...overrides } }
function version(overrides = {}) { return { id: mappingVersionId, screen_type_id: screenTypeId, version: 1, status: 'testing', layout_family: fixture.layoutFamily, game_version: fixture.gameVersion, change_note: `${fixture.changeNote} metadata-updated`, ...overrides } }
function checkpointEnvironment() {
  const environment = environmentFor('vision-acceptance-checkpoint-')
  writeCheckpoint({ runId, approvedSha: sha, baseUrlOrigin: new URL(baseUrl).origin, fixture, status: 'failed', cleanupRequired: true, mutationPerformed: true, created: { screenTypeId, mappingVersionIds: [mappingVersionId] } }, environment)
  return environment
}
async function verify({ screens = [screen()], versions = [version()], actor = ['vision.admin.read', 'vision.admin.edit', 'vision.admin.test'], ids = true, suppliedScreenTypeId = screenTypeId, suppliedMappingVersionIds = mappingVersionId, expectError } = {}) {
  const environment = checkpointEnvironment(); const calls = []
  const fetchImpl = async (_url, options) => { calls.push(options); return response(listPayload({ screens, versions, actor })) }
  const args = ['--verify', '--run-id', runId, '--project-ref', ACCEPTANCE.projectRef, '--approved-sha', sha, '--base-url', baseUrl, ...(ids ? ['--screen-type-id', suppliedScreenTypeId, '--mapping-version-ids', suppliedMappingVersionIds] : [])]
  if (expectError) { let caught; try { await runAcceptance({ args, environment, fetchImpl, cwd: process.cwd(), repositoryGate }) } catch (error) { caught = error } assert.ok(caught); assert.match(caught.cause?.message ?? caught.message, expectError) } else { const result = await runAcceptance({ args, environment, fetchImpl, cwd: process.cwd(), repositoryGate }); assert.equal(result.status, 'verified'); assert.equal(result.cleanupRequired, true); assert.equal(result.mutationPerformed, true); assert.deepEqual(result.created, { screenTypeId, mappingVersionIds: [mappingVersionId] }); assert.equal(calls.length, 1); assert.equal(calls[0].method, 'GET'); assert.equal(calls[0].body, undefined); const checkpoint = JSON.parse(readFileSync(result.checkpointPath, 'utf8')); assert.equal(checkpoint.status, 'verified'); assert.equal(checkpoint.cleanupRequired, true) }
}

const plan = await runAcceptance({ args: ['--plan', '--run-id', 'c3a2-plan-check'], fetchImpl: async () => { throw new Error('Plan mode must not fetch.') } })
assert.equal(plan.externalRequestMade, false); assert.equal(plan.databaseConnectionMade, false); assert.deepEqual(actionSequence(plan.fixture).map((step) => step.action), ['list', 'create-screen-type', 'create-version', 'update-metadata', 'submit-testing'])
assert.throws(() => assertDeploymentBaseUrl('http://forge-abc123-team.vercel.app/'), /HTTPS/)
assert.throws(() => assertDeploymentBaseUrl('https://forge-git-feature-vision.vercel.app/'), /branch alias/)
assert.throws(() => assertRepositoryState({ branch: ACCEPTANCE.branch, clean: true, sha }, undefined), /SHA/)
assert.throws(() => assertRepositoryState({ branch: 'wrong', clean: true, sha }, sha), /branch/)
assert.deepEqual(redact({ 'x-vercel-protection-bypass': 'bypass', 'x-vercel-set-bypass-cookie': 'cookie', Authorization: 'Bearer secret-token' }), { 'x-vercel-protection-bypass': '[REDACTED]', 'x-vercel-set-bypass-cookie': '[REDACTED]', Authorization: '[REDACTED]' })

const executeEnvironment = environmentFor('vision-acceptance-execute-'); const executeCalls = []
const executeArgs = ['--execute', '--run-id', runId, '--project-ref', ACCEPTANCE.projectRef, '--approved-sha', sha, '--base-url', baseUrl]
const executeFetch = async (_url, options) => { executeCalls.push(options); const action = options.method === 'GET' ? 'list' : JSON.parse(options.body).action; if (action === 'list') return response(listPayload()); if (action === 'create-screen-type') return response({ data: { id: screenTypeId } }); if (action === 'create-version') return response({ data: { id: mappingVersionId } }); return response({ data: { id: mappingVersionId } }) }
const execution = await runAcceptance({ args: executeArgs, environment: executeEnvironment, fetchImpl: executeFetch, cwd: process.cwd(), repositoryGate }); assert.equal(execution.status, 'submitted-testing'); assert.equal(execution.cleanupRequired, true); assert.equal(executeCalls.length, 5); assert.doesNotMatch(JSON.stringify(redact(execution)), /test-token|test-bypass/i)
const collisionEnvironment = environmentFor('vision-acceptance-collision-'); const collisionCalls = []
let collisionError; try { await runAcceptance({ args: executeArgs, environment: collisionEnvironment, fetchImpl: async (_url, options) => { collisionCalls.push(options); return response(listPayload({ screens: [screen()] })) }, cwd: process.cwd(), repositoryGate }) } catch (error) { collisionError = error } assert.ok(collisionError); assert.match(collisionError.cause?.message ?? collisionError.message, /collision/); assert.equal(collisionCalls.length, 1)

await verify()
await verify({ ids: false, expectError: /exact comma-separated mapping-version IDs/ })
await verify({ suppliedScreenTypeId: '33333333-3333-4333-8333-333333333333', expectError: /exactly match the retained acceptance checkpoint/ })
await verify({ suppliedMappingVersionIds: '33333333-3333-4333-8333-333333333333', expectError: /exactly match the retained acceptance checkpoint/ })
await verify({ actor: ['vision.admin.read'], expectError: /did not attest/ })
await verify({ screens: [screen(), screen({ id: '33333333-3333-4333-8333-333333333333', screen_key: `other-${runId}` })], expectError: /additional synthetic screen/ })
await verify({ versions: [version(), version({ id: '33333333-3333-4333-8333-333333333333', change_note: `${fixture.changeNote} extra` })], expectError: /additional mapping version/ })
await verify({ versions: [version({ status: 'draft' })], expectError: /incomplete or incorrect/ })
await verify({ versions: [version({ game_version: 'wrong' })], expectError: /incomplete or incorrect/ })

const childInspections = ['vision_mapping_reference_images', 'vision_regions', 'vision_field_mappings', 'vision_test_cases', 'vision_test_results', 'vision_scan_runs', 'vision_extraction_evidence']
function queryResult(data, error = null) { const result = { data, error, count: Array.isArray(data) ? data.length : 0 }; const query = { ...result, _result: result, select() { return query }, eq() { return query }, in() { return query }, maybeSingle() { return query }, delete() { query.deleted = true; return query }, then(resolve, reject) { return Promise.resolve(result).then(resolve, reject) } }; return query }
function mockedAdmin({ childCounts = {}, childError = null, versionStatus = 'testing', auditPayload = {}, operations = [] } = {}) {
  let deletedVersions = false; let deletedScreen = false
  return { operations, from(table) {
    if (table === 'vision_screen_types') { const query = queryResult(deletedScreen ? null : { id: screenTypeId, screen_key: fixture.screenKey, game_key: fixture.gameKey, label: fixture.label, description: fixture.description }, null); query.delete = () => { operations.push('delete:vision_screen_types'); deletedScreen = true; return queryResult(null) }; return query }
    if (table === 'vision_mapping_versions') { const result = deletedVersions ? [] : [{ id: mappingVersionId, status: versionStatus, screen_type_id: screenTypeId, change_note: `${fixture.changeNote} metadata-updated` }]; const query = queryResult(result); query.delete = () => { operations.push('delete:vision_mapping_versions'); deletedVersions = true; return queryResult(null) }; return query }
    if (childInspections.includes(table)) { operations.push(`inspect:${table}`); const query = queryResult(null, childError === table ? new Error('mock query error') : null); const originalSelect = query.select; query.select = (column) => { operations.push(`select:${column}`); return originalSelect.call(query, column) }; query.count = childCounts[table] ?? 0; query._result.count = query.count; return query }
    if (table === 'vision_audit_events') { operations.push('inspect:vision_audit_events'); return queryResult([{ id: 'audit-1', entity_id: screenTypeId, payload: auditPayload }, { id: 'audit-2', entity_id: mappingVersionId, payload: {} }, { id: 'audit-3', entity_id: mappingVersionId, payload: {} }, { id: 'audit-4', entity_id: mappingVersionId, payload: {} }]) }
    throw new Error(`unexpected table ${table}`)
  } }
}
function cleanupArgs(environment, extra = []) { return ['--execute-cleanup', '--project-ref', ACCEPTANCE.projectRef, '--run-id', runId, '--screen-type-id', screenTypeId, '--mapping-version-ids', mappingVersionId, '--approved-sha', sha, ...extra] }
const cleanupEnvironment = checkpointEnvironment(); cleanupEnvironment.FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED = 'YES'; cleanupEnvironment.SUPABASE_URL = `https://${ACCEPTANCE.projectRef}.supabase.co`
const cleanupOperations = []; const cleanupAdmin = mockedAdmin({ operations: cleanupOperations })
const cleaned = await cleanupAcceptance({ args: cleanupArgs(cleanupEnvironment), environment: cleanupEnvironment, cwd: process.cwd(), repositoryGate, adminFactory: async () => cleanupAdmin }); assert.equal(cleaned.status, 'cleaned'); assert.equal(cleaned.cleanupRequired, false); assert.equal(cleaned.deleted, true); assert.deepEqual(cleanupOperations.slice(-2), ['delete:vision_mapping_versions', 'delete:vision_screen_types']); assert.equal(cleanupOperations.filter((operation) => operation.startsWith('delete:') && operation.includes('audit')).length, 0); assert.equal(cleanupOperations.filter((operation) => operation === 'select:mapping_version_id').length, childInspections.length); assert.ok(cleanupOperations.every((operation) => !/[?*%]/.test(operation)))

for (const table of childInspections) { const environment = checkpointEnvironment(); environment.FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED = 'YES'; environment.SUPABASE_URL = `https://${ACCEPTANCE.projectRef}.supabase.co`; const args = cleanupArgs(environment); await assert.rejects(() => cleanupAcceptance({ args, environment, cwd: process.cwd(), repositoryGate, adminFactory: async () => mockedAdmin({ childCounts: { [table]: 1 } }) }), /unexpected child/) }
const errorEnvironment = checkpointEnvironment(); errorEnvironment.FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED = 'YES'; errorEnvironment.SUPABASE_URL = `https://${ACCEPTANCE.projectRef}.supabase.co`; await assert.rejects(() => cleanupAcceptance({ args: cleanupArgs(errorEnvironment), environment: errorEnvironment, cwd: process.cwd(), repositoryGate, adminFactory: async () => mockedAdmin({ childError: 'vision_mapping_reference_images' }) }), /child inspection/)
const auditEnvironment = checkpointEnvironment(); auditEnvironment.FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED = 'YES'; auditEnvironment.SUPABASE_URL = `https://${ACCEPTANCE.projectRef}.supabase.co`; await assert.rejects(() => cleanupAcceptance({ args: cleanupArgs(auditEnvironment), environment: auditEnvironment, cwd: process.cwd(), repositoryGate, adminFactory: async () => mockedAdmin({ auditPayload: { note: 'Bearer leaked' } }) }), /credentials/)
const mismatchEnvironment = checkpointEnvironment(); mismatchEnvironment.FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED = 'YES'; mismatchEnvironment.SUPABASE_URL = `https://${ACCEPTANCE.projectRef}.supabase.co`; const mismatchArgs = cleanupArgs(mismatchEnvironment); mismatchArgs[mismatchArgs.indexOf('--screen-type-id') + 1] = '33333333-3333-4333-8333-333333333333'; let dbCreated = false; await assert.rejects(() => cleanupAcceptance({ args: mismatchArgs, environment: mismatchEnvironment, cwd: process.cwd(), repositoryGate, adminFactory: async () => { dbCreated = true; return mockedAdmin() } }), /checkpoint/); assert.equal(dbCreated, false)
const publishedEnvironment = checkpointEnvironment(); publishedEnvironment.FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED = 'YES'; publishedEnvironment.SUPABASE_URL = `https://${ACCEPTANCE.projectRef}.supabase.co`; await assert.rejects(() => cleanupAcceptance({ args: cleanupArgs(publishedEnvironment), environment: publishedEnvironment, cwd: process.cwd(), repositoryGate, adminFactory: async () => mockedAdmin({ versionStatus: 'published' }) }), /non-acceptance/)
const deprecatedEnvironment = checkpointEnvironment(); deprecatedEnvironment.FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED = 'YES'; deprecatedEnvironment.SUPABASE_URL = `https://${ACCEPTANCE.projectRef}.supabase.co`; await assert.rejects(() => cleanupAcceptance({ args: cleanupArgs(deprecatedEnvironment), environment: deprecatedEnvironment, cwd: process.cwd(), repositoryGate, adminFactory: async () => mockedAdmin({ versionStatus: 'deprecated' }) }), /non-acceptance/)

console.log('Forge Vision authenticated acceptance controls passed: offline plan, execute collision isolation, exact read-only verify rules, mocked schema-aware cleanup, exact deletion order, audit retention, redaction and fail-closed guards.')
