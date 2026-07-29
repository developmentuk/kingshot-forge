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
  maximumSemanticGapDistortion: number
  sourceAdvances: {
    u0020Leading: number
    u0020Structural: number
    u0020Prose: number
    u0020Caption: number
    u3000: number
    asciiStructural: number
    asciiLetter: number
    asciiLetterCaption: number
    narrowPunctuation: number
    widePunctuation: number
    fullWidth: number
    lineArt: number
    unicodeStructural: number
    emoji: number
    hybrid: {
      asciiStructural: number
      u0020Structural: number
      asciiLetter: number
      narrowPunctuation: number
      widePunctuation: number
      fullWidth: number
      lineArt: number
      unicodeStructural: number
      emoji: number
    }
  }
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
  repeatedBlankLineAdvance: 1,
  preCaptionSeparatorAdvance: 1,
  captionLineAdvance: 1,
  hybridColumnGapBaseCells: 3.4,
  hybridColumnGapIncrementCells: .16,
  minimumColumnSeparationCells: 2.5,
  maximumSemanticGapDistortion: 2.5,
  sourceAdvances: {
    u0020Leading: .38,
    u0020Structural: .42,
    u0020Prose: .58,
    u0020Caption: .66,
    u3000: .9,
    asciiStructural: .65,
    asciiLetter: .8,
    asciiLetterCaption: .72,
    narrowPunctuation: .52,
    widePunctuation: .5,
    fullWidth: 1.35,
    lineArt: .85,
    unicodeStructural: .45,
    emoji: 3,
    hybrid: {
      asciiStructural: .78,
      u0020Structural: .36,
      asciiLetter: .86,
      narrowPunctuation: .52,
      widePunctuation: .78,
      fullWidth: 1.28,
      lineArt: .82,
      unicodeStructural: .6,
      emoji: 1.75,
    },
  },
}

const STRUCTURAL_FAMILIES = new Set(['ideographic-space', 'full-width', 'box-drawing', 'line-art'])
const STRUCTURAL_ASCII = /^[\\/|()[\]{}<>^]$/u
const ASCII_LETTER = /^[A-Za-z]$/u
const NARROW_PUNCTUATION = /^[.,'`!:;*]$/u
const WIDE_PUNCTUATION = /^[-=+~]$/u

export type ClipboardSourceRole = NonNullable<import('./types').GridCell['sourceRole']>

export function classifyClipboardSourceRole(line: string, glyphs: string[], index: number, row?: Pick<ClipboardDocumentRow, 'context' | 'rightRegionStartIndex'>): ClipboardSourceRole {
  const glyph = glyphs[index]
  const context = row?.context ?? classifyClipboardLineContext(line)
  if (glyph === '\u3000') return 'u3000'
  if (glyph === ' ') {
    const firstContent = glyphs.findIndex((item) => item !== ' ')
    if (index < firstContent) return 'u0020-leading'
    if (context === 'hybrid-text-art') return row?.rightRegionStartIndex !== undefined && index >= row.rightRegionStartIndex ? 'u0020-prose' : 'u0020-structural'
    if (context === 'caption' || context === 'prose') return context === 'caption' ? 'u0020-caption' : 'u0020-prose'
    return 'u0020-structural'
  }
  if (/\p{Extended_Pictographic}/u.test(glyph)) return 'emoji'
  const family = classifyGlyph(glyph)
  if (family === 'line-art') return 'line-art'
  if (family === 'full-width' || family === 'box-drawing') return 'full-width'
  if (STRUCTURAL_ASCII.test(glyph)) return 'ascii-structural'
  if (ASCII_LETTER.test(glyph)) return context === 'hybrid-text-art' && row?.rightRegionStartIndex !== undefined && index < row.rightRegionStartIndex ? 'ascii-structural' : 'ascii-letter'
  if (NARROW_PUNCTUATION.test(glyph)) return 'narrow-punctuation'
  if (WIDE_PUNCTUATION.test(glyph)) return 'wide-punctuation'
  return 'unicode-structural'
}

export function resolveClipboardSourceAdvance(line: string, glyphs: string[], index: number, row?: Pick<ClipboardDocumentRow, 'context' | 'rightRegionStartIndex' | 'sourceProfile'>): number {
  const role = classifyClipboardSourceRole(line, glyphs, index, row)
  if (row?.sourceProfile === 'emoji-structural-control') {
    const glyph = glyphs[index]
    const family = classifyGlyph(glyph)
    if (glyph === ' ') {
      if (!isArtworkLine(glyphs)) return ADAPTIVE_CLIPBOARD_CALIBRATION.proseSpaceAdvanceCells
      let runStart = index
      while (runStart > 0 && glyphs[runStart - 1] === ' ') runStart -= 1
      let runEnd = index + 1
      while (runEnd < glyphs.length && glyphs[runEnd] === ' ') runEnd += 1
      const runLength = runEnd - runStart
      return resolveAdaptiveSpaceAdvance({ line, index: runStart, glyphs, sourceContext: 'kingshot-clipboard' }) / runLength
    }
    if (family === 'line-art') return glyph === '＿' ? 2 : 1
    if (family === 'ideographic-space' || family === 'full-width' || family === 'emoji' || family === 'pixel-circles' || family === 'hearts') return 2
    return 1
  }
  const values = ADAPTIVE_CLIPBOARD_CALIBRATION.sourceAdvances
  const context = row?.context ?? classifyClipboardLineContext(line)
  const hybrid = values.hybrid
  const advances: Record<ClipboardSourceRole, number> = {
    'u0020-leading': values.u0020Leading,
    'u0020-structural': context === 'hybrid-text-art' ? hybrid.u0020Structural : values.u0020Structural,
    'u0020-prose': values.u0020Prose,
    'u0020-caption': values.u0020Caption,
    u3000: values.u3000,
    'ascii-structural': context === 'hybrid-text-art' ? hybrid.asciiStructural : values.asciiStructural,
    'ascii-letter': context === 'hybrid-text-art' ? hybrid.asciiLetter : context === 'caption' ? values.asciiLetterCaption : values.asciiLetter,
    'narrow-punctuation': context === 'hybrid-text-art' ? hybrid.narrowPunctuation : values.narrowPunctuation,
    'wide-punctuation': context === 'hybrid-text-art' ? hybrid.widePunctuation : values.widePunctuation,
    'full-width': context === 'hybrid-text-art' ? hybrid.fullWidth : values.fullWidth,
    'line-art': context === 'hybrid-text-art' ? hybrid.lineArt : row?.sourceProfile === 'caption-structural' ? 1.15 : values.lineArt,
    'unicode-structural': context === 'hybrid-text-art' ? hybrid.unicodeStructural : values.unicodeStructural,
    emoji: context === 'hybrid-text-art' ? hybrid.emoji : values.emoji,
  }
  return advances[role]
}

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
  if (!isArtworkLine(glyphs) && !(leading >= 2 && structural >= 2)) return letters > 3 && emoji === 0 ? 'caption' : 'prose'
  if (trailingEmoji && letters === 0) return 'trailing-emoji'
  if (emoji > 0 && structural > 0) return 'mixed-emoji-ascii'
  if (structural >= 6 && letters === 0 && (nonSpace.filter((glyph) => classifyGlyph(glyph) === 'line-art').length / Math.max(nonSpace.length, 1)) >= .5) return 'horizontal-structural-run'
  if (leading > 0) return structural / Math.max(nonSpace.length, 1) >= .55 ? 'dense-structural' : 'leading-structural'
  return structural / Math.max(nonSpace.length, 1) >= .55 ? 'dense-structural' : 'sparse-structural'
}

function hybridLeftBound(glyphs: string[], gapStart: number, rightRegionStartIndex: number, sourceContext: ArtworkSourceContext): number {
  if (sourceContext !== 'kingshot-clipboard') return glyphs.slice(0, gapStart).reduce((width, glyph) => width + (glyph === ' ' ? ADAPTIVE_CLIPBOARD_CALIBRATION.proseSpaceAdvanceCells : glyph === '＿' ? 2 : 1), 0)
  const line = glyphs.join('')
  const row = { context: 'hybrid-text-art', rightRegionStartIndex }
  return glyphs.slice(0, gapStart).reduce((width, _, index) => width + resolveClipboardSourceAdvance(line, glyphs, index, row), 0)
}

function blockForRows(start: number, end: number, kind: ClipboardBlockKind, details: Partial<ClipboardDocumentBlock> = {}): ClipboardDocumentBlock {
  return { kind, startRow: start, endRow: end, ...details }
}

export function analyseClipboardDocument(lines: string[], sourceContext: ArtworkSourceContext = 'authored'): ClipboardDocumentLayout {
  const contexts = lines.map((line) => classifyClipboardLineContext(line))
  const emojiStructuralControl = lines.flatMap(segmentGraphemes).filter((glyph) => /\p{Extended_Pictographic}/u.test(glyph)).length >= 2
  const rows: ClipboardDocumentRow[] = lines.map((_, row) => {
    const context = contexts[row]
    return { row, context, visualAdvanceCells: context === 'caption' ? ADAPTIVE_CLIPBOARD_CALIBRATION.captionLineAdvance : ADAPTIVE_CLIPBOARD_CALIBRATION.artworkLineAdvance, sourceProfile: emojiStructuralControl ? 'emoji-structural-control' : 'source-coordinate' }
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
      const bounds = group.map((item) => hybridLeftBound(segmentGraphemes(lines[item.row]), item.semanticGapStartIndex, item.rightRegionStartIndex, sourceContext))
      const gapWidths = group.map((item) => {
        const glyphs = segmentGraphemes(lines[item.row])
        const row = { context: 'hybrid-text-art', rightRegionStartIndex: item.rightRegionStartIndex }
        return glyphs.slice(item.semanticGapStartIndex, item.semanticGapEndIndex).reduce((width, _, offset) => width + resolveClipboardSourceAdvance(lines[item.row], glyphs, item.semanticGapStartIndex + offset, row), 0)
      })
      const medianGap = [...gapWidths].sort((a, b) => a - b)[Math.floor(gapWidths.length / 2)] || 1
      group.forEach((item, offset) => {
        Object.assign(rows[item.row], item, {
          context: 'hybrid-text-art',
          leftRegionEndColumn: bounds[offset],
          semanticGapWidthCells: gapWidths[offset],
          semanticGapDistortion: gapWidths[offset] / medianGap,
          columnAnchor: bounds[offset] + gapWidths[offset],
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
      const regionStartColumn = Math.min(...hybridRows.map((item) => item.leftRegionEndColumn ?? 0))
      const regionEndColumn = Math.max(...hybridRows.map((item) => item.columnAnchor ?? 0))
      const semanticColumnGap = Math.max(...hybridRows.map((item) => item.semanticGapWidthCells ?? 0))
      blocks.push(blockForRows(start, end, 'hybrid-columns', { regionStartColumn, regionEndColumn, semanticColumnGap }))
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
  const hasCaptionSeparator = blocks.some((block) => block.kind === 'blank-separator') && blocks.some((block) => block.kind === 'trailing-caption')
  const horizontalOffsetCells = blocks.some((block) => block.kind === 'hybrid-columns')
    ? .6
    : hasCaptionSeparator
      ? -.75
      : 0
  rows.forEach((row) => {
    row.horizontalOffsetCells = horizontalOffsetCells
    if (hasCaptionSeparator && row.sourceProfile === 'source-coordinate') row.sourceProfile = 'caption-structural'
  })
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
