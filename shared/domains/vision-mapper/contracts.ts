export const VISION_VERSION_STATUSES = ['draft', 'testing', 'published', 'deprecated'] as const
export type VisionVersionStatus = (typeof VISION_VERSION_STATUSES)[number]

export const VISION_EXTRACTORS = [
  'ocr_text',
  'ocr_digits',
  'compact_number',
  'integer',
  'percentage',
  'presence',
  'evidence_crop',
  'icon_classification',
  'colour_classification',
  'count_markers',
  'repeating_grid',
] as const
export type VisionExtractor = (typeof VISION_EXTRACTORS)[number]

export type VisionValueType = 'text' | 'integer' | 'bigint' | 'boolean' | 'percentage' | 'evidence_image'
export type VisionConflictPolicy = 'review' | 'block' | 'newest_confirmed' | 'existing_wins'
export type VisionVisibility = 'private' | 'profile' | 'public'
export type VisionSensitivity = 'standard' | 'sensitive' | 'restricted'

export interface VisionFieldDefinition {
  fieldKey: string
  label: string
  description: string
  domainKey: string
  owningService: string
  valueType: VisionValueType
  validationSchema: Record<string, unknown>
  screenshotImportAllowed: boolean
  userConfirmationRequired: boolean
  conflictPolicy: VisionConflictPolicy
  freshnessSeconds: number | null
  visibility: VisionVisibility
  sensitivity: VisionSensitivity
  writeOperation: string
  isEnabled: boolean
}

export interface VisionRegionGeometry {
  x: number
  y: number
  width: number
  height: number
}

export interface VisionAnchorRules {
  labelText?: string
  iconKey?: string
  relationship?: 'right-of' | 'left-of' | 'above' | 'below' | 'inside'
  tolerance?: number
  confidencePenalty?: number
  [key: string]: unknown
}

export interface VisionRegionDefinition extends VisionRegionGeometry {
  id: string
  regionKey: string
  label: string
  anchorRules: VisionAnchorRules
  sortOrder: number
}

export interface VisionFieldMappingDefinition {
  id: string
  regionId: string
  fieldKey: string
  extractor: VisionExtractor
  extractorConfig: Record<string, unknown>
  transformRules: VisionTransformRule[]
  validationOverrides: Record<string, unknown>
  minimumConfidence: number
  required: boolean
}

export type VisionTransformRule =
  | { operation: 'trim' }
  | { operation: 'normalise_whitespace' }
  | { operation: 'strip_prefix'; value: string }
  | { operation: 'strip_characters'; value: string }
  | { operation: 'uppercase' }
  | { operation: 'lowercase' }
  | { operation: 'compact_number' }
  | { operation: 'integer' }

export interface VisionScreenVersionDefinition {
  id: string
  screenTypeId: string
  screenKey: string
  version: number
  status: VisionVersionStatus
  layoutFamily: string
  sourceAspectRatio: number | null
  recognitionRules: Record<string, unknown>
  retentionPolicy: {
    originalDays: number
    retainAuditMetadata: boolean
    [key: string]: unknown
  }
  predecessorVersionId: string | null
  regions: Array<VisionRegionDefinition & { mapping: VisionFieldMappingDefinition | null }>
}

export interface VisionExtractionProposal {
  fieldKey: string
  rawValue: unknown
  transformedValue: unknown
  confidence: number | null
  confidenceRationale: string[]
  status: 'proposed' | 'low_confidence' | 'invalid' | 'conflict' | 'unavailable'
  validationResult: Record<string, unknown>
  conflictResult: Record<string, unknown>
}

export const INITIAL_VISION_FIELD_KEYS = [
  'player.game_name',
  'player.game_id',
  'player.power',
  'player.kills',
  'player.alliance_name',
  'player.kingdom_id',
  'player.avatar_evidence',
] as const
export type InitialVisionFieldKey = (typeof INITIAL_VISION_FIELD_KEYS)[number]

export function isNormalisedGeometry(value: VisionRegionGeometry): boolean {
  return Number.isFinite(value.x)
    && Number.isFinite(value.y)
    && Number.isFinite(value.width)
    && Number.isFinite(value.height)
    && value.x >= 0
    && value.y >= 0
    && value.width > 0
    && value.height > 0
    && value.x + value.width <= 1.00000001
    && value.y + value.height <= 1.00000001
}

export function assertEditableVisionVersion(status: VisionVersionStatus): void {
  if (status === 'published' || status === 'deprecated') {
    throw new Error('Published and deprecated Vision Mapper versions are immutable. Create a draft successor.')
  }
}

export function assertRegistryTarget(field: VisionFieldDefinition): void {
  if (!field.isEnabled || !field.screenshotImportAllowed) {
    throw new Error(`Vision field ${field.fieldKey} is not available for screenshot import.`)
  }
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(field.fieldKey)) {
    throw new Error('Vision mappings require a valid registry field key.')
  }
  if (!/^[a-z][a-z0-9_.-]+$/.test(field.writeOperation)) {
    throw new Error('Vision field write operations must be registered server operations.')
  }
}
