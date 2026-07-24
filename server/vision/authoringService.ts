import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import type { ForgeActor } from '../auth/requireForgeActor.js'
import type { VisionAuthoringRepository, VisionExtractor, VisionField, VisionMappingVersion, VisionScreenType } from '../../shared/domains/vision-mapper/authoring.js'
import { canEditVisionVersion, canSubmitVisionVersion } from '../../shared/domains/vision-mapper/authoring.js'

export class VisionPersistenceUnavailableError extends Error { readonly statusCode = 503; constructor() { super('Forge Vision persistence is not available until the approved migration is applied.'); this.name = 'VisionPersistenceUnavailableError' } }
export class VisionPermissionError extends Error { readonly statusCode = 403; constructor(message = 'Your Forge role cannot perform this Vision Studio action.') { super(message); this.name = 'VisionPermissionError' } }

function requirePermission(actor: ForgeActor, permission: string) { if (actor.accountStatus !== 'active' || !actor.permissionKeys.includes(permission)) throw new VisionPermissionError() }
function unavailable(error: unknown): never { const message = error instanceof Error ? error.message : ''; if (/schema cache|relation .*vision_|could not find the table|does not exist/i.test(message)) throw new VisionPersistenceUnavailableError(); throw error }
function clean<T>(result: { data: T | null; error: { message: string } | null }): T { if (result.error) unavailable(new Error(result.error.message)); if (result.data === null) throw new Error('Vision persistence returned no data.'); return result.data }

type AcceptanceAuditContext = { acceptanceRunId?: string; correlationId?: string }
export function acceptanceAuditContext(body: Record<string, unknown>): AcceptanceAuditContext {
  const acceptanceRunId = body.acceptanceRunId === undefined ? undefined : String(body.acceptanceRunId)
  const correlationId = body.correlationId === undefined ? undefined : String(body.correlationId)
  if (acceptanceRunId !== undefined && !/^[a-z0-9][a-z0-9-]{7,63}$/i.test(acceptanceRunId)) throw new Error('Acceptance run ID is invalid.')
  if (correlationId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(correlationId)) throw new Error('Acceptance correlation ID is invalid.')
  return { acceptanceRunId, correlationId }
}
export function buildVisionAuditPayload(actor: ForgeActor, context: AcceptanceAuditContext) { return { actorId: actor.userId, accountStatus: actor.accountStatus, roles: actor.roles, acceptanceRunId: context.acceptanceRunId ?? null, correlationId: context.correlationId ?? null } }
async function writeVisionAudit(actor: ForgeActor, eventType: string, entityType: string, entityId: string, context: AcceptanceAuditContext) {
  const result = await getSupabaseAdmin().from('vision_audit_events').insert({ actor_id: actor.userId, event_type: eventType, entity_type: entityType, entity_id: entityId, payload: buildVisionAuditPayload(actor, context) })
  if (result.error) unavailable(new Error(result.error.message))
}

export function createVisionAuthoringRepository(): VisionAuthoringRepository {
  const db = getSupabaseAdmin()
  return {
    async listScreenTypes() { return clean(await db.from('vision_screen_types').select('id,screen_key,label,description,game_key,is_enabled,created_at,updated_at').order('label')) as VisionScreenType[] },
    async createScreenType(input) { return clean(await db.from('vision_screen_types').insert({ screen_key: input.screenKey, label: input.label, description: input.description, game_key: input.gameKey, created_by: input.actorId }).select('id,screen_key,label,description,game_key,is_enabled,created_at,updated_at').single()) as VisionScreenType },
    async listVersions(screenTypeId) { let query = db.from('vision_mapping_versions').select('id,screen_type_id,version,game_version,status,layout_family,source_aspect_ratio,change_note,predecessor_version_id,created_at,updated_at,submitted_for_testing_at').order('created_at', { ascending: false }); if (screenTypeId) query = query.eq('screen_type_id', screenTypeId); return clean(await query) as VisionMappingVersion[] },
    async createVersion(input) { const version = input.predecessorVersionId ? await db.from('vision_mapping_versions').select('version,game_version,layout_family').eq('id', input.predecessorVersionId).single() : { data: null, error: null }; if (version.error) unavailable(new Error(version.error.message)); const next = input.predecessorVersionId ? Number(version.data?.version ?? 0) + 1 : 1; return clean(await db.from('vision_mapping_versions').insert({ screen_type_id: input.screenTypeId, version: next, game_version: input.gameVersion ?? version.data?.game_version ?? null, layout_family: input.layoutFamily || version.data?.layout_family || 'unclassified', change_note: input.changeNote ?? '', predecessor_version_id: input.predecessorVersionId ?? null, created_by: input.actorId }).select('id,screen_type_id,version,game_version,status,layout_family,source_aspect_ratio,change_note,predecessor_version_id,created_at,updated_at,submitted_for_testing_at').single()) as VisionMappingVersion },
    async updateMetadata(input) { const current = clean(await db.from('vision_mapping_versions').select('status').eq('id', input.versionId).single()) as { status: VisionMappingVersion['status'] }; if (!canEditVisionVersion(current.status)) throw new Error('Published and deprecated Vision versions are immutable; create a draft successor.'); void input.actorId; return clean(await db.from('vision_mapping_versions').update({ game_version: input.gameVersion, layout_family: input.layoutFamily, change_note: input.changeNote, updated_at: new Date().toISOString() }).eq('id', input.versionId).select('id,screen_type_id,version,game_version,status,layout_family,source_aspect_ratio,change_note,predecessor_version_id,created_at,updated_at,submitted_for_testing_at').single()) as VisionMappingVersion },
    async submitForTesting(versionId, actorId) { void actorId; const current = clean(await db.from('vision_mapping_versions').select('status').eq('id', versionId).single()) as { status: VisionMappingVersion['status'] }; if (!canSubmitVisionVersion(current.status)) throw new Error('Only Draft Vision versions can be submitted for Testing.'); return clean(await db.from('vision_mapping_versions').update({ status: 'testing', submitted_for_testing_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', versionId).select('id,screen_type_id,version,game_version,status,layout_family,source_aspect_ratio,change_note,predecessor_version_id,created_at,updated_at,submitted_for_testing_at').single()) as VisionMappingVersion },
    async listFields() { return clean(await db.from('vision_field_registry').select('field_key,label,description,domain_key,owning_service,value_type,screenshot_import_allowed,user_confirmation_required,is_enabled').eq('is_enabled', true).order('field_key')) as VisionField[] },
    async listExtractors() { return clean(await db.from('vision_extractor_plugins').select('plugin_key,display_name,family,execution_mode,engine_name,engine_version,plugin_version,status,supported_mime_types,capabilities,cost_profile,is_enabled').eq('is_enabled', true).in('status', ['testing', 'active']).order('display_name')) as VisionExtractor[] },
  }
}

export async function visionAuthoring(actor: ForgeActor, action: string, body: Record<string, unknown>) {
  const repo = createVisionAuthoringRepository()
  if (action === 'list') { requirePermission(actor, 'vision.admin.read'); return { screenTypes: await repo.listScreenTypes(), versions: await repo.listVersions(), fields: await repo.listFields(), extractors: await repo.listExtractors() } }
  requirePermission(actor, 'vision.admin.edit')
  const context = acceptanceAuditContext(body)
  if (action === 'create-screen-type') { const result = await repo.createScreenType({ screenKey: String(body.screenKey ?? ''), label: String(body.label ?? ''), description: String(body.description ?? ''), gameKey: String(body.gameKey ?? 'forge'), actorId: actor.userId }); await writeVisionAudit(actor, 'vision.screen_type.created', 'vision_screen_type', result.id, context); return result }
  if (action === 'create-version') { const result = await repo.createVersion({ screenTypeId: String(body.screenTypeId), layoutFamily: String(body.layoutFamily ?? 'unclassified'), gameVersion: body.gameVersion ? String(body.gameVersion) : undefined, changeNote: body.changeNote ? String(body.changeNote) : undefined, actorId: actor.userId }); await writeVisionAudit(actor, 'vision.mapping.draft_created', 'vision_mapping_version', result.id, context); return result }
  if (action === 'create-successor') return repo.createVersion({ screenTypeId: String(body.screenTypeId), layoutFamily: String(body.layoutFamily ?? 'unclassified'), gameVersion: body.gameVersion ? String(body.gameVersion) : undefined, changeNote: body.changeNote ? String(body.changeNote) : undefined, predecessorVersionId: String(body.predecessorVersionId), actorId: actor.userId })
  if (action === 'update-metadata') { const result = await repo.updateMetadata({ versionId: String(body.versionId), gameVersion: body.gameVersion ? String(body.gameVersion) : undefined, layoutFamily: body.layoutFamily ? String(body.layoutFamily) : undefined, changeNote: body.changeNote ? String(body.changeNote) : undefined, actorId: actor.userId }); await writeVisionAudit(actor, 'vision.mapping.metadata_updated', 'vision_mapping_version', result.id, context); return result }
  if (action === 'submit-testing') { requirePermission(actor, 'vision.admin.test'); const result = await repo.submitForTesting(String(body.versionId), actor.userId); await writeVisionAudit(actor, 'vision.mapping.submitted_testing', 'vision_mapping_version', result.id, context); return result }
  throw new Error('Unknown Vision authoring action.')
}
