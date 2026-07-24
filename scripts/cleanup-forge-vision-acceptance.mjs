import { ACCEPTANCE, assertRepositoryGate, parseArgs, readCheckpoint, redact, writeCheckpoint } from './forge-vision-acceptance-controls.mjs'
import { pathToFileURL } from 'node:url'

function ids(value) { const result = (value ?? '').split(',').filter(Boolean); if (!result.length || result.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) throw new Error('Cleanup requires exact comma-separated UUID mapping-version IDs.'); return result }

export async function cleanupAcceptance({ args = process.argv.slice(2), environment = process.env, cwd = process.cwd(), adminFactory, repositoryGate = assertRepositoryGate } = {}) {
  const { flags, value } = parseArgs(args)
  if (!flags.has('--execute-cleanup')) throw new Error('Cleanup requires --execute-cleanup.')
  if (environment.FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED !== 'YES') throw new Error('Cleanup requires FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED=YES.')
  if (value('--project-ref') !== ACCEPTANCE.projectRef) throw new Error('Cleanup project reference does not match the approved project.')
  if (!environment.SUPABASE_URL || !new URL(environment.SUPABASE_URL).hostname.startsWith(`${ACCEPTANCE.projectRef}.`)) throw new Error('Cleanup server configuration does not target the approved project.')
  const runId = value('--run-id'); if (!runId) throw new Error('Cleanup requires an exact --run-id.')
  const screenTypeId = value('--screen-type-id'); if (!/^[0-9a-f-]{36}$/i.test(screenTypeId ?? '')) throw new Error('Cleanup requires an exact screen-type UUID.')
  const mappingVersionIds = ids(value('--mapping-version-ids'))
  const retained = readCheckpoint(runId, environment)
  const checkpoint = retained.checkpoint
  if (checkpoint.runId !== runId || checkpoint.created?.screenTypeId !== screenTypeId || (checkpoint.created?.mappingVersionIds ?? []).join(',') !== mappingVersionIds.join(',')) throw new Error('Cleanup IDs must exactly match the retained acceptance checkpoint.')
  if (!checkpoint.cleanupRequired) throw new Error('Cleanup checkpoint does not require a fixture cleanup.')
  const repository = repositoryGate({ approvedSha: value('--approved-sha'), cwd })
  const admin = adminFactory ? await adminFactory() : (await import('../server/database/supabaseAdmin.js')).getSupabaseAdmin()
  const screen = await admin.from('vision_screen_types').select('id,screen_key,game_key,label,description').eq('id', screenTypeId).maybeSingle()
  if (screen.error || !screen.data || screen.data.game_key !== ACCEPTANCE.gameKey || !screen.data.screen_key.startsWith(ACCEPTANCE.screenKeyPrefix) || !screen.data.screen_key.includes(runId)) throw new Error('Cleanup target is not the exact synthetic acceptance screen type.')
  const versions = await admin.from('vision_mapping_versions').select('id,status,screen_type_id,change_note').in('id', mappingVersionIds)
  if (versions.error || versions.data.length !== mappingVersionIds.length || versions.data.some((row) => row.screen_type_id !== screenTypeId || !['draft', 'testing'].includes(row.status) || !row.change_note.includes(runId))) throw new Error('Cleanup target versions are incomplete, non-acceptance, or no longer safely deletable.')
  const childInspections = [
    { table: 'vision_mapping_reference_images', filterColumn: 'mapping_version_id', selectColumn: 'mapping_version_id' },
    { table: 'vision_regions', filterColumn: 'mapping_version_id', selectColumn: 'mapping_version_id' },
    { table: 'vision_field_mappings', filterColumn: 'mapping_version_id', selectColumn: 'mapping_version_id' },
    { table: 'vision_test_cases', filterColumn: 'mapping_version_id', selectColumn: 'mapping_version_id' },
    { table: 'vision_test_results', filterColumn: 'mapping_version_id', selectColumn: 'mapping_version_id' },
    { table: 'vision_scan_runs', filterColumn: 'mapping_version_id', selectColumn: 'mapping_version_id' },
    { table: 'vision_extraction_evidence', filterColumn: 'mapping_version_id', selectColumn: 'mapping_version_id' },
  ]
  const childCounts = {}
  for (const inspection of childInspections) { const result = await admin.from(inspection.table).select(inspection.selectColumn, { count: 'exact', head: true }).in(inspection.filterColumn, mappingVersionIds); if (result.error) throw new Error(`Cleanup child inspection failed for ${inspection.table}.`); childCounts[inspection.table] = result.count ?? 0 }
  if (Object.values(childCounts).some((count) => count !== 0)) throw new Error('Cleanup refuses fixture records with unexpected child records.')
  const audits = await admin.from('vision_audit_events').select('id,entity_id,payload').in('entity_id', [screenTypeId, ...mappingVersionIds])
  if (audits.error || (audits.data ?? []).some((audit) => /bearer\s+|token|secret|cookie|password|authorization|x-vercel-protection-bypass|x-vercel-set-bypass-cookie/i.test(JSON.stringify(audit.payload)))) throw new Error('Cleanup refuses retained audit payloads that may contain credentials.')
  const plan = { runId, projectRef: ACCEPTANCE.projectRef, repository, screenTypeId, mappingVersionIds, childCounts, retainedAuditEventIds: (audits.data ?? []).map((audit) => audit.id), retainedAuditCount: (audits.data ?? []).length, auditRetention: 'Vision audit events are append-only and are never deleted by this cleanup runner.' }
  console.log(JSON.stringify({ status: 'cleanup-plan', plan: redact(plan) }, null, 2))
  const versionDelete = await admin.from('vision_mapping_versions').delete().in('id', mappingVersionIds)
  if (versionDelete.error) throw new Error('Cleanup failed deleting the exact disposable mapping versions.')
  const screenDelete = await admin.from('vision_screen_types').delete().eq('id', screenTypeId)
  if (screenDelete.error) throw new Error('Cleanup failed deleting the exact disposable screen type.')
  const [screenCheck, versionCheck] = await Promise.all([admin.from('vision_screen_types').select('id', { count: 'exact', head: true }).eq('id', screenTypeId), admin.from('vision_mapping_versions').select('id', { count: 'exact', head: true }).in('id', mappingVersionIds)])
  if (screenCheck.count || versionCheck.count) throw new Error('Cleanup verification failed; fixture records still exist.')
  const evidence = { ...checkpoint, ...plan, status: 'cleaned', cleanupRequired: false, deleted: true, timestamp: new Date().toISOString() }
  return { ...redact(evidence), evidencePath: writeCheckpoint(evidence, environment) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cleanupAcceptance().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(JSON.stringify({ status: 'error', message: error instanceof Error ? error.message : 'Cleanup failed.' })); process.exitCode = 1 })
