export type AccountLinkOcrField = 'playerId' | 'displayName' | 'kingdom'

export interface AccountLinkOcrCandidate {
  readonly field: AccountLinkOcrField
  readonly rawValue: string
  readonly value: string
  readonly mappingVersion: 'account-linking-ocr-mvp'
  readonly confidence: number
  readonly source: 'ocr'
  readonly evidenceId: string
  readonly warnings: readonly string[]
}

export interface AccountLinkOcrResult {
  readonly evidenceId: string
  readonly rawText?: string
  readonly candidates: readonly AccountLinkOcrCandidate[]
  readonly provenance: {
    readonly pluginKey: string
    readonly pluginVersion: string
    readonly engineName: string
    readonly engineVersion: string
    readonly executedAt: string
  }
}

export function parseAccountLinkCandidates(rawText: string, evidenceId: string, confidence: number): AccountLinkOcrCandidate[] {
  const boundedConfidence = Math.max(0, Math.min(1, confidence))
  const candidates: AccountLinkOcrCandidate[] = []
  const playerId = rawText.match(/(?:player\s*id|id)\s*[:#-]?\s*(\d{1,20})/i)?.[1]
  const kingdom = rawText.match(/kingdom\s*[:#-]?\s*(\d{1,4})/i)?.[1]
  const name = rawText.match(/name\s*[:#-]?\s*([A-Za-z][A-Za-z0-9 _-]{1,39}?)(?=\s+kingdom\b|$)/i)?.[1]?.trim()
  if (playerId) candidates.push({ field: 'playerId', rawValue: playerId, value: playerId, mappingVersion: 'account-linking-ocr-mvp', confidence: boundedConfidence, source: 'ocr', evidenceId, warnings: boundedConfidence < 0.7 ? ['Check this value carefully.'] : [] })
  if (name) candidates.push({ field: 'displayName', rawValue: name, value: name, mappingVersion: 'account-linking-ocr-mvp', confidence: boundedConfidence * 0.9, source: 'ocr', evidenceId, warnings: [] })
  if (kingdom) candidates.push({ field: 'kingdom', rawValue: kingdom, value: kingdom, mappingVersion: 'account-linking-ocr-mvp', confidence: boundedConfidence, source: 'ocr', evidenceId, warnings: boundedConfidence < 0.7 ? ['Check this value carefully.'] : [] })
  return candidates
}
