import type { CalibrationConfiguration, GlyphCalibration, GlyphFamily } from '../types'

const calibration = (overrides: Partial<GlyphCalibration> = {}): GlyphCalibration => ({
  glyphScale: 1,
  horizontalScale: 1,
  verticalScale: 1,
  baselineOffset: 0,
  fontFamily: '"Courier New", Consolas, monospace',
  fontWeight: 400,
  ...overrides,
})

export const DEFAULT_CALIBRATION: CalibrationConfiguration = {
  space: calibration(), ascii: calibration({ horizontalScale: .91, glyphScale: .96 }),
  'box-drawing': calibration({ glyphScale: .98 }), unicode: calibration({ fontFamily: '"Segoe UI", sans-serif' }),
  emoji: calibration({ glyphScale: 1.1, verticalScale: 1.08, fontFamily: '"Segoe UI Emoji", sans-serif' }),
  'pixel-circles': calibration({ glyphScale: 1.08, horizontalScale: .95, fontFamily: '"Segoe UI Emoji", sans-serif' }),
  hearts: calibration({ glyphScale: 1.05, fontFamily: '"Segoe UI Emoji", sans-serif' }),
  'decorative-symbols': calibration({ glyphScale: 1.02 }),
}

export function mergeCalibration(base: CalibrationConfiguration, overrides: Partial<Record<GlyphFamily, Partial<GlyphCalibration>>>): CalibrationConfiguration {
  return Object.fromEntries(Object.entries(base).map(([family, value]) => [family, { ...value, ...overrides[family as GlyphFamily] }])) as CalibrationConfiguration
}

