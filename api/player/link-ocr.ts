import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { VisionEvidenceStorageError } from '../../server/vision/evidenceStorageService.js'
import { createSupabaseVisionEvidenceStorageService } from '../../server/vision/evidence/supabaseVisionEvidenceRuntime.js'
import { extractAccountLinkCandidates } from '../../server/player-identity/accountLinkingOcrService.js'
import type { VisionEvidenceActor } from '../../shared/platform/vision/evidenceStorageContracts.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  try {
    if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); response.status(405).json({ status: 'error', message: 'A POST request is required.' }); return }
    const actor = await requireForgeActor(request)
    const body = request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
    const evidenceId = typeof body.evidenceId === 'string' ? body.evidenceId : ''
    if (!evidenceId) { response.status(422).json({ status: 'error', message: 'An evidence identifier is required.' }); return }
    const evidenceActor: VisionEvidenceActor = { userId: actor.userId, accountStatus: actor.accountStatus === 'active' ? 'active' : 'inactive', permissions: actor.permissionKeys }
    const service = createSupabaseVisionEvidenceStorageService()
    const { metadata, bytes } = await service.readEvidenceBytes(evidenceActor, evidenceId)
    const data = await extractAccountLinkCandidates({ evidenceId, bytes, sha256: metadata.sha256, mimeType: metadata.mimeType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/tiff', widthPx: metadata.widthPx, heightPx: metadata.heightPx })
    const { rawText: _rawText, regionObservations: _regionObservations, ...safeData } = data
    response.status(200).json({ status: 'success', data: safeData })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) { response.status(error.statusCode).json({ status: 'error', message: error.message }); return }
    if (error instanceof VisionEvidenceStorageError) { response.status(error.code === 'not_found' ? 404 : error.code === 'forbidden' ? 403 : 422).json({ status: 'error', message: error.message }); return }
    console.error('[player-link-ocr]', error instanceof Error ? error.name : 'UnknownError')
    response.status(422).json({ status: 'error', message: 'The screenshot could not be read. Use the manual Player ID fallback.' })
  }
}
