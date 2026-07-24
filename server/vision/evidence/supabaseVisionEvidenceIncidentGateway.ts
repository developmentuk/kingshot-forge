import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../../../server/database/supabaseAdmin.js'
import { VISION_EVIDENCE_BUCKET, type VisionEvidenceUploadProvider } from '../../../shared/platform/vision/evidenceStorageContracts.js'
import { parseGovernanceCapture, type GovernanceCapture, type IncidentCleanupGateway, type IncidentIntent, type IncidentState, type VisionIncidentManifest, VisionIncidentCleanupError } from '../evidenceIncidentCleanup.js'

const INTENT_COLUMNS = 'id,owner_user_id,status,storage_bucket,storage_path'

export interface SupabaseVisionEvidenceIncidentGatewayOptions { client?: SupabaseClient; provider: VisionEvidenceUploadProvider; manifest: VisionIncidentManifest; actorId: string; migrationLedgerResult: readonly string[]; governanceResult: GovernanceCapture }

export class SupabaseVisionEvidenceIncidentGateway implements IncidentCleanupGateway {
  readonly #client: SupabaseClient; readonly #provider: VisionEvidenceUploadProvider; readonly #manifest: VisionIncidentManifest; readonly #actorId: string; readonly #governance: GovernanceCapture
  constructor(options: SupabaseVisionEvidenceIncidentGatewayOptions) { if (!options.actorId || !/^[0-9a-f-]{36}$/i.test(options.actorId)) throw new VisionIncidentCleanupError('A bounded authenticated cleanup actor ID is required.'); if (JSON.stringify(options.migrationLedgerResult) !== JSON.stringify(options.manifest.migrationLedgerNames)) throw new VisionIncidentCleanupError('The captured migration ledger names do not match the exact manifest.'); this.#governance = parseGovernanceCapture(options.governanceResult, options.manifest); this.#client = options.client ?? getSupabaseAdmin(); this.#provider = options.provider; this.#manifest = options.manifest; this.#actorId = options.actorId }

  async readState(): Promise<IncidentState> {
    const ids = [this.#manifest.createdIntentId, this.#manifest.abandonedIntentId]
    const intentsResult = await this.#client.from('vision_evidence_upload_intents').select(INTENT_COLUMNS).in('id', ids)
    if (intentsResult.error || !Array.isArray(intentsResult.data)) throw new Error('Exact Vision incident intent precheck failed.')
    const evidenceResult = await this.#client.from('vision_evidence_images').select('id', { count: 'exact', head: true })
    if (evidenceResult.error) throw new Error('Vision evidence row count precheck failed.')
    const totalAuditResult = await this.#client.from('vision_audit_events').select('id,event_type,entity_id,actor_id,payload')
    const incidentAuditResult = await this.#client.from('vision_audit_events').select('id,event_type,entity_id,actor_id,payload').in('entity_id', ids)
    if (totalAuditResult.error || incidentAuditResult.error || !Array.isArray(totalAuditResult.data) || !Array.isArray(incidentAuditResult.data)) throw new Error('Exact Vision audit precheck failed.')
    const bucket = await this.#client.storage.getBucket(this.#manifest.bucket)
    if (bucket.error || !bucket.data || bucket.data.id !== this.#manifest.bucket || bucket.data.name !== this.#manifest.bucket || bucket.data.public !== false) throw new Error('Private Vision evidence bucket verification failed.')
    const schema = await Promise.all([
      this.#client.from('vision_evidence_upload_intents').select('id,owner_user_id,status,storage_bucket,storage_path').limit(0),
      this.#client.from('vision_evidence_images').select('id,byte_length,verified_at,legal_hold').limit(0),
    ])
    if (schema.some((result) => result.error)) throw new Error('Exact Vision evidence schema verification failed.')
    const intents: IncidentIntent[] = intentsResult.data.map((row) => ({ id: String(row.id), status: String(row.status), ownerUserId: String(row.owner_user_id), storageBucket: String(row.storage_bucket), storagePath: String(row.storage_path) }))
    const exactObject = await this.headObject(this.#manifest.bucket, this.#manifest.objectPath)
    const auditEvents = totalAuditResult.data.map((row) => ({ id: String(row.id), eventType: String(row.event_type), entityId: String(row.entity_id), actorId: row.actor_id ? String(row.actor_id) : null, payload: row.payload && typeof row.payload === 'object' ? row.payload as Record<string, unknown> : {} }))
    return { intents, evidenceCount: evidenceResult.count ?? 0, objectCount: exactObject ? 1 : 0, totalAuditCount: auditEvents.length, incidentAuditCount: incidentAuditResult.data.length, retainedOriginalC3AuditCount: auditEvents.length - incidentAuditResult.data.length, auditEvents, bucketActive: this.#governance.bucket.public === false, migrationsActive: true, policiesUnchanged: true, grantsUnchanged: true, rlsUnchanged: this.#governance.rls.every((table) => table.enabled && table.forced), constraintsUnchanged: this.#governance.constraints.length === 4 }
  }

  async headObject(bucket: string, path: string): Promise<unknown | null> { if (bucket !== this.#manifest.bucket || path !== this.#manifest.objectPath) throw new VisionIncidentCleanupError('Only the exact incident object may be inspected.'); return this.#provider.headObject({ bucket: VISION_EVIDENCE_BUCKET, path }) }
  async objectExists(bucket: string, path: string): Promise<boolean> { return !!await this.headObject(bucket, path) }

  async markAbandoned(intentId: string, reason: string): Promise<void> {
    if (intentId !== this.#manifest.createdIntentId || reason.length < 1 || reason.length > 240 || /token|secret|signed|https?:\/\//i.test(reason)) throw new VisionIncidentCleanupError('Only the exact created intent and bounded credential-free reason are permitted.')
    const current = await this.#client.from('vision_evidence_upload_intents').select('id,status').eq('id', intentId).maybeSingle()
    if (current.error || !current.data || current.data.status !== 'created') throw new Error('Exact created intent was not in created state.')
    const updated = await this.#client.from('vision_evidence_upload_intents').update({ status: 'abandoned', abandoned_at: new Date().toISOString() }).eq('id', intentId).eq('status', 'created').select('id').single()
    if (updated.error || !updated.data) throw new Error('Exact intent abandonment was not confirmed.')
    const audit = await this.#client.from('vision_audit_events').insert({ actor_id: this.#actorId, event_type: 'vision.evidence.upload_abandoned', entity_type: 'vision_evidence', entity_id: intentId, payload: { reason } }).select('id,event_type,entity_id,actor_id,payload').single()
    if (audit.error || !audit.data || audit.data.event_type !== 'vision.evidence.upload_abandoned' || audit.data.entity_id !== intentId || !audit.data.actor_id) throw new Error('Exact abandonment audit append was not confirmed.')
  }

  async deleteObject(bucket: string, path: string): Promise<void> { if (bucket !== this.#manifest.bucket || path !== this.#manifest.objectPath) throw new VisionIncidentCleanupError('Only the exact incident object may be deleted.'); await this.#provider.deleteObject({ bucket: VISION_EVIDENCE_BUCKET, path }) }
  async deleteIntent(intentId: string): Promise<void> { if (intentId !== this.#manifest.createdIntentId && intentId !== this.#manifest.abandonedIntentId) throw new VisionIncidentCleanupError('Only the two exact incident intents may be deleted.'); const result = await this.#client.from('vision_evidence_upload_intents').delete().eq('id', intentId).select('id'); if (result.error || !Array.isArray(result.data) || result.data.length !== 1 || result.data[0].id !== intentId) throw new Error('Exact intent deletion was not confirmed.') }

}

export function createSupabaseVisionEvidenceIncidentGateway(options: SupabaseVisionEvidenceIncidentGatewayOptions): IncidentCleanupGateway { return new SupabaseVisionEvidenceIncidentGateway(options) }
