import { useMemo, useState } from 'react'

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

type GlyphKind = 'space' | 'emoji' | 'box' | 'ascii' | 'unicode'

type GridCell = {
  glyph: string
  kind: GlyphKind
  column: number
}

type GridRow = {
  cells: GridCell[]
  row: number
}

const ASCII_STRUCTURE = /[|/\\_\-=+()[\]{}<>]/g
const BOX_DRAWING = /[─━│┃┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬═║]/gu
const BLOCK_ART = /[█▓▒░■□▪▫●○🔴🔵⚪🟢🟡🟣🟠🟤]/gu
const EMOJI_LIKE = /\p{Extended_Pictographic}/gu
const DECORATIVE_UNICODE = /[★☆✦✧✩✪✫✬✭✮✯✰◆◇◈❖❈❉❊❋✿❀]/gu
const BOX_GLYPH = /^[─━│┃┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬═║]$/u
const EMOJI_GLYPH = /^\p{Extended_Pictographic}$/u

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

function glyphKind(glyph: string): GlyphKind {
  if (glyph === ' ' || glyph === '\t') return 'space'
  if (EMOJI_GLYPH.test(glyph)) return 'emoji'
  if (BOX_GLYPH.test(glyph)) return 'box'
  if (/^[\u0000-\u007f]$/u.test(glyph)) return 'ascii'
  return 'unicode'
}

function normaliseTabs(value: string): string {
  return value.replace(/\t/g, '    ')
}

function renderedLines(artwork: string, maxLines?: number): string[] {
  const lines = normaliseTabs(artwork.replace(/\r\n?/g, '\n')).split('\n')
  if (!maxLines || lines.length <= maxLines) return lines
  return [...lines.slice(0, maxLines), '…']
}

function buildGrid(lines: string[]): GridRow[] {
  return lines.map((line, row) => ({
    row,
    cells: segmentText(line).map((glyph, column) => ({ glyph, kind: glyphKind(glyph), column })),
  }))
}

export function analyseArtworkDetailed(artwork: string): ArtworkAnalysis {
  const normalized = normaliseTabs(artwork.replace(/\r\n?/g, '\n'))
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
  if (widestLine > 50) warnings.push('Wide lines may scroll on smaller phones.')
  if (profile === 'mixed') warnings.push('Mixed glyphs share a fixed Kingshot cell grid; colour and baseline can still vary by device.')
  if (/\t/u.test(artwork)) warnings.push('Tabs were normalised to four spaces for a stable preview.')
  if (lines.length > 16) warnings.push('Tall artwork may require scrolling in chat.')

  const widthPenalty = Math.max(0, widestLine - 44)
  const mixedPenalty = profile === 'mixed' ? 5 : 0
  const warningPenalty = warnings.length * 2
  const compatibilityScore = Math.max(55, Math.min(99, Math.round(97 - widthPenalty - mixedPenalty - warningPenalty)))
  const estimatedWidthPercent = Math.min(100, Math.max(12, Math.round((widestLine / 50) * 100)))

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
    rendererLabel: 'Kingshot Cell Grid',
  }
}

export function analyseArtwork(artwork: string): ArtworkRenderProfile {
  return analyseArtworkDetailed(artwork).profile
}

function KingshotGrid({ lines, classes, labelledBy, profile }: { lines: string[]; classes: string; labelledBy?: string; profile: ArtworkRenderProfile }) {
  const rows = useMemo(() => buildGrid(lines), [lines])
  return <div className={classes} role="img" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : `${profile} artwork preview`} data-render-profile={profile}>
    {rows.map((row) => <div className="kingshot-cell-grid__row" key={row.row} aria-hidden="true">
      {row.cells.length === 0
        ? <span className="kingshot-cell-grid__cell kingshot-cell-grid__cell--space">&nbsp;</span>
        : row.cells.map((cell) => <span className={`kingshot-cell-grid__cell kingshot-cell-grid__cell--${cell.kind}`} key={`${row.row}-${cell.column}-${cell.glyph}`}><span className="kingshot-cell-grid__glyph">{cell.glyph === ' ' ? '\u00a0' : cell.glyph}</span></span>)}
    </div>)}
  </div>
}

export function KingshotArtRenderer({ artwork, mode = 'kingshot', compact = false, className = '', maxLines, labelledBy, profile = 'auto' }: KingshotArtRendererProps) {
  const [device, setDevice] = useState<ArtworkDevicePreset>('phone')
  const lines = useMemo(() => renderedLines(artwork, maxLines), [artwork, maxLines])
  const analysis = useMemo(() => analyseArtworkDetailed(artwork), [artwork])
  const resolvedProfile = profile === 'auto' ? analysis.profile : profile
  const classes = ['kingshot-art-renderer', `kingshot-art-renderer--${mode}`, `kingshot-art-renderer--${resolvedProfile}`, 'kingshot-cell-grid', compact ? 'kingshot-art-renderer--compact' : '', className].filter(Boolean).join(' ')

  if (mode === 'studio') {
    return <pre className={classes} aria-labelledby={labelledBy}>{lines.join('\n')}</pre>
  }

  const artworkNode = <KingshotGrid lines={lines} classes={classes} labelledBy={labelledBy} profile={resolvedProfile} />
  if (!labelledBy || compact) return artworkNode

  return <section className={`forge-render-engine forge-render-engine--${device}`} aria-label="Forge artwork analysis">
    <div className="forge-render-engine__device-controls" role="group" aria-label="Preview device">
      {(['phone', 'tablet', 'desktop'] as ArtworkDevicePreset[]).map((preset) => <button key={preset} type="button" className={device === preset ? 'forge-render-engine__device forge-render-engine__device--active' : 'forge-render-engine__device'} aria-pressed={device === preset} onClick={() => setDevice(preset)}>{preset === 'phone' ? 'Phone' : preset === 'tablet' ? 'Tablet' : 'Desktop'}</button>)}
    </div>
    <div className="forge-render-engine__simulator">
      <div className="forge-render-engine__bubble">
        <div className="forge-render-engine__art">{artworkNode}</div>
        <span className="forge-render-engine__bubble-corner" aria-hidden="true" />
      </div>
      <div className="forge-render-engine__avatar" aria-hidden="true">F</div>
      <time className="forge-render-engine__timestamp">23:13</time>
    </div>
    <div className="forge-render-engine__analysis">
      <div><span>Artwork type</span><strong>{analysis.profile.toUpperCase()}</strong></div>
      <div><span>Match score</span><strong>{analysis.confidence}%</strong></div>
      <div><span>Renderer</span><strong>{analysis.rendererLabel}</strong></div>
      <div><span>Chat width used</span><strong>{analysis.estimatedWidthPercent}%</strong></div>
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
