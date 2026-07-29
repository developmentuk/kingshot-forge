import { classifyGlyph, isLogicalInternalSpaceRun, isLogicalLeadingSpaceRun, resolveGlyphAdvance } from '../analyser'
import { analyseClipboardDocument } from '../adaptiveCalibration'
import { DEFAULT_CALIBRATION } from '../configuration'
import { segmentGraphemes } from '../parser'
import type { CalibrationConfiguration, GridCell, GridRow } from '../types'
import type { ArtworkSourceContext } from '../analyser'

export function buildFixedCellGrid(lines: string[], calibration: CalibrationConfiguration = DEFAULT_CALIBRATION, sourceContext: ArtworkSourceContext = 'authored'): GridRow[] {
  const layout = analyseClipboardDocument(lines, sourceContext)
  return lines.map((line, row) => {
    let logicalColumn = 0
    const glyphs = segmentGraphemes(line)
    const cells: GridCell[] = []
    const rowLayout = layout.rows[row]
    const textAnchor = rowLayout?.columnAnchor
    const textIndex = rowLayout?.rightRegionStartIndex
    for (let index = 0; index < glyphs.length; index += 1) {
      const glyph = glyphs[index]
      if (textAnchor !== undefined && textIndex !== undefined && index === textIndex) logicalColumn = Math.max(logicalColumn, textAnchor)
      if (rowLayout?.semanticGapStartIndex === index && rowLayout.semanticGapEndIndex !== undefined && rowLayout.semanticGapWidthCells !== undefined) {
        const sourceGlyphs = glyphs.slice(index, rowLayout.semanticGapEndIndex)
        cells.push({ glyph, sourceGlyphs, sourceStartIndex: index, sourceEndIndex: rowLayout.semanticGapEndIndex, family: classifyGlyph(glyph), span: rowLayout.semanticGapWidthCells, row, column: logicalColumn, role: 'semantic-gap' })
        logicalColumn += rowLayout.semanticGapWidthCells
        index = rowLayout.semanticGapEndIndex - 1
        continue
      }
      const logicalRun = isLogicalInternalSpaceRun(glyphs, index, sourceContext) || isLogicalLeadingSpaceRun(glyphs, index, sourceContext)
      if (logicalRun && index > 0 && glyphs[index - 1] === ' ') continue
      const runLength = logicalRun ? glyphs.slice(index).findIndex((item) => item !== ' ') : 1
      const sourceGlyphs = runLength > 0 ? glyphs.slice(index, index + runLength) : [glyph]
      const family = classifyGlyph(glyph)
      const span = resolveGlyphAdvance(glyph, glyphs, index, calibration, sourceContext)
      cells.push({ glyph, sourceGlyphs, sourceStartIndex: index, sourceEndIndex: index + sourceGlyphs.length, family, span, row, column: logicalColumn })
      logicalColumn += span
      if (runLength > 1) index += runLength - 1
    }
    return { row, cells, visualAdvanceCells: rowLayout?.visualAdvanceCells ?? 1, context: rowLayout?.context ?? 'prose' }
  })
}
