import { useMemo, useState } from 'react'
import { analyseArtworkDetailed, buildFixedCellGrid, DEFAULT_CALIBRATION, DEVICE_PROFILES, normaliseArtwork, parseArtwork } from '../../render-engine'
import type { ArtworkClass, CalibrationConfiguration, DeviceProfile, DeviceProfileId, GlyphFamily } from '../../render-engine'

export type ArtworkRenderMode = 'kingshot' | 'studio'
export type ArtworkRenderProfile = ArtworkClass
export type ArtworkDevicePreset = 'phone' | 'tablet' | 'desktop'
export type ArtworkAnalysis = ReturnType<typeof analyseArtworkDetailed>
export type KingshotArtRendererProps = { artwork: string; mode?: ArtworkRenderMode; compact?: boolean; className?: string; maxLines?: number; labelledBy?: string; profile?: ArtworkRenderProfile | 'auto'; deviceProfile?: DeviceProfileId; deviceProfileConfig?: DeviceProfile; calibration?: CalibrationConfiguration; showSimulation?: boolean }

const DEVICE_ALIAS: Record<ArtworkDevicePreset, DeviceProfileId> = { phone: 'android-default', tablet: 'tablet', desktop: 'desktop-preview' }

function KingshotGrid({ artwork, lines, classes, labelledBy, calibration }: { artwork: string; lines: string[]; classes: string; labelledBy?: string; calibration: CalibrationConfiguration }) {
  const grid = useMemo(() => buildFixedCellGrid(lines), [lines])
  return <div className={classes} role="img" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : 'Fixed-cell artwork preview'} data-source-text={normaliseArtwork(artwork)}>
    {grid.map((row) => <div className="kingshot-cell-grid__row" key={row.row} aria-hidden="true">
      {row.cells.length === 0 ? <span className="kingshot-cell-grid__cell kingshot-cell-grid__cell--space">&nbsp;</span> : row.cells.map((cell) => {
        const paint = calibration[cell.family]
        return <span className={`kingshot-cell-grid__cell kingshot-cell-grid__cell--${cell.family}`} data-grid-column={cell.column} data-grid-row={cell.row} key={`${row.row}-${cell.column}`}><span className="kingshot-cell-grid__glyph" style={{ '--forge-glyph-scale': paint.glyphScale, '--forge-glyph-scale-x': paint.horizontalScale, '--forge-glyph-scale-y': paint.verticalScale, '--forge-baseline-offset': `${paint.baselineOffset}px`, '--forge-glyph-family': paint.fontFamily, '--forge-glyph-weight': paint.fontWeight } as React.CSSProperties}>{cell.glyph === ' ' ? '\u00a0' : cell.glyph}</span></span>
      })}
    </div>)}
  </div>
}

export function analyseArtwork(artwork: string): ArtworkRenderProfile { return analyseArtworkDetailed(artwork).artworkClass }

export function KingshotArtRenderer({ artwork, mode = 'kingshot', compact = false, className = '', maxLines, labelledBy, profile = 'auto', deviceProfile, deviceProfileConfig, calibration = DEFAULT_CALIBRATION, showSimulation }: KingshotArtRendererProps) {
  const [device, setDevice] = useState<ArtworkDevicePreset>('phone')
  const lines = useMemo(() => parseArtwork(artwork, maxLines), [artwork, maxLines])
  const analysis = useMemo(() => analyseArtworkDetailed(artwork), [artwork])
  const resolvedProfile = profile === 'auto' ? analysis.artworkClass : profile
  const classes = ['kingshot-art-renderer', `kingshot-art-renderer--${mode}`, `kingshot-art-renderer--${resolvedProfile}`, 'kingshot-cell-grid', compact ? 'kingshot-art-renderer--compact' : '', className].filter(Boolean).join(' ')
  if (mode === 'studio') return <pre className={classes} aria-labelledby={labelledBy}>{lines.join('\n')}</pre>
  const activeDevice = deviceProfile ?? DEVICE_ALIAS[device]
  const profileData = deviceProfileConfig ?? DEVICE_PROFILES[activeDevice]
  const artworkNode = <KingshotGrid artwork={artwork} lines={lines} classes={classes} labelledBy={labelledBy} calibration={calibration} />
  if (!labelledBy || compact || showSimulation === false) return artworkNode
  return <section className={`forge-render-engine forge-render-engine--${device}`} aria-label="Forge artwork analysis">
    {!deviceProfile && <div className="forge-render-engine__device-controls" role="group" aria-label="Preview device">{(['phone', 'tablet', 'desktop'] as ArtworkDevicePreset[]).map((preset) => <button key={preset} type="button" className={device === preset ? 'forge-render-engine__device forge-render-engine__device--active' : 'forge-render-engine__device'} aria-pressed={device === preset} onClick={() => setDevice(preset)}>{preset[0].toUpperCase() + preset.slice(1)}</button>)}</div>}
    <div className="forge-render-engine__viewport" style={{ '--forge-chat-width': `${profileData.chatBubbleWidth}px`, '--forge-bubble-padding': `${profileData.bubblePadding}px`, '--forge-avatar-size': `${profileData.avatarSize}px`, '--forge-cell-width': `${profileData.cellWidth}px`, '--forge-cell-height': `${profileData.cellHeight}px`, '--forge-grid-font-size': `${profileData.gridFontSize}px` } as React.CSSProperties}><div className="forge-render-engine__bubble"><div className="forge-render-engine__art">{artworkNode}</div></div></div>
    <div className="forge-render-engine__analysis"><div><span>Artwork type</span><strong>{analysis.artworkClass.toUpperCase()}</strong></div><div><span>Graphemes</span><strong>{analysis.graphemeCount}</strong></div><div><span>Renderer</span><strong>{analysis.rendererLabel}</strong></div><div><span>Device</span><strong>{profileData.label}</strong></div><div><span>Compatibility</span><strong>{analysis.compatibilityScore}/100</strong></div><div><span>Dimensions</span><strong>{analysis.widestLine} × {analysis.lineCount}</strong></div></div>
    {(analysis.features.length > 0 || analysis.warnings.length > 0) && <div className="forge-render-engine__notes">{analysis.features.length > 0 && <p><strong>Detected:</strong> {analysis.features.join(', ')}.</p>}{analysis.warnings.map((warning) => <p className="forge-render-engine__warning" key={warning}>⚠ {warning}</p>)}</div>}
  </section>
}

export type { ArtworkClass, DeviceProfileId, GlyphFamily }
export default KingshotArtRenderer
