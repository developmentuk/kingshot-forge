import { classifyGlyph, resolveGlyphAdvance } from '../analyser'
import { analyseClipboardDocument, classifyClipboardSourceRole, resolveClipboardSourceAdvance } from '../adaptiveCalibration'
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
    for (let index = 0; index < glyphs.length; index += 1) {
      const glyph = glyphs[index]
      const family = classifyGlyph(glyph)
      const span = sourceContext === 'kingshot-clipboard' ? resolveClipboardSourceAdvance(line, glyphs, index, rowLayout) : resolveGlyphAdvance(glyph, glyphs, index, calibration, sourceContext)
      const role = rowLayout?.semanticGapStartIndex !== undefined && rowLayout.semanticGapEndIndex !== undefined && index >= rowLayout.semanticGapStartIndex && index < rowLayout.semanticGapEndIndex ? 'semantic-gap' : undefined
      cells.push({ glyph, sourceGlyphs: [glyph], sourceStartIndex: index, sourceEndIndex: index + 1, family, span, row, column: logicalColumn, role, sourceRole: sourceContext === 'kingshot-clipboard' ? classifyClipboardSourceRole(line, glyphs, index, rowLayout) : undefined })
      logicalColumn += span
    }
    return { row, cells, visualAdvanceCells: rowLayout?.visualAdvanceCells ?? 1, context: rowLayout?.context ?? 'prose', horizontalOffsetCells: rowLayout?.horizontalOffsetCells ?? 0 }
  })
}
