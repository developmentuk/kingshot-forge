import type {
  VisionExtractorHealth,
  VisionExtractorOutput,
} from '../../../shared/platform/vision/contracts.js'
import {
  VISION_WORKER_PROTOCOL_VERSION,
  type VisionWorkerJobEnvelope,
  type VisionWorkerJobResult,
  type VisionWorkerResourceLimits,
} from '../../../shared/platform/vision/workerContracts.js'
import type { VisionExtractorRegistry } from '../extractors/registry.js'
import type {
  VisionImageProcessor,
  VisionImageProcessorHealth,
} from '../imageProcessing/contracts.js'
import { VisionRuntimeError, toVisionWorkerFailure } from '../runtime/errors.js'

export const DEFAULT_VISION_WORKER_LIMITS: Readonly<VisionWorkerResourceLimits> = Object.freeze({
  timeoutMs: 45_000,
  preprocessingTimeoutMs: 15_000,
  extractionTimeoutMs: 30_000,
  maxInputBytes: 16 * 1024 * 1024,
  maxOutputBytes: 8 * 1024 * 1024,
  maxPixels: 40_000_000,
  maxTokens: 20_000,
})

export const MAX_VISION_WORKER_LIMITS: Readonly<VisionWorkerResourceLimits> = Object.freeze({
  timeoutMs: 120_000,
  preprocessingTimeoutMs: 60_000,
  extractionTimeoutMs: 90_000,
  maxInputBytes: 32 * 1024 * 1024,
  maxOutputBytes: 16 * 1024 * 1024,
  maxPixels: 80_000_000,
  maxTokens: 50_000,
})

export interface VisionWorkerHealthReport {
  available: boolean
  checkedAt: string
  workerVersion: string
  processor: VisionImageProcessorHealth & { processorKey: string }
  extractors: Array<VisionExtractorHealth & { pluginKey: string }>
}

export interface VisionWorkerHostOptions {
  registry: VisionExtractorRegistry
  imageProcessor: VisionImageProcessor
  healthTtlMs?: number
  now?: () => Date
}

type CachedHealth<T> = { expiresAt: number; value: T }

export class VisionWorkerHost {
  readonly workerVersion = '1.0.0'
  readonly #registry: VisionExtractorRegistry
  readonly #imageProcessor: VisionImageProcessor
  readonly #healthTtlMs: number
  readonly #now: () => Date
  #processorHealth: CachedHealth<VisionImageProcessorHealth> | null = null
  readonly #extractorHealth = new Map<string, CachedHealth<VisionExtractorHealth>>()

  constructor(options: VisionWorkerHostOptions) {
    this.#registry = options.registry
    this.#imageProcessor = options.imageProcessor
    this.#healthTtlMs = options.healthTtlMs ?? 30_000
    this.#now = options.now ?? (() => new Date())
  }

  async healthcheck(force = false): Promise<VisionWorkerHealthReport> {
    const processor = await this.#getProcessorHealth(force)
    const extractors = await Promise.all(this.#registry.list().map(async (plugin) => ({
      pluginKey: plugin.manifest.pluginKey,
      ...(await this.#getExtractorHealth(plugin.manifest.pluginKey, force)),
    })))
    return {
      available: processor.available && extractors.some((item) => item.available),
      checkedAt: this.#now().toISOString(),
      workerVersion: this.workerVersion,
      processor: {
        processorKey: this.#imageProcessor.manifest.processorKey,
        ...processor,
      },
      extractors,
    }
  }

  async execute(job: VisionWorkerJobEnvelope): Promise<VisionWorkerJobResult> {
    const acceptedAt = this.#now()
    const startedAt = this.#now()
    let preprocessingMs = 0
    let extractionMs = 0
    let preprocessingRecord: VisionWorkerJobResult['preprocessing'] = null

    try {
      validateJobEnvelope(job)
      const limits = resolveVisionWorkerLimits(job.limits)
      const work = async (): Promise<VisionWorkerJobResult> => {
        let extractor
        try {
          extractor = this.#registry.get(job.extractorPluginKey)
        } catch (error) {
          throw new VisionRuntimeError(
            'extractor_not_registered',
            'acceptance',
            `Forge Vision extractor ${job.extractorPluginKey} is not registered on this worker.`,
            { cause: error },
          )
        }

        const processorHealth = await this.#getProcessorHealth(false)
        if (!processorHealth.available) {
          throw new VisionRuntimeError(
            'processor_unavailable',
            'preprocessing',
            'Forge Vision image preprocessing is unavailable.',
            { retryable: true, safeDetail: processorHealth.detail },
          )
        }
        const extractorHealth = await this.#getExtractorHealth(job.extractorPluginKey, false)
        if (!extractorHealth.available) {
          throw new VisionRuntimeError(
            'extractor_unavailable',
            'extractor_health',
            `Forge Vision extractor ${job.extractorPluginKey} is unavailable.`,
            { retryable: true, safeDetail: extractorHealth.detail },
          )
        }

        const preprocessingStarted = this.#now().getTime()
        const processed = await withTimeout(
          this.#imageProcessor.process({
            image: job.extractionRequest.image,
            region: job.extractionRequest.region,
            steps: job.preprocessingSteps,
            limits,
          }),
          limits.preprocessingTimeoutMs,
          () => new VisionRuntimeError(
            'preprocessing_timeout',
            'preprocessing',
            'Forge Vision preprocessing exceeded its stage timeout.',
            { retryable: true },
          ),
        )
        preprocessingMs = Math.max(0, this.#now().getTime() - preprocessingStarted)
        preprocessingRecord = processed.record

        const extractionStarted = this.#now().getTime()
        const configuration = {
          ...job.extractionRequest.configuration,
          timeoutMs: boundedExtractorTimeout(job.extractionRequest.configuration.timeoutMs, limits.extractionTimeoutMs),
        }
        const extraction = await withTimeout(
          extractor.extract({
            ...job.extractionRequest,
            image: processed.image,
            region: null,
            configuration,
          }),
          limits.extractionTimeoutMs,
          () => new VisionRuntimeError(
            'extraction_timeout',
            'extraction',
            'Forge Vision extraction exceeded its stage timeout.',
            { retryable: true },
          ),
        )
        extractionMs = Math.max(0, this.#now().getTime() - extractionStarted)
        validateExtractorOutput(extraction, limits)

        const completedAt = this.#now()
        return {
          protocolVersion: VISION_WORKER_PROTOCOL_VERSION,
          jobId: job.jobId,
          traceId: job.traceId,
          status: 'succeeded',
          preprocessing: preprocessingRecord,
          extraction,
          failure: null,
          timings: {
            acceptedAt: acceptedAt.toISOString(),
            startedAt: startedAt.toISOString(),
            completedAt: completedAt.toISOString(),
            preprocessingMs,
            extractionMs,
            totalMs: Math.max(0, completedAt.getTime() - acceptedAt.getTime()),
          },
        }
      }

      return await withTimeout(
        work(),
        limits.timeoutMs,
        () => new VisionRuntimeError(
          'worker_timeout',
          'result_validation',
          'Forge Vision worker job exceeded its total timeout.',
          { retryable: true },
        ),
      )
    } catch (error) {
      const completedAt = this.#now()
      return {
        protocolVersion: VISION_WORKER_PROTOCOL_VERSION,
        jobId: safeIdentifier(job?.jobId, 'unknown-job'),
        traceId: safeIdentifier(job?.traceId, 'unknown-trace'),
        status: 'failed',
        preprocessing: preprocessingRecord,
        extraction: null,
        failure: toVisionWorkerFailure(error, 'result_validation'),
        timings: {
          acceptedAt: acceptedAt.toISOString(),
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          preprocessingMs,
          extractionMs,
          totalMs: Math.max(0, completedAt.getTime() - acceptedAt.getTime()),
        },
      }
    }
  }

  async #getProcessorHealth(force: boolean): Promise<VisionImageProcessorHealth> {
    const current = this.#now().getTime()
    if (!force && this.#processorHealth && this.#processorHealth.expiresAt > current) return this.#processorHealth.value
    const value = await this.#imageProcessor.healthcheck()
    this.#processorHealth = { expiresAt: current + this.#healthTtlMs, value }
    return value
  }

  async #getExtractorHealth(pluginKey: string, force: boolean): Promise<VisionExtractorHealth> {
    const current = this.#now().getTime()
    const cached = this.#extractorHealth.get(pluginKey)
    if (!force && cached && cached.expiresAt > current) return cached.value
    const value = await this.#registry.get(pluginKey).healthcheck()
    this.#extractorHealth.set(pluginKey, { expiresAt: current + this.#healthTtlMs, value })
    return value
  }
}

export function resolveVisionWorkerLimits(
  requested: Partial<VisionWorkerResourceLimits> | undefined,
): VisionWorkerResourceLimits {
  const resolved = { ...DEFAULT_VISION_WORKER_LIMITS, ...(requested ?? {}) }
  for (const key of Object.keys(DEFAULT_VISION_WORKER_LIMITS) as Array<keyof VisionWorkerResourceLimits>) {
    const value = resolved[key]
    if (!Number.isInteger(value) || value <= 0 || value > MAX_VISION_WORKER_LIMITS[key]) {
      throw new VisionRuntimeError(
        'invalid_job',
        'acceptance',
        `Forge Vision worker limit ${key} is invalid or exceeds the platform maximum.`,
      )
    }
  }
  return resolved
}

function validateJobEnvelope(job: VisionWorkerJobEnvelope): void {
  if (job.protocolVersion !== VISION_WORKER_PROTOCOL_VERSION) {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Unsupported Forge Vision worker protocol version.')
  }
  for (const [label, value] of [['jobId', job.jobId], ['traceId', job.traceId], ['extractorPluginKey', job.extractorPluginKey]] as const) {
    if (typeof value !== 'string' || value.length < 1 || value.length > 160 || !/^[A-Za-z0-9_.:-]+$/.test(value)) {
      throw new VisionRuntimeError('invalid_job', 'acceptance', `Forge Vision ${label} is invalid.`)
    }
  }
  if (!Number.isFinite(Date.parse(job.submittedAt))) {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision submittedAt must be a valid timestamp.')
  }
  if (!job.extractionRequest || typeof job.extractionRequest !== 'object') {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision extraction request is missing.')
  }
  if (!Array.isArray(job.preprocessingSteps)) {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision preprocessing steps must be an array.')
  }
}

function validateExtractorOutput(output: VisionExtractorOutput, limits: VisionWorkerResourceLimits): void {
  if (output.tokens.length > limits.maxTokens) {
    throw new VisionRuntimeError('token_limit_exceeded', 'result_validation', 'Forge Vision extractor output exceeds the configured token limit.')
  }
  let outputSize: number
  try {
    outputSize = Buffer.byteLength(JSON.stringify(output), 'utf8')
  } catch (error) {
    throw new VisionRuntimeError('extraction_failed', 'result_validation', 'Forge Vision extractor returned a non-serialisable result.', { cause: error })
  }
  if (outputSize > limits.maxOutputBytes) {
    throw new VisionRuntimeError('output_too_large', 'result_validation', 'Forge Vision extractor output exceeds the configured byte limit.')
  }
  if (output.provenance.pluginKey.length === 0 || output.provenance.engineVersion.length === 0) {
    throw new VisionRuntimeError('extraction_failed', 'result_validation', 'Forge Vision extractor output is missing required provenance.')
  }
}

function boundedExtractorTimeout(value: unknown, stageMaximum: number): number {
  const requested = value == null ? stageMaximum : Number(value)
  if (!Number.isInteger(requested) || requested <= 0) return stageMaximum
  return Math.min(requested, stageMaximum)
}

function safeIdentifier(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,160}$/.test(value) ? value : fallback
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, createError: () => Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(createError()), timeoutMs)
    timer.unref?.()
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (error) => { clearTimeout(timer); reject(error) },
    )
  })
}
