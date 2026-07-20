import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildingsContract } from '../../shared/data-pipeline/buildingsContract.js'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { getSupabaseAdmin } from '../../server/database/supabaseAdmin.js'
import { withWarningId } from '../../shared/data-pipeline/warningIdentity.js'

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
      const { data: warnings, error: warningsError } = await supabase.from('forge_import_warnings').select('warning_id,import_run_id,import_record_id,dataset_key,sheet_name,source_row,record_id,building_key,code,severity,message,source_text,parsed_name,required_level,required_stage,occurred_at,details').eq('import_run_id', run.id).order('occurred_at').order('warning_id')
      if (warningsError) throw new Error(`Unable to load staged warning identities: ${warningsError.message}`)
      response.status(200).json({ status: 'success', data: { run, records: records ?? [], warnings: warnings ?? [] } })
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

    const { data: existing } = await supabase.from('forge_import_runs').select('id, state, validation_result').eq('dataset_key', 'buildings').eq('file_fingerprint', fingerprint).maybeSingle()
    if (existing) {
      const { data: existingRecords, error: existingRecordsError } = await supabase
        .from('forge_import_records')
        .select('sheet_name, issue_state')
        .eq('import_run_id', existing.id)
      if (existingRecordsError) throw new Error(`Unable to read the existing staged run: ${existingRecordsError.message}`)
      const records = existingRecords ?? []
      const { data: existingWarnings, error: existingWarningsError } = await supabase.from('forge_import_warnings').select('warning_id').eq('import_run_id', existing.id).order('warning_id')
      if (existingWarningsError) throw new Error(`Unable to read immutable warning identities: ${existingWarningsError.message}`)
      response.status(200).json({ status: 'success', data: {
        importRunId: existing.id,
        state: existing.state,
        stagedCatalog: records.filter(record => record.sheet_name === 'buildings_catalog').length,
        stagedProgression: records.filter(record => record.sheet_name === 'buildings_import').length,
        warningRows: Number((existing.validation_result as { counts?: { warnings?: unknown } } | null)?.counts?.warnings ?? records.filter(record => record.issue_state === 'warning').length),
        warningIds: (existingWarnings ?? []).map(record => record.warning_id),
        rejectedRows: records.filter(record => record.issue_state === 'rejected').length,
        reused: true,
      } })
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
    const { data: insertedRecords, error: recordsError } = await supabase.from('forge_import_records').insert(records).select('id,sheet_name,source_row,external_key')
    if (recordsError) throw new Error(`Unable to stage import records: ${recordsError.message}`)
    const warningSourceRows = prerequisiteRows.filter(row => row.unresolved_reason).map(row => withWarningId({
      dataset: 'buildings', code: 'unresolved_prerequisite', sheet: String(row.sheet), row: Number(row.row), record_id: String(row.record_id), building_key: String(row.building_key), source_text: String(row.source_text), parsed_name: row.parsed_name ? String(row.parsed_name) : null, required_level: row.required_level == null ? null : Number(row.required_level), required_stage: row.required_stage == null ? null : Number(row.required_stage), unresolved_reason: String(row.unresolved_reason),
    }))
    const warningRecords = warningSourceRows.map(warning => ({
      warning_id: warning.warning_id,
      import_run_id: run.id,
      import_record_id: insertedRecords?.find(record => record.sheet_name === warning.sheet && record.source_row === warning.row && record.external_key === warning.record_id)?.id ?? null,
      dataset_key: warning.dataset,
      sheet_name: warning.sheet,
      source_row: warning.row,
      record_id: warning.record_id,
      building_key: warning.building_key,
      code: warning.code,
      severity: 'warning',
      message: `Prerequisite ${warning.source_text} could not be mapped to a canonical building_key.`,
      source_text: warning.source_text,
      parsed_name: warning.parsed_name,
      required_level: warning.required_level,
      required_stage: warning.required_stage,
      occurred_at: new Date().toISOString(),
      details: { unresolved_reason: warning.unresolved_reason },
    }))
    if (warningRecords.length) {
      const { error: warningError } = await supabase.from('forge_import_warnings').insert(warningRecords)
      if (warningError) throw new Error(`Unable to stage immutable warning identities: ${warningError.message}`)
    }
    response.status(200).json({ status: 'success', data: { importRunId: run.id, state: run.state, stagedCatalog: sheets.buildings_catalog.length, stagedProgression: sheets.buildings_import.length, warningRows: warningSourceRows.length, warningIds: warningSourceRows.map(warning => warning.warning_id), rejectedRows: records.filter(record => record.issue_state === 'rejected').length, reused: false } })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) {
      fail(response, error.statusCode, error.message)
      return
    }
    fail(response, 500, error instanceof Error ? error.message : 'The Buildings import could not be staged.')
  }
}
