import { isUuid } from '../../shared/platform/vision/evidenceStorageContracts.js'

export interface VisionIncidentManifest {
  incidentKey: string
  activationSourceSha: string
  projectRef: string
  createdIntentId: string
  abandonedIntentId: string
  bucket: string
  objectPath: string
  expectedPreCleanupEvidenceCount: number
  expectedPreCleanupAuditCount: number
  expectedPostAbandonmentAuditCount: number
  expectedFinalAuditCount: number
  migrationNames: readonly string[]
  historicalObjectOwnerUuid: string
  providerCredentialCreatedAt: string | null
  providerCredentialExpiresAt: string | null
}

export const VISION_INCIDENT_MANIFEST: VisionIncidentManifest = {
  incidentKey: 'VISION-001D1B-HALTED-SYNTHETIC-ACTIVATION',
  activationSourceSha: '6ab837627a90ce56de1bc1f2e7170812989ae35e',
  projectRef: 'hrvdhjscwitqpwjhnjkm',
  createdIntentId: 'cb9c46a3-8731-4379-9097-6d09bd735363',
  abandonedIntentId: 'cb239170-c310-45eb-9999-9eaa637f0a7a',
  bucket: 'vision-evidence',
  objectPath: 'd245eb2e-b295-4c9b-bcef-cd134bfe981a/scan_source/cb9c46a3-8731-4379-9097-6d09bd735363.png',
  expectedPreCleanupEvidenceCount: 0,
  expectedPreCleanupAuditCount: 7,
  expectedPostAbandonmentAuditCount: 8,
  expectedFinalAuditCount: 8,
  migrationNames: ['20260723181223_vision_evidence_storage.sql', '20260724140000_vision_evidence_storage_governance.sql', '20260724153000_vision_evidence_adapter_support.sql'],
  historicalObjectOwnerUuid: 'd245eb2e-b295-4c9b-bcef-cd134bfe981a',
  providerCredentialCreatedAt: null,
  providerCredentialExpiresAt: null,
}

export class VisionIncidentCleanupError extends Error { constructor(message: string) { super(message); this.name = 'VisionIncidentCleanupError' } }
export interface IncidentIntent { id: string; status: string; ownerUserId: string; storageBucket: string; storagePath: string }
export interface IncidentState { intents: IncidentIntent[]; evidenceCount: number; objectCount: number; auditCount: number; bucketActive: boolean; migrationsActive: boolean; policiesUnchanged: boolean; grantsUnchanged: boolean; rlsUnchanged: boolean; constraintsUnchanged: boolean }
export interface IncidentCleanupGateway { readState(): Promise<IncidentState>; headObject(bucket: string, path: string): Promise<unknown | null>; objectExists?(bucket: string, path: string): Promise<boolean>; markAbandoned(intentId: string, reason: string): Promise<void>; deleteObject(bucket: string, path: string): Promise<void>; deleteIntent(intentId: string): Promise<void> }
export interface RepositoryGate { cwd: string; branch: string; sha: string; clean: boolean; synchronized: boolean }
export interface IncidentCleanupOptions { manifest?: VisionIncidentManifest; gateway?: IncidentCleanupGateway; execute?: boolean; approval?: boolean; projectRef?: string; approvedCleanupSha?: string; repositoryGate?: RepositoryGate; providerCredentialExpiresAt?: string | null; providerCreatedAt?: string | null; now?: Date; abandonmentReason?: string }

export function parseVisionIncidentManifest(value: unknown): VisionIncidentManifest {
  if (!value || typeof value !== 'object') throw new VisionIncidentCleanupError('A structured incident manifest is required.')
  const manifest = value as Partial<VisionIncidentManifest>
  const exact = VISION_INCIDENT_MANIFEST
  const fields: (keyof VisionIncidentManifest)[] = ['incidentKey', 'activationSourceSha', 'projectRef', 'createdIntentId', 'abandonedIntentId', 'bucket', 'objectPath', 'historicalObjectOwnerUuid']
  if (fields.some((field) => manifest[field] !== exact[field]) || manifest.expectedPreCleanupEvidenceCount !== 0 || manifest.expectedPreCleanupAuditCount !== 7 || manifest.expectedPostAbandonmentAuditCount !== 8 || manifest.expectedFinalAuditCount !== 8 || JSON.stringify(manifest.migrationNames) !== JSON.stringify(exact.migrationNames) || !isUuid(String(manifest.historicalObjectOwnerUuid))) throw new VisionIncidentCleanupError('Incident manifest fields do not match the exact retained checkpoint.')
  if (manifest.providerCredentialCreatedAt !== null && manifest.providerCredentialCreatedAt !== undefined && !Number.isFinite(Date.parse(manifest.providerCredentialCreatedAt))) throw new VisionIncidentCleanupError('Incident manifest provider creation evidence is invalid.')
  if (manifest.providerCredentialExpiresAt !== null && manifest.providerCredentialExpiresAt !== undefined && !Number.isFinite(Date.parse(manifest.providerCredentialExpiresAt))) throw new VisionIncidentCleanupError('Incident manifest provider expiry evidence is invalid.')
  return { ...exact, providerCredentialCreatedAt: manifest.providerCredentialCreatedAt ?? null, providerCredentialExpiresAt: manifest.providerCredentialExpiresAt ?? null }
}

export function assertProviderCredentialExpired(now: Date, expiresAt: string | null, createdAt: string | null): void {
  const expiry = expiresAt ? Date.parse(expiresAt) : createdAt ? Date.parse(createdAt) + 2 * 60 * 60 * 1000 : NaN
  if (!Number.isFinite(expiry) || now.getTime() < expiry + 5 * 60 * 1000) throw new VisionIncidentCleanupError('Provider credential expiry safety margin is unavailable or insufficient.')
}

export function assertRepositoryGate(gate: RepositoryGate, approvedCleanupSha: string): void {
  if (gate.branch !== 'feature/vision-mapper' || gate.sha !== approvedCleanupSha || !gate.clean || !gate.synchronized) throw new VisionIncidentCleanupError('The current branch, approved cleanup SHA, clean worktree and origin synchronization gates must all pass.')
}

function assertPreState(state: IncidentState, manifest: VisionIncidentManifest): void {
  const ids = state.intents.map((intent) => intent.id).sort(); const expected = [manifest.abandonedIntentId, manifest.createdIntentId].sort()
  if (JSON.stringify(ids) !== JSON.stringify(expected) || state.evidenceCount !== manifest.expectedPreCleanupEvidenceCount || state.objectCount !== 1 || state.auditCount !== manifest.expectedPreCleanupAuditCount || !state.bucketActive || !state.migrationsActive || !state.policiesUnchanged || !state.grantsUnchanged || !state.rlsUnchanged || !state.constraintsUnchanged) throw new VisionIncidentCleanupError('The exact retained incident precheck did not match the manifest.')
  const created = state.intents.find((intent) => intent.id === manifest.createdIntentId); const abandoned = state.intents.find((intent) => intent.id === manifest.abandonedIntentId)
  if (!created || created.status !== 'created' || created.ownerUserId !== manifest.historicalObjectOwnerUuid || created.storageBucket !== manifest.bucket || created.storagePath !== manifest.objectPath || !abandoned || abandoned.status !== 'abandoned') throw new VisionIncidentCleanupError('The exact incident intents did not match the manifest.')
}
function assertPostAbandonment(state: IncidentState, manifest: VisionIncidentManifest): void { if (state.intents.length !== 2 || state.intents.some((intent) => intent.status !== 'abandoned') || state.auditCount !== manifest.expectedPostAbandonmentAuditCount) throw new VisionIncidentCleanupError('Abandonment and its audit event were not confirmed.') }

export async function runVisionIncidentCleanup(options: IncidentCleanupOptions): Promise<{ mutationPerformed: boolean; objectWasPresent: boolean }> {
  if (!options.execute) return { mutationPerformed: false, objectWasPresent: false }
  const manifest = parseVisionIncidentManifest(options.manifest ?? VISION_INCIDENT_MANIFEST)
  if (!options.approval || options.projectRef !== manifest.projectRef || !options.approvedCleanupSha || !options.repositoryGate) throw new VisionIncidentCleanupError('Explicit approval, exact project, cleanup SHA and repository gate are required.')
  assertRepositoryGate(options.repositoryGate, options.approvedCleanupSha)
  assertProviderCredentialExpired(options.now ?? new Date(), options.providerCredentialExpiresAt ?? manifest.providerCredentialExpiresAt, options.providerCreatedAt ?? manifest.providerCredentialCreatedAt)
  if (!options.gateway) throw new VisionIncidentCleanupError('An exact live cleanup gateway is required for execution.')
  const state = await options.gateway.readState(); assertPreState(state, manifest)
  if (!await options.gateway.headObject(manifest.bucket, manifest.objectPath)) throw new VisionIncidentCleanupError('The exact incident object is absent; cleanup is not retried.')
  await options.gateway.markAbandoned(manifest.createdIntentId, options.abandonmentReason ?? 'VISION-001D1B exact incident cleanup')
  assertPostAbandonment(await options.gateway.readState(), manifest)
  await options.gateway.deleteObject(manifest.bucket, manifest.objectPath)
  if (await options.gateway.headObject(manifest.bucket, manifest.objectPath) || options.gateway.objectExists && await options.gateway.objectExists(manifest.bucket, manifest.objectPath)) throw new VisionIncidentCleanupError('The exact incident object remains or has ambiguous existence; intent deletion is blocked.')
  await options.gateway.deleteIntent(manifest.createdIntentId); await options.gateway.deleteIntent(manifest.abandonedIntentId)
  const finalState = await options.gateway.readState()
  if (finalState.intents.length !== 0 || finalState.evidenceCount !== 0 || finalState.objectCount !== 0 || finalState.auditCount !== manifest.expectedFinalAuditCount || !finalState.bucketActive || !finalState.migrationsActive || !finalState.policiesUnchanged || !finalState.grantsUnchanged || !finalState.rlsUnchanged || !finalState.constraintsUnchanged) throw new VisionIncidentCleanupError('Final exact cleanup state did not verify.')
  return { mutationPerformed: true, objectWasPresent: true }
}
