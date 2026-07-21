import type { LineAnchor, LineDrift, RenderContext, RenderProfile } from '../../../shared/domains/art-studio/rendering'
import { measureRenderDrift, summariseRenderDrift } from '../../../shared/domains/art-studio/rendering'

export type CalibrationEvidence = {
  fixtureId: string
  context: RenderContext
  screenshotName: string
  screenshotScale: number
  browserScale: number
  anchors: LineAnchor[]
  drifts: LineDrift[]
  summary: ReturnType<typeof summariseRenderDrift>
  rootCause: string[]
}
type CalibrationInput = Omit<CalibrationEvidence, 'drifts' | 'summary'> & { text: string }

export type VersionedRenderProfile = { schemaVersion: 1; id: string; version: number; context: RenderContext; createdAt: string; profile: RenderProfile; evidence?: CalibrationEvidence }

export const CALIBRATION_EVIDENCE_STORAGE_KEY = 'forge.renderEngine.contextProfiles.v1'

export function calibrateEvidence(input: CalibrationInput, profile: RenderProfile): CalibrationEvidence {
  const drifts = measureRenderDrift(input.text, profile, input.anchors, { screenshotScale: input.screenshotScale * input.browserScale })
  return { ...input, drifts, summary: summariseRenderDrift(drifts) }
}

export function makeVersionedRenderProfile(context: RenderContext, profile: RenderProfile, evidence?: CalibrationEvidence, now = new Date().toISOString()): VersionedRenderProfile {
  return { schemaVersion: 1, id: `render-${context}-v${profile.version}`, version: profile.version, context, createdAt: now, profile: structuredClone(profile), evidence }
}

export function persistVersionedRenderProfiles(profiles: VersionedRenderProfile[], storage?: Pick<Storage, 'setItem'>) { storage?.setItem(CALIBRATION_EVIDENCE_STORAGE_KEY, JSON.stringify(profiles)) }

export function parseVersionedRenderProfiles(value: string | null): VersionedRenderProfile[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is VersionedRenderProfile => Boolean(item && typeof item === 'object' && (item as VersionedRenderProfile).schemaVersion === 1 && typeof (item as VersionedRenderProfile).context === 'string' && typeof (item as VersionedRenderProfile).profile === 'object')) : []
  } catch { return [] }
}
