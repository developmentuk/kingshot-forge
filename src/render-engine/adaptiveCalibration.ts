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
const STRUCTURAL_ASCII = /^[\\/|()[\]{}<>^]$/u
const ASCII_LETTER = /^[A-Za-z]$/u

type SemanticGapProposal = {
  row: number
  semanticGapStartIndex: number
  semanticGapEndIndex: number
  rightRegionStartIndex: number
  sourceGapGlyphs: string[]
}

function isStructuralGlyph(glyph: string): boolean {
  return STRUCTURAL_FAMILIES.has(classifyGlyph(glyph)) || STRUCTURAL_ASCII.test(glyph)
}

function isProseLikeRegion(glyphs: string[]): boolean {
  const nonSpace = glyphs.filter((glyph) => glyph !== ' ' && glyph !== '\u3000')
  const asciiLetters = nonSpace.filter((glyph) => ASCII_LETTER.test(glyph)).length
  const structural = nonSpace.filter(isStructuralGlyph).length
  const clusters = glyphs.join('').trim().split(/ +/u).filter(Boolean)
  const wordLikeClusters = clusters.filter((cluster) => {
    const tokens = segmentGraphemes(cluster).filter((glyph) => glyph !== '\u3000')
    const letters = tokens.filter((glyph) => ASCII_LETTER.test(glyph)).length
    return letters >= 2 && letters / Math.max(tokens.length, 1) >= .5
  })
  return asciiLetters >= 3
    && wordLikeClusters.length >= 1
    && structural / Math.max(nonSpace.length, 1) <= .2
}

function semanticGapProposal(line: string, row: number): SemanticGapProposal | undefined {
  const glyphs = segmentGraphemes(line)
  const candidates: SemanticGapProposal[] = []
  for (let start = 1; start < glyphs.length - 1; start += 1) {
    if (glyphs[start] !== ' ' || glyphs[start - 1] === ' ') continue
    let end = start
    while (end < glyphs.length && glyphs[end] === ' ') end += 1
    if (end - start < 2 || end >= glyphs.length) continue
    const left = glyphs.slice(0, start).filter((glyph) => glyph !== ' ' && glyph !== '\u3000')
    const right = glyphs.slice(end)
    const leftStructural = left.filter(isStructuralGlyph).length
    if (leftStructural < 2 || leftStructural / Math.max(left.length, 1) < .25 || !isProseLikeRegion(right)) continue
    candidates.push({ row, semanticGapStartIndex: start, semanticGapEndIndex: end, rightRegionStartIndex: end, sourceGapGlyphs: glyphs.slice(start, end) })
  }
  return candidates.at(-1)
}

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
  if (structural >= 6 && letters === 0 && (nonSpace.filter((glyph) => classifyGlyph(glyph) === 'line-art').length / Math.max(nonSpace.length, 1)) >= .5) return 'horizontal-structural-run'
  if (leading > 0) return structural / Math.max(nonSpace.length, 1) >= .55 ? 'dense-structural' : 'leading-structural'
  return structural / Math.max(nonSpace.length, 1) >= .55 ? 'dense-structural' : 'sparse-structural'
}

function hybridLeftBound(glyphs: string[], gapStart: number, sourceContext: ArtworkSourceContext): number {
  let width = 0
  const logicalArtworkRuns = sourceContext === 'kingshot-clipboard' && isArtworkLine(glyphs)
  for (let index = 0; index < gapStart; index += 1) {
    const glyph = glyphs[index]
    if (glyph === ' ' && logicalArtworkRuns) {
      const runLength = glyphs.slice(index).findIndex((item) => item !== ' ')
      width += resolveAdaptiveSpaceAdvance({ line: glyphs.join(''), index, glyphs, sourceContext })
      if (runLength > 1) index += runLength - 1
    } else if (glyph === ' ') width += ADAPTIVE_CLIPBOARD_CALIBRATION.proseSpaceAdvanceCells
    else width += glyph === '＿' ? 2 : 1
  }
  return width
}

function blockForRows(start: number, end: number, kind: ClipboardBlockKind, details: Partial<ClipboardDocumentBlock> = {}): ClipboardDocumentBlock {
  return { kind, startRow: start, endRow: end, ...details }
}

export function analyseClipboardDocument(lines: string[], sourceContext: ArtworkSourceContext = 'authored'): ClipboardDocumentLayout {
  const contexts = lines.map((line) => classifyClipboardLineContext(line))
  const rows: ClipboardDocumentRow[] = lines.map((_, row) => {
    const context = contexts[row]
    return { row, context, visualAdvanceCells: context === 'caption' ? ADAPTIVE_CLIPBOARD_CALIBRATION.captionLineAdvance : ADAPTIVE_CLIPBOARD_CALIBRATION.artworkLineAdvance }
  })
  if (sourceContext !== 'kingshot-clipboard') return { rows: rows.map((row) => ({ ...row, visualAdvanceCells: 1 })), blocks: [] }

  const proposals = lines.map((line, row) => semanticGapProposal(line, row))
  let proposalIndex = 0
  while (proposalIndex < proposals.length) {
    const proposal = proposals[proposalIndex]
    if (!proposal) {
      proposalIndex += 1
      continue
    }
    const group = [proposal]
    let end = proposalIndex
    while (end + 1 < proposals.length && proposals[end + 1]) {
      group.push(proposals[end + 1]!)
      end += 1
    }
    const rightStarts = group.map((item) => item.rightRegionStartIndex)
    const compatible = Math.max(...rightStarts) - Math.min(...rightStarts) <= 6
    if (group.length >= 2 && compatible) {
      const bounds = group.map((item) => hybridLeftBound(segmentGraphemes(lines[item.row]), item.semanticGapStartIndex, sourceContext))
      const regionStartColumn = Math.max(...bounds)
      const semanticColumnGap = ADAPTIVE_CLIPBOARD_CALIBRATION.hybridColumnGapBaseCells + Math.max(0, group.length - 1) * ADAPTIVE_CLIPBOARD_CALIBRATION.hybridColumnGapIncrementCells
      const columnAnchor = regionStartColumn + Math.max(semanticColumnGap, ADAPTIVE_CLIPBOARD_CALIBRATION.minimumColumnSeparationCells)
      group.forEach((item, offset) => {
        Object.assign(rows[item.row], item, {
          context: 'hybrid-text-art',
          leftRegionEndColumn: bounds[offset],
          semanticGapWidthCells: columnAnchor - bounds[offset],
          columnAnchor,
        })
      })
    } else {
      group.forEach((item) => { rows[item.row].hybridRejectionReason = group.length < 2 ? 'candidate lacks a neighbouring prose-bearing row' : 'neighbouring right-region starts are incompatible' })
    }
    proposalIndex = end + 1
  }

  rows.forEach((row) => {
    if (row.context === 'hybrid-text-art' || row.hybridRejectionReason) return
    if (row.context === 'caption') row.hybridRejectionReason = 'caption row is outside a verified multi-row semantic column'
    else if (segmentGraphemes(lines[row.row]).some((glyph) => /\p{Letter}/u.test(glyph))) row.hybridRejectionReason = 'no qualifying structural-left/prose-right semantic separator'
    else row.hybridRejectionReason = 'no prose-like right region'
  })

  const blocks: ClipboardDocumentBlock[] = []
  let index = 0
  while (index < rows.length) {
    const row = rows[index]
    if (row.context === 'hybrid-text-art') {
      const start = index
      while (index + 1 < rows.length && rows[index + 1].context === 'hybrid-text-art') index += 1
      const end = index
      const hybridRows = rows.slice(start, end + 1)
      const regionStartColumn = Math.max(...hybridRows.map((item) => item.leftRegionEndColumn ?? 0), 0)
      const semanticColumnGap = ADAPTIVE_CLIPBOARD_CALIBRATION.hybridColumnGapBaseCells + Math.max(0, hybridRows.length - 1) * ADAPTIVE_CLIPBOARD_CALIBRATION.hybridColumnGapIncrementCells
      const columnAnchor = hybridRows[0]?.columnAnchor ?? regionStartColumn + Math.max(semanticColumnGap, ADAPTIVE_CLIPBOARD_CALIBRATION.minimumColumnSeparationCells)
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
  const base = mixed ? ADAPTIVE_CLIPBOARD_CALIBRATION.mixedEmojiGapBaseCells : context === 'caption' ? ADAPTIVE_CLIPBOARD_CALIBRATION.captionSpaceAdvanceCells : ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapBaseCells
  const increment = mixed ? ADAPTIVE_CLIPBOARD_CALIBRATION.mixedEmojiGapIncrementCells : ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapIncrementCells
  const cap = mixed ? ADAPTIVE_CLIPBOARD_CALIBRATION.mixedEmojiGapCap : ADAPTIVE_CLIPBOARD_CALIBRATION.structuralGapCap
  return base + increment * Math.min(Math.max(runLength - 1, 0), cap)
}
