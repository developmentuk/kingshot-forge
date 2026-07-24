import { ACCEPTANCE, actionSequence, assertCorrelationId, assertDeploymentBaseUrl, assertRemoteGuards, assertRepositoryGate, assertSingleMode, fixtureFor, newRunId, parseArgs, readCheckpoint, redact, writeCheckpoint } from './forge-vision-acceptance-controls.mjs'
import { pathToFileURL } from 'node:url'

function fail(message, checkpoint, cause) { const error = new Error(message); error.acceptanceResult = { ...checkpoint, failure: { step: checkpoint.failedStep ?? 'unknown', status: checkpoint.status, cleanupRequired: checkpoint.cleanupRequired, checkpointPath: checkpoint.checkpointPath } }; error.cause = cause; throw error }
function responseError(response, baseUrl) { return `Acceptance request failed with HTTP ${response.status} from ${baseUrl.hostname}.` }
function assertListPreflight(result) {
  const data = result.data; const meta = result.meta
  if (!Array.isArray(data?.screenTypes) || !Array.isArray(data?.versions) || !Array.isArray(data?.extractors)) throw new Error('Acceptance list preflight returned an incomplete Forge payload.')
  if (!meta?.deploymentSha || !meta?.actor || meta.actor.accountStatus !== 'active' || !['vision.admin.read', 'vision.admin.edit', 'vision.admin.test'].every((permission) => meta.actor.permissionKeys?.includes(permission))) throw new Error('Acceptance list preflight did not attest the deployment SHA and active actor permissions.')
  if (!data.extractors.some((extractor) => extractor.plugin_key === 'ocr.tesseract.cli')) throw new Error('Acceptance preflight requires canonical ocr.tesseract.cli extractor availability.')
  return meta
}
function assertExecuteCollision(data, fixture) {
  if (data.screenTypes.some((screen) => screen.screen_key === fixture.screenKey) || data.versions.some((version) => String(version.change_note ?? '').includes(fixture.runId))) throw new Error('Acceptance collision scan found an existing synthetic fixture for this run ID.')
}
function exactIds(value, label) {
  const ids = (value ?? '').split(',').filter(Boolean)
  if (!ids.length || ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id)) || new Set(ids).size !== ids.length) throw new Error(`Verification requires exact ${label}.`)
  return ids
}
function assertHandoverMode(mode, checkpointApprovedSha, checkpointBaseUrl) {
  const hasSha = checkpointApprovedSha !== undefined
  const hasUrl = checkpointBaseUrl !== undefined
  if (mode !== '--verify' && (hasSha || hasUrl)) throw new Error('Checkpoint provenance handover flags are valid only with --verify.')
  if (mode === '--verify' && hasSha !== hasUrl) throw new Error('Verify provenance handover requires both --checkpoint-approved-sha and --checkpoint-base-url.')
}
function provenanceGuards(checkpoint, { approvedSha, baseUrl, checkpointApprovedSha, checkpointBaseUrl }) {
  const checkpointOrigin = checkpoint.baseUrlOrigin
  const sameProvenance = checkpoint.approvedSha === approvedSha && checkpointOrigin === baseUrl.origin
  if (!sameProvenance && (checkpointApprovedSha === undefined || checkpointBaseUrl === undefined)) throw new Error('Cross-provenance verification requires explicit checkpoint provenance handover flags.')
  if (checkpointApprovedSha !== undefined && !/^[0-9a-f]{40}$/i.test(checkpointApprovedSha)) throw new Error('Checkpoint approved SHA must be an exact 40-character SHA.')
  if (checkpointApprovedSha !== undefined && checkpoint.approvedSha !== checkpointApprovedSha) throw new Error('Checkpoint approved SHA does not match the retained checkpoint.')
  if (checkpointBaseUrl !== undefined) {
    const handoverUrl = assertDeploymentBaseUrl(checkpointBaseUrl)
    if (checkpointOrigin !== handoverUrl.origin) throw new Error('Checkpoint base URL origin does not match the retained checkpoint.')
  }
  return { sameProvenance, handoverUsed: !sameProvenance, checkpointApprovedSha: checkpointApprovedSha ?? checkpoint.approvedSha, checkpointBaseUrlOrigin: checkpointBaseUrl ? new URL(checkpointBaseUrl).origin : checkpointOrigin }
}
function executionProvenance(checkpoint) {
  const original = checkpoint.executionProvenance ?? {}
  return { ...original, approvedSha: original.approvedSha ?? checkpoint.approvedSha, baseUrlOrigin: original.baseUrlOrigin ?? checkpoint.baseUrlOrigin, ...(original.correlationId || !checkpoint.correlationId ? {} : { correlationId: checkpoint.correlationId }), ...(original.timestamp || !checkpoint.timestamp ? {} : { timestamp: checkpoint.timestamp }) }
}
function assertFixtureState(data, checkpoint, fixture, screenTypeId, mappingVersionIds) {
  const screens = data.screenTypes ?? []
  const matchingScreens = screens.filter((item) => item.screen_key === fixture.screenKey)
  if (matchingScreens.length !== 1 || matchingScreens[0].id !== screenTypeId || matchingScreens[0].game_key !== fixture.gameKey) throw new Error('Verification did not find exactly the checkpoint synthetic screen type.')
  const runIdScreens = screens.filter((item) => String(item.screen_key ?? '').toLowerCase().includes(fixture.runId.toLowerCase()))
  if (runIdScreens.length !== 1 || runIdScreens[0].id !== screenTypeId) throw new Error('Verification found an additional synthetic screen carrying the run ID.')
  const runIdVersions = (data.versions ?? []).filter((item) => String(item.change_note ?? '').includes(fixture.runId))
  const expectedSet = new Set(mappingVersionIds)
  if (runIdVersions.length !== mappingVersionIds.length || runIdVersions.some((item) => !expectedSet.has(item.id))) throw new Error('Verification found an additional mapping version carrying the run ID.')
  const versions = (data.versions ?? []).filter((item) => expectedSet.has(item.id))
  if (versions.length !== mappingVersionIds.length || versions.some((item) => item.screen_type_id !== screenTypeId || item.version !== 1 || item.status !== 'testing' || item.layout_family !== fixture.layoutFamily || item.game_version !== fixture.gameVersion || item.change_note !== `${fixture.changeNote} metadata-updated`)) throw new Error('Verification found incomplete or incorrect synthetic mapping-version state.')
}

export async function runAcceptance({ args = process.argv.slice(2), environment = process.env, fetchImpl = globalThis.fetch, cwd = process.cwd(), repositoryGate = assertRepositoryGate } = {}) {
  const { flags, value } = parseArgs(args)
  if (flags.has('--cleanup')) throw new Error('Cleanup is a separate command: use scripts/cleanup-forge-vision-acceptance.mjs --execute-cleanup.')
  const mode = assertSingleMode(flags, ['--plan', '--execute', '--verify'])
  const checkpointApprovedShaArg = value('--checkpoint-approved-sha'); const checkpointBaseUrlArg = value('--checkpoint-base-url')
  assertHandoverMode(mode, checkpointApprovedShaArg, checkpointBaseUrlArg)
  const runId = value('--run-id') ?? newRunId(); const fixture = fixtureFor(runId); const approvedSha = value('--approved-sha')
  const plan = { mode, runId, projectRef: value('--project-ref') ?? ACCEPTANCE.projectRef, approvedSha: approvedSha ?? null, baseUrlOrigin: value('--base-url') ? new URL(value('--base-url')).origin : null, fixture, sequence: actionSequence(fixture), storageExcluded: true, mutationPerformed: false }
  if (mode === '--plan') return { ...plan, externalRequestMade: false, databaseConnectionMade: false, note: 'Plan only. No HTTP, database, storage, or cleanup action was attempted.' }
  assertRemoteGuards({ mode, environment, values: { projectRef: plan.projectRef, baseUrl: value('--base-url'), runId, approvedSha } })
  const repository = repositoryGate({ approvedSha, cwd }); const baseUrl = assertDeploymentBaseUrl(value('--base-url')); const correlationId = value('--correlation-id') ?? newRunId(); assertCorrelationId(correlationId)
  let checkpoint = mode === '--verify'
    ? readCheckpoint(runId, environment).checkpoint
    : { ...plan, repository, correlationId, checkpointPath: null, status: 'planned', cleanupRequired: false, created: { screenTypeId: null, mappingVersionIds: [] }, mutationPerformed: false, timestamp: new Date().toISOString() }
  const provenance = mode === '--verify' ? provenanceGuards(checkpoint, { approvedSha, baseUrl, checkpointApprovedSha: checkpointApprovedShaArg, checkpointBaseUrl: checkpointBaseUrlArg }) : null
  const verifyScreenTypeId = mode === '--verify' ? value('--screen-type-id') : null
  const verifyMappingVersionIds = mode === '--verify' ? exactIds(value('--mapping-version-ids'), 'comma-separated mapping-version IDs') : []
  if (mode === '--verify' && checkpoint.deleted === true) throw new Error('Verification refuses a checkpoint already marked deleted.')
  if (mode === '--verify' && (checkpoint.runId !== runId || !/^[0-9a-f-]{36}$/i.test(verifyScreenTypeId ?? '') || verifyScreenTypeId !== checkpoint.created?.screenTypeId || verifyMappingVersionIds.join(',') !== (checkpoint.created?.mappingVersionIds ?? []).join(','))) throw new Error('Verification IDs must exactly match the retained acceptance checkpoint.')
  checkpoint.checkpointPath = writeCheckpoint(checkpoint, environment)
  const save = (patch) => { checkpoint = { ...checkpoint, ...patch, timestamp: new Date().toISOString() }; checkpoint.checkpointPath = writeCheckpoint(checkpoint, environment); return checkpoint }
  const safeRequest = async (step, body) => {
    const response = await fetchImpl(new URL('/api/vision', baseUrl), { method: step.method, redirect: 'manual', headers: { Authorization: `Bearer ${environment.FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN}`, 'x-vercel-protection-bypass': environment.VERCEL_AUTOMATION_BYPASS_SECRET, ...(step.method === 'POST' ? { 'Content-Type': 'application/json' } : {}) }, body: step.method === 'POST' ? JSON.stringify({ action: step.action, ...body, acceptanceRunId: runId, correlationId }) : undefined })
    if (response.status >= 300 && response.status < 400) throw new Error(`Protected preview redirect/configuration failure (HTTP ${response.status} from ${baseUrl.hostname}).`)
    const contentType = response.headers?.get?.('content-type') ?? ''
    if (!contentType.toLowerCase().includes('application/json')) throw new Error(`Acceptance expected JSON from ${baseUrl.hostname}, received HTTP ${response.status}.`)
    let result; try { result = await response.json() } catch { throw new Error(`Acceptance received invalid JSON from ${baseUrl.hostname}.`) }
    if (response.status !== 200) throw new Error(responseError(response, baseUrl))
    return result
  }
  try {
    const list = await safeRequest(plan.sequence[0])
    const meta = assertListPreflight(list)
    if (meta.deploymentSha !== approvedSha) throw new Error('Acceptance deployment SHA attestation does not match --approved-sha.')
    if (mode === '--verify') {
      assertFixtureState(list.data, checkpoint, fixture, verifyScreenTypeId, verifyMappingVersionIds)
      return { ...save({ status: 'verified', cleanupRequired: true, created: { screenTypeId: verifyScreenTypeId, mappingVersionIds: verifyMappingVersionIds }, mutationPerformed: checkpoint.mutationPerformed, deleted: checkpoint.deleted, executionProvenance: executionProvenance(checkpoint), verificationProvenance: { approvedSha, baseUrlOrigin: baseUrl.origin, deploymentSha: meta.deploymentSha, verifiedAt: new Date().toISOString(), handoverUsed: provenance.handoverUsed, checkpointApprovedSha: provenance.checkpointApprovedSha, checkpointBaseUrlOrigin: provenance.checkpointBaseUrlOrigin }, verification: { deploymentSha: meta.deploymentSha, actor: meta.actor } }), externalRequestMade: true }
    }
    assertExecuteCollision(list.data, fixture)
    const screen = await safeRequest(plan.sequence[1], fixture); const screenTypeId = screen.data?.id
    if (!screenTypeId) throw new Error('Acceptance screen creation returned no screen-type ID.')
    save({ status: 'screen-created', failedStep: undefined, cleanupRequired: true, mutationPerformed: true, created: { screenTypeId, mappingVersionIds: [] } })
    const version = await safeRequest(plan.sequence[2], { ...plan.sequence[2].body, screenTypeId }); const versionId = version.data?.id
    if (!versionId) throw new Error('Acceptance version creation returned no mapping-version ID.')
    save({ status: 'version-created', created: { screenTypeId, mappingVersionIds: [versionId] } })
    await safeRequest(plan.sequence[3], { ...plan.sequence[3].body, versionId }); save({ status: 'metadata-updated' })
    await safeRequest(plan.sequence[4], { versionId }); save({ status: 'submitted-testing' })
    return { ...checkpoint, externalRequestMade: true }
  } catch (cause) {
    save({ status: 'failed', failedStep: checkpoint.status, failureMessage: cause instanceof Error ? cause.message : 'Acceptance runner failed.' })
    fail('Acceptance execution stopped; inspect the retained checkpoint and run separately approved cleanup if required.', checkpoint, cause)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runAcceptance().then((result) => console.log(JSON.stringify(redact(result), null, 2))).catch((error) => { console.error(JSON.stringify(redact(error.acceptanceResult ?? { status: 'error', message: error instanceof Error ? error.message : 'Acceptance runner failed.' }), null, 2)); process.exitCode = 1 })
