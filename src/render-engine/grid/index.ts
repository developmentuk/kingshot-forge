import { classifyGlyph, resolveGlyphAdvance } from '../analyser'
import { DEFAULT_CALIBRATION } from '../configuration'
import { segmentGraphemes } from '../parser'
import type { CalibrationConfiguration, GridRow } from '../types'
import type { ArtworkSourceContext } from '../analyser'

export function buildFixedCellGrid(lines: string[], calibration: CalibrationConfiguration = DEFAULT_CALIBRATION, sourceContext: ArtworkSourceContext = 'authored'): GridRow[] {
  return lines.map((line, row) => {
    let logicalColumn = 0
    return {
      row,
      cells: segmentGraphemes(line).map((glyph, index, glyphs) => {
        const family = classifyGlyph(glyph)
        const span = resolveGlyphAdvance(glyph, glyphs, index, calibration, sourceContext)
        const cell = { glyph, family, span, row, column: logicalColumn }
        logicalColumn += span
        return cell
      }),
    }
  })
}
