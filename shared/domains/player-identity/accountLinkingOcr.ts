export type AccountLinkOcrField = 'playerId' | 'displayName' | 'kingdom' | 'allianceTag' | 'townCenterLevel'
export type AccountLinkOcrMappingVersion = 'account-linking-ocr-mvp' | 'account-linking-kingshot-profile-v1' | 'account-linking-kingshot-profile-v2' | 'account-linking-kingshot-profile-v3' | 'account-linking-kingshot-profile-v4' | 'account-linking-kingshot-profile-v5' | 'account-linking-kingshot-profile-v6' | 'account-linking-kingshot-profile-v7' | 'account-linking-kingshot-profile-v8'
export type AccountLinkOcrDisposition = 'recognised' | 'review_required' | 'could_not_read' | 'conflicting_reads'

export interface AccountLinkOcrRegionObservation {
  readonly field: AccountLinkOcrField
  readonly rawText: string
  readonly confidence: number
  readonly warnings: readonly string[]
  readonly acceptedValue?: string
  readonly disposition?: AccountLinkOcrDisposition
  readonly agreement?: 'agree' | 'agree_with_missing_pass' | 'disagree' | 'not_applicable'
  readonly passType?: 'labelled_line' | 'numeric_only' | 'panel' | 'label_component' | 'digits_single_word' | 'digits_single_line' | 'glyph_single_char'
  readonly variant?: 'greyscale' | 'threshold' | 'inverted'
  readonly labelContext?: boolean
}

export interface AccountLinkOcrCandidate {
  readonly field: AccountLinkOcrField
  readonly rawValue: string
  readonly value: string
  readonly mappingVersion: AccountLinkOcrMappingVersion
  readonly confidence: number
  readonly source: 'ocr'
  readonly evidenceId: string
  readonly warnings: readonly string[]
}

export interface AccountLinkOcrResult {
  readonly evidenceId: string
  readonly engineConfidence?: number
  readonly rawText?: string
  readonly regionObservations?: readonly AccountLinkOcrRegionObservation[]
  readonly candidates: readonly AccountLinkOcrCandidate[]
  readonly diagnostics?: {
    readonly mappingVersion: AccountLinkOcrMappingVersion
    readonly regions: readonly { field: AccountLinkOcrField; attempted: boolean; recognized: boolean; confidence: number; warnings: readonly string[] }[]
    readonly fields?: readonly { field: AccountLinkOcrField; disposition: AccountLinkOcrDisposition; confidence: number; agreement: 'agree' | 'agree_with_missing_pass' | 'disagree' | 'not_applicable'; warnings: readonly string[] }[]
    readonly passes?: readonly { field: AccountLinkOcrField; passType: 'labelled_line' | 'numeric_only' | 'panel' | 'label_component' | 'digits_single_word' | 'digits_single_line' | 'glyph_single_char'; variant: 'greyscale' | 'threshold' | 'inverted'; attempted: boolean; confidence: number; labelContext: boolean; warnings: readonly string[] }[]
  }
  readonly provenance: {
    readonly pluginKey: string
    readonly pluginVersion: string
    readonly engineName: string
    readonly engineVersion: string
    readonly executedAt: string
  }
}

export type AccountLinkOcrReview = {
  playerId: string
  displayName: string
  kingdom: string
  allianceTag: string
  townCenterLevel: string
  evidenceId: string
  confidence: number
  source: 'Screenshot OCR'
  userConfirmed: Readonly<Record<AccountLinkOcrField, boolean>>
}

function boundedConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, confidence))
}

function numericValue(text: string, pattern: RegExp, maxLength: number): string | undefined {
  const match = text.match(pattern)?.[1]?.replace(/\s+/g, '')
  return match && match.length <= maxLength ? match : undefined
}

function normalizeName(value: string): string {
  return value.replace(/^[|¦Ⅰl]+\s*/u, '').replace(/^(?:name\s*[:#-]?\s*)/i, '').replace(/[|:;\s]+$/g, '').trim()
}

export function normalizeAllianceTag(value: string): { value?: string; warning?: string } {
  const trimmed = value.trim()
  const inner = /^[[(](.*)[\])]$/u.exec(trimmed)?.[1] ?? trimmed
  const graphemes = typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(inner)].map((item) => item.segment)
    : Array.from(inner)
  if (graphemes.length !== 3) return { warning: 'alliance_tag_must_have_exactly_three_characters' }
  return { value: graphemes.join('').toUpperCase() }
}

function candidate(field: AccountLinkOcrField, value: string, rawValue: string, evidenceId: string, confidence: number, mappingVersion: AccountLinkOcrMappingVersion, warnings: string[] = []): AccountLinkOcrCandidate {
  return { field, rawValue, value, mappingVersion, confidence: boundedConfidence(confidence), source: 'ocr', evidenceId, warnings }
}

export function parseAccountLinkCandidates(rawText: string, evidenceId: string, confidence: number, options: { mappingVersion?: AccountLinkOcrMappingVersion; regions?: readonly AccountLinkOcrRegionObservation[] } = {}): AccountLinkOcrCandidate[] {
  const mappingVersion = options.mappingVersion ?? 'account-linking-ocr-mvp'
  const bounded = boundedConfidence(confidence)
  const candidates: AccountLinkOcrCandidate[] = []
  const regionFor = (field: AccountLinkOcrField) => options.regions?.find((region) => region.field === field)
  const v2 = mappingVersion !== 'account-linking-ocr-mvp' && mappingVersion !== 'account-linking-kingshot-profile-v1'

  const idRegion = regionFor('playerId')
  const idText = idRegion?.rawText && /\d/.test(idRegion.rawText) ? idRegion.rawText : rawText
  const acceptedPlayerId = idRegion && idRegion.disposition === 'recognised' && idRegion.confidence >= 0.65 ? idRegion.acceptedValue : undefined
  const playerId = acceptedPlayerId ?? (v2 && idRegion ? undefined : numericValue(idText, /(?:player\s*[i1]d|[i1]d)\s*[:#-]?\s*((?:\d\s*){1,20})/i, 20) ?? (idRegion ? numericValue(idText, /((?:\d\s*){5,20})/, 20) : undefined))
  if (playerId) candidates.push(candidate('playerId', playerId, playerId, evidenceId, idRegion?.confidence ?? bounded, mappingVersion, [...(idRegion?.warnings ?? []), ...(bounded < 0.7 ? ['Check this value carefully.'] : [])]))

  const nameRegion = regionFor('displayName')
  const labelledName = rawText.match(/name\s*[:#-]?\s*([A-Za-z\x5b][A-Za-z0-9 _\x5d_-]{1,39}?)(?=\s+(?:kingdom|player\s*[i1]d|[i1]d)\b|$)/i)?.[1]?.trim()
  const unlabelledName = nameRegion?.rawText.replace(/\s+/g, ' ').replace(/^(?:name\s*[:#-]?\s*)/i, '').trim().match(/[A-Za-z\x5b][A-Za-z0-9 _\x5d_-]{1,39}/)?.[0]?.trim()
  const name = labelledName || unlabelledName
  const cleanName = nameRegion?.acceptedValue ?? (v2 && nameRegion ? undefined : name?.replace(/[|:;\s]+$/g, '').replace(/[\x5b\x5d]$/, (value) => name.startsWith('[') ? value : '').trim())
  if (cleanName) candidates.push(candidate('displayName', cleanName, cleanName, evidenceId, (nameRegion?.confidence ?? bounded) * 0.9, mappingVersion, [...(nameRegion?.warnings ?? [])]))

  const allianceRegion = regionFor('allianceTag')
  const allianceRaw = allianceRegion?.acceptedValue ?? normalizeName(allianceRegion?.rawText ?? '')
  const alliance = mappingVersion === 'account-linking-kingshot-profile-v6' || mappingVersion === 'account-linking-kingshot-profile-v7' ? normalizeAllianceTag(allianceRaw).value : allianceRaw
  if (alliance) candidates.push(candidate('allianceTag', alliance, allianceRaw, evidenceId, (allianceRegion?.confidence ?? bounded) * 0.8, mappingVersion, [...(allianceRegion?.warnings ?? []), 'supporting_information_review_only']))

  const kingdomRegion = regionFor('kingdom')
  const kingdomText = kingdomRegion?.rawText && /\d/.test(kingdomRegion.rawText) ? kingdomRegion.rawText : rawText
  const acceptedKingdom = kingdomRegion && kingdomRegion.disposition === 'recognised' && kingdomRegion.confidence >= 0.65 ? kingdomRegion.acceptedValue : undefined
  const kingdom = acceptedKingdom ?? (v2 && kingdomRegion ? undefined : numericValue(kingdomText, /kingdom\s*(?:[#:]|no\.?\s*)?\s*((?:\d\s*){1,4})/i, 4) ?? (kingdomRegion ? numericValue(kingdomText, /((?:\d\s*){1,4})/, 4) : undefined))
  if (kingdom) candidates.push(candidate('kingdom', kingdom, kingdom, evidenceId, kingdomRegion?.confidence ?? bounded, mappingVersion, [...(kingdomRegion?.warnings ?? []), ...(bounded < 0.7 ? ['Check this value carefully.'] : [])]))

  const townRegion = regionFor('townCenterLevel')
  const town = townRegion?.acceptedValue && Number(townRegion.acceptedValue) >= 1 && Number(townRegion.acceptedValue) <= 30 ? townRegion.acceptedValue : undefined
  if (town) candidates.push(candidate('townCenterLevel', town, town, evidenceId, townRegion?.confidence ?? bounded, mappingVersion, [...(townRegion?.warnings ?? []), 'town_center_review_only']))

  return candidates.filter((item, index, all) => all.findIndex((other) => other.field === item.field) === index)
}
