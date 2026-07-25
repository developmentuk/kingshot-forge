import type { CSSProperties } from 'react'
import type { CalibrationConfiguration, DeviceProfile, GlyphFamily } from '../types'

export function deviceProfileStyle(device: DeviceProfile, scale = 1): CSSProperties {
  return {
    '--forge-chat-width': `${device.chatBubbleWidth * scale}px`,
    '--forge-bubble-padding': `${device.bubblePadding * scale}px`,
    '--forge-bubble-inline-padding': `${device.bubbleInlinePadding * scale}px`,
    '--forge-avatar-size': `${device.avatarSize * scale}px`,
    '--forge-cell-width': `${device.cellWidth * scale}px`,
    '--forge-cell-height': `${device.cellHeight * scale}px`,
    '--forge-grid-font-size': `${device.gridFontSize * scale}px`,
    '--forge-grid-line-height': device.lineHeight,
    '--forge-emoji-scale': device.emojiScale,
  } as CSSProperties
}

export function calibrationStyle(family: GlyphFamily, calibration: CalibrationConfiguration, device: DeviceProfile): CSSProperties {
  const value = calibration[family]
  return {
    ...deviceProfileStyle(device),
    '--forge-glyph-scale': value.glyphScale,
    '--forge-glyph-scale-x': value.horizontalScale,
    '--forge-glyph-translate-x-cells': value.glyphTranslateXCells ?? 0,
    '--forge-glyph-scale-y': value.verticalScale,
    '--forge-baseline-offset': `${value.baselineOffset}px`,
    '--forge-glyph-family': value.fontFamily,
    '--forge-glyph-weight': value.fontWeight,
  } as CSSProperties
}
