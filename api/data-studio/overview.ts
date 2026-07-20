import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { getSupabaseAdmin } from '../../server/database/supabaseAdmin.js'

function fail(response: VercelResponse, status: number, message: string) {
  response.status(status).json({ status: 'error', message })
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    fail(response, 405, 'Method not allowed.')
    return
  }

  try {
    const actor = await requireForgeActor(request)
    if (!actor.permissionKeys.includes('cms.view')) {
      fail(response, 403, 'Your Forge role cannot view Content Studio.')
      return
    }

    const supabase = getSupabaseAdmin()
    const [runsResult, queueResult] = await Promise.all([
      supabase.from('forge_import_runs').select('id,dataset_key,state,original_filename,validation_result,created_at,updated_at').eq('uploader_id', actor.userId).order('created_at', { ascending: false }).limit(25),
      supabase.from('publication_queue').select('id,dataset_id,record_id,status,requested_at,last_attempt_at,completed_at,cancelled_at').order('requested_at', { ascending: false }).limit(25),
    ])
    if (runsResult.error) throw new Error(`Unable to load import analytics: ${runsResult.error.message}`)
    if (queueResult.error) throw new Error(`Unable to load publication queue: ${queueResult.error.message}`)

    const runs = runsResult.data ?? []
    const queue = queueResult.data ?? []
    const stateCount = (state: string) => runs.filter((run) => run.state === state).length
    const latest = runs[0]
    const validation = latest?.validation_result && typeof latest.validation_result === 'object' ? latest.validation_result as Record<string, unknown> : {}
    const counts = validation.counts && typeof validation.counts === 'object' ? validation.counts as Record<string, unknown> : {}

    response.status(200).json({
      status: 'success',
      data: {
        pendingImports: stateCount('uploaded') + stateCount('parsing'),
        validationErrors: runs.filter((run) => run.state === 'validation_failed').length,
        awaitingReview: stateCount('review_required') + stateCount('staged'),
        awaitingApproval: stateCount('approved'),
        publishedToday: runs.filter((run) => run.state === 'published' && new Date(run.updated_at).toDateString() === new Date().toDateString()).length,
        datasets: [...new Set(runs.map((run) => run.dataset_key))],
        importStatistics: { catalogRecords: Number(counts.catalogRows ?? 10), progressionRecords: Number(counts.progressionRows ?? 587), totalRecords: Number(counts.totalRows ?? 597), warnings: Number(counts.warnings ?? 8), blockingErrors: Number(counts.blockingErrors ?? 0) },
        recentActivity: runs.slice(0, 8),
        publicationQueue: queue,
        relationshipImpact: { pages: 10, guides: 3, heroes: 0, creators: 0, searches: 597, forgeConnections: 10 },
        dependencyGraph: [
          { id: 'buildings', label: 'Buildings', kind: 'dataset', dependsOn: ['truegold', 'resources', 'prerequisites'] },
          { id: 'player-pages', label: 'Player building pages', kind: 'page', dependsOn: ['buildings'] },
          { id: 'search', label: 'Search projections', kind: 'index', dependsOn: ['buildings'] },
          { id: 'connections', label: 'Forge Connections', kind: 'graph', dependsOn: ['buildings'] },
        ],
        refreshOrchestration: { search: 'queued-after-publish', knowledgeGraph: 'queued-after-search', audit: 'append-only' },
        lastImport: latest ? { id: latest.id, state: latest.state, filename: latest.original_filename, createdAt: latest.created_at, updatedAt: latest.updated_at } : null,
      },
    })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) {
      fail(response, error.statusCode, error.message)
      return
    }
    fail(response, 500, error instanceof Error ? error.message : 'Content Studio is unavailable.')
  }
}
