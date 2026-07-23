export type VisionMappingStatus = 'draft' | 'testing' | 'published' | 'deprecated'

export type VisionScreenType = {
  id: string
  screen_key: string
  label: string
  description: string
  game_key: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export type VisionMappingVersion = {
  id: string
  screen_type_id: string
  version: number
  game_version: string | null
  status: VisionMappingStatus
  layout_family: string
  source_aspect_ratio: number | null
  change_note: string
  predecessor_version_id: string | null
  created_at: string
  updated_at: string
  submitted_for_testing_at: string | null
}

export type VisionField = { field_key: string; label: string; description: string; domain_key: string; owning_service: string; value_type: string; screenshot_import_allowed: boolean; user_confirmation_required: boolean; is_enabled: boolean }
export type VisionExtractor = { plugin_key: string; display_name: string; family: string; execution_mode: string; engine_name: string; engine_version: string; plugin_version: string; status: string; supported_mime_types: unknown; capabilities: unknown; cost_profile: string; is_enabled: boolean }

export type VisionAuthoringRepository = {
  listScreenTypes(): Promise<VisionScreenType[]>
  createScreenType(input: { screenKey: string; label: string; description: string; gameKey: string; actorId: string }): Promise<VisionScreenType>
  listVersions(screenTypeId?: string): Promise<VisionMappingVersion[]>
  createVersion(input: { screenTypeId: string; layoutFamily: string; gameVersion?: string; changeNote?: string; predecessorVersionId?: string; actorId: string }): Promise<VisionMappingVersion>
  updateMetadata(input: { versionId: string; gameVersion?: string; layoutFamily?: string; changeNote?: string; actorId: string }): Promise<VisionMappingVersion>
  submitForTesting(versionId: string, actorId: string): Promise<VisionMappingVersion>
  listFields(): Promise<VisionField[]>
  listExtractors(): Promise<VisionExtractor[]>
}

export function canEditVisionVersion(status: VisionMappingStatus): boolean { return status === 'draft' || status === 'testing' }
export function canSubmitVisionVersion(status: VisionMappingStatus): boolean { return status === 'draft' }
export function assertGovernedFieldTarget(fieldKey: string, fields: VisionField[]): void {
  if (!fields.some((field) => field.field_key === fieldKey && field.is_enabled)) throw new Error('Vision mappings may target enabled Forge Field Registry keys only.')
}
