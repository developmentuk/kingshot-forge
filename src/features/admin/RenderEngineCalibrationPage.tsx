import { useMemo, useState } from 'react'
import { KingshotArtRenderer } from '../../components/art/KingshotArtRenderer'
import { analyseArtworkDetailed, DEFAULT_CALIBRATION, DEVICE_PROFILES, getBenchmarkArtwork, mergeCalibration, RENDER_BENCHMARKS } from '../../render-engine'
import type { DeviceProfileId, GlyphFamily } from '../../render-engine'
import './renderEngineCalibration.css'

const FAMILIES: GlyphFamily[] = ['space', 'ascii', 'box-drawing', 'unicode', 'emoji', 'pixel-circles', 'hearts', 'decorative-symbols']

export function RenderEngineCalibrationPage() {
  const [benchmarkId, setBenchmarkId] = useState(RENDER_BENCHMARKS[0].id)
  const [deviceId, setDeviceId] = useState<DeviceProfileId>('android-default')
  const [family, setFamily] = useState<GlyphFamily>('ascii')
  const [overrides, setOverrides] = useState<Partial<Record<GlyphFamily, Partial<typeof DEFAULT_CALIBRATION.ascii>>>>({})
  const [referenceUrl, setReferenceUrl] = useState<string>()
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay'>('side-by-side')
  const [opacity, setOpacity] = useState(.5)
  const benchmark = RENDER_BENCHMARKS.find((item) => item.id === benchmarkId) ?? RENDER_BENCHMARKS[0]
  const artwork = getBenchmarkArtwork(benchmark)
  const calibration = useMemo(() => mergeCalibration(DEFAULT_CALIBRATION, overrides), [overrides])
  const analysis = useMemo(() => analyseArtworkDetailed(artwork), [artwork])
  const selected = calibration[family]

  function updateCalibration(field: keyof typeof selected, value: string) {
    const numeric = field === 'fontFamily' || field === 'fontWeight' ? value : Number(value)
    setOverrides((current) => ({ ...current, [family]: { ...current[family], [field]: numeric } }))
  }

  function resetCalibration() {
    setOverrides((current) => { const next = { ...current }; delete next[family]; return next })
  }

  function selectReference(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) setReferenceUrl(URL.createObjectURL(file))
  }

  return <main className="admin-page render-engine-lab">
    <section className="admin-dashboard-hero"><div><p className="admin-page__eyebrow">Forge Render Engine</p><h1>Calibration Lab</h1><p className="admin-page__intro">Tune browser-local glyph calibration against fixed-cell benchmarks. Values are not persisted or uploaded.</p></div><div className="admin-dashboard-role"><span>Route</span><strong>/admin/render-engine</strong></div></section>
    <section className="render-engine-lab__toolbar"><label>Benchmark<select value={benchmarkId} onChange={(event) => setBenchmarkId(event.target.value)}>{RENDER_BENCHMARKS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Device profile<select value={deviceId} onChange={(event) => setDeviceId(event.target.value as DeviceProfileId)}>{Object.values(DEVICE_PROFILES).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Glyph family<select value={family} onChange={(event) => setFamily(event.target.value as GlyphFamily)}>{FAMILIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></section>
    <section className="render-engine-lab__grid">
      <article className="render-engine-lab__panel"><h2>Forge render</h2>{artwork ? <KingshotArtRenderer artwork={artwork} labelledBy="render-engine-benchmark-title" calibration={calibration} deviceProfile={deviceId} /> : <div className="render-engine-lab__unavailable"><h3>{benchmark.title}</h3><p>The benchmark metadata is registered, but its approved artwork record is not available in this checkout yet.</p></div>}</article>
      <article className="render-engine-lab__panel"><h2 id="render-engine-benchmark-title">{benchmark.title}</h2><dl className="render-engine-lab__metadata"><div><dt>Expected class</dt><dd>{benchmark.expectedArtworkClass}</dd></div><div><dt>Expected renderer</dt><dd>{benchmark.expectedRenderer}</dd></div><div><dt>Validation</dt><dd>{benchmark.validationStatus}</dd></div><div><dt>Target profile</dt><dd>{benchmark.targetDeviceProfile}</dd></div></dl><p>{benchmark.notes}</p><h3>Calibration controls · {family}</h3><label>Glyph scale<input type="range" min="0.5" max="1.5" step="0.01" value={selected.glyphScale} onChange={(event) => updateCalibration('glyphScale', event.target.value)} /></label><label>Horizontal scale<input type="range" min="0.5" max="1.5" step="0.01" value={selected.horizontalScale} onChange={(event) => updateCalibration('horizontalScale', event.target.value)} /></label><label>Vertical scale<input type="range" min="0.5" max="1.5" step="0.01" value={selected.verticalScale} onChange={(event) => updateCalibration('verticalScale', event.target.value)} /></label><label>Baseline offset<input type="range" min="-6" max="6" step="1" value={selected.baselineOffset} onChange={(event) => updateCalibration('baselineOffset', event.target.value)} /></label><button className="button button--secondary" type="button" onClick={resetCalibration}>Reset {family} to default</button></article>
    </section>
    <section className="render-engine-lab__panel"><h2>Render diagnostics</h2><div className="render-engine-lab__diagnostics"><span>Grid dimensions<strong>{analysis.widestLine} × {analysis.lineCount}</strong></span><span>Total graphemes<strong>{analysis.graphemeCount}</strong></span><span>Classification<strong>{analysis.artworkClass}</strong></span><span>Device<strong>{DEVICE_PROFILES[deviceId].label}</strong></span></div><p>Glyph-family counts: {Object.entries(analysis.familyCounts).filter(([, count]) => count > 0).map(([name, count]) => `${name} ${count}`).join(' · ') || 'No artwork loaded'}.</p>{analysis.warnings.map((warning) => <p className="render-engine-lab__warning" key={warning}>⚠ {warning}</p>)}</section>
    <section className="render-engine-lab__panel"><h2>Screenshot comparison workspace</h2><p>Reference images stay in this browser session. OCR and automatic image matching are intentionally out of scope.</p><label>Upload local reference screenshot<input type="file" accept="image/*" onChange={selectReference} /></label><div className={`render-engine-lab__comparison render-engine-lab__comparison--${comparisonMode}`}><div className="render-engine-lab__reference"><h3>Reference image</h3>{referenceUrl ? <img src={referenceUrl} alt="Local reference screenshot" style={{ opacity }} /> : <p>No local reference selected.</p>}</div><div className="render-engine-lab__forge"><h3>Forge render</h3>{artwork ? <KingshotArtRenderer artwork={artwork} compact calibration={calibration} deviceProfile={deviceId} /> : <p>No render available for this metadata-only benchmark.</p>}</div></div><label>Overlay opacity<input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /></label><div className="render-engine-lab__comparison-actions"><button className={comparisonMode === 'side-by-side' ? 'button button--primary' : 'button button--secondary'} type="button" onClick={() => setComparisonMode('side-by-side')}>Side-by-side</button><button className={comparisonMode === 'overlay' ? 'button button--primary' : 'button button--secondary'} type="button" onClick={() => setComparisonMode('overlay')}>Overlay</button></div></section>
  </main>
}
