import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { createWorker, PSM, type Worker } from 'tesseract.js'
import type { VisionExtractionRequest } from '../../shared/platform/vision/contracts.js'
import { VisionRuntimeError } from '../vision/runtime/errors.js'
import type { AccountLinkOcrAdapter } from './accountLinkingOcrService.js'

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
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK, preserve_interword_spaces: '1' })
      const result = await withTimeout(worker.recognize(Buffer.from(request.image.bytes)), this.#timeoutMs)
      const rawText = typeof result.data.text === 'string' ? result.data.text.replace(/\s+/g, ' ').trim().slice(0, MAX_RAW_TEXT) : ''
      return {
        rawText,
        engineConfidence: typeof result.data.confidence === 'number' ? Math.max(0, Math.min(1, result.data.confidence / 100)) : 0,
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new VisionRuntimeError('extraction_timeout', 'extraction', 'Bundled account-linking OCR exceeded its time limit.', { retryable: true })), timeoutMs) }),
    ])
  } finally { if (timer) clearTimeout(timer) }
}
