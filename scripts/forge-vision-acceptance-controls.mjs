import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const ACCEPTANCE = Object.freeze({
  projectRef: 'hrvdhjscwitqpwjhnjkm', branch: 'feature/vision-mapper', screenKeyPrefix: 'acceptance-vision-', gameKey: 'forge_acceptance',
  labelPrefix: 'Forge Vision Acceptance', layoutFamily: 'synthetic_acceptance', gameVersion: 'acceptance-only', changeNotePrefix: 'VISION-001C3 ACCEPTANCE — DISPOSABLE',
})

const sensitiveHeader = /^(authorization|cookie|set-cookie|x-api-key|x-vercel-protection-bypass|x-vercel-set-bypass-cookie)$/i
const tokenLike = /(bearer\s+)[^\s,]+|(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)|(sb_(?:secret|service_role)_[A-Za-z0-9_-]+)/gi

export function redact(value) {
  if (typeof value === 'string') return value.replace(tokenLike, (...parts) => parts[1] ? `${parts[1]}[REDACTED]` : '[REDACTED]')
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitiveHeader.test(key) || /token|secret|cookie|password|authorization|bypass/i.test(key) ? '[REDACTED]' : redact(item)]))
  return value
}

export function parseArgs(args) { const flags = new Set(args.filter((arg) => arg.startsWith('--'))); const value = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined }; return { flags, value } }
export function assertSingleMode(flags, modes) { const selected = modes.filter((mode) => flags.has(mode)); if (selected.length > 1) throw new Error(`Choose one acceptance mode only: ${modes.join(', ')}.`); return selected[0] ?? '--plan' }
export function assertRunId(runId) { if (!/^[a-z0-9][a-z0-9-]{7,63}$/i.test(runId ?? '')) throw new Error('Acceptance run ID must be a 8-64 character UUID-like identifier.'); return runId }
export function assertCorrelationId(correlationId) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(correlationId ?? '')) throw new Error('Acceptance correlation ID must be a UUID.'); return correlationId }

export function fixtureFor(runId) { assertRunId(runId); return { runId, screenKey: `${ACCEPTANCE.screenKeyPrefix}${runId.toLowerCase()}`, gameKey: ACCEPTANCE.gameKey, label: `${ACCEPTANCE.labelPrefix} ${runId}`, description: `Disposable synthetic acceptance fixture for run ${runId}. No Kingshot screen or screenshot.`, layoutFamily: ACCEPTANCE.layoutFamily, gameVersion: ACCEPTANCE.gameVersion, changeNote: `${ACCEPTANCE.changeNotePrefix} ${runId}` } }
export function repositoryState(cwd = process.cwd()) { const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim(); return { branch: git('branch', '--show-current'), sha: git('rev-parse', 'HEAD'), clean: git('status', '--porcelain') === '' } }
export function assertRepositoryGate({ approvedSha, cwd } = {}) { if (!/^[0-9a-f]{40}$/i.test(approvedSha ?? '')) throw new Error('Remote acceptance requires an explicit 40-character --approved-sha.'); return assertRepositoryState(repositoryState(cwd), approvedSha) }
export function assertRepositoryState(state, approvedSha) { if (state.branch !== ACCEPTANCE.branch) throw new Error(`Acceptance requires branch ${ACCEPTANCE.branch}.`); if (!state.clean) throw new Error('Acceptance refuses a dirty repository.'); if (state.sha !== approvedSha) throw new Error('Acceptance SHA does not match the approved execution SHA.'); return state }

export function assertDeploymentBaseUrl(value) {
  let url; try { url = new URL(value) } catch { throw new Error('Acceptance requires a valid HTTPS deployment --base-url.') }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || !url.hostname.endsWith('.vercel.app') || /-(?:git|branch)-/i.test(url.hostname)) throw new Error('Acceptance requires an exact immutable HTTPS Vercel deployment URL, without credentials, query, fragment, path, or branch alias.')
  return url
}
export function assertRemoteGuards({ mode, environment = process.env, values }) {
  if (!['--execute', '--verify'].includes(mode)) throw new Error('Remote guards require --execute or --verify.')
  if (mode === '--execute' && environment.FORGE_VISION_ACCEPTANCE_APPROVED !== 'YES') throw new Error('Execution requires FORGE_VISION_ACCEPTANCE_APPROVED=YES.')
  if (values.projectRef !== ACCEPTANCE.projectRef) throw new Error('Acceptance project reference does not match the approved project.')
  if (environment.FORGE_VISION_ACCEPTANCE_STORAGE_EXCLUDED !== 'YES') throw new Error('Remote acceptance requires FORGE_VISION_ACCEPTANCE_STORAGE_EXCLUDED=YES.')
  if (!environment.FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN) throw new Error('Remote acceptance requires a short-lived FORGE_VISION_ACCEPTANCE_ACCESS_TOKEN.')
  if (!environment.VERCEL_AUTOMATION_BYPASS_SECRET) throw new Error('Protected preview acceptance requires VERCEL_AUTOMATION_BYPASS_SECRET.')
  assertRunId(values.runId); assertDeploymentBaseUrl(values.baseUrl); if (!/^[0-9a-f]{40}$/i.test(values.approvedSha ?? '')) throw new Error('Remote acceptance requires an explicit 40-character --approved-sha.')
}
// Compatibility alias retained for local callers; execution is now SHA- and preview-bound.
export function assertExecutionGuards({ execute, environment = process.env, values }) { return assertRemoteGuards({ mode: execute ? '--execute' : '--plan', environment, values }) }

export function evidenceDirectory(environment = process.env) { const directory = environment.FORGE_VISION_ACCEPTANCE_EVIDENCE_DIR || join(tmpdir(), 'kingshot-forge-vision-acceptance-evidence'); mkdirSync(directory, { recursive: true, mode: 0o700 }); return directory }
export function checkpointPath(runId, environment = process.env) { assertRunId(runId); return join(evidenceDirectory(environment), `acceptance-checkpoint-${runId}.json`) }
export function writeCheckpoint(payload, environment = process.env) { const path = checkpointPath(payload.runId, environment); const temporary = `${path}.${randomUUID()}.tmp`; writeFileSync(temporary, `${JSON.stringify(redact(payload), null, 2)}\n`, { encoding: 'utf8', mode: 0o600 }); renameSync(temporary, path); return path }
export function readCheckpoint(runId, environment = process.env) { const path = checkpointPath(runId, environment); try { return { path, checkpoint: JSON.parse(readFileSync(path, 'utf8')) } } catch { throw new Error(`Acceptance checkpoint is required and unreadable: ${path}`) } }
export function writeEvidence(kind, payload, environment = process.env) { return writeCheckpoint({ ...payload, evidenceKind: kind }, environment) }

export function actionSequence(fixture) { return [
  { action: 'list', method: 'GET' }, { action: 'create-screen-type', method: 'POST', body: fixture },
  { action: 'create-version', method: 'POST', body: { layoutFamily: fixture.layoutFamily, gameVersion: fixture.gameVersion, changeNote: fixture.changeNote } },
  { action: 'update-metadata', method: 'POST', body: { layoutFamily: fixture.layoutFamily, gameVersion: fixture.gameVersion, changeNote: `${fixture.changeNote} metadata-updated` } },
  { action: 'submit-testing', method: 'POST', body: {} },
] }
export function newRunId() { return randomUUID() }
export function fingerprint(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }
