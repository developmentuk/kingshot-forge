import type {
  VisionImageInput,
  VisionRegionBinding,
} from '../../../shared/platform/vision/contracts.js'
import type {
  VisionPreprocessingStep,
  VisionWorkerPreprocessingRecord,
  VisionWorkerResourceLimits,
} from '../../../shared/platform/vision/workerContracts.js'

export interface VisionImageProcessorManifest {
  processorKey: string
  displayName: string
  processorVersion: string
  engineName: string
  engineVersion: string
  supportedMimeTypes: readonly string[]
  supportedOperations: readonly VisionPreprocessingStep['operation'][]
  executionMode: 'local_worker' | 'server_worker'
}

export interface VisionImageProcessorHealth {
  available: boolean
  checkedAt: string
  engineVersion: string | null
  detail: string | null
}

export interface VisionImageProcessingRequest {
  image: VisionImageInput
  region: VisionRegionBinding | null
  steps: VisionPreprocessingStep[]
  limits: VisionWorkerResourceLimits
}

export interface VisionImageProcessingOutput {
  image: VisionImageInput
  record: VisionWorkerPreprocessingRecord
}

export interface VisionImageProcessor {
  readonly manifest: VisionImageProcessorManifest
  healthcheck(): Promise<VisionImageProcessorHealth>
  process(request: VisionImageProcessingRequest): Promise<VisionImageProcessingOutput>
}
