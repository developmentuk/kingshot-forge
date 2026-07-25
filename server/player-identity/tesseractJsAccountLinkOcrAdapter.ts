import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { createWorker, PSM, type Worker } from 'tesseract.js'
import type { VisionExtractionRequest } from '../../shared/platform/vision/contracts.js'
import { VisionRuntimeError } from '../vision/runtime/errors.js'
import type { AccountLinkOcrAdapter } from './accountLinkingOcrService.js'
import { KINGSHOT_PROFILE_V1_MAPPING_VERSION, KINGSHOT_PROFILE_V2_MAPPING_VERSION, KINGSHOT_PROFILE_V3_MAPPING_VERSION, KINGSHOT_PROFILE_V4_MAPPING_VERSION, KINGSHOT_PROFILE_V5_MAPPING_VERSION, KINGSHOT_PROFILE_V6_MAPPING_VERSION, prepareProfileRegion, type KingshotProfileRegion } from './kingshotProfileOcr.js'
import { KINGSHOT_PROFILE_V1_REGIONS, KINGSHOT_PROFILE_V2_REGIONS, KINGSHOT_PROFILE_V3_REGIONS, KINGSHOT_PROFILE_V4_REGIONS, KINGSHOT_PROFILE_V5_REGIONS, KINGSHOT_PROFILE_V6_REGIONS, type KingshotProfileField } from '../../shared/domains/player-identity/kingshotProfileMapping.js'
import type { AccountLinkOcrDisposition, AccountLinkOcrMappingVersion, AccountLinkOcrRegionObservation } from '../../shared/domains/player-identity/accountLinkingOcr.js'
import { consensusPlayerId, consensusComponentDigits, consensusKingdomLine, type ComponentNumericObservation, type PlayerIdObservation } from '../../shared/domains/player-identity/kingshotProfileConsensus.js'

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
type FieldDiagnostic = { field: KingshotProfileField; disposition: AccountLinkOcrDisposition; confidence: number; agreement: 'agree' | 'agree_with_missing_pass' | 'disagree' | 'not_applicable'; warnings: readonly string[] }

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
      if (request.mappingVersionId === KINGSHOT_PROFILE_V6_MAPPING_VERSION) return await this.#extractV4(worker, request, true, true)
      if (request.mappingVersionId === KINGSHOT_PROFILE_V5_MAPPING_VERSION) return await this.#extractV4(worker, request, true)
      if (request.mappingVersionId === KINGSHOT_PROFILE_V4_MAPPING_VERSION) return await this.#extractV4(worker, request)
      if (request.mappingVersionId === KINGSHOT_PROFILE_V3_MAPPING_VERSION) return await this.#extractV3(worker, request)
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
    for (const region of KINGSHOT_PROFILE_V2_REGIONS.filter((item) => item.field && item.observation !== 'numeric')) {
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

  async #extractV3(worker: Worker, request: VisionExtractionRequest) {
    const panel = KINGSHOT_PROFILE_V3_REGIONS.find((region) => region.observation === 'panel')!
    const panelPrepared = await this.#recognizePrepared(worker, request, panel, 'greyscale', PSM.SPARSE_TEXT, null)
    const lineRegion = KINGSHOT_PROFILE_V3_REGIONS.find((region) => region.key === 'playerId')!
    const numericRegion = KINGSHOT_PROFILE_V3_REGIONS.find((region) => region.key === 'playerIdNumeric')!
    const idPasses: PlayerIdObservation[] = []
    const passes: Array<{ field: KingshotProfileField; passType: 'labelled_line' | 'numeric_only' | 'panel'; variant: 'greyscale' | 'threshold'; attempted: boolean; confidence: number; labelContext: boolean; warnings: string[] }> = []
    const readId = async (region: KingshotProfileRegion, passType: 'labelled_line' | 'numeric_only', variant: 'greyscale' | 'threshold', psm: string, whitelist: string | null) => {
      const result = await this.#recognizePrepared(worker, request, region, variant, psm, whitelist)
      const text = cleanRawText(result.text)
      const labelContext = passType === 'labelled_line' && /(?:player\s*[i1]d|[i1]d)/i.test(text)
      const digits = passType === 'labelled_line' ? extractNumber(text, 'playerId') : extractDigits(text, 20)
      idPasses.push({ passType, variant, digits, confidence: result.confidence, labelContext })
      passes.push({ field: 'playerId', passType, variant, attempted: true, confidence: result.confidence, labelContext, warnings: result.confidence === 0 ? ['zero_confidence_numeric'] : [] })
      return { text, confidence: result.confidence, digits }
    }
    await readId(lineRegion, 'labelled_line', 'greyscale', PSM.SINGLE_LINE, lineRegion.characterWhitelist)
    await readId(lineRegion, 'labelled_line', 'threshold', PSM.SINGLE_LINE, lineRegion.characterWhitelist)
    await readId(numericRegion, 'numeric_only', 'greyscale', PSM.SINGLE_LINE, numericRegion.characterWhitelist)
    await readId(numericRegion, 'numeric_only', 'threshold', PSM.SINGLE_LINE, numericRegion.characterWhitelist)
    const consensus = consensusPlayerId(idPasses)
    const observations: AccountLinkOcrRegionObservation[] = [{ field: 'playerId', rawText: '', confidence: consensus.confidence, warnings: consensus.warnings, acceptedValue: consensus.value, disposition: consensus.disposition, agreement: consensus.agreement === 'insufficient' ? 'not_applicable' : consensus.agreement, passType: 'labelled_line', variant: 'greyscale', labelContext: idPasses.some((pass) => pass.labelContext) }]
    const diagnostics: DiagnosticRegion[] = [{ field: 'playerId', attempted: true, recognized: idPasses.some((pass) => Boolean(pass.digits)), confidence: consensus.confidence, warnings: consensus.warnings }]
    const fields: FieldDiagnostic[] = [{ field: 'playerId', disposition: consensus.disposition, confidence: consensus.confidence, agreement: consensus.agreement === 'insufficient' ? 'not_applicable' : consensus.agreement, warnings: consensus.warnings }]
    for (const region of KINGSHOT_PROFILE_V3_REGIONS.filter((item) => item.field && item.field !== 'playerId')) {
      const line = await this.#recognizePrepared(worker, request, region, 'greyscale', PSM.SINGLE_LINE, region.characterWhitelist)
      const threshold = await this.#recognizePrepared(worker, request, region, 'threshold', PSM.SINGLE_LINE, region.characterWhitelist)
      const lineText = cleanRawText(line.text); const thresholdText = cleanRawText(threshold.text)
      const field = region.field!
      const selected = field === 'kingdom' ? chooseKingdom(lineText, thresholdText, line.confidence, threshold.confidence, cleanRawText(panelPrepared.text)) : chooseName(lineText, thresholdText, line.confidence, threshold.confidence)
      observations.push({ field, rawText: '', confidence: selected.confidence, warnings: selected.warnings, acceptedValue: selected.value, disposition: selected.disposition, agreement: selected.agreement === 'insufficient' ? 'not_applicable' : selected.agreement, passType: 'labelled_line', variant: selected.variant, labelContext: selected.labelContext })
      diagnostics.push({ field, attempted: true, recognized: Boolean(selected.value), confidence: selected.confidence, warnings: selected.warnings })
      fields.push({ field, disposition: selected.disposition, confidence: selected.confidence, agreement: selected.agreement === 'insufficient' ? 'not_applicable' : selected.agreement, warnings: selected.warnings })
      passes.push({ field, passType: 'labelled_line', variant: 'greyscale', attempted: true, confidence: line.confidence, labelContext: selected.labelContext, warnings: [] }, { field, passType: 'labelled_line', variant: 'threshold', attempted: true, confidence: threshold.confidence, labelContext: selected.labelContext, warnings: [] })
    }
    return { ...this.#output('', consensus.confidence, observations, diagnostics, fields, KINGSHOT_PROFILE_V3_MAPPING_VERSION), diagnostics: { mappingVersion: KINGSHOT_PROFILE_V3_MAPPING_VERSION, regions: diagnostics, fields, passes } }
  }

  async #extractV4(worker: Worker, request: VisionExtractionRequest, labelledKingdomLine = false, townCenter = false) {
    const region = (key: string) => (townCenter ? KINGSHOT_PROFILE_V6_REGIONS : KINGSHOT_PROFILE_V4_REGIONS).find((item) => item.key === key)!
    const panel = await this.#recognizePrepared(worker, request, region('profilePanel'), 'greyscale', PSM.SPARSE_TEXT, null)
    const passes: Array<{ field: KingshotProfileField; passType: 'labelled_line' | 'numeric_only' | 'panel' | 'label_component' | 'digits_single_word' | 'digits_single_line'; variant: 'greyscale' | 'threshold' | 'inverted'; attempted: boolean; confidence: number; labelContext: boolean; warnings: string[] }> = []
    const read = async (field: KingshotProfileField, item: KingshotProfileRegion, variant: 'greyscale' | 'threshold' | 'inverted', psm: string, passType: 'label_component' | 'digits_single_word' | 'digits_single_line', whitelist: string | null) => {
      const result = await this.#recognizePrepared(worker, request, item, variant, psm, whitelist)
      const text = cleanRawText(result.text)
      const labelContext = field === 'playerId' ? /(?:[i1]d)/i.test(text) : field === 'kingdom' ? /kingdom/i.test(text) : false
      passes.push({ field, passType, variant, attempted: true, confidence: result.confidence, labelContext, warnings: result.confidence === 0 ? ['zero_confidence_numeric'] : [] })
      return { text, confidence: result.confidence, labelContext }
    }
    const idLabel = [await read('playerId', region('playerIdLabel'), 'greyscale', PSM.SINGLE_WORD, 'label_component', region('playerIdLabel').characterWhitelist), await read('playerId', region('playerIdLabel'), 'threshold', PSM.SINGLE_WORD, 'label_component', region('playerIdLabel').characterWhitelist)]
    const idDigits = [
      await read('playerId', region('playerIdDigits'), 'greyscale', PSM.SINGLE_WORD, 'digits_single_word', '0123456789'),
      await read('playerId', region('playerIdDigits'), 'greyscale', PSM.SINGLE_LINE, 'digits_single_line', '0123456789'),
      await read('playerId', region('playerIdDigits'), 'threshold', PSM.SINGLE_WORD, 'digits_single_word', '0123456789'),
      await read('playerId', region('playerIdDigits'), 'threshold', PSM.SINGLE_LINE, 'digits_single_line', '0123456789'),
    ]
    const idContext = idLabel.some((item) => item.labelContext) || /(?:[i1]d)/i.test(cleanRawText(panel.text))
    const componentPass = (index: number): ComponentNumericObservation['passType'] => index % 2 ? 'single_line' : 'single_word'
    const componentVariant = (index: number): ComponentNumericObservation['variant'] => index > 3 ? 'inverted' : index > 1 ? 'threshold' : 'greyscale'
    const idConsensus = consensusComponentDigits(idDigits.map((item, index) => ({ passType: componentPass(index), variant: componentVariant(index), digits: extractDigits(item.text, 20), confidence: item.confidence })), idContext)
    const observations: AccountLinkOcrRegionObservation[] = [{ field: 'playerId', rawText: '', confidence: idConsensus.confidence, warnings: idConsensus.warnings, acceptedValue: idConsensus.value, disposition: idConsensus.disposition, agreement: idConsensus.agreement === 'insufficient' ? 'not_applicable' : idConsensus.agreement, passType: 'label_component', variant: 'greyscale', labelContext: idContext }]
    const diagnostics: DiagnosticRegion[] = [{ field: 'playerId', attempted: true, recognized: Boolean(idConsensus.value), confidence: idConsensus.confidence, warnings: idConsensus.warnings }]
    const fields: FieldDiagnostic[] = [{ field: 'playerId', disposition: idConsensus.disposition, confidence: idConsensus.confidence, agreement: idConsensus.agreement === 'insufficient' ? 'not_applicable' : idConsensus.agreement, warnings: idConsensus.warnings }]

    const readNumericComponent = async (field: 'kingdom', labelKey: string, digitsKey: string, validator: (value: string) => boolean) => {
      const label = [await read(field, region(labelKey), 'greyscale', PSM.SINGLE_WORD, 'label_component', region(labelKey).characterWhitelist), await read(field, region(labelKey), 'threshold', PSM.SINGLE_WORD, 'label_component', region(labelKey).characterWhitelist)]
      const numeric = [
        await read(field, region(digitsKey), 'greyscale', PSM.SINGLE_WORD, 'digits_single_word', '0123456789'),
        await read(field, region(digitsKey), 'greyscale', PSM.SINGLE_LINE, 'digits_single_line', '0123456789'),
        await read(field, region(digitsKey), 'threshold', PSM.SINGLE_WORD, 'digits_single_word', '0123456789'),
        await read(field, region(digitsKey), 'threshold', PSM.SINGLE_LINE, 'digits_single_line', '0123456789'),
      ]
      const context = label.some((item) => /kingdom/i.test(item.text)) || /kingdom/i.test(cleanRawText(panel.text))
      const numericObservations = numeric.map((item, index) => ({ passType: componentPass(index), variant: componentVariant(index), digits: extractDigits(item.text, 4), confidence: item.confidence }))
      let consensus = consensusComponentDigits(numericObservations, context, validator)
      if (field === 'kingdom' && consensus.disposition === 'conflicting_reads' && context) {
        const groups = new Map<string, typeof numericObservations>()
        for (const item of numericObservations.filter((candidate) => candidate.digits)) groups.set(item.digits!, [...(groups.get(item.digits!) ?? []), item])
        const ranked = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || Math.max(...b[1].map((item) => item.confidence)) - Math.max(...a[1].map((item) => item.confidence)))
        if (ranked[0]?.[1].length >= 2 && ranked[0][1].length > (ranked[1]?.[1].length ?? 0)) consensus = { value: ranked[0][0], disposition: 'recognised', agreement: 'agree', confidence: Math.max(...ranked[0][1].map((item) => item.confidence)), warnings: ['kingdom_component_majority_used'] }
      }
      observations.push({ field, rawText: '', confidence: consensus.confidence, warnings: consensus.warnings, acceptedValue: consensus.value, disposition: consensus.disposition, agreement: consensus.agreement === 'insufficient' ? 'not_applicable' : consensus.agreement, passType: 'label_component', variant: 'greyscale', labelContext: context })
      diagnostics.push({ field, attempted: true, recognized: Boolean(consensus.value), confidence: consensus.confidence, warnings: consensus.warnings })
      fields.push({ field, disposition: consensus.disposition, confidence: consensus.confidence, agreement: consensus.agreement === 'insufficient' ? 'not_applicable' : consensus.agreement, warnings: consensus.warnings })
    }
    if (labelledKingdomLine) {
      const lineRegion = KINGSHOT_PROFILE_V5_REGIONS.find((item) => item.key === 'kingdomLine')!
      const lineReads = [
        await this.#recognizePrepared(worker, request, lineRegion, 'greyscale', PSM.SINGLE_LINE, lineRegion.characterWhitelist),
        await this.#recognizePrepared(worker, request, lineRegion, 'threshold', PSM.SINGLE_LINE, lineRegion.characterWhitelist),
      ].map((item, index) => ({ value: extractNumber(cleanRawText(item.text), 'kingdom'), confidence: item.confidence, variant: index === 0 ? 'greyscale' as const : 'threshold' as const }))
      const valid = lineReads.filter((item) => item.value && item.confidence > 0 && Number(item.value) >= 1 && Number(item.value) <= 9999)
      const labelContext = lineReads.some((item) => item.value !== undefined) || /kingdom/i.test(cleanRawText(panel.text))
      let value: string | undefined
      const lineConsensus = consensusKingdomLine(valid, labelContext)
      value = lineConsensus.value
      const disposition = lineConsensus.disposition
      const agreement = lineConsensus.agreement === 'insufficient' ? 'not_applicable' : lineConsensus.agreement
      const confidence = lineConsensus.confidence
      const warnings = [...lineConsensus.warnings]
      observations.push({ field: 'kingdom', rawText: '', confidence, warnings, acceptedValue: value, disposition, agreement, passType: 'labelled_line', variant: valid.sort((a, b) => b.confidence - a.confidence)[0]?.variant ?? 'greyscale', labelContext })
      diagnostics.push({ field: 'kingdom', attempted: true, recognized: Boolean(value), confidence, warnings })
      fields.push({ field: 'kingdom', disposition, confidence, agreement, warnings })
      passes.push({ field: 'kingdom', passType: 'labelled_line', variant: 'greyscale', attempted: true, confidence: lineReads[0].confidence, labelContext, warnings: lineReads[0].confidence === 0 ? ['zero_confidence_numeric'] : [] }, { field: 'kingdom', passType: 'labelled_line', variant: 'threshold', attempted: true, confidence: lineReads[1].confidence, labelContext, warnings: lineReads[1].confidence === 0 ? ['zero_confidence_numeric'] : [] })
    } else {
      await readNumericComponent('kingdom', 'kingdomLabel', 'kingdomDigits', (value) => Number(value) >= 1 && Number(value) <= 9999)
    }

    const readSupporting = async (field: 'allianceTag' | 'displayName', key: string) => {
      const values = [await read(field, region(key), 'greyscale', PSM.SINGLE_LINE, 'label_component', region(key).characterWhitelist), await read(field, region(key), 'threshold', PSM.SINGLE_LINE, 'label_component', region(key).characterWhitelist)].filter((item) => item.text)
      const selected = values.sort((a, b) => b.confidence - a.confidence)[0]
      const value = selected ? normalizeName(selected.text) : undefined
      const review = Boolean(value) && (selected!.confidence < 0.65 || value!.length < 4 || (field === 'displayName' && !/\s/u.test(value!)))
      const disposition = value ? 'review_required' as const : 'could_not_read' as const
      const warnings = value && review ? ['partial_or_normalised_name', 'supporting_information_review_only'] : value ? [] : ['name_not_read']
      observations.push({ field, rawText: '', confidence: selected?.confidence ?? 0, warnings, acceptedValue: value, disposition, agreement: 'not_applicable', passType: 'label_component', variant: selected ? 'greyscale' : 'threshold', labelContext: false })
      diagnostics.push({ field, attempted: true, recognized: Boolean(value), confidence: selected?.confidence ?? 0, warnings })
      fields.push({ field, disposition, confidence: selected?.confidence ?? 0, agreement: 'not_applicable', warnings })
    }
    await readSupporting('allianceTag', 'allianceTag')
    await readSupporting('displayName', 'displayName')
    if (townCenter) {
      const labelRegion = region('townCenterLabel')
      const badgeRegion = region('townCenterBadge')
      const labelReads = [
        await read('townCenterLevel', labelRegion, 'greyscale', PSM.SINGLE_LINE, 'label_component', labelRegion.characterWhitelist),
        await read('townCenterLevel', labelRegion, 'threshold', PSM.SINGLE_LINE, 'label_component', labelRegion.characterWhitelist),
      ]
      const badgeReads = [
        await read('townCenterLevel', badgeRegion, 'greyscale', PSM.SINGLE_WORD, 'digits_single_word', '0123456789'),
        await read('townCenterLevel', badgeRegion, 'greyscale', PSM.SINGLE_LINE, 'digits_single_line', '0123456789'),
        await read('townCenterLevel', badgeRegion, 'threshold', PSM.SINGLE_WORD, 'digits_single_word', '0123456789'),
        await read('townCenterLevel', badgeRegion, 'threshold', PSM.SINGLE_LINE, 'digits_single_line', '0123456789'),
        await read('townCenterLevel', badgeRegion, 'inverted', PSM.SINGLE_WORD, 'digits_single_word', '0123456789'),
        await read('townCenterLevel', badgeRegion, 'inverted', PSM.SINGLE_LINE, 'digits_single_line', '0123456789'),
      ]
      const labelContext = labelReads.some((item) => /town\s*(?:centre|center)/i.test(item.text)) || /town\s*(?:centre|center)/i.test(cleanRawText(panel.text))
      const numeric = badgeReads.map((item, index) => ({ passType: componentPass(index), variant: componentVariant(index), digits: extractDigits(item.text, 2), confidence: item.confidence }))
      const consensus = consensusComponentDigits(numeric, labelContext, (value) => Number(value) >= 1 && Number(value) <= 30)
      const warnings = labelContext ? consensus.warnings : [...consensus.warnings, 'town_center_label_context_required']
      const disposition = consensus.disposition
      const agreement = consensus.agreement === 'insufficient' ? 'not_applicable' : consensus.agreement
      observations.push({ field: 'townCenterLevel', rawText: '', confidence: consensus.confidence, warnings, acceptedValue: consensus.value, disposition, agreement, passType: 'label_component', variant: 'greyscale', labelContext })
      diagnostics.push({ field: 'townCenterLevel', attempted: true, recognized: Boolean(consensus.value), confidence: consensus.confidence, warnings })
      fields.push({ field: 'townCenterLevel', disposition, confidence: consensus.confidence, agreement, warnings })
    }
    const mappingVersion = townCenter ? KINGSHOT_PROFILE_V6_MAPPING_VERSION : labelledKingdomLine ? KINGSHOT_PROFILE_V5_MAPPING_VERSION : KINGSHOT_PROFILE_V4_MAPPING_VERSION
    return { ...this.#output('', Math.max(idConsensus.confidence, ...fields.map((item) => item.confidence)), observations, diagnostics, fields, mappingVersion), diagnostics: { mappingVersion, regions: diagnostics, fields, passes } }
  }

  async #recognizePrepared(worker: Worker, request: VisionExtractionRequest, region: KingshotProfileRegion, variant: 'greyscale' | 'threshold' | 'inverted', psm: string, whitelist: string | null) {
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
function normalizeName(value: string): string { return value.replace(/^[|¦Ⅰl]+\s*/u, '').replace(/^(?:name\s*[:#-]?\s*)/i, '').replace(/[|:;\s]+$/g, '').trim() }
function extractNumber(text: string, field: KingshotProfileField): string | undefined { const pattern = field === 'playerId' ? /(?:player\s*[i1]d|[i1]d)\s*[:#-]?\s*((?:\d\s*){1,20})/i : /kingdom\s*(?:[#:]|no\.?\s*)?\s*((?:\d\s*){1,4})/i; return text.match(pattern)?.[1]?.replace(/\s+/g, '') }
function extractBareNumber(text: string, field: KingshotProfileField): string | undefined { const max = field === 'playerId' ? 20 : 4; const value = text.match(new RegExp(`((?:\\d\\s*){1,${max}})`))?.[1]?.replace(/\s+/g, ''); return value }
function extractDigits(text: string, max: number): string | undefined { const value = text.match(new RegExp(`((?:\\d\\s*){1,${max}})`))?.[1]?.replace(/\s+/g, ''); return value && /^\d{1,20}$/u.test(value) ? value : undefined }
function chooseName(greyscale: string, threshold: string, grayConfidence: number, thresholdConfidence: number) {
  const candidates = [{ value: normalizeName(greyscale), confidence: grayConfidence, variant: 'greyscale' as const }, { value: normalizeName(threshold), confidence: thresholdConfidence, variant: 'threshold' as const }].filter((item) => item.value)
  const selected = candidates.sort((a, b) => b.confidence - a.confidence)[0]
  if (!selected) return { value: undefined, confidence: 0, disposition: 'could_not_read' as const, agreement: 'not_applicable' as const, warnings: ['name_not_read'], variant: 'greyscale' as const, labelContext: false }
  const review = selected.confidence < 0.65 || selected.value.length < 4 || !/\s/u.test(selected.value)
  return { value: selected.value, confidence: selected.confidence, disposition: review ? 'review_required' as const : 'recognised' as const, agreement: 'not_applicable' as const, warnings: review ? ['partial_or_normalised_name'] : [], variant: selected.variant, labelContext: false }
}
function chooseKingdom(greyscale: string, threshold: string, grayConfidence: number, thresholdConfidence: number, panelText: string) {
  const values = [{ text: greyscale, confidence: grayConfidence, variant: 'greyscale' as const }, { text: threshold, confidence: thresholdConfidence, variant: 'threshold' as const }].map((item) => ({ ...item, value: extractNumber(item.text, 'kingdom') })).filter((item) => item.value && item.confidence > 0 && Number(item.value) >= 1 && Number(item.value) <= 9999)
  const panelHasKingdom = /kingdom/i.test(panelText)
  const selected = values.sort((a, b) => b.confidence - a.confidence)[0]
  if (!selected || !panelHasKingdom) return { value: undefined, confidence: selected?.confidence ?? 0, disposition: 'could_not_read' as const, agreement: 'insufficient' as const, warnings: ['kingdom_label_context_required'], variant: selected?.variant ?? 'greyscale' as const, labelContext: panelHasKingdom }
  const agreement = values.length > 1 && new Set(values.map((item) => item.value)).size > 1 ? 'disagree' as const : 'agree' as const
  return { value: agreement === 'disagree' ? undefined : selected.value, confidence: selected.confidence, disposition: agreement === 'disagree' ? 'conflicting_reads' as const : 'recognised' as const, agreement, warnings: agreement === 'disagree' ? ['conflicting_digit_strings'] : [], variant: selected.variant, labelContext: true }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try { return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new VisionRuntimeError('extraction_timeout', 'extraction', 'Bundled account-linking OCR exceeded its time limit.', { retryable: true })), timeoutMs) })]) } finally { if (timer) clearTimeout(timer) }
}
