import { classifyGlyph } from '../analyser'
import { DEFAULT_CALIBRATION } from '../configuration'
import { segmentGraphemes } from '../parser'
import type { CalibrationConfiguration, GridRow } from '../types'

export function buildFixedCellGrid(lines: string[], calibration: CalibrationConfiguration = DEFAULT_CALIBRATION): GridRow[] {
  return lines.map((line, row) => {
    let logicalColumn = 0
    return {
      row,
      cells: segmentGraphemes(line).map((glyph) => {
        const family = classifyGlyph(glyph)
        const span = calibration[family].advanceCells
        const cell = { glyph, family, span, row, column: logicalColumn }
        logicalColumn += span
        return cell
      }),
    }
  })
}
