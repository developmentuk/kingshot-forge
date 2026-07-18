import { useMemo } from 'react'
import type { CSSProperties } from 'react'

export type ArtworkRenderMode = 'kingshot' | 'studio'
export type ArtworkRenderProfile = 'pixel' | 'ascii' | 'banner' | 'mixed'

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

export function analyseArtwork(artwork: string): ArtworkRenderProfile {
  const normalized = artwork.replace(/\r\n?/g, '\n')
  const nonWhitespace = normalized.replace(/\s/g, '')
  const length = Math.max(nonWhitespace.length, 1)
  const asciiStructure = countMatches(normalized, ASCII_STRUCTURE)
  const boxDrawing = countMatches(normalized, BOX_DRAWING)
  const blockArt = countMatches(normalized, BLOCK_ART)
  const emoji = countMatches(normalized, EMOJI_LIKE)
  const decorative = countMatches(normalized, DECORATIVE_UNICODE)
  const lineCount = normalized.split('\n').length
  const structuredRatio = (asciiStructure + boxDrawing) / length
  const pixelRatio = (blockArt + emoji) / length

  if (pixelRatio >= 0.22 || (blockArt + emoji >= 8 && asciiStructure < 8)) return 'pixel'
  if (structuredRatio >= 0.18 && lineCount >= 3 && blockArt + emoji <= 4) return 'ascii'
  if (decorative >= 4 || (boxDrawing >= 6 && lineCount <= 4)) return 'banner'
  if ((asciiStructure + boxDrawing >= 6) && (blockArt + emoji >= 3)) return 'mixed'
  return asciiStructure + boxDrawing >= 4 ? 'ascii' : 'mixed'
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

function segmentText(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(value), (item) => item.segment)
  }
  return Array.from(value)
}

function renderedLines(artwork: string, maxLines?: number): string[] {
  const lines = artwork.replace(/\r\n?/g, '\n').split('\n')
  if (!maxLines || lines.length <= maxLines) return lines
  return [...lines.slice(0, maxLines), '…']
}

export function KingshotArtRenderer({ artwork, mode = 'kingshot', compact = false, className = '', maxLines, labelledBy, profile = 'auto' }: KingshotArtRendererProps) {
  const lines = useMemo(() => renderedLines(artwork, maxLines), [artwork, maxLines])
  const resolvedProfile = useMemo(() => profile === 'auto' ? analyseArtwork(artwork) : profile, [artwork, profile])
  const classes = ['kingshot-art-renderer', `kingshot-art-renderer--${mode}`, `kingshot-art-renderer--${resolvedProfile}`, compact ? 'kingshot-art-renderer--compact' : '', className].filter(Boolean).join(' ')

  if (mode === 'studio' || resolvedProfile === 'ascii') {
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

export default KingshotArtRenderer
