import { segmentGraphemes } from '../parser'
import type { GridRow } from '../types'
import { classifyGlyph } from '../analyser'

export function buildFixedCellGrid(lines: string[]): GridRow[] {
  return lines.map((line, row) => ({
    row,
    cells: segmentGraphemes(line).map((glyph, column) => ({
      glyph,
      family: classifyGlyph(glyph),
      row,
      column,
    })),
  }))
}

