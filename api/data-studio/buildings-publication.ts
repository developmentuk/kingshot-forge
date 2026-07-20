import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'node:crypto'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { getSupabaseAdmin } from '../../server/database/supabaseAdmin.js'

function fail(response: VercelResponse, status: number, message: string) {
  response.status(status).json({ status: 'error', message })
}

function body(request: VercelRequest): Record<string, unknown> {
  return request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  try {
    const actor = await requireForgeActor(request)
    if (!actor.permissionKeys.includes('cms.publish')) {
      fail(response, 403, 'Your Forge role cannot publish Buildings.')
      return
    }
    const supabase = getSupabaseAdmin()
    const input = body(request)
    const importRunId = typeof input.importRunId === 'string' ? input.importRunId : typeof request.query.runId === 'string' ? request.query.runId : ''
    if (!importRunId) { fail(response, 400, 'An import run is required.'); return }

    if (request.method === 'GET') {
      const [manifest, decisions, refreshes, publication] = await Promise.all([
        supabase.rpc('get_buildings_publication_manifest', { p_import_run_id: importRunId }),
        supabase.from('forge_current_warning_decisions').select('*').eq('import_run_id', importRunId).order('warning_id'),
        supabase.from('buildings_publication_refreshes').select('*').order('updated_at', { ascending: false }),
        supabase.from('buildings_publication_versions').select('*').eq('import_run_id', importRunId).maybeSingle(),
      ])
      if (manifest.error) throw new Error(manifest.error.message)
      if (decisions.error) throw new Error(decisions.error.message)
      if (refreshes.error) throw new Error(refreshes.error.message)
      if (publication.error) throw new Error(publication.error.message)
      const manifestHash = createHash('md5').update(JSON.stringify(manifest.data)).digest('hex')
      response.status(200).json({ status: 'success', data: { manifest: manifest.data, manifestHash, decisions: decisions.data ?? [], refreshes: refreshes.data ?? [], publication: publication.data ?? null } })
      return
    }
    if (request.method !== 'POST') { response.setHeader('Allow', 'GET, POST'); fail(response, 405, 'Method not allowed.'); return }

    const action = input.action
    if (action === 'decision') {
      const result = await supabase.rpc('record_buildings_warning_decision', {
        p_import_run_id: importRunId,
        p_warning_id: input.warningId,
        p_resolution_type: input.resolutionType,
        p_dependency_status: input.dependencyStatus,
        p_canonical_target: input.canonicalTarget ?? null,
        p_external_reference: input.externalReference ?? null,
        p_editor_reason: input.editorReason,
        p_actor_id: actor.userId,
        p_source_version: input.sourceVersion ?? 'rel003-owner-approval',
        p_supersedes_decision_id: input.supersedesDecisionId ?? null,
      })
      if (result.error) throw new Error(result.error.message)
      response.status(200).json({ status: 'success', data: result.data })
      return
    }
    if (action === 'publish') {
      const result = await supabase.rpc('publish_buildings_import_run', {
        p_import_run_id: importRunId,
        p_expected_manifest_hash: input.expectedManifestHash,
        p_publication_reason: input.publicationReason ?? 'Owner-approved Buildings publication through Forge Content Studio.',
        p_idempotency_key: input.idempotencyKey,
        p_actor_id: actor.userId,
      })
      if (result.error) throw new Error(result.error.message)
      const publication = result.data as { publicationId?: string } | null
      if (publication?.publicationId) {
        const refresh = await supabase.rpc('complete_buildings_publication_refreshes', { p_publication_id: publication.publicationId, p_actor_id: actor.userId })
        if (refresh.error) throw new Error(refresh.error.message)
        response.status(200).json({ status: 'success', data: { publication, refresh: refresh.data } })
        return
      }
      response.status(200).json({ status: 'success', data: result.data })
      return
    }
    if (action === 'rollback-preview') {
      const result = await supabase.rpc('preview_buildings_rollback', { p_publication_id: input.publicationId })
      if (result.error) throw new Error(result.error.message)
      response.status(200).json({ status: 'success', data: result.data })
      return
    }
    fail(response, 400, 'Supported actions are decision, publish and rollback-preview.')
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) { fail(response, error.statusCode, error.message); return }
    fail(response, 500, error instanceof Error ? error.message : 'Buildings publication is unavailable.')
  }
}
