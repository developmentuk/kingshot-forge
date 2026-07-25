export type PlayerIdPassType = 'labelled_line' | 'numeric_only'
export type PlayerIdPreprocessVariant = 'greyscale' | 'threshold' | 'inverted'

export interface PlayerIdObservation {
  readonly passType: PlayerIdPassType
  readonly variant: PlayerIdPreprocessVariant
  readonly digits?: string
  readonly confidence: number
  readonly labelContext: boolean
}

export interface PlayerIdConsensus {
  readonly value?: string
  readonly disposition: 'recognised' | 'could_not_read' | 'conflicting_reads'
  readonly agreement: 'agree' | 'agree_with_missing_pass' | 'disagree' | 'insufficient'
  readonly confidence: number
  readonly warnings: readonly string[]
}

export const PLAYER_ID_LABEL_CONFIDENCE = 0.65
export const PLAYER_ID_NUMERIC_CONFIDENCE = 0.55
export const COMPONENT_NUMERIC_STRONG_CONFIDENCE = 0.55
export const COMPONENT_NUMERIC_SUPPORTING_CONFIDENCE = 0.35

export function isValidKingshotPlayerId(value: string | undefined): value is string {
  return typeof value === 'string' && /^\d{1,20}$/u.test(value)
}

export function consensusPlayerId(observations: readonly PlayerIdObservation[]): PlayerIdConsensus {
  const valid = observations.filter((item) => isValidKingshotPlayerId(item.digits) && item.confidence > 0)
  const labelled = valid.filter((item) => item.passType === 'labelled_line' && item.labelContext && item.confidence >= PLAYER_ID_LABEL_CONFIDENCE)
  const numeric = valid.filter((item) => item.passType === 'numeric_only' && item.confidence >= PLAYER_ID_NUMERIC_CONFIDENCE)
  const labelledValues = new Set(labelled.map((item) => item.digits!))
  const numericValues = new Set(numeric.map((item) => item.digits!))
  const common = [...labelledValues].filter((value) => numericValues.has(value))
  const allValues = new Set(valid.map((item) => item.digits!))
  if (common.length === 1) {
    const value = common[0]
    const supporting = valid.filter((item) => item.digits === value)
    return { value, disposition: 'recognised', agreement: 'agree', confidence: Math.min(1, Math.max(...supporting.map((item) => item.confidence))), warnings: supporting.length < 3 ? ['one_or_more_passes_failed'] : [] }
  }
  if (allValues.size > 1 && labelled.length > 0) return { disposition: 'conflicting_reads', agreement: 'disagree', confidence: Math.max(...valid.map((item) => item.confidence), 0), warnings: ['conflicting_digit_strings'] }
  return { disposition: 'could_not_read', agreement: 'insufficient', confidence: Math.max(...valid.map((item) => item.confidence), 0), warnings: ['insufficient_labelled_numeric_agreement'] }
}

export type ComponentNumericObservation = {
  readonly passType: 'single_word' | 'single_line'
  readonly variant: PlayerIdPreprocessVariant
  readonly digits?: string
  readonly confidence: number
}

export function consensusComponentDigits(observations: readonly ComponentNumericObservation[], labelContext: boolean, validator: (value: string) => boolean = isValidKingshotPlayerId): PlayerIdConsensus {
  const valid = observations.filter((item) => validator(item.digits ?? '') && item.confidence > 0)
  if (!labelContext) return { disposition: 'could_not_read', agreement: 'insufficient', confidence: Math.max(...valid.map((item) => item.confidence), 0), warnings: ['missing_field_label_context'] }
  const groups = new Map<string, ComponentNumericObservation[]>()
  for (const item of valid) groups.set(item.digits!, [...(groups.get(item.digits!) ?? []), item])
  const supported = [...groups.entries()].filter(([, items]) => items.some((item) => item.confidence >= COMPONENT_NUMERIC_STRONG_CONFIDENCE) && items.some((item) => item.confidence >= COMPONENT_NUMERIC_SUPPORTING_CONFIDENCE))
  if (supported.length === 1) {
    const [value, items] = supported[0]
    const conflict = valid.some((item) => item.digits !== value && item.confidence >= Math.min(...items.map((candidate) => candidate.confidence)))
    if (conflict) return { disposition: 'conflicting_reads', agreement: 'disagree', confidence: Math.max(...valid.map((item) => item.confidence)), warnings: ['conflicting_digit_strings'] }
    return { value, disposition: 'recognised', agreement: 'agree', confidence: Math.max(...items.map((item) => item.confidence)), warnings: valid.length < observations.length ? ['one_or_more_passes_failed'] : [] }
  }
  if (groups.size > 1) return { disposition: 'conflicting_reads', agreement: 'disagree', confidence: Math.max(...valid.map((item) => item.confidence), 0), warnings: ['conflicting_digit_strings'] }
  return { disposition: 'could_not_read', agreement: 'insufficient', confidence: Math.max(...valid.map((item) => item.confidence), 0), warnings: ['insufficient_component_numeric_agreement'] }
}

export type KingdomLineRead = { readonly value?: string; readonly confidence: number }

export function consensusKingdomLine(reads: readonly KingdomLineRead[], labelContext: boolean): PlayerIdConsensus {
  const valid = reads.filter((item) => item.value && item.confidence > 0 && Number(item.value) >= 1 && Number(item.value) <= 9999)
  const confidence = Math.max(...reads.map((item) => item.confidence), 0)
  if (!labelContext) return { disposition: 'could_not_read', agreement: 'insufficient', confidence, warnings: ['kingdom_label_context_required'] }
  if (valid.length === 2 && valid[0].value === valid[1].value) return { value: valid[0].value, disposition: 'recognised', agreement: 'agree', confidence: Math.max(...valid.map((item) => item.confidence)), warnings: [] }
  if (labelContext && valid.length === 1 && valid[0].confidence >= 0.75) return { value: valid[0].value, disposition: 'recognised', agreement: 'agree_with_missing_pass', confidence: valid[0].confidence, warnings: ['one_kingdom_pass_failed'] }
  if (valid.length === 2 && valid[0].value !== valid[1].value) return { disposition: 'conflicting_reads', agreement: 'disagree', confidence, warnings: ['conflicting_digit_strings'] }
  return { disposition: 'could_not_read', agreement: 'insufficient', confidence, warnings: labelContext ? [] : ['kingdom_label_context_required'] }
}

export type TownCenterBadgeObservation = { readonly source: 'tight' | 'context'; readonly value?: string; readonly confidence: number }

export function consensusTownCenterBadge(tight: readonly TownCenterBadgeObservation[], context: readonly TownCenterBadgeObservation[], labelContext: boolean): PlayerIdConsensus {
  const validTight = tight.filter((item) => item.value && Number(item.value) >= 1 && Number(item.value) <= 30 && item.confidence > 0)
  const validContext = context.filter((item) => item.value && Number(item.value) >= 1 && Number(item.value) <= 30 && item.confidence > 0)
  const confidence = Math.max(...[...validTight, ...validContext].map((item) => item.confidence), 0)
  if (!labelContext) return { disposition: 'could_not_read', agreement: 'insufficient', confidence, warnings: ['town_center_label_context_required'] }
  const groups = new Map<string, TownCenterBadgeObservation[]>()
  for (const item of validTight) groups.set(item.value!, [...(groups.get(item.value!) ?? []), item])
  const strongValues = new Set(validTight.filter((item) => item.confidence >= COMPONENT_NUMERIC_STRONG_CONFIDENCE).map((item) => item.value))
  if (strongValues.size > 1) return { disposition: 'conflicting_reads', agreement: 'disagree', confidence, warnings: ['conflicting_town_center_levels'] }
  const supported = [...groups.entries()].filter(([, items]) => items.length >= 2 && items.some((item) => item.confidence >= COMPONENT_NUMERIC_STRONG_CONFIDENCE))
  if (supported.length === 0) return { disposition: 'could_not_read', agreement: 'insufficient', confidence, warnings: ['insufficient_tight_badge_agreement'] }
  const ranked = supported.sort((a, b) => b[1].length - a[1].length || Math.max(...b[1].map((item) => item.confidence)) - Math.max(...a[1].map((item) => item.confidence)))
  const [value, observations] = ranked[0]
  const strongest = Math.max(...observations.map((item) => item.confidence))
  const conflict = [...groups.entries()].some(([candidate, items]) => candidate !== value && Math.max(...items.map((item) => item.confidence)) >= strongest - 0.05)
  if (conflict) return { disposition: 'conflicting_reads', agreement: 'disagree', confidence, warnings: ['conflicting_town_center_levels'] }
  const contextSupport = validContext.some((item) => item.value === value)
  return { value, disposition: 'recognised', agreement: validTight.length < tight.length ? 'agree_with_missing_pass' : 'agree', confidence: strongest, warnings: contextSupport ? [] : ['tight_badge_only_consensus'] }
}
