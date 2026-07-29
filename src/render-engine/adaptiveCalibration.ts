import { classifyGlyph, isArtworkLine, type ArtworkSourceContext } from './analyser'
import { segmentGraphemes } from './parser'
import type { ClipboardBlockKind, ClipboardDocumentBlock, ClipboardDocumentLayout, ClipboardDocumentRow } from './types'

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
  artworkLineAdvance: number
  emptyLineAdvance: number
  repeatedBlankLineAdvance: number
  preCaptionSeparatorAdvance: number
  captionLineAdvance: number
  hybridColumnGapBaseCells: number
  hybridColumnGapIncrementCells: number
  minimumColumnSeparationCells: number
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
  artworkLineAdvance: 1,
  emptyLineAdvance: .45,
  repeatedBlankLineAdvance: .25,
  preCaptionSeparatorAdvance: .40,
  captionLineAdvance: 1,
  hybridColumnGapBaseCells: 3.4,
  hybridColumnGapIncrementCells: .16,
  minimumColumnSeparationCells: 2.5,
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
  const firstLetter = glyphs.findIndex((glyph) => /\p{Letter}/u.test(glyph))
  const structuralBeforeText = firstLetter > 0 ? glyphs.slice(0, firstLetter).filter((glyph) => STRUCTURAL_FAMILIES.has(classifyGlyph(glyph)) || /^[\\/|()[\]{}<>^]$/u.test(glyph)).length : 0
  const lettersAfterText = firstLetter >= 0 ? glyphs.slice(firstLetter + 1).filter((glyph) => /\p{Letter}/u.test(glyph)).length : 0
  if (firstLetter >= 12 && structuralBeforeText >= 2 && lettersAfterText > 0) return 'hybrid-text-art'
  if (!isArtworkLine(glyphs)) return letters > 3 && emoji === 0 ? 'caption' : 'prose'
  if (trailingEmoji && letters === 0) return 'trailing-emoji'
  if (emoji > 0 && structural > 0) return 'mixed-emoji-ascii'
  if (letters > 0 && structural > 0) return 'hybrid-text-art'
  if (structural >= 6 && letters === 0 && (nonSpace.filter((glyph) => classifyGlyph(glyph) === 'line-art').length / Math.max(nonSpace.length, 1)) >= .5) return 'horizontal-structural-run'
  if (leading > 0) return structural / Math.max(nonSpace.length, 1) >= .55 ? 'dense-structural' : 'leading-structural'
  return structural / Math.max(nonSpace.length, 1) >= .55 ? 'dense-structural' : 'sparse-structural'
}

function firstHybridTextIndex(glyphs: string[], context: ClipboardLineContext): number | undefined {
  if (context !== 'hybrid-text-art') return undefined
  const firstLetter = glyphs.findIndex((glyph) => /\p{Letter}/u.test(glyph))
  if (firstLetter <= 0) return undefined
  const before = glyphs.slice(0, firstLetter)
  const after = glyphs.slice(firstLetter)
  const laterLetters = after.findIndex((glyph, index) => index > 0 && /\p{Letter}/u.test(glyph))
  return before.some((glyph) => STRUCTURAL_FAMILIES.has(classifyGlyph(glyph)) || /^[\\/|()[\]{}<>^]$/u.test(glyph)) && (laterLetters >= 0 || before.some((glyph) => glyph === ' ')) ? firstLetter : undefined
}

function hybridLeftBound(glyphs: string[], textIndex: number, sourceContext: ArtworkSourceContext): number {
  let gapStart = textIndex
  while (gapStart > 0 && glyphs[gapStart - 1] === ' ') gapStart -= 1
  let width = 0
  for (let index = 0; index < gapStart; index += 1) {
    const glyph = glyphs[index]
    if (glyph === ' ') {
      const runLength = glyphs.slice(index).findIndex((item) => item !== ' ')
      width += resolveAdaptiveSpaceAdvance({ line: glyphs.join(''), index, glyphs, sourceContext })
      if (runLength > 1) index += runLength - 1
    } else width += 1
  }
  return width
}

function blockForRows(start: number, end: number, kind: ClipboardBlockKind, details: Partial<ClipboardDocumentBlock> = {}): ClipboardDocumentBlock {
  return { kind, startRow: start, endRow: end, ...details }
}

export function analyseClipboardDocument(lines: string[], sourceContext: ArtworkSourceContext = 'authored'): ClipboardDocumentLayout {
  const contexts = lines.map((line) => classifyClipboardLineContext(line))
  const rows: ClipboardDocumentRow[] = lines.map((line, row) => {
    const glyphs = segmentGraphemes(line)
    const context = contexts[row]
    const textIndex = firstHybridTextIndex(glyphs, context)
    return { row, context, visualAdvanceCells: context === 'caption' ? ADAPTIVE_CLIPBOARD_CALIBRATION.captionLineAdvance : ADAPTIVE_CLIPBOARD_CALIBRATION.artworkLineAdvance, hybridTextStartIndex: textIndex }
  })
  if (sourceContext !== 'kingshot-clipboard') return { rows: rows.map((row) => ({ ...row, visualAdvanceCells: 1 })), blocks: [] }

  const blocks: ClipboardDocumentBlock[] = []
  let index = 0
  while (index < rows.length) {
    const row = rows[index]
    if (row.context === 'hybrid-text-art') {
      const start = index
      while (index + 1 < rows.length && rows[index + 1].context === 'hybrid-text-art') index += 1
      const end = index
      const hybridRows = rows.slice(start, end + 1)
      const bounds = hybridRows.map((item) => {
        const glyphs = segmentGraphemes(lines[item.row])
        return hybridLeftBound(glyphs, item.hybridTextStartIndex ?? glyphs.length, sourceContext)
      })
      const regionStartColumn = Math.max(...bounds, 0)
      const semanticColumnGap = ADAPTIVE_CLIPBOARD_CALIBRATION.hybridColumnGapBaseCells + Math.max(0, hybridRows.length - 1) * ADAPTIVE_CLIPBOARD_CALIBRATION.hybridColumnGapIncrementCells
      const columnAnchor = regionStartColumn + Math.max(semanticColumnGap, ADAPTIVE_CLIPBOARD_CALIBRATION.minimumColumnSeparationCells)
      hybridRows.forEach((item) => { item.columnAnchor = columnAnchor })
      blocks.push(blockForRows(start, end, 'hybrid-columns', { regionStartColumn, regionEndColumn: columnAnchor, columnAnchor, semanticColumnGap }))
    } else if (row.context === 'caption') {
      const start = index
      while (index + 1 < rows.length && rows[index + 1].context === 'caption') index += 1
      blocks.push(blockForRows(start, index, 'trailing-caption'))
    } else if (!lines[index]) {
      const start = index
      while (index + 1 < rows.length && !lines[index + 1]) index += 1
      const next = rows[index + 1]
      const previous = rows[start - 1]
      const isSeparator = Boolean(next?.context === 'caption' && previous && previous.context !== 'prose')
      for (let blank = start; blank <= index; blank += 1) rows[blank].visualAdvanceCells = isSeparator
        ? blank === start ? ADAPTIVE_CLIPBOARD_CALIBRATION.preCaptionSeparatorAdvance : ADAPTIVE_CLIPBOARD_CALIBRATION.repeatedBlankLineAdvance
        : ADAPTIVE_CLIPBOARD_CALIBRATION.emptyLineAdvance
      blocks.push(blockForRows(start, index, isSeparator ? 'blank-separator' : 'mixed'))
    } else {
      const start = index
      while (index + 1 < rows.length && rows[index + 1].context === row.context && rows[index + 1].context !== 'hybrid-text-art' && rows[index + 1].context !== 'caption') index += 1
      blocks.push(blockForRows(start, index, row.context === 'prose' ? 'prose' : 'structural-body'))
    }
    index += 1
  }
  return { rows, blocks }
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
  const hybrid = context === 'hybrid-text-art'
  const base = mixed ? ADAPTIVE_CLIPBOARD_CALIBRATION.mixedEmojiGapBaseCells : hybrid ? ADAPTIVE_CLIPBOARD_CALIBRATION.hybridColumnGapBaseCells : context === 'caption' ? ADAPTIVE_CLIPBOARD_CALIBRATION.captionSpaceAdvanceCells : ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapBaseCells
  const increment = mixed ? ADAPTIVE_CLIPBOARD_CALIBRATION.mixedEmojiGapIncrementCells : hybrid ? ADAPTIVE_CLIPBOARD_CALIBRATION.hybridColumnGapIncrementCells : ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapIncrementCells
  const cap = mixed ? ADAPTIVE_CLIPBOARD_CALIBRATION.mixedEmojiGapCap : hybrid ? 3 : ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapCap
  return base + increment * Math.min(Math.max(runLength - 1, 0), cap)
}
