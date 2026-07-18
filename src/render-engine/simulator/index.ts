import type { CSSProperties } from 'react'
import type { CalibrationConfiguration, DeviceProfile, GlyphFamily } from '../types'

export function calibrationStyle(family: GlyphFamily, calibration: CalibrationConfiguration, device: DeviceProfile): CSSProperties {
  const value = calibration[family]
  return {
    '--forge-cell-width': `${device.cellWidth}px`,
    '--forge-cell-height': `${device.cellHeight}px`,
    '--forge-glyph-scale': value.glyphScale,
    '--forge-glyph-scale-x': value.horizontalScale,
    '--forge-glyph-scale-y': value.verticalScale,
    '--forge-baseline-offset': `${value.baselineOffset}px`,
    '--forge-glyph-family': value.fontFamily,
    '--forge-glyph-weight': value.fontWeight,
  } as CSSProperties
}

