import type { CalibrationConfiguration, GlyphCalibration, GlyphFamily } from '../types'

const GAME_TEXT_STACK = 'Arial, Arimo, "Noto Sans", "Segoe UI", sans-serif'
const GAME_FULL_WIDTH_STACK = 'Arial, "Noto Sans CJK SC", "Microsoft YaHei", "Segoe UI", sans-serif'
const EMOJI_STACK = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'

const calibration = (overrides: Partial<GlyphCalibration> = {}): GlyphCalibration => ({
  advanceCells: 1,
  glyphScale: 1,
  horizontalScale: 1,
  verticalScale: 1,
  baselineOffset: 0,
  fontFamily: GAME_TEXT_STACK,
  fontWeight: 600,
  ...overrides,
})

export const DEFAULT_CALIBRATION: CalibrationConfiguration = {
  space: calibration({ advanceCells: .72, fontWeight: 400 }),
  'ideographic-space': calibration({ advanceCells: 2, fontFamily: GAME_FULL_WIDTH_STACK, fontWeight: 400 }),
  ascii: calibration({ horizontalScale: .98, verticalScale: .98 }),
  'box-drawing': calibration({ horizontalScale: .9, verticalScale: .98 }),
  'full-width': calibration({ advanceCells: 2, glyphScale: 1.08, horizontalScale: .95, fontFamily: GAME_FULL_WIDTH_STACK }),
  unicode: calibration({ horizontalScale: .95, fontFamily: GAME_FULL_WIDTH_STACK }),
  emoji: calibration({ advanceCells: 2, glyphScale: 1.08, verticalScale: 1.02, fontFamily: EMOJI_STACK, fontWeight: 400 }),
  'pixel-circles': calibration({ advanceCells: 2, glyphScale: 1.04, horizontalScale: .96, fontFamily: EMOJI_STACK, fontWeight: 400 }),
  hearts: calibration({ advanceCells: 2, glyphScale: 1.03, fontFamily: EMOJI_STACK, fontWeight: 400 }),
  'line-art': calibration({ horizontalScale: .95, verticalScale: .95, fontFamily: GAME_FULL_WIDTH_STACK, fontWeight: 400 }),
  'decorative-symbols': calibration({ glyphScale: 1.02, horizontalScale: .92 }),
}

export function mergeCalibration(base: CalibrationConfiguration, overrides: Partial<Record<GlyphFamily, Partial<GlyphCalibration>>>): CalibrationConfiguration {
  return Object.fromEntries(Object.entries(base).map(([family, value]) => [family, { ...value, ...overrides[family as GlyphFamily] }])) as CalibrationConfiguration
}
