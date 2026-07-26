import type {
  VisionWorkerFailure,
  VisionWorkerFailureCode,
  VisionWorkerStage,
} from '../../../shared/platform/vision/workerContracts.js'

export class VisionRuntimeError extends Error {
  readonly code: VisionWorkerFailureCode
  readonly stage: VisionWorkerStage
  readonly retryable: boolean
  readonly safeDetail: string | null

  constructor(
    code: VisionWorkerFailureCode,
    stage: VisionWorkerStage,
    message: string,
    options: { retryable?: boolean; safeDetail?: string | null; cause?: unknown } = {},
  ) {
    super(message)
    if (options.cause !== undefined) {
      Object.defineProperty(this, 'cause', { configurable: true, enumerable: false, value: options.cause, writable: false })
    }
    this.name = 'VisionRuntimeError'
    this.code = code
    this.stage = stage
    this.retryable = options.retryable ?? false
    this.safeDetail = options.safeDetail ?? null
  }
}

export function toVisionWorkerFailure(
  error: unknown,
  fallbackStage: VisionWorkerStage,
): VisionWorkerFailure {
  if (error instanceof VisionRuntimeError) {
    return {
      code: error.code,
      stage: error.stage,
      retryable: error.retryable,
      message: error.message,
      detail: error.safeDetail,
    }
  }

  return {
    code: 'internal_error',
    stage: fallbackStage,
    retryable: false,
    message: 'Forge Vision encountered an unexpected worker failure.',
    detail: error instanceof Error ? error.name : null,
  }
}
