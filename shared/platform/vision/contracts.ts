export const VISION_MAPPING_STATUSES = ['draft', 'testing', 'published', 'deprecated'] as const
export type VisionMappingStatus = (typeof VISION_MAPPING_STATUSES)[number]

export const VISION_EXTRACTOR_FAMILIES = ['ocr', 'computer_vision', 'ai_vision'] as const
export type VisionExtractorFamily = (typeof VISION_EXTRACTOR_FAMILIES)[number]

export const VISION_EXECUTION_MODES = ['local_worker', 'server_worker', 'external_api', 'browser_worker'] as const
export type VisionExecutionMode = (typeof VISION_EXECUTION_MODES)[number]

export const VISION_DETECTION_METHODS = ['ocr', 'computer_vision', 'ai_vision', 'hybrid'] as const
export type VisionDetectionMethod = (typeof VISION_DETECTION_METHODS)[number]

export const VISION_VALUE_STATUSES = [
  'proposed',
  'low_confidence',
  'invalid',
  'conflict',
  'confirmed',
  'corrected',
  'rejected',
  'unavailable',
] as const
export type VisionValueStatus = (typeof VISION_VALUE_STATUSES)[number]

export type VisionValueType = 'text' | 'integer' | 'bigint' | 'boolean' | 'percentage' | 'evidence_image' | 'json'
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
  proposalOperation: string
  isEnabled: boolean
}

export interface VisionNormalisedBox {
  x: number
  y: number
  width: number
  height: number
}

export interface VisionPixelBox {
  left: number
  top: number
  width: number
  height: number
}

export interface VisionRegionBinding extends VisionNormalisedBox {
  id: string
  regionKey: string
  label: string
  role: 'source' | 'anchor' | 'comparison' | 'evidence'
  anchorRules: Record<string, unknown>
  sortOrder: number
}

export interface VisionExtractorManifest {
  pluginKey: string
  displayName: string
  family: VisionExtractorFamily
  executionMode: VisionExecutionMode
  engineName: string
  engineVersion: string
  pluginVersion: string
  supportedMimeTypes: readonly string[]
  capabilities: readonly string[]
  configurationSchema: Record<string, unknown>
  costProfile: 'local_zero_cost' | 'metered' | 'unknown'
}

export interface VisionExtractorBinding {
  pluginKey: string
  role: 'primary' | 'fallback' | 'comparison'
  configuration: Record<string, unknown>
  minimumEngineConfidence: number | null
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
  | { operation: 'percentage' }

export interface VisionFieldMappingDefinition {
  id: string
  fieldKey: string
  detectionMethod: VisionDetectionMethod
  extractors: VisionExtractorBinding[]
  regions: VisionRegionBinding[]
  transformRules: VisionTransformRule[]
  validationOverrides: Record<string, unknown>
  minimumConfidence: number
  required: boolean
}

export interface VisionScreenMappingVersion {
  id: string
  screenTypeId: string
  screenKey: string
  version: number
  gameVersion: string | null
  status: VisionMappingStatus
  layoutFamily: string
  sourceAspectRatio: number | null
  recognitionRules: Record<string, unknown>
  retentionPolicy: {
    originalDays: number
    retainAuditMetadata: boolean
    [key: string]: unknown
  }
  predecessorVersionId: string | null
  mappings: VisionFieldMappingDefinition[]
}

export interface VisionImageInput {
  evidenceId: string
  sha256: string
  mimeType: string
  widthPx: number
  heightPx: number
  bytes: Uint8Array
}

export interface VisionExtractionRequest {
  runId: string
  mappingVersionId: string
  mappingId: string
  fieldKey: string
  image: VisionImageInput
  region: VisionRegionBinding | null
  configuration: Record<string, unknown>
}

export interface VisionExtractedToken {
  text: string
  confidence: number | null
  pixelBox: VisionPixelBox | null
  normalisedBox: VisionNormalisedBox | null
  page: number | null
  line: number | null
}

export interface VisionExtractorOutput {
  candidateValue: unknown
  rawText: string | null
  engineConfidence: number | null
  tokens: VisionExtractedToken[]
  diagnostics: Record<string, unknown>
  provenance: {
    pluginKey: string
    pluginVersion: string
    engineName: string
    engineVersion: string
    executedAt: string
    configuration: Record<string, unknown>
  }
}

export interface VisionExtractorHealth {
  available: boolean
  checkedAt: string
  engineVersion: string | null
  detail: string | null
}

export interface VisionExtractorPlugin {
  readonly manifest: VisionExtractorManifest
  healthcheck(): Promise<VisionExtractorHealth>
  extract(request: VisionExtractionRequest): Promise<VisionExtractorOutput>
}

export interface VisionValidationRuleResult {
  ruleKey: string
  status: 'passed' | 'warning' | 'failed' | 'unavailable'
  message: string
  observedValue?: unknown
  expected?: unknown
}

export interface VisionValidationResult {
  status: 'valid' | 'warning' | 'invalid' | 'unavailable'
  rules: VisionValidationRuleResult[]
  validatedAt: string
  validatorVersion: string
}

export interface VisionConfidenceContribution {
  key: string
  score: number
  weight: number
  rationale: string
}

export interface VisionConfidenceResult {
  score: number | null
  status: 'accepted' | 'review_required' | 'blocked' | 'unavailable'
  threshold: number
  modelVersion: string
  contributions: VisionConfidenceContribution[]
  rationale: string[]
}

export interface VisionConflictResult {
  status: 'none' | 'review_required' | 'blocked' | 'resolved'
  policy: VisionConflictPolicy
  existingValue: unknown
  proposedValue: unknown
  resolution: string | null
}

export interface VisionExtractionEvidence {
  evidenceId: string
  runId: string
  fieldKey: string
  mappingVersionId: string
  mappingId: string
  sourceScreenshotId: string
  sourceSha256: string
  sourceRegion: VisionRegionBinding | null
  boundingBoxes: VisionNormalisedBox[]
  rawText: string | null
  rawPayload: Record<string, unknown>
  extractedValue: unknown
  extractor: VisionExtractorOutput['provenance']
  confidence: VisionConfidenceResult
  validation: VisionValidationResult
  conflict: VisionConflictResult
  recordedAt: string
}

export interface VisionExtractionProposal {
  fieldKey: string
  rawValue: unknown
  transformedValue: unknown
  confidence: VisionConfidenceResult
  status: VisionValueStatus
  validation: VisionValidationResult
  conflict: VisionConflictResult
  evidence: VisionExtractionEvidence[]
}

export function isNormalisedGeometry(value: VisionNormalisedBox): boolean {
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

export function assertEditableVisionVersion(status: VisionMappingStatus): void {
  if (status === 'published' || status === 'deprecated') {
    throw new Error('Published and deprecated Forge Vision mapping versions are immutable. Create a draft successor.')
  }
}

export function assertRegistryTarget(field: VisionFieldDefinition): void {
  if (!field.isEnabled || !field.screenshotImportAllowed) {
    throw new Error(`Forge Vision field ${field.fieldKey} is not available for screenshot import.`)
  }
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(field.fieldKey)) {
    throw new Error('Forge Vision mappings require a valid governed field registry key.')
  }
  if (!/^[a-z][a-z0-9_.-]+$/.test(field.proposalOperation)) {
    throw new Error('Forge Vision proposal operations must be registered server operations.')
  }
}

export function assertExtractorManifest(manifest: VisionExtractorManifest): void {
  if (!/^[a-z][a-z0-9_.-]+$/.test(manifest.pluginKey)) {
    throw new Error('Forge Vision extractor plugin keys must be stable lowercase identifiers.')
  }
  if (manifest.supportedMimeTypes.length === 0 || manifest.capabilities.length === 0) {
    throw new Error(`Forge Vision extractor ${manifest.pluginKey} must declare capabilities and supported input types.`)
  }
}
