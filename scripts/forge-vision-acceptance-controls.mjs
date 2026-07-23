import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const ACCEPTANCE = Object.freeze({
  projectRef: 'hrvdhjscwitqpwjhnjkm',
  branch: 'feature/vision-mapper',
  approvedSha: '1789f38af4262aae8d5cc5d963be9d2dab6e43a4',
  screenKeyPrefix: 'acceptance-vision-',
  gameKey: 'forge_acceptance',
  labelPrefix: 'Forge Vision Acceptance',
  layoutFamily: 'synthetic_acceptance',
  gameVersion: 'acceptance-only',
  changeNotePrefix: 'VISION-001C3 ACCEPTANCE — DISPOSABLE',
})

const sensitiveHeader = /^(authorization|cookie|set-cookie|x-api-key)$/i
const tokenLike = /(bearer\s+)[^\s,]+|(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)|(sb_(?:secret|service_role)_[A-Za-z0-9_-]+)/gi

export function redact(value) {
  if (typeof value === 'string') return value.replace(tokenLike, (...parts) => parts[1] ? `${parts[1]}[REDACTED]` : '[REDACTED]')
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitiveHeader.test(key) || /token|secret|cookie|password|authorization/i.test(key) ? '[REDACTED]' : redact(item)]))
  return value
}

export function parseArgs(args) {
  const flags = new Set(args.filter((arg) => arg.startsWith('--')))
  const value = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined }
  return { flags, value }
}

export function assertSingleMode(flags, modes) {
  const selected = modes.filter((mode) => flags.has(mode))
  if (selected.length > 1) throw new Error(`Choose one acceptance mode only: ${modes.join(', ')}.`)
  return selected[0] ?? '--plan'
}

export function fixtureFor(runId) {
  if (!/^[a-z0-9][a-z0-9-]{7,63}$/i.test(runId)) throw new Error('Acceptance run ID must be a 8-64 character UUID-like identifier.')
  return {
    runId,
    screenKey: `${ACCEPTANCE.screenKeyPrefix}${runId.toLowerCase()}`,
    gameKey: ACCEPTANCE.gameKey,
    label: `${ACCEPTANCE.labelPrefix} ${runId}`,
    description: `Disposable synthetic acceptance fixture for run ${runId}. No Kingshot screen or screenshot.`,
    layoutFamily: ACCEPTANCE.layoutFamily,
    gameVersion: ACCEPTANCE.gameVersion,
    changeNote: `${ACCEPTANCE.changeNotePrefix} ${runId}`,
  }
}

export function repositoryState(cwd = process.cwd()) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
  return { branch: git('branch', '--show-current'), sha: git('rev-parse', 'HEAD'), clean: git('status', '--porcelain') === '' }
}

export function assertRepositoryGate({ approvedSha, cwd } = {}) {
  const state = repositoryState(cwd)
  return assertRepositoryState(state, approvedSha)
}

export function assertRepositoryState(state, approvedSha = ACCEPTANCE.approvedSha) {
  if (state.branch !== ACCEPTANCE.branch) throw new Error(`Acceptance requires branch ${ACCEPTANCE.branch}.`)
  if (!state.clean) throw new Error('Acceptance refuses a dirty repository.')
  if (state.sha !== approvedSha) throw new Error('Acceptance SHA does not match the approved execution SHA.')
  return state
}

export function assertExecutionGuards({ execute, environment = process.env, values }) {
  if (!execute) throw new Error('Execution requires --execute.')
  if (environment.FORGE_VISION_ACCEPTANCE_APPROVED !== 'YES') throw new Error('Execution requires FORGE_VISION_ACCEPTANCE_APPROVED=YES.')
  if (values.projectRef !== ACCEPTANCE.projectRef) throw new Error('Acceptance project reference does not match the approved project.')
  if (!values.baseUrl) throw new Error('Execution requires an explicit --base-url.')
  if (environment.FORGE_VISION_ACCEPTANCE_STORAGE_EXCLUDED !== 'YES') throw new Error('Execution requires FORGE_VISION_ACCEPTANCE_STORAGE_EXCLUDED=YES.')
  if (!environment.FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN) throw new Error('Execution requires a short-lived FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN.')
  if (!values.runId) throw new Error('Execution requires an exact --run-id.')
}

export function evidencePath(kind, runId, environment = process.env) {
  const directory = environment.FORGE_VISION_ACCEPTANCE_EVIDENCE_DIR || join(tmpdir(), 'kingshot-forge-vision-acceptance-evidence')
  mkdirSync(directory, { recursive: true })
  return join(directory, `${kind}-${runId}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
}

export function writeEvidence(kind, payload, environment = process.env) {
  const path = evidencePath(kind, payload.runId, environment)
  writeFileSync(path, `${JSON.stringify(redact(payload), null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  return path
}

export function actionSequence(fixture) {
  return [
    { action: 'list', method: 'GET' },
    { action: 'create-screen-type', method: 'POST', body: fixture },
    { action: 'create-version', method: 'POST', body: { layoutFamily: fixture.layoutFamily, gameVersion: fixture.gameVersion, changeNote: fixture.changeNote } },
    { action: 'update-metadata', method: 'POST', body: { layoutFamily: fixture.layoutFamily, gameVersion: fixture.gameVersion, changeNote: `${fixture.changeNote} metadata-updated` } },
    { action: 'submit-testing', method: 'POST', body: {} },
  ]
}

export function newRunId() { return randomUUID() }
export function fingerprint(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }
