import { ACCEPTANCE, actionSequence, assertExecutionGuards, assertRepositoryGate, assertSingleMode, fixtureFor, newRunId, parseArgs, redact, writeEvidence } from './forge-vision-acceptance-controls.mjs'
import { pathToFileURL } from 'node:url'

export async function runAcceptance({ args = process.argv.slice(2), environment = process.env, fetchImpl = globalThis.fetch, cwd = process.cwd() } = {}) {
  const { flags, value } = parseArgs(args)
  const mode = assertSingleMode(flags, ['--plan', '--execute', '--verify', '--cleanup'])
  const runId = value('--run-id') ?? newRunId()
  const fixture = fixtureFor(runId)
  const plan = { mode, runId, projectRef: value('--project-ref') ?? ACCEPTANCE.projectRef, baseUrlOrigin: value('--base-url') ? new URL(value('--base-url')).origin : null, fixture, sequence: actionSequence(fixture), storageExcluded: true, mutationPerformed: false }
  if (mode === '--plan') return { ...plan, externalRequestMade: false, databaseConnectionMade: false, note: 'Plan only. No HTTP, database or cleanup action was attempted.' }
  if (mode !== '--execute') throw new Error(`${mode} is reserved for a separately approved live acceptance session.`)
  assertExecutionGuards({ execute: true, environment, values: { projectRef: plan.projectRef, baseUrl: value('--base-url'), runId } })
  const repository = assertRepositoryGate({ approvedSha: value('--approved-sha'), cwd })
  const baseUrl = new URL(value('--base-url'))
  if (!/^https:$/.test(baseUrl.protocol)) throw new Error('Acceptance execution requires an HTTPS base URL.')
  const safeRequest = async (step, body) => {
    const response = await fetchImpl(new URL('/api/vision', baseUrl), { method: step.method, headers: { Authorization: `Bearer ${environment.FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN}`, ...(step.method === 'POST' ? { 'Content-Type': 'application/json' } : {}) }, body: step.method === 'POST' ? JSON.stringify(body) : undefined })
    const result = await response.json().catch(() => ({}))
    return { action: step.action, httpStatus: response.status, response: redact(result) }
  }
  const results = []
  const list = await safeRequest(plan.sequence[0])
  if (list.httpStatus !== 200) throw new Error(`Acceptance list gate failed with HTTP ${list.httpStatus}.`)
  results.push(list)
  const screen = await safeRequest(plan.sequence[1], fixture)
  if (screen.httpStatus !== 200) throw new Error(`Acceptance screen creation failed with HTTP ${screen.httpStatus}; cleanup is required if any fixture ID was returned.`)
  const screenTypeId = screen.response?.data?.id
  if (!screenTypeId) throw new Error('Acceptance screen creation returned no screen-type ID.')
  results.push(screen)
  const version = await safeRequest(plan.sequence[2], { ...plan.sequence[2].body, screenTypeId })
  if (version.httpStatus !== 200 || !version.response?.data?.id) throw new Error('Acceptance version creation failed; cleanup is required.')
  const versionId = version.response.data.id
  results.push(version)
  for (const step of plan.sequence.slice(3)) {
    const result = await safeRequest(step, { ...step.body, versionId })
    if (result.httpStatus !== 200) throw new Error(`Acceptance ${step.action} failed; cleanup is required.`)
    results.push(result)
  }
  const evidence = { ...plan, repository, mutationPerformed: true, created: { screenTypeId, mappingVersionIds: [versionId] }, results, timestamp: new Date().toISOString() }
  return { ...evidence, evidencePath: writeEvidence('acceptance', evidence, environment) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runAcceptance().then((result) => console.log(JSON.stringify(redact(result), null, 2))).catch((error) => { console.error(JSON.stringify({ status: 'error', message: error instanceof Error ? error.message : 'Acceptance runner failed.' })); process.exitCode = 1 })
