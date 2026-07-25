import { classifyGlyph, isArtworkLine, type ArtworkSourceContext } from './analyser'
import { segmentGraphemes } from './parser'

export type ClipboardLineContext =
  | 'prose'
  | 'caption'
  | 'leading-structural'
  | 'sparse-structural'
  | 'dense-structural'
  | 'mixed-emoji-ascii'
  | 'trailing-emoji'
  | 'horizontal-structural-run'
  | 'hybrid-text-art'

export type AdaptiveClipboardCalibration = {
  proseSpaceAdvanceCells: number
  captionSpaceAdvanceCells: number
  leadingRunBaseCells: number
  leadingRunIncrementCells: number
  leadingRunCap: number
  structuralGapBaseCells: number
  structuralGapIncrementCells: number
  structuralGapCap: number
  mixedEmojiGapBaseCells: number
  mixedEmojiGapIncrementCells: number
  mixedEmojiGapCap: number
}

export const ADAPTIVE_CLIPBOARD_CALIBRATION: AdaptiveClipboardCalibration = {
  proseSpaceAdvanceCells: .72,
  captionSpaceAdvanceCells: .55,
  leadingRunBaseCells: .20,
  leadingRunIncrementCells: .45,
  leadingRunCap: 23,
  structuralGapBaseCells: .30,
  structuralGapIncrementCells: .33,
  structuralGapCap: 3,
  mixedEmojiGapBaseCells: .26,
  mixedEmojiGapIncrementCells: .30,
  mixedEmojiGapCap: 3,
}

const STRUCTURAL_FAMILIES = new Set(['ideographic-space', 'full-width', 'box-drawing', 'line-art'])

export function classifyClipboardLineContext(line: string): ClipboardLineContext {
  const glyphs = segmentGraphemes(line)
  const nonSpace = glyphs.filter((glyph) => glyph !== ' ' && glyph !== '\u3000')
  const letters = nonSpace.filter((glyph) => /\p{Letter}/u.test(glyph)).length
  const emoji = nonSpace.filter((glyph) => /\p{Extended_Pictographic}/u.test(glyph)).length
  const structural = nonSpace.filter((glyph) => STRUCTURAL_FAMILIES.has(classifyGlyph(glyph)) || /^[\\/|()[\]{}<>^]$/u.test(glyph)).length
  const leading = glyphs.findIndex((glyph) => glyph !== ' ')
  const trailingEmoji = emoji > 0 && /\p{Extended_Pictographic}\s*$/u.test(line)
  if (!isArtworkLine(glyphs)) return letters > 3 && emoji === 0 ? 'caption' : 'prose'
  if (trailingEmoji && letters === 0) return 'trailing-emoji'
  if (emoji > 0 && structural > 0) return 'mixed-emoji-ascii'
  if (letters > 0 && structural > 0) return 'hybrid-text-art'
  if (structural >= 6 && letters === 0 && (nonSpace.filter((glyph) => classifyGlyph(glyph) === 'line-art').length / Math.max(nonSpace.length, 1)) >= .5) return 'horizontal-structural-run'
  if (leading > 0) return structural / Math.max(nonSpace.length, 1) >= .55 ? 'dense-structural' : 'leading-structural'
  return structural / Math.max(nonSpace.length, 1) >= .55 ? 'dense-structural' : 'sparse-structural'
}

export function resolveAdaptiveSpaceAdvance(input: { line: string; index: number; glyphs: string[]; sourceContext: ArtworkSourceContext }): number {
  const { line, index, glyphs, sourceContext } = input
  if (sourceContext !== 'kingshot-clipboard') return .72
  const context = classifyClipboardLineContext(line)
  const firstContent = glyphs.findIndex((item) => item !== ' ')
  if (index < firstContent) {
    const runLength = glyphs.slice(index).findIndex((item) => item !== ' ')
    return ADAPTIVE_CLIPBOARD_CALIBRATION.leadingRunBaseCells + ADAPTIVE_CLIPBOARD_CALIBRATION.leadingRunIncrementCells * Math.min(Math.max(runLength - 1, 0), ADAPTIVE_CLIPBOARD_CALIBRATION.leadingRunCap)
  }
  const runLength = glyphs.slice(index).findIndex((item) => item !== ' ')
  if (runLength < 0) return ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapBaseCells
  const mixed = context === 'mixed-emoji-ascii' || context === 'trailing-emoji'
  const base = mixed ? ADAPTIVE_CLIPBOARD_CALIBRATION.mixedEmojiGapBaseCells : context === 'caption' ? ADAPTIVE_CLIPBOARD_CALIBRATION.captionSpaceAdvanceCells : ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapBaseCells
  const increment = mixed ? ADAPTIVE_CLIPBOARD_CALIBRATION.mixedEmojiGapIncrementCells : ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapIncrementCells
  const cap = mixed ? ADAPTIVE_CLIPBOARD_CALIBRATION.mixedEmojiGapCap : ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapCap
  return base + increment * Math.min(Math.max(runLength - 1, 0), cap)
}
