import { DEFAULT_CALIBRATION } from '../configuration'
import { normaliseArtwork, segmentGraphemes } from '../parser'
import type { ArtworkAnalysis, ArtworkClass, CalibrationConfiguration, GlyphFamily } from '../types'

const BOX_DRAWING = /^[─━│┃┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬═║]$/u
const PIXEL_CIRCLE = /^[🔴🔵⚪🟢🟡🟣🟠🟤●○]$/u
const HEART = /^[♥❤💕💖💗💓💞💘💝💟♡]$/u
const DECORATIVE = /^[★☆✦✧✩✪✫✬✭✮✯✰◆◇◈❖❈❉❊❋✿❀]$/u
const EMOJI = /^\p{Extended_Pictographic}$/u
const FULL_WIDTH = /^[\u1100-\u115F\u2329\u232A\u2E80-\u303E\u3040-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]$/u
const LINE_ART = /^[_＿]$/u
const STRUCTURAL_ASCII = /^[\\/|()[\]{}<>^]$/u

export const PROSE_SPACE_ADVANCE = .72
export const ARTWORK_SPACE_ADVANCE = .55
export const ARTWORK_LEADING_SPACE_ADVANCE = .20

export function isArtworkLine(glyphs: string[]): boolean {
  const structural = glyphs.filter((glyph) => {
    const family = classifyGlyph(glyph)
    return family === 'ideographic-space' || family === 'full-width' || family === 'box-drawing' || family === 'line-art' || STRUCTURAL_ASCII.test(glyph)
  }).length
  const letters = glyphs.filter((glyph) => /\p{Letter}/u.test(glyph)).length
  return structural >= 2 && structural >= letters
}

export function resolveGlyphAdvance(glyph: string, glyphs: string[], index: number, calibration: CalibrationConfiguration): number {
  const family = classifyGlyph(glyph)
  if (family === 'line-art') return glyph === '＿' ? 2 : 1
  if (family !== 'space') return calibration[family].advanceCells
  if (!isArtworkLine(glyphs)) return PROSE_SPACE_ADVANCE
  const firstContent = glyphs.findIndex((item) => !/^\s$/u.test(item) && item !== '\u3000')
  return index < firstContent ? ARTWORK_LEADING_SPACE_ADVANCE : ARTWORK_SPACE_ADVANCE
}

export function classifyGlyph(glyph: string): GlyphFamily {
  if (glyph === '\u3000') return 'ideographic-space'
  if (/^\s$/u.test(glyph)) return 'space'
  if (LINE_ART.test(glyph)) return 'line-art'
  if (EMOJI.test(glyph)) {
    if (HEART.test(glyph)) return 'hearts'
    if (PIXEL_CIRCLE.test(glyph)) return 'pixel-circles'
    return 'emoji'
  }
  if (BOX_DRAWING.test(glyph)) return 'box-drawing'
  if (DECORATIVE.test(glyph)) return 'decorative-symbols'
  if (glyph.length === 1 && glyph.charCodeAt(0) <= 0x7f) return 'ascii'
  if (FULL_WIDTH.test(glyph)) return 'full-width'
  return 'unicode'
}

export function classifyArtwork(artwork: string): ArtworkClass {
  const normalized = normaliseArtwork(artwork)
  const glyphs = segmentGraphemes(normalized).filter((glyph) => glyph.trim())
  const familyCounts = countGlyphFamilies(glyphs)
  const structure = familyCounts.ascii + familyCounts['box-drawing'] + familyCounts['full-width']
  const pixels = familyCounts.emoji + familyCounts['pixel-circles'] + familyCounts.hearts
  if (pixels / Math.max(glyphs.length, 1) >= 0.22 || pixels >= 8 && structure < 8) return 'pixel'
  if (structure / Math.max(glyphs.length, 1) >= 0.18 && normalized.split('\n').length >= 3 && pixels <= 4) return 'ascii'
  if (familyCounts['decorative-symbols'] >= 4 || familyCounts['box-drawing'] >= 6 && normalized.split('\n').length <= 4) return 'banner'
  return 'mixed'
}

export function countGlyphFamilies(glyphs: string[]): Record<GlyphFamily, number> {
  const counts = {
    space: 0,
    'ideographic-space': 0,
    ascii: 0,
    'box-drawing': 0,
    'full-width': 0,
    unicode: 0,
    emoji: 0,
    'pixel-circles': 0,
    hearts: 0,
    'line-art': 0,
    'decorative-symbols': 0,
  } satisfies Record<GlyphFamily, number>
  glyphs.forEach((glyph) => { counts[classifyGlyph(glyph)] += 1 })
  return counts
}

export function analyseArtworkDetailed(artwork: string, calibration: CalibrationConfiguration = DEFAULT_CALIBRATION): ArtworkAnalysis {
  const normalized = normaliseArtwork(artwork)
  const lines = normalized.split('\n')
  const glyphs = segmentGraphemes(normalized)
  const familyCounts = countGlyphFamilies(glyphs)
  const artworkClass = classifyArtwork(artwork)
  const widestLine = Math.max(...lines.map((line) => {
    const lineGlyphs = segmentGraphemes(line)
    return lineGlyphs.reduce((width, glyph, index) => width + resolveGlyphAdvance(glyph, lineGlyphs, index, calibration), 0)
  }), 0)
  const warnings: string[] = []
  if (widestLine > 50) warnings.push('Wide lines may scroll on smaller phones.')
  if (artworkClass === 'mixed') warnings.push('Mixed glyphs share a fixed cell grid; baseline and colour can vary by device.')
  if (/\t/u.test(artwork)) warnings.push('Tabs were normalised to four spaces for a stable preview.')
  if (lines.length > 16) warnings.push('Tall artwork may require scrolling in chat.')
  const features = Object.entries(familyCounts).filter(([, count]) => count > 0).map(([family]) => family)
  const widthPenalty = Math.max(0, widestLine - 44)
  const compatibilityScore = Math.max(55, Math.min(99, Math.round(97 - widthPenalty - (artworkClass === 'mixed' ? 5 : 0) - warnings.length * 2)))
  return {
    artworkClass,
    confidence: Math.max(60, Math.min(99, 76 + Math.round((familyCounts.emoji + familyCounts['box-drawing']) / Math.max(glyphs.length, 1) * 40))),
    compatibilityScore,
    estimatedWidthPercent: Math.min(100, Math.max(12, Math.round(widestLine / 50 * 100))),
    graphemeCount: glyphs.length,
    lineCount: lines.length,
    widestLine,
    familyCounts,
    features,
    warnings,
    rendererLabel: 'Forge Fixed Cell Grid',
  }
}

export { BOX_DRAWING, DECORATIVE, EMOJI, FULL_WIDTH, HEART, LINE_ART, PIXEL_CIRCLE }
