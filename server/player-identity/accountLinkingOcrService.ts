import type { AccountLinkOcrRegionObservation, AccountLinkOcrResult } from '../../shared/domains/player-identity/accountLinkingOcr.js'
import { TesseractCliExtractor } from '../vision/extractors/tesseractCliExtractor.js'
import { TesseractJsAccountLinkOcrAdapter } from './tesseractJsAccountLinkOcrAdapter.js'
import type { VisionExtractionRequest } from '../../shared/platform/vision/contracts.js'
import { parseAccountLinkCandidates } from '../../shared/domains/player-identity/accountLinkingOcr.js'

export interface AccountLinkOcrAdapter {
  extract(request: VisionExtractionRequest): Promise<{ rawText: string; engineConfidence: number; provenance: AccountLinkOcrResult['provenance']; regionObservations?: readonly AccountLinkOcrRegionObservation[]; diagnostics?: AccountLinkOcrResult['diagnostics'] }>
}

export class TesseractAccountLinkOcrAdapter implements AccountLinkOcrAdapter {
  constructor(private readonly extractor = new TesseractCliExtractor()) {}
  async extract(request: VisionExtractionRequest) {
    const result = await this.extractor.extract(request)
    return { rawText: result.rawText ?? '', engineConfidence: result.engineConfidence ?? 0, provenance: result.provenance }
  }
}

export async function extractAccountLinkCandidates(input: {
  evidenceId: string
  bytes: Uint8Array
  sha256: string
  mimeType: VisionExtractionRequest['image']['mimeType']
  widthPx: number
  heightPx: number
  mappingVersion?: 'account-linking-kingshot-profile-v1' | 'account-linking-kingshot-profile-v2' | 'account-linking-kingshot-profile-v3'
  adapter?: AccountLinkOcrAdapter
}): Promise<AccountLinkOcrResult> {
  const adapter = input.adapter ?? new TesseractJsAccountLinkOcrAdapter()
  const mappingVersion = input.mappingVersion ?? 'account-linking-kingshot-profile-v3'
  const extracted = await adapter.extract({
    runId: `account-link-${input.evidenceId}`,
    mappingVersionId: mappingVersion,
    mappingId: mappingVersion === 'account-linking-kingshot-profile-v1' ? 'account-linking-kingshot-profile' : mappingVersion,
    fieldKey: 'player-identity',
    image: { evidenceId: input.evidenceId, bytes: input.bytes, sha256: input.sha256, mimeType: input.mimeType, widthPx: input.widthPx, heightPx: input.heightPx },
    region: null,
    configuration: { language: 'eng', pageSegmentationMode: 7, ocrEngineMode: 1, preserveInterwordSpaces: true, characterWhitelist: null, timeoutMs: 30_000, mappingVersion },
  })
  return { evidenceId: input.evidenceId, rawText: extracted.rawText, candidates: parseAccountLinkCandidates(extracted.rawText, input.evidenceId, extracted.engineConfidence, { mappingVersion, regions: extracted.regionObservations }), diagnostics: extracted.diagnostics, provenance: { pluginKey: extracted.provenance.pluginKey, pluginVersion: extracted.provenance.pluginVersion, engineName: extracted.provenance.engineName, engineVersion: extracted.provenance.engineVersion, executedAt: extracted.provenance.executedAt } }
}
