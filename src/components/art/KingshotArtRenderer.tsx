import { useMemo } from 'react'
import type { CSSProperties } from 'react'

export type ArtworkRenderMode = 'kingshot' | 'studio'

export type KingshotArtRendererProps = {
  artwork: string
  mode?: ArtworkRenderMode
  compact?: boolean
  className?: string
  maxLines?: number
  labelledBy?: string
}

type GlyphProfile = {
  width: number
}

/*
 * Forge Render Engine calibration.
 *
 * These widths model the compact proportional spacing seen in Kingshot chat.
 * The original text is never changed; these values affect preview layout only.
 */
const SPACE_WIDTH = 0.36
const TAB_WIDTH = SPACE_WIDTH * 4

const EXTRA_NARROW_GLYPHS = new Set(['|', '│', '┃', '║', '¦', '!', 'i', 'l', 'I', '·', '•', "'", '`', ':', ';'])
const BRACKET_GLYPHS = new Set(['(', ')', '[', ']', '{', '}'])
const DIAGONAL_GLYPHS = new Set(['/', '\\', '╱', '╲', '⟋', '⟍'])
const HORIZONTAL_GLYPHS = new Set(['-', '─', '━', '═', '_', '¯', '‾'])
const WIDE_GLYPHS = new Set(['M', 'W', 'm', 'w', '田', '國', '国', '█', '▓', '▒', '░'])
const JOINING_LEFT = new Set(['╲', '\\', ')', ']', '}', '〉', '》', '」', '』'])
const JOINING_RIGHT = new Set(['╱', '/', '(', '[', '{', '〈', '《', '「', '『'])

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

export function KingshotArtRenderer({ artwork, mode = 'kingshot', compact = false, className = '', maxLines, labelledBy }: KingshotArtRendererProps) {
  const lines = useMemo(() => renderedLines(artwork, maxLines), [artwork, maxLines])
  const classes = ['kingshot-art-renderer', `kingshot-art-renderer--${mode}`, compact ? 'kingshot-art-renderer--compact' : '', className].filter(Boolean).join(' ')

  if (mode === 'studio') {
    return <pre className={classes} aria-labelledby={labelledBy}>{lines.join('\n')}</pre>
  }

  return <div className={classes} role="img" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : 'Kingshot-style artwork preview'}>
    {lines.map((line, lineIndex) => {
      const glyphs = segmentText(line)
      return <div className="kingshot-art-renderer__line" key={`${lineIndex}-${line}`} aria-hidden="true">
        {glyphs.length === 0 ? <span className="kingshot-art-renderer__empty">&nbsp;</span> : glyphs.map((glyph, glyphIndex) => {
          const previous = glyphs[glyphIndex - 1]
          const next = glyphs[glyphIndex + 1]
          const profile = glyphProfile(glyph)
          let overlap = 0

          if (DIAGONAL_GLYPHS.has(glyph) && (DIAGONAL_GLYPHS.has(previous) || DIAGONAL_GLYPHS.has(next))) overlap = -0.085
          if (JOINING_LEFT.has(glyph) || JOINING_RIGHT.has(glyph)) overlap = Math.min(overlap, -0.045)
          if (HORIZONTAL_GLYPHS.has(glyph) && HORIZONTAL_GLYPHS.has(previous)) overlap = Math.min(overlap, -0.025)

          const style = {
            '--ks-glyph-width': `${profile.width}em`,
            '--ks-glyph-overlap': `${overlap}em`,
          } as CSSProperties

          return <span className="kingshot-art-renderer__glyph" style={style} key={`${glyphIndex}-${glyph}`}>{glyph === ' ' ? '\u00a0' : glyph}</span>
        })}
      </div>
    })}
  </div>
}

export default KingshotArtRenderer
