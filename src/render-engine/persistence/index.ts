import { DEFAULT_CALIBRATION } from '../configuration'
import { DEVICE_PROFILES } from '../device-profiles'
import type { CalibrationConfiguration, DeviceProfileOverrides, DeviceProfileId, GlyphCalibration, GlyphFamily, SavedCalibrationProfile } from '../types'

export const CALIBRATION_STORAGE_KEY = 'forge.renderEngine.calibrationProfiles.v1'

const FAMILIES: GlyphFamily[] = ['space', 'ideographic-space', 'ascii', 'box-drawing', 'full-width', 'unicode', 'emoji', 'pixel-circles', 'hearts', 'decorative-symbols']
const DEVICE_IDS: DeviceProfileId[] = ['android-default', 'iphone-default', 'tablet', 'desktop-preview']
const CALIBRATION_FIELDS: Array<keyof GlyphCalibration> = ['advanceCells', 'glyphScale', 'horizontalScale', 'verticalScale', 'baselineOffset', 'fontFamily', 'fontWeight']

export function cloneCalibration(source: CalibrationConfiguration): CalibrationConfiguration {
  return Object.fromEntries(FAMILIES.map((family) => [family, { ...source[family] }])) as CalibrationConfiguration
}

function isFiniteNumber(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
}

function validCalibration(value: unknown): value is CalibrationConfiguration {
  if (!value || typeof value !== 'object') return false
  return FAMILIES.every((family) => {
    const item = (value as Record<string, unknown>)[family]
    if (!item || typeof item !== 'object') return false
    const record = item as Record<string, unknown>
    return isFiniteNumber(record.advanceCells, .25, 4) && isFiniteNumber(record.glyphScale, .1, 4) && isFiniteNumber(record.horizontalScale, .1, 4) && isFiniteNumber(record.verticalScale, .1, 4) && isFiniteNumber(record.baselineOffset, -100, 100) && typeof record.fontFamily === 'string' && record.fontFamily.length <= 240 && isFiniteNumber(record.fontWeight, 100, 900) && CALIBRATION_FIELDS.every((field) => field in record)
  })
}

function validDeviceOverrides(value: unknown): value is DeviceProfileOverrides {
  if (value === undefined) return true
  if (!value || typeof value !== 'object') return false
  return Object.entries(value as Record<string, unknown>).every(([id, override]) => {
    if (!DEVICE_IDS.includes(id as DeviceProfileId) || !override || typeof override !== 'object') return false
    const base = DEVICE_PROFILES[id as DeviceProfileId]
    const limits: Record<string, [number, number]> = { cellWidth: [1, 100], cellHeight: [1, 100], gridFontSize: [1, 100], lineHeight: [.5, 3], emojiScale: [.1, 4], chatBubbleWidth: [100, 2000], bubblePadding: [0, 100], bubbleInlinePadding: [0, 100], avatarSize: [1, 200] }
    return Object.entries(override as Record<string, unknown>).every(([field, item]) => field in base && field in limits && isFiniteNumber(item, ...limits[field]))
  })
}

function upgradeCalibration(value: unknown): CalibrationConfiguration | undefined {
  if (!value || typeof value !== 'object') return undefined
  const source = value as Record<string, unknown>
  const hasKnownFamily = FAMILIES.some((family) => {
    const legacyFamily = family === 'ideographic-space' ? 'space' : family === 'full-width' ? 'unicode' : family
    const item = source[family] ?? source[legacyFamily]
    return Boolean(item && typeof item === 'object')
  })
  if (!hasKnownFamily) return undefined
  const upgraded = Object.fromEntries(FAMILIES.map((family) => {
    const legacyFamily = family === 'ideographic-space' ? 'space' : family === 'full-width' ? 'unicode' : family
    const item = source[family] ?? source[legacyFamily]
    if (!item || typeof item !== 'object') return [family, { ...DEFAULT_CALIBRATION[family] }]
    const record = item as Partial<GlyphCalibration>
    return [family, { ...DEFAULT_CALIBRATION[family], ...record, advanceCells: typeof record.advanceCells === 'number' ? record.advanceCells : DEFAULT_CALIBRATION[family].advanceCells }]
  })) as CalibrationConfiguration
  return validCalibration(upgraded) ? upgraded : undefined
}

export function upgradeSavedCalibrationProfile(value: unknown): SavedCalibrationProfile | undefined {
  if (!value || typeof value !== 'object') return undefined
  const profile = value as Partial<SavedCalibrationProfile>
  const calibration = upgradeCalibration(profile.calibration)
  if (profile.schemaVersion !== 1 || typeof profile.id !== 'string' || profile.id.length === 0 || typeof profile.name !== 'string' || profile.name.trim().length === 0 || typeof profile.createdAt !== 'string' || typeof profile.updatedAt !== 'string' || !DEVICE_IDS.includes(profile.baseDeviceProfile as DeviceProfileId) || !calibration || !validDeviceOverrides(profile.deviceOverrides)) return undefined
  return { schemaVersion: 1, id: profile.id, name: profile.name, createdAt: profile.createdAt, updatedAt: profile.updatedAt, baseDeviceProfile: profile.baseDeviceProfile as DeviceProfileId, calibration, deviceOverrides: structuredClone(profile.deviceOverrides ?? {}), benchmarkId: typeof profile.benchmarkId === 'string' ? profile.benchmarkId : undefined }
}

export function isSavedCalibrationProfile(value: unknown): value is SavedCalibrationProfile {
  return Boolean(upgradeSavedCalibrationProfile(value))
}

export function parseCalibrationProfiles(value: string | null): SavedCalibrationProfile[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.map(upgradeSavedCalibrationProfile).filter((profile): profile is SavedCalibrationProfile => Boolean(profile))
  } catch {
    return []
  }
}

export function loadCalibrationProfiles(storage?: Pick<Storage, 'getItem'>): SavedCalibrationProfile[] {
  try { return parseCalibrationProfiles(storage?.getItem(CALIBRATION_STORAGE_KEY) ?? null) } catch { return [] }
}

export function persistCalibrationProfiles(profiles: SavedCalibrationProfile[], storage?: Pick<Storage, 'setItem'>): void {
  storage?.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(profiles))
}

export function makeCalibrationProfile(input: { name: string; baseDeviceProfile: DeviceProfileId; calibration: CalibrationConfiguration; deviceOverrides: DeviceProfileOverrides; benchmarkId?: string; now?: string }): SavedCalibrationProfile {
  const now = input.now ?? new Date().toISOString()
  return { schemaVersion: 1, id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: input.name.trim(), createdAt: now, updatedAt: now, baseDeviceProfile: input.baseDeviceProfile, calibration: cloneCalibration(input.calibration), deviceOverrides: structuredClone(input.deviceOverrides), benchmarkId: input.benchmarkId }
}

export function isCalibrationConfiguration(value: unknown): value is CalibrationConfiguration { return validCalibration(value) }
