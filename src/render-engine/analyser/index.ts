import { normaliseArtwork, segmentGraphemes } from '../parser'
import type { ArtworkAnalysis, ArtworkClass, GlyphFamily } from '../types'

const BOX_DRAWING = /^[─━│┃┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬═║]$/u
const PIXEL_CIRCLE = /^[🔴🔵⚪🟢🟡🟣🟠🟤●○]$/u
const HEART = /^[♥❤💕💖💗💓💞💘💝💟♡]$/u
const DECORATIVE = /^[★☆✦✧✩✪✫✬✭✮✯✰◆◇◈❖❈❉❊❋✿❀]$/u
const EMOJI = /^\p{Extended_Pictographic}$/u

export function classifyGlyph(glyph: string): GlyphFamily {
  if (/^\s$/u.test(glyph)) return 'space'
  if (EMOJI.test(glyph)) {
    if (HEART.test(glyph)) return 'hearts'
    if (PIXEL_CIRCLE.test(glyph)) return 'pixel-circles'
    return 'emoji'
  }
  if (BOX_DRAWING.test(glyph)) return 'box-drawing'
  if (DECORATIVE.test(glyph)) return 'decorative-symbols'
  if (glyph.length === 1 && glyph.charCodeAt(0) <= 0x7f) return 'ascii'
  return 'unicode'
}

export function classifyArtwork(artwork: string): ArtworkClass {
  const normalized = normaliseArtwork(artwork)
  const glyphs = segmentGraphemes(normalized).filter((glyph) => glyph.trim())
  const familyCounts = countGlyphFamilies(glyphs)
  const structure = familyCounts.ascii + familyCounts['box-drawing']
  const pixels = familyCounts.emoji + familyCounts['pixel-circles'] + familyCounts.hearts
  if (pixels / Math.max(glyphs.length, 1) >= 0.22 || pixels >= 8 && structure < 8) return 'pixel'
  if (structure / Math.max(glyphs.length, 1) >= 0.18 && normalized.split('\n').length >= 3 && pixels <= 4) return 'ascii'
  if (familyCounts['decorative-symbols'] >= 4 || familyCounts['box-drawing'] >= 6 && normalized.split('\n').length <= 4) return 'banner'
  return 'mixed'
}

export function countGlyphFamilies(glyphs: string[]): Record<GlyphFamily, number> {
  const counts = {
    space: 0, ascii: 0, 'box-drawing': 0, unicode: 0, emoji: 0,
    'pixel-circles': 0, hearts: 0, 'decorative-symbols': 0,
  } satisfies Record<GlyphFamily, number>
  glyphs.forEach((glyph) => { counts[classifyGlyph(glyph)] += 1 })
  return counts
}

export function analyseArtworkDetailed(artwork: string): ArtworkAnalysis {
  const normalized = normaliseArtwork(artwork)
  const lines = normalized.split('\n')
  const glyphs = segmentGraphemes(normalized)
  const familyCounts = countGlyphFamilies(glyphs)
  const artworkClass = classifyArtwork(artwork)
  const widestLine = Math.max(...lines.map((line) => segmentGraphemes(line).length), 0)
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

export { BOX_DRAWING, DECORATIVE, EMOJI, HEART, PIXEL_CIRCLE }
