import { ACCEPTANCE, assertRepositoryGate, parseArgs, redact, writeEvidence } from './forge-vision-acceptance-controls.mjs'
import { pathToFileURL } from 'node:url'

function ids(value) { const result = (value ?? '').split(',').filter(Boolean); if (!result.length || result.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) throw new Error('Cleanup requires exact comma-separated UUID mapping-version IDs.'); return result }

export async function cleanupAcceptance({ args = process.argv.slice(2), environment = process.env, cwd = process.cwd(), adminFactory } = {}) {
  const { flags, value } = parseArgs(args)
  if (!flags.has('--execute-cleanup')) throw new Error('Cleanup requires --execute-cleanup.')
  if (environment.FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED !== 'YES') throw new Error('Cleanup requires FORGE_VISION_ACCEPTANCE_CLEANUP_APPROVED=YES.')
  if (value('--project-ref') !== ACCEPTANCE.projectRef) throw new Error('Cleanup project reference does not match the approved project.')
  if (!environment.SUPABASE_URL || !new URL(environment.SUPABASE_URL).hostname.startsWith(`${ACCEPTANCE.projectRef}.`)) throw new Error('Cleanup server configuration does not target the approved project.')
  const runId = value('--run-id'); if (!runId) throw new Error('Cleanup requires an exact --run-id.')
  const screenTypeId = value('--screen-type-id'); if (!/^[0-9a-f-]{36}$/i.test(screenTypeId ?? '')) throw new Error('Cleanup requires an exact screen-type UUID.')
  const mappingVersionIds = ids(value('--mapping-version-ids'))
  const repository = assertRepositoryGate({ approvedSha: value('--approved-sha'), cwd })
  const admin = adminFactory ? await adminFactory() : (await import('../server/database/supabaseAdmin.js')).getSupabaseAdmin()
  const screen = await admin.from('vision_screen_types').select('id,screen_key,game_key,label,description').eq('id', screenTypeId).maybeSingle()
  if (screen.error || !screen.data || screen.data.game_key !== ACCEPTANCE.gameKey || !screen.data.screen_key.startsWith(ACCEPTANCE.screenKeyPrefix) || !screen.data.screen_key.includes(runId)) throw new Error('Cleanup target is not the exact synthetic acceptance screen type.')
  const versions = await admin.from('vision_mapping_versions').select('id,status,screen_type_id,change_note').in('id', mappingVersionIds)
  if (versions.error || versions.data.length !== mappingVersionIds.length || versions.data.some((row) => row.screen_type_id !== screenTypeId || !['draft', 'testing'].includes(row.status) || !row.change_note.includes(runId))) throw new Error('Cleanup target versions are incomplete, non-acceptance, or no longer safely deletable.')
  const childTables = ['vision_mapping_reference_images','vision_regions','vision_field_mappings','vision_test_cases','vision_test_results','vision_scan_runs','vision_extraction_evidence']
  const childCounts = {}
  for (const table of childTables) { const column = table === 'vision_test_results' || table === 'vision_scan_runs' || table === 'vision_extraction_evidence' ? 'mapping_version_id' : 'mapping_version_id'; const result = await admin.from(table).select('id', { count: 'exact', head: true }).in(column, mappingVersionIds); if (result.error) throw new Error(`Cleanup child inspection failed for ${table}.`); childCounts[table] = result.count ?? 0 }
  if (Object.values(childCounts).some((count) => count !== 0)) throw new Error('Cleanup refuses fixture records with unexpected child records.')
  const plan = { runId, projectRef: ACCEPTANCE.projectRef, repository, screenTypeId, mappingVersionIds, childCounts, auditRetention: 'Vision audit events are append-only and are never deleted by this cleanup runner.' }
  console.log(JSON.stringify({ status: 'cleanup-plan', plan: redact(plan) }, null, 2))
  const versionDelete = await admin.from('vision_mapping_versions').delete().in('id', mappingVersionIds)
  if (versionDelete.error) throw new Error('Cleanup failed deleting the exact disposable mapping versions.')
  const screenDelete = await admin.from('vision_screen_types').delete().eq('id', screenTypeId)
  if (screenDelete.error) throw new Error('Cleanup failed deleting the exact disposable screen type.')
  const [screenCheck, versionCheck] = await Promise.all([admin.from('vision_screen_types').select('id', { count: 'exact', head: true }).eq('id', screenTypeId), admin.from('vision_mapping_versions').select('id', { count: 'exact', head: true }).in('id', mappingVersionIds)])
  if (screenCheck.count || versionCheck.count) throw new Error('Cleanup verification failed; fixture records still exist.')
  const evidence = { ...plan, deleted: true, timestamp: new Date().toISOString() }
  return { ...redact(evidence), evidencePath: writeEvidence('cleanup', evidence, environment) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cleanupAcceptance().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(JSON.stringify({ status: 'error', message: error instanceof Error ? error.message : 'Cleanup failed.' })); process.exitCode = 1 })
