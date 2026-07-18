import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

export type ArtworkRenderMode = 'kingshot' | 'studio'
export type ArtworkRenderProfile = 'pixel' | 'ascii' | 'banner' | 'mixed'
export type ArtworkDevicePreset = 'phone' | 'tablet' | 'desktop'

export type ArtworkAnalysis = {
  profile: ArtworkRenderProfile
  confidence: number
  compatibilityScore: number
  estimatedWidthPercent: number
  characterCount: number
  lineCount: number
  widestLine: number
  features: string[]
  warnings: string[]
  rendererLabel: string
}

export type KingshotArtRendererProps = {
  artwork: string
  mode?: ArtworkRenderMode
  compact?: boolean
  className?: string
  maxLines?: number
  labelledBy?: string
  profile?: ArtworkRenderProfile | 'auto'
}

type GlyphProfile = { width: number }

const SPACE_WIDTH = 0.36
const TAB_WIDTH = SPACE_WIDTH * 4
const EXTRA_NARROW_GLYPHS = new Set(['|', '│', '┃', '║', '¦', '!', 'i', 'l', 'I', '·', '•', "'", '`', ':', ';'])
const BRACKET_GLYPHS = new Set(['(', ')', '[', ']', '{', '}'])
const DIAGONAL_GLYPHS = new Set(['/', '\\', '╱', '╲', '⟋', '⟍'])
const HORIZONTAL_GLYPHS = new Set(['-', '─', '━', '═', '_', '¯', '‾'])
const WIDE_GLYPHS = new Set(['M', 'W', 'm', 'w', '田', '國', '国', '█', '▓', '▒', '░'])
const JOINING_LEFT = new Set(['╲', '\\', ')', ']', '}', '〉', '》', '」', '』'])
const JOINING_RIGHT = new Set(['╱', '/', '(', '[', '{', '〈', '《', '「', '『'])
const ASCII_STRUCTURE = /[|/\\_\-=+()[\]{}<>]/g
const BOX_DRAWING = /[─━│┃┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬═║]/gu
const BLOCK_ART = /[█▓▒░■□▪▫●○🔴🔵⚪🟢🟡🟣🟠🟤]/gu
const EMOJI_LIKE = /\p{Extended_Pictographic}/gu
const DECORATIVE_UNICODE = /[★☆✦✧✩✪✫✬✭✮✯✰◆◇◈❖❈❉❊❋✿❀]/gu

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0
}

function segmentText(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(value), (item) => item.segment)
  }
  return Array.from(value)
}

export function analyseArtworkDetailed(artwork: string): ArtworkAnalysis {
  const normalized = artwork.replace(/\r\n?/g, '\n')
  const lines = normalized.split('\n')
  const nonWhitespace = normalized.replace(/\s/g, '')
  const length = Math.max(segmentText(nonWhitespace).length, 1)
  const asciiStructure = countMatches(normalized, ASCII_STRUCTURE)
  const boxDrawing = countMatches(normalized, BOX_DRAWING)
  const blockArt = countMatches(normalized, BLOCK_ART)
  const emoji = countMatches(normalized, EMOJI_LIKE)
  const decorative = countMatches(normalized, DECORATIVE_UNICODE)
  const structuredRatio = (asciiStructure + boxDrawing) / length
  const pixelRatio = (blockArt + emoji) / length
  const widestLine = Math.max(...lines.map((line) => segmentText(line).length), 0)

  let profile: ArtworkRenderProfile
  let confidence: number
  if (pixelRatio >= 0.22 || (blockArt + emoji >= 8 && asciiStructure < 8)) {
    profile = 'pixel'
    confidence = Math.min(99, Math.round(76 + pixelRatio * 80))
  } else if (structuredRatio >= 0.18 && lines.length >= 3 && blockArt + emoji <= 4) {
    profile = 'ascii'
    confidence = Math.min(98, Math.round(72 + structuredRatio * 85))
  } else if (decorative >= 4 || (boxDrawing >= 6 && lines.length <= 4)) {
    profile = 'banner'
    confidence = Math.min(96, 78 + decorative * 2)
  } else {
    profile = 'mixed'
    confidence = Math.min(92, 64 + Math.round((pixelRatio + structuredRatio) * 55))
  }

  const features: string[] = []
  if (emoji + blockArt > 0) features.push('emoji and pixel glyphs')
  if (asciiStructure > 0) features.push('ASCII structure')
  if (boxDrawing > 0) features.push('box drawing')
  if (decorative > 0) features.push('decorative Unicode')
  if (/[^\u0000-\u007f]/u.test(normalized)) features.push('Unicode characters')

  const warnings: string[] = []
  if (widestLine > 42) warnings.push('Wide lines may scroll on smaller phones.')
  if (profile === 'mixed') warnings.push('Mixed character systems can vary slightly by device.')
  if (profile === 'ascii' && /\t/u.test(normalized)) warnings.push('Tabs may render differently; spaces are safer.')
  if (lines.length > 16) warnings.push('Tall artwork may require scrolling in chat.')

  const widthPenalty = Math.max(0, widestLine - 36) * 1.2
  const mixedPenalty = profile === 'mixed' ? 8 : 0
  const warningPenalty = warnings.length * 3
  const compatibilityScore = Math.max(55, Math.min(99, Math.round(97 - widthPenalty - mixedPenalty - warningPenalty)))
  const estimatedWidthPercent = Math.min(100, Math.max(12, Math.round((widestLine / 44) * 100)))
  const rendererLabel = profile === 'pixel' ? 'Kingshot Pixel' : profile === 'ascii' ? 'Forge ASCII' : profile === 'banner' ? 'Forge Banner' : 'Forge Hybrid'

  return {
    profile,
    confidence,
    compatibilityScore,
    estimatedWidthPercent,
    characterCount: segmentText(normalized).length,
    lineCount: lines.length,
    widestLine,
    features,
    warnings,
    rendererLabel,
  }
}

export function analyseArtwork(artwork: string): ArtworkRenderProfile {
  return analyseArtworkDetailed(artwork).profile
}

function glyphProfile(glyph: string): GlyphProfile {
  if (glyph === ' ') return { width: SPACE_WIDTH }
  if (glyph === '\t') return { width: TAB_WIDTH }
  if (EXTRA_NARROW_GLYPHS.has(glyph)) return { width: 0.39 }
  if (BRACKET_GLYPHS.has(glyph)) return { width: 0.43 }
  if (DIAGONAL_GLYPHS.has(glyph)) return { width: 0.48 }
  if (HORIZONTAL_GLYPHS.has(glyph)) return { width: 0.64 }
  if (WIDE_GLYPHS.has(glyph)) return { width: 0.94 }
  if (/^[A-Z0-9]$/u.test(glyph)) return { width: 0.66 }
  if (/^[a-z]$/u.test(glyph)) return { width: 0.55 }
  return { width: 0.68 }
}

function renderedLines(artwork: string, maxLines?: number): string[] {
  const lines = artwork.replace(/\r\n?/g, '\n').split('\n')
  if (!maxLines || lines.length <= maxLines) return lines
  return [...lines.slice(0, maxLines), '…']
}

function RenderedArtwork({ lines, classes, labelledBy, resolvedProfile }: { lines: string[]; classes: string; labelledBy?: string; resolvedProfile: ArtworkRenderProfile }) {
  if (resolvedProfile === 'ascii') {
    return <pre className={classes} aria-labelledby={labelledBy} data-render-profile={resolvedProfile}>{lines.join('\n')}</pre>
  }

  return <div className={classes} role="img" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : `${resolvedProfile} artwork preview`} data-render-profile={resolvedProfile}>
    {lines.map((line, lineIndex) => {
      const glyphs = segmentText(line)
      return <div className="kingshot-art-renderer__line" key={`${lineIndex}-${line}`} aria-hidden="true">
        {glyphs.length === 0 ? <span className="kingshot-art-renderer__empty">&nbsp;</span> : glyphs.map((glyph, glyphIndex) => {
          const previous = glyphs[glyphIndex - 1]
          const next = glyphs[glyphIndex + 1]
          const glyphMetrics = glyphProfile(glyph)
          let overlap = 0
          if (DIAGONAL_GLYPHS.has(glyph) && (DIAGONAL_GLYPHS.has(previous) || DIAGONAL_GLYPHS.has(next))) overlap = -0.085
          if (JOINING_LEFT.has(glyph) || JOINING_RIGHT.has(glyph)) overlap = Math.min(overlap, -0.045)
          if (HORIZONTAL_GLYPHS.has(glyph) && HORIZONTAL_GLYPHS.has(previous)) overlap = Math.min(overlap, -0.025)
          const style = {
            '--ks-glyph-width': `${glyphMetrics.width}em`,
            '--ks-glyph-overlap': `${overlap}em`,
          } as CSSProperties
          return <span className="kingshot-art-renderer__glyph" style={style} key={`${glyphIndex}-${glyph}`}>{glyph === ' ' ? '\u00a0' : glyph}</span>
        })}
      </div>
    })}
  </div>
}

export function KingshotArtRenderer({ artwork, mode = 'kingshot', compact = false, className = '', maxLines, labelledBy, profile = 'auto' }: KingshotArtRendererProps) {
  const [device, setDevice] = useState<ArtworkDevicePreset>('phone')
  const lines = useMemo(() => renderedLines(artwork, maxLines), [artwork, maxLines])
  const analysis = useMemo(() => analyseArtworkDetailed(artwork), [artwork])
  const resolvedProfile = profile === 'auto' ? analysis.profile : profile
  const classes = ['kingshot-art-renderer', `kingshot-art-renderer--${mode}`, `kingshot-art-renderer--${resolvedProfile}`, compact ? 'kingshot-art-renderer--compact' : '', className].filter(Boolean).join(' ')

  if (mode === 'studio') {
    return <pre className={classes} aria-labelledby={labelledBy}>{lines.join('\n')}</pre>
  }

  const artworkNode = <RenderedArtwork lines={lines} classes={classes} labelledBy={labelledBy} resolvedProfile={resolvedProfile} />
  if (!labelledBy || compact) return artworkNode

  return <section className={`forge-render-engine forge-render-engine--${device}`} aria-label="Forge artwork analysis">
    <div className="forge-render-engine__device-controls" role="group" aria-label="Preview device">
      {(['phone', 'tablet', 'desktop'] as ArtworkDevicePreset[]).map((preset) => <button key={preset} type="button" className={device === preset ? 'forge-render-engine__device forge-render-engine__device--active' : 'forge-render-engine__device'} aria-pressed={device === preset} onClick={() => setDevice(preset)}>{preset === 'phone' ? 'Phone' : preset === 'tablet' ? 'Tablet' : 'Desktop'}</button>)}
    </div>
    <div className="forge-render-engine__viewport"><div className="forge-render-engine__art">{artworkNode}</div></div>
    <div className="forge-render-engine__analysis">
      <div><span>Artwork type</span><strong>{analysis.profile.toUpperCase()}</strong></div>
      <div><span>Confidence</span><strong>{analysis.confidence}%</strong></div>
      <div><span>Renderer</span><strong>{analysis.rendererLabel}</strong></div>
      <div><span>Estimated chat width</span><strong>{analysis.estimatedWidthPercent}%</strong></div>
      <div><span>Compatibility</span><strong>{analysis.compatibilityScore}/100</strong></div>
      <div><span>Dimensions</span><strong>{analysis.widestLine} × {analysis.lineCount}</strong></div>
    </div>
    {(analysis.features.length > 0 || analysis.warnings.length > 0) && <div className="forge-render-engine__notes">
      {analysis.features.length > 0 && <p><strong>Detected:</strong> {analysis.features.join(', ')}.</p>}
      {analysis.warnings.map((warning) => <p className="forge-render-engine__warning" key={warning}>⚠ {warning}</p>)}
    </div>}
  </section>
}

export default KingshotArtRenderer
