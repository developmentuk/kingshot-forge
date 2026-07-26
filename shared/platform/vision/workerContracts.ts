import type {
  VisionExtractionRequest,
  VisionExtractorOutput,
  VisionNormalisedBox,
  VisionPixelBox,
} from './contracts.js'

export const VISION_WORKER_PROTOCOL_VERSION = 'forge-vision-worker.v1' as const
export type VisionWorkerProtocolVersion = typeof VISION_WORKER_PROTOCOL_VERSION

export const VISION_WORKER_JOB_STATUSES = ['succeeded', 'failed'] as const
export type VisionWorkerJobStatus = (typeof VISION_WORKER_JOB_STATUSES)[number]

export const VISION_WORKER_FAILURE_CODES = [
  'invalid_job',
  'input_too_large',
  'pixel_limit_exceeded',
  'unsupported_mime_type',
  'processor_unavailable',
  'preprocessing_timeout',
  'preprocessing_failed',
  'extractor_not_registered',
  'extractor_unavailable',
  'extraction_timeout',
  'extraction_failed',
  'output_too_large',
  'token_limit_exceeded',
  'worker_timeout',
  'internal_error',
] as const
export type VisionWorkerFailureCode = (typeof VISION_WORKER_FAILURE_CODES)[number]

export type VisionWorkerStage = 'acceptance' | 'preprocessing' | 'extractor_health' | 'extraction' | 'result_validation'

export type VisionPreprocessingStep =
  | { operation: 'grayscale' }
  | { operation: 'auto_level' }
  | { operation: 'contrast'; iterations: number }
  | { operation: 'threshold'; percent: number }
  | { operation: 'sharpen'; sigma: number }
  | { operation: 'negate' }
  | { operation: 'remove_alpha' }
  | { operation: 'resize'; scale: number }

export interface VisionWorkerResourceLimits {
  timeoutMs: number
  preprocessingTimeoutMs: number
  extractionTimeoutMs: number
  maxInputBytes: number
  maxOutputBytes: number
  maxPixels: number
  maxTokens: number
}

export interface VisionWorkerJobEnvelope {
  protocolVersion: VisionWorkerProtocolVersion
  jobId: string
  traceId: string
  submittedAt: string
  extractorPluginKey: string
  extractionRequest: VisionExtractionRequest
  preprocessingSteps: VisionPreprocessingStep[]
  limits?: Partial<VisionWorkerResourceLimits>
}

export interface VisionWorkerFailure {
  code: VisionWorkerFailureCode
  stage: VisionWorkerStage
  retryable: boolean
  message: string
  detail: string | null
}

export interface VisionWorkerPreprocessingRecord {
  processorKey: string
  processorVersion: string
  engineName: string
  engineVersion: string
  sourceSha256: string
  outputSha256: string
  outputMimeType: string
  outputWidthPx: number
  outputHeightPx: number
  outputByteLength: number
  sourceRegion: VisionNormalisedBox | null
  sourcePixelBox: VisionPixelBox | null
  steps: VisionPreprocessingStep[]
  durationMs: number
  diagnostics: Record<string, unknown>
}

export interface VisionWorkerTimings {
  acceptedAt: string
  startedAt: string
  completedAt: string
  preprocessingMs: number
  extractionMs: number
  totalMs: number
}

export interface VisionWorkerJobResult {
  protocolVersion: VisionWorkerProtocolVersion
  jobId: string
  traceId: string
  status: VisionWorkerJobStatus
  preprocessing: VisionWorkerPreprocessingRecord | null
  extraction: VisionExtractorOutput | null
  failure: VisionWorkerFailure | null
  timings: VisionWorkerTimings
}

export function assertVisionPreprocessingSteps(steps: readonly VisionPreprocessingStep[]): void {
  if (steps.length > 12) throw new Error('Forge Vision preprocessing supports at most 12 governed steps per job.')
  let resizeCount = 0
  for (const step of steps) {
    switch (step.operation) {
      case 'grayscale':
      case 'auto_level':
      case 'negate':
      case 'remove_alpha':
        break
      case 'contrast':
        if (!Number.isInteger(step.iterations) || step.iterations < 1 || step.iterations > 3) throw new Error('Forge Vision contrast iterations must be an integer from 1 to 3.')
        break
      case 'threshold':
        if (!Number.isFinite(step.percent) || step.percent < 0 || step.percent > 100) throw new Error('Forge Vision threshold percentage must be between 0 and 100.')
        break
      case 'sharpen':
        if (!Number.isFinite(step.sigma) || step.sigma < 0.1 || step.sigma > 3) throw new Error('Forge Vision sharpen sigma must be between 0.1 and 3.')
        break
      case 'resize':
        resizeCount += 1
        if (!Number.isFinite(step.scale) || step.scale < 0.5 || step.scale > 4) throw new Error('Forge Vision resize scale must be between 0.5 and 4.')
        if (resizeCount > 1) throw new Error('Forge Vision preprocessing permits one resize step per job.')
        break
      default: {
        const neverStep: never = step
        throw new Error(`Unsupported Forge Vision preprocessing step: ${JSON.stringify(neverStep)}`)
      }
    }
  }
}
