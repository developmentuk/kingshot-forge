import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import type {
  VisionExtractionRequest,
  VisionExtractorHealth,
  VisionExtractorManifest,
  VisionExtractorOutput,
  VisionExtractorPlugin,
  VisionExtractedToken,
} from '../../../shared/platform/vision/contracts.js'
import { VisionRuntimeError } from '../runtime/errors.js'

const execFileAsync = promisify(execFile)
const DEFAULT_TIMEOUT_MS = 30_000
const MAX_TIMEOUT_MS = 60_000
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024
const DEFAULT_MAX_INPUT_BYTES = 16 * 1024 * 1024
const DEFAULT_MAX_PIXELS = 40_000_000
const DEFAULT_MAX_TOKENS = 20_000

export interface TesseractCommandResult {
  stdout: string
  stderr: string
}

export interface TesseractCommandRunner {
  run(executable: string, args: readonly string[], timeoutMs: number): Promise<TesseractCommandResult>
}

export interface TesseractCliExtractorOptions {
  executablePath?: string
  tessdataDirectory?: string
  expectedEngineVersion?: string
  requiredLanguages?: string[]
  maxInputBytes?: number
  maxPixels?: number
  maxTokens?: number
  commandRunner?: TesseractCommandRunner
  now?: () => Date
}

interface TesseractRequestConfiguration {
  language: string
  pageSegmentationMode: number
  ocrEngineMode: number
  preserveInterwordSpaces: boolean
  characterWhitelist: string | null
  timeoutMs: number
}

const defaultCommandRunner: TesseractCommandRunner = {
  async run(executable, args, timeoutMs) {
    const result = await execFileAsync(executable, [...args], {
      encoding: 'utf8',
      maxBuffer: MAX_OUTPUT_BYTES,
      timeout: timeoutMs,
      windowsHide: true,
    })
    return { stdout: result.stdout, stderr: result.stderr }
  },
}

export class TesseractCliExtractor implements VisionExtractorPlugin {
  readonly manifest: VisionExtractorManifest
  readonly #executablePath: string
  readonly #tessdataDirectory: string | null
  readonly #expectedEngineVersion: string | null
  readonly #requiredLanguages: string[]
  readonly #maxInputBytes: number
  readonly #maxPixels: number
  readonly #maxTokens: number
  readonly #commandRunner: TesseractCommandRunner
  readonly #now: () => Date
  #runtimeEngineVersion: string | null = null

  constructor(options: TesseractCliExtractorOptions = {}) {
    this.#executablePath = options.executablePath ?? process.env.FORGE_VISION_TESSERACT_PATH ?? 'tesseract'
    this.#tessdataDirectory = options.tessdataDirectory ?? process.env.FORGE_VISION_TESSDATA_DIR ?? null
    this.#expectedEngineVersion = options.expectedEngineVersion ?? process.env.FORGE_VISION_TESSERACT_EXPECTED_VERSION ?? null
    this.#requiredLanguages = options.requiredLanguages ?? ['eng']
    this.#maxInputBytes = options.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES
    this.#maxPixels = options.maxPixels ?? DEFAULT_MAX_PIXELS
    this.#maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS
    this.#commandRunner = options.commandRunner ?? defaultCommandRunner
    this.#now = options.now ?? (() => new Date())
    this.manifest = {
      pluginKey: 'ocr.tesseract.cli',
      displayName: 'Tesseract OCR (local CLI)',
      family: 'ocr',
      executionMode: 'local_worker',
      engineName: 'Tesseract',
      engineVersion: this.#expectedEngineVersion ?? 'runtime-discovered',
      pluginVersion: '1.1.0',
      supportedMimeTypes: ['image/png', 'image/jpeg', 'image/tiff'],
      capabilities: ['text', 'word_confidence', 'word_boxes', 'tsv_diagnostics', 'language_selection'],
      configurationSchema: {
        language: { type: 'string', pattern: '^[a-z0-9_+.-]{2,80}$', default: 'eng' },
        pageSegmentationMode: { type: 'integer', minimum: 0, maximum: 13, default: 6 },
        ocrEngineMode: { type: 'integer', minimum: 0, maximum: 3, default: 1 },
        preserveInterwordSpaces: { type: 'boolean', default: false },
        characterWhitelist: { type: ['string', 'null'], maxLength: 256, default: null },
        timeoutMs: { type: 'integer', minimum: 1000, maximum: MAX_TIMEOUT_MS, default: DEFAULT_TIMEOUT_MS },
      },
      costProfile: 'local_zero_cost',
    }
  }

  async healthcheck(): Promise<VisionExtractorHealth> {
    try {
      const versionResult = await this.#commandRunner.run(this.#executablePath, ['--version'], 5_000)
      const engineVersion = parseTesseractVersion(versionResult.stdout || versionResult.stderr)
      this.#runtimeEngineVersion = engineVersion

      const listArgs = this.#tessdataDirectory
        ? ['--tessdata-dir', this.#tessdataDirectory, '--list-langs']
        : ['--list-langs']
      const languageResult = await this.#commandRunner.run(this.#executablePath, listArgs, 5_000)
      const languages = parseTesseractLanguages(languageResult.stdout || languageResult.stderr)
      const missingLanguages = this.#requiredLanguages.filter((language) => !languages.includes(language))
      const versionMismatch = Boolean(this.#expectedEngineVersion && engineVersion !== this.#expectedEngineVersion)
      const details = [
        versionMismatch ? `Expected Tesseract ${this.#expectedEngineVersion} but found ${engineVersion ?? 'an unknown version'}.` : null,
        missingLanguages.length > 0 ? `Missing required Tesseract language data: ${missingLanguages.join(', ')}.` : null,
        engineVersion ? null : 'Tesseract responded but its version could not be parsed.',
      ].filter((value): value is string => Boolean(value))

      return {
        available: Boolean(engineVersion) && !versionMismatch && missingLanguages.length === 0,
        checkedAt: this.#now().toISOString(),
        engineVersion,
        detail: details.length > 0 ? details.join(' ') : null,
      }
    } catch (error) {
      return {
        available: false,
        checkedAt: this.#now().toISOString(),
        engineVersion: null,
        detail: error instanceof Error ? error.message : 'Tesseract health check failed.',
      }
    }
  }

  async extract(request: VisionExtractionRequest): Promise<VisionExtractorOutput> {
    validateTesseractInput(request, this.#maxInputBytes, this.#maxPixels)
    if (!this.manifest.supportedMimeTypes.includes(request.image.mimeType)) {
      throw new VisionRuntimeError(
        'unsupported_mime_type',
        'extraction',
        `Tesseract CLI extractor does not accept ${request.image.mimeType}; preprocess it into PNG, JPEG or TIFF.`,
      )
    }

    const configuration = parseConfiguration(request.configuration)
    const extension = extensionForMimeType(request.image.mimeType)
    const workingDirectory = await mkdtemp(join(tmpdir(), 'forge-vision-tesseract-'))
    const inputPath = join(workingDirectory, `input.${extension}`)

    try {
      await writeFile(inputPath, request.image.bytes)
      const args = buildTesseractArguments(inputPath, configuration, this.#tessdataDirectory)
      let result: TesseractCommandResult
      try {
        result = await this.#commandRunner.run(this.#executablePath, args, configuration.timeoutMs)
      } catch (error) {
        throw mapTesseractError(error)
      }

      let tokens: VisionExtractedToken[]
      try {
        tokens = parseTesseractTsv(result.stdout, request.image.widthPx, request.image.heightPx)
      } catch (error) {
        throw new VisionRuntimeError(
          'extraction_failed',
          'extraction',
          'Tesseract returned invalid TSV output.',
          { cause: error },
        )
      }
      if (tokens.length > this.#maxTokens) {
        throw new VisionRuntimeError(
          'token_limit_exceeded',
          'result_validation',
          'Tesseract output exceeds the configured token limit.',
        )
      }

      const rawText = tokens.map((token) => token.text).join(' ').replace(/\s+/g, ' ').trim()
      const engineConfidence = weightedConfidence(tokens)
      if (!this.#runtimeEngineVersion) {
        const health = await this.healthcheck()
        if (!health.available) {
          throw new VisionRuntimeError(
            'extractor_unavailable',
            'extractor_health',
            'Tesseract runtime health requirements are not satisfied.',
            { safeDetail: health.detail },
          )
        }
      }
      const engineVersion = this.#runtimeEngineVersion ?? 'unknown'

      return {
        candidateValue: rawText,
        rawText,
        engineConfidence,
        tokens,
        diagnostics: {
          stderr: sanitiseDiagnostic(result.stderr),
          tokenCount: tokens.length,
          outputFormat: 'tsv',
          inputSha256: request.image.sha256,
        },
        provenance: {
          pluginKey: this.manifest.pluginKey,
          pluginVersion: this.manifest.pluginVersion,
          engineName: this.manifest.engineName,
          engineVersion,
          executedAt: this.#now().toISOString(),
          configuration: { ...configuration },
        },
      }
    } finally {
      await rm(workingDirectory, { recursive: true, force: true })
    }
  }
}

export function buildTesseractArguments(
  inputPath: string,
  configuration: TesseractRequestConfiguration,
  tessdataDirectory: string | null,
): string[] {
  const args = [
    inputPath,
    'stdout',
    '-l',
    configuration.language,
    '--oem',
    String(configuration.ocrEngineMode),
    '--psm',
    String(configuration.pageSegmentationMode),
  ]
  if (tessdataDirectory) args.push('--tessdata-dir', tessdataDirectory)
  if (configuration.preserveInterwordSpaces) args.push('-c', 'preserve_interword_spaces=1')
  if (configuration.characterWhitelist) args.push('-c', `tessedit_char_whitelist=${configuration.characterWhitelist}`)
  args.push('tsv')
  return args
}

export function parseTesseractTsv(tsv: string, imageWidth: number, imageHeight: number): VisionExtractedToken[] {
  if (!Number.isFinite(imageWidth) || imageWidth <= 0 || !Number.isFinite(imageHeight) || imageHeight <= 0) throw new Error('Tesseract token normalisation requires positive image dimensions.')
  const lines = tsv.replace(/^\uFEFF/, '').split(/\r?\n/)
  if (lines.length === 0 || !lines[0]?.startsWith('level\tpage_num')) throw new Error('Tesseract did not return the expected TSV header.')
  const tokens: VisionExtractedToken[] = []
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const columns = line.split('\t')
    if (columns.length < 12 || columns[0] !== '5') continue
    const text = columns.slice(11).join('\t').trim()
    if (!text) continue
    const left = Number(columns[6])
    const top = Number(columns[7])
    const width = Number(columns[8])
    const height = Number(columns[9])
    const rawConfidence = Number(columns[10])
    const boxValid = [left, top, width, height].every(Number.isFinite) && width >= 0 && height >= 0
    tokens.push({
      text,
      confidence: Number.isFinite(rawConfidence) && rawConfidence >= 0 ? clamp01(rawConfidence / 100) : null,
      pixelBox: boxValid ? { left, top, width, height } : null,
      normalisedBox: boxValid ? {
        x: clamp01(left / imageWidth),
        y: clamp01(top / imageHeight),
        width: clamp01(width / imageWidth),
        height: clamp01(height / imageHeight),
      } : null,
      page: toPositiveInteger(columns[1]),
      line: toPositiveInteger(columns[4]),
    })
  }
  return tokens
}

export function parseTesseractLanguages(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[A-Za-z0-9_]+$/.test(line))
    .sort()
}

function parseConfiguration(value: Record<string, unknown>): TesseractRequestConfiguration {
  const language = typeof value.language === 'string' ? value.language : 'eng'
  if (!/^[a-z0-9_+.-]{2,80}$/i.test(language)) throw new Error('Invalid Tesseract language configuration.')
  const pageSegmentationMode = boundedInteger(value.pageSegmentationMode, 6, 0, 13, 'pageSegmentationMode')
  const ocrEngineMode = boundedInteger(value.ocrEngineMode, 1, 0, 3, 'ocrEngineMode')
  const timeoutMs = boundedInteger(value.timeoutMs, DEFAULT_TIMEOUT_MS, 1_000, MAX_TIMEOUT_MS, 'timeoutMs')
  const preserveInterwordSpaces = value.preserveInterwordSpaces === true
  const characterWhitelist = value.characterWhitelist == null ? null : String(value.characterWhitelist)
  if (characterWhitelist && characterWhitelist.length > 256) throw new Error('Tesseract character whitelist is too long.')
  return { language, pageSegmentationMode, ocrEngineMode, timeoutMs, preserveInterwordSpaces, characterWhitelist }
}

function validateTesseractInput(request: VisionExtractionRequest, maxInputBytes: number, maxPixels: number): void {
  const image = request.image
  if (image.bytes.byteLength === 0 || image.bytes.byteLength > maxInputBytes) throw new VisionRuntimeError('input_too_large', 'acceptance', 'Tesseract input is empty or exceeds the configured byte limit.')
  if (!Number.isInteger(image.widthPx) || image.widthPx <= 0 || !Number.isInteger(image.heightPx) || image.heightPx <= 0) throw new VisionRuntimeError('invalid_job', 'acceptance', 'Tesseract input dimensions must be positive integers.')
  if (image.widthPx * image.heightPx > maxPixels) throw new VisionRuntimeError('pixel_limit_exceeded', 'acceptance', 'Tesseract input exceeds the configured pixel limit.')
  if (!/^[a-f0-9]{64}$/.test(image.sha256) || createHash('sha256').update(image.bytes).digest('hex') !== image.sha256) throw new VisionRuntimeError('invalid_job', 'acceptance', 'Tesseract input SHA-256 metadata does not match its bytes.')
}

function mapTesseractError(error: unknown): VisionRuntimeError {
  const candidate = error as { killed?: boolean; signal?: string; code?: string | number }
  if (candidate?.killed || candidate?.signal === 'SIGTERM') return new VisionRuntimeError('extraction_timeout', 'extraction', 'Tesseract extraction exceeded its time limit.', { retryable: true, cause: error })
  return new VisionRuntimeError('extraction_failed', 'extraction', 'Tesseract extraction failed.', { retryable: true, safeDetail: candidate?.code == null ? null : String(candidate.code), cause: error })
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number, label: string): number {
  const resolved = value == null ? fallback : Number(value)
  if (!Number.isInteger(resolved) || resolved < minimum || resolved > maximum) throw new Error(`Invalid Tesseract ${label} configuration.`)
  return resolved
}

function weightedConfidence(tokens: VisionExtractedToken[]): number | null {
  let weightedTotal = 0
  let weight = 0
  for (const token of tokens) {
    if (token.confidence == null) continue
    const tokenWeight = Math.max(1, [...token.text].length)
    weightedTotal += token.confidence * tokenWeight
    weight += tokenWeight
  }
  return weight > 0 ? clamp01(weightedTotal / weight) : null
}

function parseTesseractVersion(output: string): string | null {
  return output.match(/tesseract\s+([^\s]+)/i)?.[1] ?? null
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/tiff') return 'tiff'
  throw new VisionRuntimeError('unsupported_mime_type', 'extraction', `Unsupported Tesseract input type: ${mimeType}`)
}

function toPositiveInteger(value: string | undefined): number | null {
  const resolved = Number(value)
  return Number.isInteger(resolved) && resolved > 0 ? resolved : null
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function sanitiseDiagnostic(value: string): string | null {
  const trimmed = value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
  return trimmed ? trimmed.slice(0, 2_000) : null
}
