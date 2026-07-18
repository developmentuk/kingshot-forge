export type ArtworkClass = 'pixel' | 'ascii' | 'banner' | 'mixed'

export type GlyphFamily =
  | 'space'
  | 'ascii'
  | 'box-drawing'
  | 'unicode'
  | 'emoji'
  | 'pixel-circles'
  | 'hearts'
  | 'decorative-symbols'

export type DeviceProfileId = 'android-default' | 'iphone-default' | 'tablet' | 'desktop-preview'

export type GlyphCalibration = {
  glyphScale: number
  horizontalScale: number
  verticalScale: number
  baselineOffset: number
  fontFamily: string
  fontWeight: number
}

export type CalibrationConfiguration = Record<GlyphFamily, GlyphCalibration>

export type DeviceProfile = {
  id: DeviceProfileId
  label: string
  cellWidth: number
  cellHeight: number
  gridFontSize: number
  lineHeight: number
  emojiScale: number
  chatBubbleWidth: number
  bubblePadding: number
  avatarSize: number
}

export type GridCell = {
  glyph: string
  family: GlyphFamily
  row: number
  column: number
}

export type GridRow = { row: number; cells: GridCell[] }

export type ArtworkAnalysis = {
  artworkClass: ArtworkClass
  confidence: number
  compatibilityScore: number
  estimatedWidthPercent: number
  graphemeCount: number
  lineCount: number
  widestLine: number
  familyCounts: Record<GlyphFamily, number>
  features: string[]
  warnings: string[]
  rendererLabel: string
}

