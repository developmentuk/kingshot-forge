import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { createWorker, PSM, type Worker } from 'tesseract.js'
import type { VisionExtractionRequest } from '../../shared/platform/vision/contracts.js'
import { VisionRuntimeError } from '../vision/runtime/errors.js'
import type { AccountLinkOcrAdapter } from './accountLinkingOcrService.js'
import { KINGSHOT_PROFILE_V1_MAPPING_VERSION, KINGSHOT_PROFILE_V2_MAPPING_VERSION, prepareProfileRegion, type KingshotProfileRegion } from './kingshotProfileOcr.js'
import { KINGSHOT_PROFILE_V1_REGIONS, KINGSHOT_PROFILE_V2_REGIONS, type KingshotProfileField } from '../../shared/domains/player-identity/kingshotProfileMapping.js'
import type { AccountLinkOcrDisposition, AccountLinkOcrMappingVersion, AccountLinkOcrRegionObservation } from '../../shared/domains/player-identity/accountLinkingOcr.js'

const require = createRequire(import.meta.url)
const RUNTIME_TIMEOUT_MS = 45_000
const MAX_RAW_TEXT = 4_096
const TESSERACT_VERSION = '7.0.0'
const LANGUAGE_DATA_VERSION = '1.0.0'
const PLUGIN_KEY = 'ocr.tesseract.js.wasm'
const PLUGIN_VERSION = '1.0.0'
const MIN_NUMERIC_CONFIDENCE = 0.65

export interface TesseractJsWorkerFactory { create(options: Record<string, unknown>): Promise<Worker> }
const defaultWorkerFactory: TesseractJsWorkerFactory = { create: (options) => createWorker('eng', 1, options) }

function bundledPaths(): { workerPath: string; langPath: string } {
  const language = require('@tesseract.js-data/eng') as { langPath: string }
  return { workerPath: require.resolve('tesseract.js/src/worker-script/node/index.js'), langPath: language.langPath }
}

type DiagnosticRegion = { field: KingshotProfileField; attempted: boolean; recognized: boolean; confidence: number; warnings: readonly string[] }
type FieldDiagnostic = { field: KingshotProfileField; disposition: AccountLinkOcrDisposition; confidence: number; agreement: 'agree' | 'disagree' | 'not_applicable'; warnings: readonly string[] }

export class TesseractJsAccountLinkOcrAdapter implements AccountLinkOcrAdapter {
  readonly #workerFactory: TesseractJsWorkerFactory
  readonly #timeoutMs: number
  #busy = false

  constructor(options: { workerFactory?: TesseractJsWorkerFactory; timeoutMs?: number } = {}) { this.#workerFactory = options.workerFactory ?? defaultWorkerFactory; this.#timeoutMs = options.timeoutMs ?? RUNTIME_TIMEOUT_MS }

  async extract(request: VisionExtractionRequest) {
    if (this.#busy) throw new VisionRuntimeError('invalid_job', 'acceptance', 'Account-linking OCR already has an active recognition job.')
    if (request.image.bytes.byteLength === 0) throw new VisionRuntimeError('invalid_job', 'acceptance', 'Account-linking OCR received an empty image.')
    if (createHash('sha256').update(request.image.bytes).digest('hex') !== request.image.sha256) throw new VisionRuntimeError('invalid_job', 'acceptance', 'Account-linking OCR image digest does not match verified evidence.')
    this.#busy = true
    let worker: Worker | null = null
    try {
      const paths = bundledPaths()
      worker = await this.#workerFactory.create({ workerPath: paths.workerPath, langPath: paths.langPath, cacheMethod: 'none', gzip: true, workerBlobURL: false, logger: () => {} })
      if (request.mappingVersionId === KINGSHOT_PROFILE_V2_MAPPING_VERSION) return await this.#extractV2(worker, request)
      return await this.#extractV1(worker, request)
    } catch (error) {
      if (error instanceof VisionRuntimeError) throw error
      throw new VisionRuntimeError('extraction_failed', 'extraction', 'Bundled account-linking OCR failed.', { retryable: true, cause: error })
    } finally {
      try { if (worker) await worker.terminate() } finally { worker = null; this.#busy = false }
    }
  }

  async #extractV1(worker: Worker, request: VisionExtractionRequest) {
    const observations: AccountLinkOcrRegionObservation[] = []
    const diagnostics: DiagnosticRegion[] = []
    for (const region of request.mappingVersionId === KINGSHOT_PROFILE_V1_MAPPING_VERSION ? KINGSHOT_PROFILE_V1_REGIONS : []) {
      const result = await this.#recognize(worker, Buffer.from(request.image.bytes), { left: Math.floor(region.x * request.image.widthPx), top: Math.floor(region.y * request.image.heightPx), width: Math.ceil(region.width * request.image.widthPx), height: Math.ceil(region.height * request.image.heightPx) }, PSM.SINGLE_LINE, region.characterWhitelist, 1)
      const text = cleanRawText(result.text); const confidence = result.confidence
      observations.push({ field: region.field!, rawText: text, confidence, warnings: [] })
      diagnostics.push({ field: region.field!, attempted: true, recognized: text.length > 0, confidence, warnings: [] })
    }
    const result = await this.#recognize(worker, Buffer.from(request.image.bytes), { left: 0, top: 0, width: request.image.widthPx, height: request.image.heightPx }, PSM.SINGLE_BLOCK, null, 1)
    const mappingVersion: AccountLinkOcrMappingVersion = request.mappingVersionId === KINGSHOT_PROFILE_V1_MAPPING_VERSION ? KINGSHOT_PROFILE_V1_MAPPING_VERSION : 'account-linking-ocr-mvp'
    return this.#output(result.text, result.confidence, observations, diagnostics, [], mappingVersion)
  }

  async #extractV2(worker: Worker, request: VisionExtractionRequest) {
    const panel = KINGSHOT_PROFILE_V2_REGIONS.find((region) => region.key === 'profilePanel')!
    const panelPrepared = await prepareProfileRegion({ bytes: request.image.bytes, mimeType: request.image.mimeType, widthPx: request.image.widthPx, heightPx: request.image.heightPx, region: panel })
    const panelResult = await this.#recognize(worker, Buffer.from(panelPrepared.bytes), { left: 0, top: 0, width: panelPrepared.widthPx, height: panelPrepared.heightPx }, PSM.SPARSE_TEXT, null, 1)
    const observations: AccountLinkOcrRegionObservation[] = []
    const diagnostics: DiagnosticRegion[] = []
    const fields: FieldDiagnostic[] = []
    for (const region of KINGSHOT_PROFILE_V2_REGIONS.filter((item) => item.field)) {
      const line = await this.#recognizePrepared(worker, request, region, 'greyscale', PSM.SINGLE_LINE, region.characterWhitelist)
      const numericRegion = region.field === 'playerId' ? { ...region, x: region.x + 0.06, width: 0.35 } : region.field === 'kingdom' ? { ...region, x: region.x + 0.18, width: 0.20 } : region
      // Keep this pass spatially numeric, but let Tesseract score the glyphs normally;
      // its whitelist mode reports confidence 0 for short Kingdom tokens even when it
      // reads them correctly. The parser remains digits-only and validates the domain.
      const numeric = region.field === 'playerId' || region.field === 'kingdom' ? await this.#recognizePrepared(worker, request, numericRegion, 'greyscale', PSM.SINGLE_LINE, null) : null
      const lineText = cleanRawText(line.text); const numericText = numeric ? cleanRawText(numeric.text) : ''
      const field = region.field!
      const warnings: string[] = []
      let acceptedValue: string | undefined
      let disposition: AccountLinkOcrDisposition = 'could_not_read'
      let agreement: 'agree' | 'disagree' | 'not_applicable' = 'not_applicable'
      if (field === 'displayName') {
        acceptedValue = normalizeName(lineText)
        disposition = acceptedValue ? (lineText.length < 4 || !/\s/.test(lineText) ? 'review_required' : 'recognised') : 'could_not_read'
        if (acceptedValue && disposition === 'review_required') warnings.push('partial_or_normalised_name')
      } else {
        const lineValue = extractNumber(lineText, field)
        const numericValue = extractBareNumber(numericText, field)
        agreement = lineValue && numericValue && lineValue === numericValue ? 'agree' : 'disagree'
        const labelOk = field === 'playerId' ? /(?:player\s*[i1]d|[i1]d)/i.test(lineText) : /kingdom/i.test(lineText) || /kingdom/i.test(panelResult.text)
        const valid = field === 'playerId' ? Boolean(lineValue && /^\d{1,20}$/.test(lineValue)) : Boolean(lineValue && /^\d{1,4}$/.test(lineValue) && Number(lineValue) >= 1 && Number(lineValue) <= 9999)
        if (agreement === 'agree' && labelOk && valid && line.confidence >= MIN_NUMERIC_CONFIDENCE && numeric!.confidence >= MIN_NUMERIC_CONFIDENCE) { acceptedValue = lineValue; disposition = 'recognised' } else if (agreement === 'disagree') disposition = 'conflicting_reads'
        else if (lineValue || numericValue) disposition = 'could_not_read'
        if (!labelOk) warnings.push('missing_field_label_context')
        if (line.confidence === 0 || (numeric && numeric.confidence === 0)) warnings.push('zero_confidence_numeric')
      }
      observations.push({ field, rawText: lineText, confidence: Math.min(line.confidence, numeric?.confidence ?? line.confidence), warnings, acceptedValue, disposition, agreement })
      diagnostics.push({ field, attempted: true, recognized: lineText.length > 0, confidence: Math.min(line.confidence, numeric?.confidence ?? line.confidence), warnings })
      fields.push({ field, disposition, confidence: Math.min(line.confidence, numeric?.confidence ?? line.confidence), agreement, warnings })
    }
    return this.#output(panelResult.text, panelResult.confidence, observations, diagnostics, fields, KINGSHOT_PROFILE_V2_MAPPING_VERSION)
  }

  async #recognizePrepared(worker: Worker, request: VisionExtractionRequest, region: KingshotProfileRegion, variant: 'greyscale' | 'threshold', psm: string, whitelist: string | null) {
    const prepared = await prepareProfileRegion({ bytes: request.image.bytes, mimeType: request.image.mimeType, widthPx: request.image.widthPx, heightPx: request.image.heightPx, region, variant })
    const result = await this.#recognize(worker, Buffer.from(prepared.bytes), { left: 0, top: 0, width: prepared.widthPx, height: prepared.heightPx }, psm, whitelist, prepared.scale)
    return { ...result, prepared }
  }

  async #recognize(worker: Worker, image: Buffer, rectangle: { left: number; top: number; width: number; height: number }, psm: string, whitelist: string | null, scale: number) {
    await worker.setParameters({ tessedit_pageseg_mode: psm as never, preserve_interword_spaces: '1', user_defined_dpi: String(Math.min(300, 150 * scale)), tessedit_char_whitelist: whitelist ?? '' })
    const result = await withTimeout(worker.recognize(image, { rectangle }), this.#timeoutMs)
    return { text: typeof result.data.text === 'string' ? result.data.text : '', confidence: confidenceValue(result.data.confidence) }
  }

  #output(rawText: string, confidence: number, observations: readonly AccountLinkOcrRegionObservation[], regions: readonly DiagnosticRegion[], fields: readonly FieldDiagnostic[], mappingVersion: AccountLinkOcrMappingVersion) {
    return { rawText: cleanRawText(rawText), engineConfidence: confidence, regionObservations: observations, diagnostics: { mappingVersion, regions, fields }, provenance: { pluginKey: PLUGIN_KEY, pluginVersion: PLUGIN_VERSION, engineName: 'Tesseract.js / WebAssembly', engineVersion: TESSERACT_VERSION, executedAt: new Date().toISOString(), configuration: { language: 'eng', languageDataVersion: LANGUAGE_DATA_VERSION, timeoutMs: this.#timeoutMs } } }
  }
}

function cleanRawText(value: unknown): string { return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, MAX_RAW_TEXT) : '' }
function confidenceValue(value: unknown): number { return typeof value === 'number' ? Math.max(0, Math.min(1, value / 100)) : 0 }
function normalizeName(value: string): string { return value.replace(/^(?:name\s*[:#-]?\s*)/i, '').replace(/[|:;\s]+$/g, '').trim() }
function extractNumber(text: string, field: KingshotProfileField): string | undefined { const pattern = field === 'playerId' ? /(?:player\s*[i1]d|[i1]d)\s*[:#-]?\s*((?:\d\s*){1,20})/i : /kingdom\s*(?:[#:]|no\.?\s*)?\s*((?:\d\s*){1,4})/i; return text.match(pattern)?.[1]?.replace(/\s+/g, '') }
function extractBareNumber(text: string, field: KingshotProfileField): string | undefined { const max = field === 'playerId' ? 20 : 4; const value = text.match(new RegExp(`((?:\\d\\s*){1,${max}})`))?.[1]?.replace(/\s+/g, ''); return value }

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try { return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new VisionRuntimeError('extraction_timeout', 'extraction', 'Bundled account-linking OCR exceeded its time limit.', { retryable: true })), timeoutMs) })]) } finally { if (timer) clearTimeout(timer) }
}
