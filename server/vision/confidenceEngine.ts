import type {
  VisionConfidenceContribution,
  VisionConfidenceResult,
  VisionValidationResult,
} from '../../shared/platform/vision/contracts.js'

export const FORGE_VISION_CONFIDENCE_MODEL_VERSION = 'forge-vision-confidence-v1'

export interface VisionConfidenceInput {
  threshold: number
  extractorConfidence: number | null
  screenDetectionConfidence?: number | null
  regionDetectionConfidence?: number | null
  formatConfidence?: number | null
  validation: VisionValidationResult
}

export function evaluateVisionConfidence(input: VisionConfidenceInput): VisionConfidenceResult {
  const threshold = normaliseScore(input.threshold, 'threshold')
  const contributions: VisionConfidenceContribution[] = []

  addContribution(contributions, 'extractor', input.extractorConfidence, 0.5, 'Confidence reported by the selected extractor plugin.')
  addContribution(contributions, 'screen_detection', input.screenDetectionConfidence, 0.15, 'Confidence that the published screen mapping matches the screenshot.')
  addContribution(contributions, 'region_detection', input.regionDetectionConfidence, 0.15, 'Confidence that the configured region or anchor was located correctly.')
  addContribution(contributions, 'format', input.formatConfidence, 0.1, 'Confidence that the extracted value matches the expected field format.')

  const validationScore = input.validation.status === 'valid'
    ? 1
    : input.validation.status === 'warning'
      ? 0.65
      : input.validation.status === 'invalid'
        ? 0
        : null
  addContribution(contributions, 'validation', validationScore, 0.1, 'Outcome from the governed validation contract.')

  const available = contributions.filter((item) => item.weight > 0)
  const totalWeight = available.reduce((total, item) => total + item.weight, 0)
  const score = totalWeight > 0
    ? available.reduce((total, item) => total + item.score * item.weight, 0) / totalWeight
    : null

  const status = input.validation.status === 'invalid'
    ? 'blocked'
    : score == null
      ? 'unavailable'
      : score >= threshold
        ? 'accepted'
        : 'review_required'

  const rationale = contributions.map((item) => `${item.key}: ${(item.score * 100).toFixed(1)}% (${item.rationale})`)
  if (status === 'blocked') rationale.push('Validation failed; confidence cannot bypass a blocking validation result.')
  if (status === 'review_required') rationale.push(`Combined confidence is below the ${(threshold * 100).toFixed(1)}% mapping threshold.`)

  return {
    score: score == null ? null : roundScore(score),
    status,
    threshold,
    modelVersion: FORGE_VISION_CONFIDENCE_MODEL_VERSION,
    contributions,
    rationale,
  }
}

function addContribution(
  target: VisionConfidenceContribution[],
  key: string,
  score: number | null | undefined,
  weight: number,
  rationale: string,
): void {
  if (score == null) return
  target.push({ key, score: normaliseScore(score, key), weight, rationale })
}

function normaliseScore(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`Forge Vision ${label} confidence must be between 0 and 1.`)
  }
  return value
}

function roundScore(value: number): number {
  return Math.round(value * 10_000) / 10_000
}
