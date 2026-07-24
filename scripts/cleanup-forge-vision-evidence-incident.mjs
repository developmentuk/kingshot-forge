import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseVisionIncidentManifest, runVisionIncidentCleanup } from '../server/vision/evidenceIncidentCleanup.ts'

const execute = process.argv.includes('--execute')
if (!execute) { console.log(JSON.stringify({ mode: 'plan', mutationPerformed: false, message: 'Pass --execute with all exact gates to construct the live gateway.' }, null, 2)); process.exit(0) }

const repo = process.cwd()
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()
const manifestPath = process.env.FORGE_VISION_EVIDENCE_INCIDENT_MANIFEST_PATH
if (!manifestPath) throw new Error('FORGE_VISION_EVIDENCE_INCIDENT_MANIFEST_PATH is required for execution.')
const manifest = parseVisionIncidentManifest(JSON.parse(readFileSync(manifestPath, 'utf8')))
const branch = git('branch', '--show-current'); const sha = git('rev-parse', 'HEAD'); const clean = git('status', '--porcelain') === ''; const sync = git('rev-list', '--left-right', '--count', `HEAD...origin/${branch}`) === '0\t0'
const approvedCleanupSha = process.env.FORGE_VISION_EVIDENCE_INCIDENT_APPROVED_CLEANUP_SHA
if (!approvedCleanupSha) throw new Error('An explicit approved cleanup execution SHA is required.')
const projectRef = process.env.FORGE_VISION_EVIDENCE_INCIDENT_PROJECT_REF
const actorId = process.env.FORGE_VISION_EVIDENCE_INCIDENT_ACTOR_ID
const providerCredentialExpiresAt = process.env.FORGE_VISION_EVIDENCE_INCIDENT_PROVIDER_CREDENTIAL_EXPIRES_AT ?? manifest.providerCredentialExpiresAt
const providerCreatedAt = process.env.FORGE_VISION_EVIDENCE_INCIDENT_PROVIDER_CREATED_AT ?? manifest.providerCredentialCreatedAt
const [{ createSupabaseVisionEvidenceIncidentGateway }, { createSupabaseVisionEvidenceProvider }] = await Promise.all([import('../server/vision/evidence/supabaseVisionEvidenceIncidentGateway.ts'), import('../server/vision/evidence/supabaseVisionEvidenceProvider.ts')])
const provider = createSupabaseVisionEvidenceProvider()
const gateway = createSupabaseVisionEvidenceIncidentGateway({ provider, manifest, actorId })
const result = await runVisionIncidentCleanup({ execute: true, approval: process.env.FORGE_VISION_EVIDENCE_INCIDENT_APPROVED === 'true', manifest, projectRef, approvedCleanupSha, repositoryGate: { cwd: repo, branch, sha, clean, synchronized: sync }, providerCredentialExpiresAt, providerCreatedAt, gateway })
console.log(JSON.stringify({ mutationPerformed: result.mutationPerformed }, null, 2))
