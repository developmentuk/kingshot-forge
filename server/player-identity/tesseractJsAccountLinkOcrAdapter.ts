import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { createWorker, PSM, type Worker } from 'tesseract.js'
import type { VisionExtractionRequest } from '../../shared/platform/vision/contracts.js'
import { VisionRuntimeError } from '../vision/runtime/errors.js'
import type { AccountLinkOcrAdapter } from './accountLinkingOcrService.js'
import { KINGSOT_PROFILE_REGIONS, prepareProfileRegion, type KingshotProfileField } from './kingshotProfileOcr.js'
import type { AccountLinkOcrMappingVersion, AccountLinkOcrRegionObservation } from '../../shared/domains/player-identity/accountLinkingOcr.js'

const require = createRequire(import.meta.url)
const RUNTIME_TIMEOUT_MS = 45_000
const MAX_RAW_TEXT = 4_096
const TESSERACT_VERSION = '7.0.0'
const LANGUAGE_DATA_VERSION = '1.0.0'
const PLUGIN_KEY = 'ocr.tesseract.js.wasm'
const PLUGIN_VERSION = '1.0.0'

export interface TesseractJsWorkerFactory {
  create(options: Record<string, unknown>): Promise<Worker>
}

const defaultWorkerFactory: TesseractJsWorkerFactory = {
  create(options) {
    return createWorker('eng', 1, options)
  },
}

function bundledPaths(): { workerPath: string; langPath: string } {
  const language = require('@tesseract.js-data/eng') as { langPath: string }
  return {
    workerPath: require.resolve('tesseract.js/src/worker-script/node/index.js'),
    langPath: language.langPath,
  }
}

export class TesseractJsAccountLinkOcrAdapter implements AccountLinkOcrAdapter {
  readonly #workerFactory: TesseractJsWorkerFactory
  readonly #timeoutMs: number
  #busy = false

  constructor(options: { workerFactory?: TesseractJsWorkerFactory; timeoutMs?: number } = {}) {
    this.#workerFactory = options.workerFactory ?? defaultWorkerFactory
    this.#timeoutMs = options.timeoutMs ?? RUNTIME_TIMEOUT_MS
  }

  async extract(request: VisionExtractionRequest) {
    if (this.#busy) throw new VisionRuntimeError('invalid_job', 'acceptance', 'Account-linking OCR already has an active recognition job.')
    if (request.image.bytes.byteLength === 0) throw new VisionRuntimeError('invalid_job', 'acceptance', 'Account-linking OCR received an empty image.')
    if (createHash('sha256').update(request.image.bytes).digest('hex') !== request.image.sha256) throw new VisionRuntimeError('invalid_job', 'acceptance', 'Account-linking OCR image digest does not match verified evidence.')
    this.#busy = true
    let worker: Worker | null = null
    try {
      const paths = bundledPaths()
      worker = await this.#workerFactory.create({
        workerPath: paths.workerPath,
        langPath: paths.langPath,
        cacheMethod: 'none',
        gzip: true,
        workerBlobURL: false,
        logger: () => {},
      })
      const observations: AccountLinkOcrRegionObservation[] = []
      const diagnostics: { field: 'displayName' | 'playerId' | 'kingdom'; attempted: boolean; recognized: boolean; confidence: number; warnings: readonly string[] }[] = []
      for (const region of request.mappingVersionId === 'account-linking-kingshot-profile-v1' ? KINGSOT_PROFILE_REGIONS : []) {
        const prepared = prepareProfileRegion(request.image.bytes, request.image.widthPx, request.image.heightPx, region)
        await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE, preserve_interword_spaces: '1', user_defined_dpi: String(Math.min(300, 150 * prepared.scale)), tessedit_char_whitelist: region.characterWhitelist ?? '' })
        const result = await withTimeout(worker.recognize(Buffer.from(prepared.bytes), { rectangle: prepared.rectangle }), this.#timeoutMs)
        const text = cleanRawText(result.data.text)
        const confidence = confidenceValue(result.data.confidence)
        observations.push({ field: region.field as KingshotProfileField, rawText: text, confidence, warnings: prepared.warningCodes })
        diagnostics.push({ field: region.field, attempted: true, recognized: text.length > 0, confidence, warnings: prepared.warningCodes })
      }
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK, preserve_interword_spaces: '1', tessedit_char_whitelist: '' })
      const result = await withTimeout(worker.recognize(Buffer.from(request.image.bytes), { rectangle: { left: 0, top: 0, width: request.image.widthPx, height: request.image.heightPx } }), this.#timeoutMs)
      const rawText = cleanRawText(result.data.text)
      const mappingVersion: AccountLinkOcrMappingVersion = request.mappingVersionId === 'account-linking-kingshot-profile-v1' ? 'account-linking-kingshot-profile-v1' : 'account-linking-ocr-mvp'
      return {
        rawText,
        engineConfidence: confidenceValue(result.data.confidence),
        regionObservations: observations,
        diagnostics: { mappingVersion, regions: diagnostics },
        provenance: {
          pluginKey: PLUGIN_KEY,
          pluginVersion: PLUGIN_VERSION,
          engineName: 'Tesseract.js / WebAssembly',
          engineVersion: TESSERACT_VERSION,
          executedAt: new Date().toISOString(),
          configuration: { language: 'eng', languageDataVersion: LANGUAGE_DATA_VERSION, timeoutMs: this.#timeoutMs },
        },
      }
    } catch (error) {
      if (error instanceof VisionRuntimeError) throw error
      throw new VisionRuntimeError('extraction_failed', 'extraction', 'Bundled account-linking OCR failed.', { retryable: true, cause: error })
    } finally {
      try { if (worker) await worker.terminate() } finally { worker = null; this.#busy = false }
    }
  }
}

function cleanRawText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, MAX_RAW_TEXT) : ''
}

function confidenceValue(value: unknown): number {
  return typeof value === 'number' ? Math.max(0, Math.min(1, value / 100)) : 0
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new VisionRuntimeError('extraction_timeout', 'extraction', 'Bundled account-linking OCR exceeded its time limit.', { retryable: true })), timeoutMs) }),
    ])
  } finally { if (timer) clearTimeout(timer) }
}
