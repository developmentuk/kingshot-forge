export type ArtworkClass = 'pixel' | 'ascii' | 'banner' | 'mixed'

export type GlyphFamily =
  | 'space'
  | 'ideographic-space'
  | 'ascii'
  | 'box-drawing'
  | 'full-width'
  | 'unicode'
  | 'emoji'
  | 'pixel-circles'
  | 'hearts'
  | 'decorative-symbols'

export type DeviceProfileId = 'android-default' | 'iphone-default' | 'tablet' | 'desktop-preview'

export type GlyphCalibration = {
  advanceCells: number
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
  bubbleInlinePadding: number
  avatarSize: number
}

export type DeviceProfileOverrides = Partial<Record<DeviceProfileId, Partial<DeviceProfile>>>

export type SavedCalibrationProfile = {
  schemaVersion: 1
  id: string
  name: string
  createdAt: string
  updatedAt: string
  baseDeviceProfile: DeviceProfileId
  calibration: CalibrationConfiguration
  deviceOverrides: DeviceProfileOverrides
  benchmarkId?: string
}

export type GridCell = {
  glyph: string
  span: number
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
