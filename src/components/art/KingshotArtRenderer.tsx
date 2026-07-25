import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { analyseArtworkDetailed, buildFixedCellGrid, DEFAULT_CALIBRATION, DEVICE_PROFILES, deviceProfileStyle, getDirectionalGlyphCalibration, parseArtwork } from '../../render-engine'
import type { ArtworkClass, ArtworkSourceContext, CalibrationConfiguration, DeviceProfile, DeviceProfileId, GlyphFamily } from '../../render-engine'
import { calculateResponsiveLayout } from './fitToContainer'

export type ArtworkRenderMode = 'kingshot' | 'studio'
export type ArtworkRenderProfile = ArtworkClass
export type ArtworkDevicePreset = 'phone' | 'tablet' | 'desktop'
export type ArtworkAnalysis = ReturnType<typeof analyseArtworkDetailed>
export type KingshotArtRendererProps = { artwork: string; mode?: ArtworkRenderMode; compact?: boolean; className?: string; maxLines?: number; labelledBy?: string; profile?: ArtworkRenderProfile | 'auto'; deviceProfile?: DeviceProfileId; deviceProfileConfig?: DeviceProfile; calibration?: CalibrationConfiguration; showSimulation?: boolean; sourceContext?: ArtworkSourceContext; fitToContainer?: boolean }

const DEVICE_ALIAS: Record<ArtworkDevicePreset, DeviceProfileId> = { phone: 'android-default', tablet: 'tablet', desktop: 'desktop-preview' }
const COMPACT_SCALE = .56

function ResponsiveFit({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ availableWidth: 0, naturalWidth: 0, naturalHeight: 0, scale: 1, scaledWidth: 0, scaledHeight: 0, offsetLeft: 0 })

  useLayoutEffect(() => {
    if (!enabled) return
    const measure = () => {
      const container = containerRef.current
      const content = contentRef.current
      if (!container || !content) return
      const naturalWidth = Math.max(content.scrollWidth, content.offsetWidth)
      const naturalHeight = Math.max(content.scrollHeight, content.offsetHeight)
      const availableWidth = container.clientWidth
      const next = calculateResponsiveLayout(availableWidth, naturalWidth, naturalHeight)
      setFit((current) => current.availableWidth === next.availableWidth && current.naturalWidth === next.naturalWidth && current.naturalHeight === next.naturalHeight && current.scale === next.scale ? current : next)
    }
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    if (observer && containerRef.current) observer.observe(containerRef.current)
    if (observer && contentRef.current) observer.observe(contentRef.current)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [enabled])

  if (!enabled) return <>{children}</>
  const hasMeasurement = fit.naturalWidth > 0 && fit.naturalHeight > 0
  return <div ref={containerRef} className="forge-render-engine__fit" style={{ height: hasMeasurement ? fit.scaledHeight : undefined }} data-fit-available-width={fit.availableWidth || undefined} data-fit-natural-width={fit.naturalWidth || undefined} data-fit-scaled-width={fit.scaledWidth || undefined} data-fit-scale={fit.scale}>
    <div className="forge-render-engine__fit-stage" style={{ width: hasMeasurement ? fit.scaledWidth : '100%', height: hasMeasurement ? fit.scaledHeight : undefined }}>
      <div ref={contentRef} className="forge-render-engine__fit-content" style={{ width: fit.naturalWidth || 'max-content', height: fit.naturalHeight || undefined, transform: `scale(${fit.scale})` }}>{children}</div>
    </div>
  </div>
}

function KingshotGrid({ artwork, lines, classes, labelledBy, calibration, style, sourceContext }: { artwork: string; lines: string[]; classes: string; labelledBy?: string; calibration: CalibrationConfiguration; style: CSSProperties; sourceContext: ArtworkSourceContext }) {
  const grid = useMemo(() => buildFixedCellGrid(lines, calibration, sourceContext), [lines, calibration, sourceContext])
  return <div className={classes} role="img" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : 'Fixed-cell artwork preview'} data-source-text={artwork} style={style}>
    {grid.map((row) => <div className="kingshot-cell-grid__row" key={row.row} aria-hidden="true">
      {row.cells.length === 0 ? <span className="kingshot-cell-grid__cell kingshot-cell-grid__cell--space"><span className="kingshot-cell-grid__glyph">&nbsp;</span></span> : row.cells.map((cell) => {
        const paint = calibration[cell.family]
        const directionalPaint = getDirectionalGlyphCalibration(cell.glyph, cell.family)
        const horizontalScale = (paint.horizontalScale ?? 1) * (paint.glyphScaleX ?? 1) * directionalPaint.glyphScaleX
        const translateX = (paint.glyphTranslateXCells ?? 0) + directionalPaint.glyphTranslateXCells
        return <span className={`kingshot-cell-grid__cell kingshot-cell-grid__cell--${cell.family}`} data-grid-column={cell.column} data-grid-row={cell.row} data-grid-span={cell.span} data-source-graphemes={cell.sourceGlyphs.length} key={`${row.row}-${cell.column}`} style={{ '--forge-cell-span': cell.span } as CSSProperties}><span className="kingshot-cell-grid__glyph" style={{ '--forge-glyph-scale': paint.glyphScale, '--forge-glyph-scale-x': horizontalScale, '--forge-glyph-scale-y': paint.verticalScale, '--forge-glyph-translate-x-cells': translateX, '--forge-baseline-offset': `${paint.baselineOffset}px`, '--forge-glyph-family': paint.fontFamily, '--forge-glyph-weight': paint.fontWeight } as CSSProperties}>{cell.glyph === ' ' ? '\u00a0' : cell.glyph}</span></span>
      })}
    </div>)}
  </div>
}

export function KingshotArtRenderer({ artwork, mode = 'kingshot', compact = false, className = '', maxLines, labelledBy, profile = 'auto', deviceProfile, deviceProfileConfig, calibration = DEFAULT_CALIBRATION, showSimulation, sourceContext = 'authored', fitToContainer = false }: KingshotArtRendererProps) {
  const [device, setDevice] = useState<ArtworkDevicePreset>('phone')
  const lines = useMemo(() => parseArtwork(artwork, maxLines), [artwork, maxLines])
  const analysis = useMemo(() => analyseArtworkDetailed(artwork, calibration, sourceContext), [artwork, calibration, sourceContext])
  const resolvedProfile = profile === 'auto' ? analysis.artworkClass : profile
  const classes = ['kingshot-art-renderer', `kingshot-art-renderer--${mode}`, `kingshot-art-renderer--${resolvedProfile}`, 'kingshot-cell-grid', compact ? 'kingshot-art-renderer--compact' : '', className].filter(Boolean).join(' ')

  if (mode === 'studio') return <pre className={classes} aria-labelledby={labelledBy} data-source-text={artwork}>{artwork}</pre>

  const activeDevice = deviceProfile ?? DEVICE_ALIAS[device]
  const profileData = deviceProfileConfig ?? DEVICE_PROFILES[activeDevice]
  const displayScale = compact ? COMPACT_SCALE : 1
  const profileStyle = deviceProfileStyle(profileData, displayScale)
  const artworkNode = <KingshotGrid artwork={artwork} lines={lines} classes={classes} labelledBy={labelledBy} calibration={calibration} style={profileStyle} sourceContext={sourceContext} />

  if (showSimulation === false) return artworkNode

  const frame = <div className={`forge-render-engine__viewport${fitToContainer ? ' forge-render-engine__viewport--fit' : ''}`} style={profileStyle} data-device-profile={activeDevice}><div className="forge-render-engine__bubble"><div className="forge-render-engine__art">{artworkNode}</div></div></div>
  const presentationClass = deviceProfile ? activeDevice === 'tablet' ? 'tablet' : activeDevice === 'desktop-preview' ? 'desktop' : 'phone' : device

  if (compact || !labelledBy) return <div className={`forge-render-engine forge-render-engine--${presentationClass} forge-render-engine--embedded${compact ? ' forge-render-engine--compact' : ''}${fitToContainer ? ' forge-render-engine--fit' : ''}`} aria-label={`${profileData.label} Kingshot preview`}><ResponsiveFit enabled={fitToContainer}>{frame}</ResponsiveFit></div>

  return <section className={`forge-render-engine forge-render-engine--${presentationClass}${fitToContainer ? ' forge-render-engine--fit' : ''}`} aria-label="Forge artwork analysis">
    {!deviceProfile && <div className="forge-render-engine__device-controls" role="group" aria-label="Preview device">{(['phone', 'tablet', 'desktop'] as ArtworkDevicePreset[]).map((preset) => <button key={preset} type="button" className={device === preset ? 'forge-render-engine__device forge-render-engine__device--active' : 'forge-render-engine__device'} aria-pressed={device === preset} onClick={() => setDevice(preset)}>{preset[0].toUpperCase() + preset.slice(1)}</button>)}</div>}
    <ResponsiveFit enabled={fitToContainer}>{frame}</ResponsiveFit>
    <div className="forge-render-engine__analysis"><div><span>Artwork type</span><strong>{analysis.artworkClass.toUpperCase()}</strong></div><div><span>Graphemes</span><strong>{analysis.graphemeCount}</strong></div><div><span>Renderer</span><strong>{analysis.rendererLabel}</strong></div><div><span>Device</span><strong>{profileData.label}</strong></div><div><span>Source</span><strong>{sourceContext === 'kingshot-clipboard' ? 'Kingshot clipboard' : 'Authored'}</strong></div><div><span>Dimensions</span><strong>{analysis.widestLine} × {analysis.lineCount}</strong></div></div>
    {(analysis.features.length > 0 || analysis.warnings.length > 0) && <div className="forge-render-engine__notes">{analysis.features.length > 0 && <p><strong>Detected:</strong> {analysis.features.join(', ')}.</p>}{analysis.warnings.map((warning) => <p className="forge-render-engine__warning" key={warning}>⚠ {warning}</p>)}</div>}
  </section>
}

export type { ArtworkClass, DeviceProfileId, GlyphFamily }
export default KingshotArtRenderer
