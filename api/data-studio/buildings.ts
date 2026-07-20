import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildingsContract } from '../../shared/data-pipeline/buildingsContract.js'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { getSupabaseAdmin } from '../../server/database/supabaseAdmin.js'

type SheetRows = Record<string, Record<string, unknown>[]>

function fail(response: VercelResponse, status: number, message: string): void {
  response.status(status).json({ status: 'error', message })
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  try {
    const actor = await requireForgeActor(request)
    const supabase = getSupabaseAdmin()
    const requestedRunId = typeof request.query.runId === 'string' ? request.query.runId : undefined
    if (request.method === 'GET') {
      if (!actor.permissionKeys.includes('cms.view')) {
        fail(response, 403, 'Your Forge role cannot view dataset imports.')
        return
      }
      let runsQuery = supabase.from('forge_import_runs').select('id,dataset_key,file_fingerprint,original_filename,uploader_id,parser_version,contract_version,state,validation_result,source_metadata,created_at,updated_at').eq('dataset_key', 'buildings').eq('uploader_id', actor.userId).order('created_at', { ascending: false }).limit(10)
      if (requestedRunId) runsQuery = runsQuery.eq('id', requestedRunId).limit(1)
      const { data: runs, error: runsError } = await runsQuery
      if (runsError) throw new Error(`Unable to load Buildings import runs: ${runsError.message}`)
      const run = runs?.[0]
      if (!run) {
        response.status(404).json({ status: 'error', message: 'Buildings import run not found.' })
        return
      }
      const { data: records, error: recordsError } = await supabase.from('forge_import_records').select('id,import_run_id,sheet_name,source_row,external_key,original_values,editorial_values,issue_state,editorial_note,created_at').eq('import_run_id', run.id).order('sheet_name').order('source_row')
      if (recordsError) throw new Error(`Unable to load staged Buildings records: ${recordsError.message}`)
      response.status(200).json({ status: 'success', data: { run, records: records ?? [] } })
      return
    }
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'GET, POST')
      fail(response, 405, 'Method not allowed.')
      return
    }
    if (!actor.permissionKeys.includes('cms.import.run')) {
      fail(response, 403, 'Your Forge role cannot stage dataset imports.')
      return
    }

    const body = request.body as {
      fileFingerprint?: string
      originalFilename?: string
      parserVersion?: string
      validationResult?: Record<string, unknown>
      sourceMetadata?: Record<string, unknown>
      sheets?: SheetRows
      prerequisiteResolution?: unknown
    }
    const fingerprint = body.fileFingerprint?.trim()
    const originalFilename = body.originalFilename?.trim()
    const sheets = body.sheets
    if (!fingerprint || !/^[a-f0-9]{64}$/i.test(fingerprint)) throw new Error('A SHA-256 source fingerprint is required.')
    if (!originalFilename || !sheets?.buildings_catalog || !sheets.buildings_import) throw new Error('Buildings catalog and progression rows are required.')

    const contractDefinition = JSON.parse(JSON.stringify(buildingsContract)) as Record<string, unknown>
    const { error: contractError } = await supabase.from('forge_dataset_contracts').upsert({
      dataset_key: buildingsContract.key,
      display_name: buildingsContract.displayName,
      contract_version: buildingsContract.version,
      definition: contractDefinition,
      active: true,
    })
    if (contractError) throw new Error(`Unable to register the Buildings contract: ${contractError.message}`)

    const { data: existing } = await supabase.from('forge_import_runs').select('id, state').eq('dataset_key', 'buildings').eq('file_fingerprint', fingerprint).maybeSingle()
    if (existing) {
      response.status(200).json({ status: 'success', data: { importRunId: existing.id, state: existing.state, reused: true } })
      return
    }

    const validationResult = body.validationResult ?? {}
    const blockingErrors = Number((validationResult.counts as Record<string, unknown> | undefined)?.blockingErrors ?? 0)
    const { data: run, error: runError } = await supabase.from('forge_import_runs').insert({
      dataset_key: 'buildings',
      file_fingerprint: fingerprint.toLowerCase(),
      original_filename: originalFilename,
      uploader_id: actor.userId,
      parser_version: body.parserVersion ?? 'forge-buildings-preflight-v2',
      contract_version: buildingsContract.version,
      state: blockingErrors > 0 ? 'validation_failed' : 'review_required',
      validation_result: validationResult,
      source_metadata: { ...(body.sourceMetadata ?? {}), prerequisiteResolution: body.prerequisiteResolution ?? null, missingRecordPolicy: 'retain_existing' },
    }).select('id, state').single()
    if (runError || !run) throw new Error(`Unable to create the immutable import run: ${runError?.message ?? 'unknown error'}`)

    const issues = Array.isArray(validationResult.findings) ? validationResult.findings as Array<Record<string, unknown>> : []
    const prerequisiteRows = Array.isArray((validationResult.prerequisiteResolution as Record<string, unknown> | undefined)?.rows) ? (validationResult.prerequisiteResolution as Record<string, unknown>).rows as Array<Record<string, unknown>> : []
    const issueFor = (sheetName: string, rowNumber: number) => issues.find(issue => issue.sheet === sheetName && issue.row === rowNumber && (issue.severity === 'Blocking Error' || issue.severity === 'blocking')) ? 'rejected' : issues.some(issue => issue.sheet === sheetName && issue.row === rowNumber && (issue.severity === 'Warning' || issue.severity === 'warning')) || prerequisiteRows.some(issue => issue.sheet === sheetName && issue.row === rowNumber) ? 'warning' : 'valid'
    const records = [
      ...sheets.buildings_catalog.map((values, index) => ({ import_run_id: run.id, sheet_name: 'buildings_catalog', source_row: index + 2, external_key: String(values.building_key ?? ''), original_values: values, issue_state: issueFor('buildings_catalog', index + 2) })),
      ...sheets.buildings_import.map((values, index) => ({ import_run_id: run.id, sheet_name: 'buildings_import', source_row: index + 2, external_key: String(values.record_id ?? ''), original_values: values, issue_state: issueFor('buildings_import', index + 2) })),
    ]
    const { error: recordsError } = await supabase.from('forge_import_records').insert(records)
    if (recordsError) throw new Error(`Unable to stage import records: ${recordsError.message}`)
    response.status(200).json({ status: 'success', data: { importRunId: run.id, state: run.state, stagedCatalog: sheets.buildings_catalog.length, stagedProgression: sheets.buildings_import.length, warningRows: records.filter(record => record.issue_state === 'warning').length, rejectedRows: records.filter(record => record.issue_state === 'rejected').length, reused: false } })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) {
      fail(response, error.statusCode, error.message)
      return
    }
    fail(response, 500, error instanceof Error ? error.message : 'The Buildings import could not be staged.')
  }
}
