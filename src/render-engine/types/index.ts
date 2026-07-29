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
  | 'line-art'
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
  /** Paint-only correction in logical cells; never changes advanceCells. */
  glyphTranslateXCells?: number
  /** Paint-only multiplier applied after the family horizontal scale. */
  glyphScaleX?: number
}

export type DirectionalGlyphCalibrationId =
  | 'ascii-forward-slash'
  | 'ascii-backslash'
  | 'full-width-forward-slash'
  | 'full-width-backslash'
  | 'vertical-bar'
  | 'line-art'

export type GlyphPaintCalibration = {
  glyphTranslateXCells: number
  glyphScaleX: number
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
  sourceGlyphs: string[]
  sourceStartIndex: number
  sourceEndIndex: number
  span: number
  family: GlyphFamily
  row: number
  column: number
  role?: 'semantic-gap'
}

export type ClipboardBlockKind = 'structural-body' | 'hybrid-columns' | 'blank-separator' | 'trailing-caption' | 'prose' | 'mixed'

export type ClipboardDocumentRow = {
  row: number
  context: string
  visualAdvanceCells: number
  semanticGapStartIndex?: number
  semanticGapEndIndex?: number
  rightRegionStartIndex?: number
  columnAnchor?: number
  leftRegionEndColumn?: number
  semanticGapWidthCells?: number
  sourceGapGlyphs?: string[]
  hybridRejectionReason?: string
}

export type ClipboardDocumentBlock = {
  kind: ClipboardBlockKind
  startRow: number
  endRow: number
  regionStartColumn?: number
  regionEndColumn?: number
  columnAnchor?: number
  semanticColumnGap?: number
}

export type ClipboardDocumentLayout = {
  rows: ClipboardDocumentRow[]
  blocks: ClipboardDocumentBlock[]
}

export type GridRow = { row: number; cells: GridCell[]; visualAdvanceCells: number; context: string }

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
