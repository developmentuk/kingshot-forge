import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor, type ForgeActor } from '../server/auth/requireForgeActor.js'
import { VisionEvidenceStorageError } from '../server/vision/evidenceStorageService.js'
import { createSupabaseVisionEvidenceStorageService } from '../server/vision/evidence/supabaseVisionEvidenceRuntime.js'
import { isUuid, isVisionEvidenceMimeType, type VisionEvidenceActor, type VisionEvidencePurpose } from '../shared/platform/vision/evidenceStorageContracts.js'

const ACTIONS = new Set(['create-upload-intent', 'complete-upload', 'abandon-upload', 'cancel-evidence', 'get-evidence-metadata', 'get-active-acceptance-evidence', 'get-acceptance-recovery', 'create-read-url', 'request-deletion', 'execute-retention-deletion'])
const PURPOSES = new Set(['mapping_reference', 'test_case', 'scan_source', 'evidence_crop'])

export function mapVisionEvidenceErrorStatus(error: VisionEvidenceStorageError): number {
  return error.code === 'unauthorised' ? 401 : error.code === 'forbidden' ? 403 : error.code === 'not_found' || error.code === 'intent_not_found' ? 404 : 422
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  try {
    const actor = await requireForgeActor(request)
    const body = request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
    const action = typeof body.action === 'string' ? body.action : typeof request.query.action === 'string' ? request.query.action : ''
    if (request.method !== 'POST' || !ACTIONS.has(action)) { response.setHeader('Allow', 'POST'); response.status(405).json({ status: 'error', message: 'A supported POST evidence action is required.' }); return }
    const service = createSupabaseVisionEvidenceStorageService()
    const data = await dispatch(service, toEvidenceActor(actor), action, body)
    response.status(200).json({ status: 'success', data })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) { response.status(error.statusCode).json({ status: 'error', message: error.message }); return }
    if (error instanceof VisionEvidenceStorageError) { response.status(mapVisionEvidenceErrorStatus(error)).json({ status: 'error', code: error.code, message: error.message }); return }
    console.error('[vision-evidence]', error instanceof Error ? error.name : 'UnknownError')
    response.status(500).json({ status: 'error', message: 'The Vision evidence service is temporarily unavailable.' })
  }
}

async function dispatch(service: ReturnType<typeof createSupabaseVisionEvidenceStorageService>, actor: VisionEvidenceActor, action: string, body: Record<string, unknown>): Promise<unknown> {
  const allowed: Record<string, string[]> = { 'create-upload-intent': ['action', 'ownerUserId', 'purpose', 'uploadPurpose', 'mimeType', 'expectedBytes', 'consentRecordedAt', 'retentionUntil'], 'complete-upload': ['action', 'intentId', 'bytes', 'mimeType', 'sha256', 'widthPx', 'heightPx'], 'abandon-upload': ['action', 'intentId', 'reason'], 'cancel-evidence': ['action', 'evidenceId', 'reason'], 'get-evidence-metadata': ['action', 'evidenceId'], 'get-active-acceptance-evidence': ['action'], 'get-acceptance-recovery': ['action'], 'create-read-url': ['action', 'evidenceId', 'seconds'], 'request-deletion': ['action', 'evidenceId', 'reason'], 'execute-retention-deletion': ['action', 'evidenceId'] }
  for (const key of Object.keys(body)) if (!allowed[action]?.includes(key)) throw new VisionEvidenceStorageError('invalid_request', 'Vision evidence request contains an unsupported field.')
  switch (action) {
    case 'create-upload-intent': return service.createUploadIntent(actor, { ownerUserId: requiredUuid(body.ownerUserId), purpose: requiredPurpose(body.purpose), uploadPurpose: requiredString(body.uploadPurpose, 240), mimeType: requiredMime(body.mimeType), expectedBytes: requiredInteger(body.expectedBytes), consentRecordedAt: optionalTimestamp(body.consentRecordedAt), retentionUntil: optionalTimestamp(body.retentionUntil) })
    case 'complete-upload': return service.completeUpload(actor, requiredUuid(body.intentId), { bytes: requiredInteger(body.bytes), mimeType: requiredMime(body.mimeType), sha256: requiredString(body.sha256, 64), widthPx: requiredInteger(body.widthPx), heightPx: requiredInteger(body.heightPx) })
    case 'abandon-upload': return service.abandonUpload(actor, requiredUuid(body.intentId), requiredString(body.reason, 240)).then(() => null)
    case 'cancel-evidence': return service.cancelOwnerScanEvidence(actor, requiredUuid(body.evidenceId), requiredString(body.reason, 240)).then(() => null)
    case 'get-evidence-metadata': return service.getEvidenceMetadata(actor, requiredUuid(body.evidenceId))
    case 'get-active-acceptance-evidence': return service.getActiveAcceptanceEvidence(actor)
    case 'get-acceptance-recovery': return service.getAcceptanceRecovery(actor)
    case 'create-read-url': return service.createShortLivedReadUrl(actor, requiredUuid(body.evidenceId), body.seconds === undefined ? 300 : requiredInteger(body.seconds))
    case 'request-deletion': return service.requestEvidenceDeletion(actor, requiredUuid(body.evidenceId), requiredString(body.reason, 240)).then(() => null)
    case 'execute-retention-deletion': return service.executeRetentionDeletion(actor, requiredUuid(body.evidenceId)).then(() => null)
    default: throw new VisionEvidenceStorageError('invalid_action', 'The Vision evidence action is not supported.')
  }
}

function toEvidenceActor(actor: ForgeActor): VisionEvidenceActor { return { userId: actor.userId, accountStatus: actor.accountStatus === 'active' ? 'active' : 'inactive', permissions: actor.permissionKeys } }
function requiredString(value: unknown, max: number): string { if (typeof value !== 'string' || !value.trim() || value.length > max) throw new VisionEvidenceStorageError('invalid_request', 'Vision evidence request text is invalid.'); return value }
function requiredUuid(value: unknown): string { if (typeof value !== 'string' || !isUuid(value)) throw new VisionEvidenceStorageError('invalid_request', 'Vision evidence request identifier is invalid.'); return value }
function requiredInteger(value: unknown): number { if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw new VisionEvidenceStorageError('invalid_request', 'Vision evidence request number is invalid.'); return value }
function requiredMime(value: unknown) { if (typeof value !== 'string' || !isVisionEvidenceMimeType(value)) throw new VisionEvidenceStorageError('invalid_request', 'Vision evidence MIME type is invalid.'); return value }
function requiredPurpose(value: unknown): VisionEvidencePurpose { if (typeof value !== 'string' || !PURPOSES.has(value)) throw new VisionEvidenceStorageError('invalid_request', 'Vision evidence purpose is invalid.'); return value as VisionEvidencePurpose }
function optionalTimestamp(value: unknown): string | undefined { if (value === undefined || value === null) return undefined; const result = requiredString(value, 40); if (!Number.isFinite(new Date(result).getTime())) throw new VisionEvidenceStorageError('invalid_request', 'Vision evidence timestamp is invalid.'); return result }
