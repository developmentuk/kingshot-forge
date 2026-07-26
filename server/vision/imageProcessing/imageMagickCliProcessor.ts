import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type {
  VisionImageInput,
  VisionPixelBox,
  VisionRegionBinding,
} from '../../../shared/platform/vision/contracts.js'
import {
  assertVisionPreprocessingSteps,
  type VisionPreprocessingStep,
} from '../../../shared/platform/vision/workerContracts.js'
import { VisionRuntimeError } from '../runtime/errors.js'
import type {
  VisionImageProcessingOutput,
  VisionImageProcessingRequest,
  VisionImageProcessor,
  VisionImageProcessorHealth,
  VisionImageProcessorManifest,
} from './contracts.js'

const DEFAULT_PROCESSOR_TIMEOUT_MS = 15_000
const MAX_PROCESSOR_OUTPUT_BYTES = 16 * 1024 * 1024
const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/tiff'] as const
const SUPPORTED_OPERATIONS: readonly VisionPreprocessingStep['operation'][] = [
  'grayscale',
  'auto_level',
  'contrast',
  'threshold',
  'sharpen',
  'negate',
  'remove_alpha',
  'resize',
]

export interface ImageMagickCommandResult {
  stdout: Uint8Array
  stderr: string
}

export interface ImageMagickCommandRunner {
  run(
    executable: string,
    args: readonly string[],
    timeoutMs: number,
    maxOutputBytes: number,
  ): Promise<ImageMagickCommandResult>
}

export interface ImageMagickCliProcessorOptions {
  executablePath?: string
  expectedEngineVersion?: string
  commandRunner?: ImageMagickCommandRunner
  now?: () => Date
}

const defaultCommandRunner: ImageMagickCommandRunner = {
  run(executable, args, timeoutMs, maxOutputBytes) {
    return new Promise((resolve, reject) => {
      execFile(executable, [...args], {
        encoding: 'buffer',
        maxBuffer: Math.min(maxOutputBytes, MAX_PROCESSOR_OUTPUT_BYTES),
        timeout: timeoutMs,
        windowsHide: true,
      }, (error, stdout, stderr) => {
        if (error) {
          reject(error)
          return
        }
        resolve({
          stdout: new Uint8Array(stdout),
          stderr: Buffer.from(stderr).toString('utf8'),
        })
      })
    })
  },
}

export class ImageMagickCliProcessor implements VisionImageProcessor {
  readonly manifest: VisionImageProcessorManifest
  readonly #executablePath: string
  readonly #expectedEngineVersion: string | null
  readonly #commandRunner: ImageMagickCommandRunner
  readonly #now: () => Date
  #runtimeEngineVersion: string | null = null

  constructor(options: ImageMagickCliProcessorOptions = {}) {
    this.#executablePath = options.executablePath ?? process.env.FORGE_VISION_IMAGEMAGICK_PATH ?? 'magick'
    this.#expectedEngineVersion = options.expectedEngineVersion ?? process.env.FORGE_VISION_IMAGEMAGICK_EXPECTED_VERSION ?? null
    this.#commandRunner = options.commandRunner ?? defaultCommandRunner
    this.#now = options.now ?? (() => new Date())
    this.manifest = {
      processorKey: 'image.imagemagick.cli',
      displayName: 'ImageMagick preprocessing (local CLI)',
      processorVersion: '1.0.0',
      engineName: 'ImageMagick',
      engineVersion: this.#expectedEngineVersion ?? 'runtime-discovered',
      supportedMimeTypes: SUPPORTED_MIME_TYPES,
      supportedOperations: SUPPORTED_OPERATIONS,
      executionMode: 'local_worker',
    }
  }

  async healthcheck(): Promise<VisionImageProcessorHealth> {
    try {
      const result = await this.#commandRunner.run(this.#executablePath, ['-version'], 5_000, 512 * 1024)
      const output = `${Buffer.from(result.stdout).toString('utf8')}\n${result.stderr}`
      const engineVersion = parseImageMagickVersion(output)
      this.#runtimeEngineVersion = engineVersion
      const mismatch = this.#expectedEngineVersion && engineVersion !== this.#expectedEngineVersion
      return {
        available: Boolean(engineVersion) && !mismatch,
        checkedAt: this.#now().toISOString(),
        engineVersion,
        detail: mismatch
          ? `Expected ImageMagick ${this.#expectedEngineVersion} but found ${engineVersion ?? 'an unknown version'}.`
          : engineVersion ? null : 'ImageMagick responded but its version could not be parsed.',
      }
    } catch (error) {
      return {
        available: false,
        checkedAt: this.#now().toISOString(),
        engineVersion: null,
        detail: error instanceof Error ? error.message : 'ImageMagick health check failed.',
      }
    }
  }

  async process(request: VisionImageProcessingRequest): Promise<VisionImageProcessingOutput> {
    const startedAt = this.#now().getTime()
    validateSourceImage(request.image, request.limits.maxInputBytes, request.limits.maxPixels)
    assertVisionPreprocessingSteps(request.steps)

    if (!this.manifest.supportedMimeTypes.includes(request.image.mimeType)) {
      throw new VisionRuntimeError(
        'unsupported_mime_type',
        'preprocessing',
        `Forge Vision preprocessing does not accept ${request.image.mimeType}.`,
      )
    }

    const sourcePixelBox = normalisedRegionToPixelBox(
      request.region,
      request.image.widthPx,
      request.image.heightPx,
    )
    const dimensions = outputDimensions(sourcePixelBox, request.image, request.steps)
    if (dimensions.widthPx * dimensions.heightPx > request.limits.maxPixels) {
      throw new VisionRuntimeError(
        'pixel_limit_exceeded',
        'preprocessing',
        'Forge Vision preprocessing output exceeds the configured pixel limit.',
      )
    }

    const workingDirectory = await mkdtemp(join(tmpdir(), 'forge-vision-image-'))
    const inputPath = join(workingDirectory, `input.${extensionForMimeType(request.image.mimeType)}`)

    try {
      await writeFile(inputPath, request.image.bytes)
      const timeoutMs = Math.min(request.limits.preprocessingTimeoutMs, DEFAULT_PROCESSOR_TIMEOUT_MS)
      const args = buildImageMagickArguments(inputPath, sourcePixelBox, request.steps, timeoutMs, request.limits.maxPixels)
      const maxOutputBytes = Math.min(request.limits.maxOutputBytes, MAX_PROCESSOR_OUTPUT_BYTES)

      let result: ImageMagickCommandResult
      try {
        result = await this.#commandRunner.run(this.#executablePath, args, timeoutMs, maxOutputBytes)
      } catch (error) {
        throw mapImageMagickError(error)
      }

      if (result.stdout.byteLength === 0) {
        throw new VisionRuntimeError(
          'preprocessing_failed',
          'preprocessing',
          'ImageMagick returned an empty processed image.',
        )
      }
      if (result.stdout.byteLength > request.limits.maxOutputBytes) {
        throw new VisionRuntimeError(
          'output_too_large',
          'preprocessing',
          'Processed Forge Vision image exceeds the configured output size limit.',
        )
      }

      const outputSha256 = sha256(result.stdout)
      const engineVersion = this.#runtimeEngineVersion ?? (await this.healthcheck()).engineVersion ?? 'unknown'
      const completedAt = this.#now().getTime()
      const outputImage: VisionImageInput = {
        evidenceId: `${request.image.evidenceId}:processed:${outputSha256.slice(0, 12)}`,
        sha256: outputSha256,
        mimeType: 'image/png',
        widthPx: dimensions.widthPx,
        heightPx: dimensions.heightPx,
        bytes: result.stdout,
      }

      return {
        image: outputImage,
        record: {
          processorKey: this.manifest.processorKey,
          processorVersion: this.manifest.processorVersion,
          engineName: this.manifest.engineName,
          engineVersion,
          sourceSha256: request.image.sha256,
          outputSha256,
          outputMimeType: outputImage.mimeType,
          outputWidthPx: outputImage.widthPx,
          outputHeightPx: outputImage.heightPx,
          outputByteLength: outputImage.bytes.byteLength,
          sourceRegion: request.region ? {
            x: request.region.x,
            y: request.region.y,
            width: request.region.width,
            height: request.region.height,
          } : null,
          sourcePixelBox,
          steps: request.steps.map((step) => ({ ...step })),
          durationMs: Math.max(0, completedAt - startedAt),
          diagnostics: {
            stderr: sanitiseDiagnostic(result.stderr),
            outputFormat: 'png',
            metadataStripped: true,
          },
        },
      }
    } finally {
      await rm(workingDirectory, { recursive: true, force: true })
    }
  }
}

export function buildImageMagickArguments(
  inputPath: string,
  sourcePixelBox: VisionPixelBox | null,
  steps: readonly VisionPreprocessingStep[],
  timeoutMs = DEFAULT_PROCESSOR_TIMEOUT_MS,
  maxPixels = 40_000_000,
): string[] {
  assertVisionPreprocessingSteps(steps)
  const args: string[] = [
    '-limit', 'memory', '256MiB',
    '-limit', 'map', '512MiB',
    '-limit', 'disk', '512MiB',
    '-limit', 'thread', '2',
    '-limit', 'time', String(Math.max(1, Math.ceil(timeoutMs / 1000))),
    '-limit', 'area', String(maxPixels),
    inputPath,
  ]

  if (sourcePixelBox) {
    args.push(
      '-crop',
      `${sourcePixelBox.width}x${sourcePixelBox.height}+${sourcePixelBox.left}+${sourcePixelBox.top}`,
      '+repage',
    )
  }

  for (const step of steps) {
    switch (step.operation) {
      case 'grayscale':
        args.push('-colorspace', 'Gray')
        break
      case 'auto_level':
        args.push('-auto-level')
        break
      case 'contrast':
        for (let index = 0; index < step.iterations; index += 1) args.push('-contrast')
        break
      case 'threshold':
        args.push('-threshold', `${formatNumber(step.percent)}%`)
        break
      case 'sharpen':
        args.push('-sharpen', `0x${formatNumber(step.sigma)}`)
        break
      case 'negate':
        args.push('-negate')
        break
      case 'remove_alpha':
        args.push('-alpha', 'off')
        break
      case 'resize':
        args.push('-resize', `${formatNumber(step.scale * 100)}%`)
        break
    }
  }

  args.push('-strip', 'png:-')
  return args
}

export function normalisedRegionToPixelBox(
  region: VisionRegionBinding | null,
  widthPx: number,
  heightPx: number,
): VisionPixelBox | null {
  if (!region) return null
  if (![widthPx, heightPx].every((value) => Number.isInteger(value) && value > 0)) {
    throw new VisionRuntimeError('invalid_job', 'preprocessing', 'Source image dimensions must be positive integers.')
  }
  const values = [region.x, region.y, region.width, region.height]
  if (!values.every(Number.isFinite)
    || region.x < 0
    || region.y < 0
    || region.width <= 0
    || region.height <= 0
    || region.x + region.width > 1.00000001
    || region.y + region.height > 1.00000001) {
    throw new VisionRuntimeError('invalid_job', 'preprocessing', 'Forge Vision received invalid normalised crop geometry.')
  }

  const left = clampInteger(Math.floor(region.x * widthPx), 0, widthPx - 1)
  const top = clampInteger(Math.floor(region.y * heightPx), 0, heightPx - 1)
  const right = clampInteger(Math.ceil(((region.x + region.width) * widthPx) - 1e-9), left + 1, widthPx)
  const bottom = clampInteger(Math.ceil(((region.y + region.height) * heightPx) - 1e-9), top + 1, heightPx)
  return { left, top, width: right - left, height: bottom - top }
}

function outputDimensions(
  sourcePixelBox: VisionPixelBox | null,
  image: VisionImageInput,
  steps: readonly VisionPreprocessingStep[],
): { widthPx: number; heightPx: number } {
  let widthPx = sourcePixelBox?.width ?? image.widthPx
  let heightPx = sourcePixelBox?.height ?? image.heightPx
  const resize = steps.find((step): step is Extract<VisionPreprocessingStep, { operation: 'resize' }> => step.operation === 'resize')
  if (resize) {
    widthPx = Math.max(1, Math.round(widthPx * resize.scale))
    heightPx = Math.max(1, Math.round(heightPx * resize.scale))
  }
  return { widthPx, heightPx }
}

function validateSourceImage(image: VisionImageInput, maxInputBytes: number, maxPixels: number): void {
  if (!/^[a-f0-9]{64}$/.test(image.sha256)) {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision image SHA-256 metadata is invalid.')
  }
  if (!Number.isInteger(image.widthPx) || image.widthPx <= 0 || !Number.isInteger(image.heightPx) || image.heightPx <= 0) {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision image dimensions must be positive integers.')
  }
  if (image.bytes.byteLength === 0 || image.bytes.byteLength > maxInputBytes) {
    throw new VisionRuntimeError('input_too_large', 'acceptance', 'Forge Vision image input is empty or exceeds the configured byte limit.')
  }
  if (image.widthPx * image.heightPx > maxPixels) {
    throw new VisionRuntimeError('pixel_limit_exceeded', 'acceptance', 'Forge Vision image exceeds the configured pixel limit.')
  }
  if (sha256(image.bytes) !== image.sha256) {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision image bytes do not match the supplied SHA-256 digest.')
  }
}

function mapImageMagickError(error: unknown): VisionRuntimeError {
  const candidate = error as { killed?: boolean; signal?: string; code?: string | number }
  if (candidate?.killed || candidate?.signal === 'SIGTERM') {
    return new VisionRuntimeError(
      'preprocessing_timeout',
      'preprocessing',
      'Forge Vision image preprocessing exceeded its time limit.',
      { retryable: true, cause: error },
    )
  }
  return new VisionRuntimeError(
    'preprocessing_failed',
    'preprocessing',
    'Forge Vision image preprocessing failed.',
    { retryable: true, safeDetail: candidate?.code == null ? null : String(candidate.code), cause: error },
  )
}

function parseImageMagickVersion(output: string): string | null {
  return output.match(/ImageMagick\s+([0-9]+(?:\.[0-9]+){1,3}(?:-[0-9]+)?)/i)?.[1] ?? null
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'image/tiff') return 'tiff'
  throw new VisionRuntimeError('unsupported_mime_type', 'preprocessing', `Unsupported Forge Vision image type: ${mimeType}`)
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function formatNumber(value: number): string {
  return Number(value.toFixed(4)).toString()
}

function sanitiseDiagnostic(value: string): string | null {
  const trimmed = value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!trimmed) return null
  return trimmed.slice(0, 2_000)
}
