export const VISION_INCIDENT = {
  projectRef: 'hrvdhjscwitqpwjhnjkm',
  approvedSha: '6ab837627a90ce56de1bc1f2e7170812989ae35e',
  createdIntentId: 'cb9c46a3-8731-4379-9097-6d09bd735363',
  abandonedIntentId: 'cb239170-c310-45eb-9999-9eaa637f0a7a',
  bucket: 'vision-evidence',
  objectPath: 'd245eb2e-b295-4c9b-bcef-cd134bfe981a/scan_source/cb9c46a3-8731-4379-9097-6d09bd735363.png',
  checkpoint: 'VISION-001D1B-HALTED-SYNTHETIC-ACTIVATION',
  expectedAuditEvents: 7,
} as const

export class VisionIncidentCleanupError extends Error {
  constructor(message: string) { super(message); this.name = 'VisionIncidentCleanupError' }
}

export interface IncidentIntent { id: string; status: string; ownerUserId: string; storageBucket: string; storagePath: string }
export interface IncidentState {
  intents: IncidentIntent[]
  evidenceCount: number
  auditCount: number
  bucketActive: boolean
  migrationsActive: boolean
  policiesUnchanged: boolean
  grantsUnchanged: boolean
  rlsUnchanged: boolean
  constraintsUnchanged: boolean
}
export interface IncidentCleanupGateway {
  readState(): Promise<IncidentState>
  headObject(bucket: string, path: string): Promise<unknown | null>
  markAbandoned(intentId: string, reason: string): Promise<void>
  deleteObject(bucket: string, path: string): Promise<void>
  deleteIntent(intentId: string): Promise<void>
}

export interface IncidentCleanupOptions {
  gateway?: IncidentCleanupGateway
  execute?: boolean
  approval?: boolean
  projectRef?: string
  repositorySha?: string
  checkpoint?: string
  providerCredentialExpiresAt?: string
  providerCreatedAt?: string
  now?: Date
}

function assertGate(options: IncidentCleanupOptions): void {
  if (!options.execute) return
  if (!options.approval) throw new VisionIncidentCleanupError('Explicit incident cleanup approval is required.')
  if (options.projectRef !== VISION_INCIDENT.projectRef || options.repositorySha !== VISION_INCIDENT.approvedSha) throw new VisionIncidentCleanupError('Exact project and repository gates are required.')
  if (options.checkpoint !== VISION_INCIDENT.checkpoint) throw new VisionIncidentCleanupError('The retained halted-activation checkpoint is required.')
  const now = (options.now ?? new Date()).getTime()
  const expiry = options.providerCredentialExpiresAt ? Date.parse(options.providerCredentialExpiresAt) : options.providerCreatedAt ? Date.parse(options.providerCreatedAt) + (2 * 60 * 60 + 15 * 60) * 1000 : NaN
  if (!Number.isFinite(expiry) || now + 5 * 60 * 1000 > expiry) throw new VisionIncidentCleanupError('Provider credential expiry safety margin is unavailable or insufficient.')
}

function assertState(state: IncidentState): void {
  const ids = state.intents.map((intent) => intent.id).sort()
  const expected = [VISION_INCIDENT.abandonedIntentId, VISION_INCIDENT.createdIntentId].sort()
  if (JSON.stringify(ids) !== JSON.stringify(expected)) throw new VisionIncidentCleanupError('The exact two synthetic upload intents were not found.')
  if (state.evidenceCount !== 0 || state.auditCount !== VISION_INCIDENT.expectedAuditEvents) throw new VisionIncidentCleanupError('Incident state does not match the retained synthetic checkpoint.')
  if (!state.bucketActive || !state.migrationsActive || !state.policiesUnchanged || !state.grantsUnchanged || !state.rlsUnchanged || !state.constraintsUnchanged) throw new VisionIncidentCleanupError('Governance state is not unchanged and active.')
  const created = state.intents.find((intent) => intent.id === VISION_INCIDENT.createdIntentId)
  const abandoned = state.intents.find((intent) => intent.id === VISION_INCIDENT.abandonedIntentId)
  if (!created || created.status !== 'created' || created.storageBucket !== VISION_INCIDENT.bucket || created.storagePath !== VISION_INCIDENT.objectPath) throw new VisionIncidentCleanupError('The created intent does not match the exact approved object.')
  if (!abandoned || abandoned.status !== 'abandoned') throw new VisionIncidentCleanupError('The retained abandoned intent does not match the checkpoint.')
}

export async function runVisionIncidentCleanup(options: IncidentCleanupOptions): Promise<{ mutationPerformed: boolean; objectWasPresent: boolean }> {
  assertGate(options)
  if (!options.execute) return { mutationPerformed: false, objectWasPresent: false }
  if (!options.gateway) throw new VisionIncidentCleanupError('An exact cleanup gateway is required for execution.')
  const state = await options.gateway.readState()
  assertState(state)
  const object = await options.gateway.headObject(VISION_INCIDENT.bucket, VISION_INCIDENT.objectPath)
  if (!object) throw new VisionIncidentCleanupError('The exact incident object is already absent; cleanup is not retried.')
  await options.gateway.markAbandoned(VISION_INCIDENT.createdIntentId, 'VISION-001D1B exact incident cleanup')
  await options.gateway.deleteObject(VISION_INCIDENT.bucket, VISION_INCIDENT.objectPath)
  if (await options.gateway.headObject(VISION_INCIDENT.bucket, VISION_INCIDENT.objectPath)) throw new VisionIncidentCleanupError('The exact incident object remains after deletion; intent deletion is blocked.')
  await options.gateway.deleteIntent(VISION_INCIDENT.createdIntentId)
  await options.gateway.deleteIntent(VISION_INCIDENT.abandonedIntentId)
  const finalState = await options.gateway.readState()
  if (finalState.intents.length !== 0 || finalState.evidenceCount !== 0 || finalState.auditCount !== VISION_INCIDENT.expectedAuditEvents || !finalState.bucketActive || !finalState.migrationsActive) throw new VisionIncidentCleanupError('Final exact cleanup state did not verify.')
  return { mutationPerformed: true, objectWasPresent: true }
}
