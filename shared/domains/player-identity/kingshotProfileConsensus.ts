export type PlayerIdPassType = 'labelled_line' | 'numeric_only'
export type PlayerIdPreprocessVariant = 'greyscale' | 'threshold'

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
  readonly agreement: 'agree' | 'disagree' | 'insufficient'
  readonly confidence: number
  readonly warnings: readonly string[]
}

export const PLAYER_ID_LABEL_CONFIDENCE = 0.65
export const PLAYER_ID_NUMERIC_CONFIDENCE = 0.55

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
