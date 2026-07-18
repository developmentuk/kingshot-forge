import { useEffect, useMemo, useRef, useState } from 'react'
import { KingshotArtRenderer } from '../../components/art/KingshotArtRenderer'
import { analyseArtworkDetailed, DEFAULT_CALIBRATION, DEVICE_PROFILES, getBenchmarkArtwork, mergeCalibration, RENDER_BENCHMARKS } from '../../render-engine'
import type { DeviceProfileId, GlyphCalibration, GlyphFamily } from '../../render-engine'
import './renderEngineCalibration.css'

const FAMILIES: GlyphFamily[] = ['space', 'ascii', 'box-drawing', 'unicode', 'emoji', 'pixel-circles', 'hearts', 'decorative-symbols']
const familyLabel = (family: GlyphFamily) => family.replaceAll('-', ' ')

export function RenderEngineCalibrationPage() {
  const [benchmarkId, setBenchmarkId] = useState(RENDER_BENCHMARKS[0].id)
  const [deviceId, setDeviceId] = useState<DeviceProfileId>('android-default')
  const [family, setFamily] = useState<GlyphFamily>('pixel-circles')
  const [overrides, setOverrides] = useState<Partial<Record<GlyphFamily, Partial<GlyphCalibration>>>>({})
  const [referenceUrl, setReferenceUrl] = useState<string>()
  const [referenceName, setReferenceName] = useState<string>()
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay'>('side-by-side')
  const [opacity, setOpacity] = useState(.5)
  const benchmark = RENDER_BENCHMARKS.find((item) => item.id === benchmarkId) ?? RENDER_BENCHMARKS[0]
  const artwork = getBenchmarkArtwork(benchmark)
  const calibration = useMemo(() => mergeCalibration(DEFAULT_CALIBRATION, overrides), [overrides])
  const analysis = useMemo(() => analyseArtworkDetailed(artwork), [artwork])
  const familyCount = analysis.familyCounts[family]
  const autoFamily = useMemo(() => FAMILIES.filter((item) => item !== 'space').sort((first, second) => analysis.familyCounts[second] - analysis.familyCounts[first])[0], [analysis])
  const hasArtwork = artwork.length > 0
  const hasOverrides = Object.keys(overrides).length > 0
  const selected = calibration[family]
  const previousBenchmark = useRef(benchmarkId)

  useEffect(() => {
    if (previousBenchmark.current === benchmarkId) return
    previousBenchmark.current = benchmarkId
    if (!hasArtwork || familyCount > 0) return
    if (autoFamily && analysis.familyCounts[autoFamily] > 0) setFamily(autoFamily)
  }, [analysis, autoFamily, benchmarkId, familyCount, hasArtwork])

  function updateCalibration(field: keyof GlyphCalibration, value: string) {
    const parsed = field === 'fontFamily' ? value : Number(value)
    setOverrides((current) => ({ ...current, [family]: { ...current[family], [field]: parsed } }))
  }

  function resetFamily() {
    setOverrides((current) => { const next = { ...current }; delete next[family]; return next })
  }

  function resetAll() { setOverrides({}) }

  function selectReference(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (referenceUrl) URL.revokeObjectURL(referenceUrl)
    setReferenceUrl(URL.createObjectURL(file))
    setReferenceName(file.name)
  }

  function removeReference() {
    if (referenceUrl) URL.revokeObjectURL(referenceUrl)
    setReferenceUrl(undefined)
    setReferenceName(undefined)
  }

  return <main className="admin-page render-engine-lab">
    <section className="render-engine-lab__topbar">
      <div><p className="render-engine-lab__eyebrow">Forge Render Engine / Sprint 9.2</p><h1>Calibration Lab</h1><p>Browser-local calibration for fixed-cell visual validation. No values or screenshots leave this session.</p></div>
      <div className="render-engine-lab__actions"><button className="button button--secondary" type="button" onClick={resetAll} disabled={!hasOverrides}>Reset all calibration</button><button className="button button--secondary" type="button" disabled>Reset device profile</button></div>
    </section>

    <section className="render-engine-lab__toolbar" aria-label="Render Engine selectors">
      <label>Benchmark<select value={benchmarkId} onChange={(event) => setBenchmarkId(event.target.value)}>{RENDER_BENCHMARKS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>Device profile<select value={deviceId} onChange={(event) => setDeviceId(event.target.value as DeviceProfileId)}>{Object.values(DEVICE_PROFILES).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Glyph family<select value={family} onChange={(event) => setFamily(event.target.value as GlyphFamily)}>{FAMILIES.map((item) => <option key={item} value={item}>{familyLabel(item)}</option>)}</select></label>
      <div className="render-engine-lab__status"><span>Selected family</span><strong>{familyLabel(family)}</strong><small>{familyCount} grapheme{familyCount === 1 ? '' : 's'} in this benchmark</small></div>
    </section>

    <section className="render-engine-lab__workspace">
      <article className="render-engine-lab__panel render-engine-lab__panel--preview"><div className="render-engine-lab__panel-heading"><h2>Forge render</h2><span className={hasArtwork ? 'render-engine-lab__availability render-engine-lab__availability--ready' : 'render-engine-lab__availability'}>{hasArtwork ? 'Artwork available' : 'Metadata only'}</span></div>{hasArtwork ? <KingshotArtRenderer artwork={artwork} labelledBy="render-engine-benchmark-title" calibration={calibration} deviceProfile={deviceId} /> : <div className="render-engine-lab__unavailable"><strong>{benchmark.title}</strong><p>This benchmark remains registered, but its approved artwork record is not available in this checkout. Calibration is disabled until a source record exists.</p></div>}</article>
      <article className="render-engine-lab__panel render-engine-lab__panel--reference"><div className="render-engine-lab__panel-heading"><h2>Reference screenshot</h2>{referenceName && <button type="button" className="render-engine-lab__text-button" onClick={removeReference}>Remove {referenceName}</button>}</div>{referenceUrl ? <div className={comparisonMode === 'overlay' && hasArtwork ? 'render-engine-lab__overlay-stage' : ''}><img className="render-engine-lab__reference-image" src={referenceUrl} alt="Local reference screenshot" style={{ opacity: comparisonMode === 'overlay' ? opacity : 1 }} />{comparisonMode === 'overlay' && hasArtwork && <div className="render-engine-lab__overlay-render"><KingshotArtRenderer artwork={artwork} compact calibration={calibration} deviceProfile={deviceId} /></div>}</div> : <label className="render-engine-lab__upload">Choose a local image<input type="file" accept="image/*" onChange={selectReference} /></label>}<div className="render-engine-lab__comparison-controls"><button className={comparisonMode === 'side-by-side' ? 'button button--primary' : 'button button--secondary'} type="button" onClick={() => setComparisonMode('side-by-side')}>Side-by-side</button><button className={comparisonMode === 'overlay' ? 'button button--primary' : 'button button--secondary'} type="button" onClick={() => setComparisonMode('overlay')}>Overlay</button><label>Opacity <output>{Math.round(opacity * 100)}%</output><input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} disabled={comparisonMode !== 'overlay'} /></label></div></article>
    </section>

    <section className="render-engine-lab__inspector">
      <article className="render-engine-lab__panel"><div className="render-engine-lab__panel-heading"><h2>Calibration inspector</h2><button className="render-engine-lab__text-button" type="button" onClick={resetFamily} disabled={!overrides[family]}>Reset {familyLabel(family)}</button></div>{!hasArtwork && <p className="render-engine-lab__notice">Controls are unavailable because this benchmark has no approved artwork record.</p>}{hasArtwork && familyCount === 0 && <p className="render-engine-lab__notice">Not present in this benchmark. Select a family with a positive count to see a live effect.</p>}<div className="render-engine-lab__controls">{([['glyphScale', 'Glyph scale', .5, 1.5, .01, ''], ['horizontalScale', 'Horizontal scale', .5, 1.5, .01, ''], ['verticalScale', 'Vertical scale', .5, 1.5, .01, ''], ['baselineOffset', 'Baseline offset', -6, 6, 1, ' px'], ['fontWeight', 'Font weight', 300, 900, 100, ''] ] as const).map(([field, label, min, max, step, unit]) => <label key={field}><span>{label}<output>{selected[field]}{unit}</output></span><input type="range" min={min} max={max} step={step} value={selected[field]} onChange={(event) => updateCalibration(field, event.target.value)} disabled={!hasArtwork || familyCount === 0} /></label>)}</div></article>
      <article className="render-engine-lab__panel"><h2>Diagnostics</h2><div className="render-engine-lab__diagnostics"><span>Grid<strong>{analysis.widestLine} × {analysis.lineCount}</strong></span><span>Graphemes<strong>{analysis.graphemeCount}</strong></span><span>Classification<strong>{analysis.artworkClass}</strong></span><span>Renderer<strong>Fixed cell grid</strong></span><span>Device<strong>{DEVICE_PROFILES[deviceId].label}</strong></span><span>Family<strong>{familyLabel(family)} · {familyCount}</strong></span></div><h3>Family counts</h3><div className="render-engine-lab__family-counts">{FAMILIES.map((item) => <button key={item} type="button" className={item === family ? 'render-engine-lab__family-count render-engine-lab__family-count--selected' : 'render-engine-lab__family-count'} onClick={() => setFamily(item)}><span>{familyLabel(item)}</span><strong>{analysis.familyCounts[item]}</strong></button>)}</div><p>Active overrides: {hasOverrides ? Object.keys(overrides).join(', ') : 'none'}</p>{analysis.warnings.map((warning) => <p className="render-engine-lab__warning" key={warning}>⚠ {warning}</p>)}</article>
      <article className="render-engine-lab__panel"><h2 id="render-engine-benchmark-title">Benchmark metadata</h2><dl className="render-engine-lab__metadata"><div><dt>Expected class</dt><dd>{benchmark.expectedArtworkClass}</dd></div><div><dt>Expected renderer</dt><dd>{benchmark.expectedRenderer}</dd></div><div><dt>Validation</dt><dd>{benchmark.validationStatus}</dd></div><div><dt>Target profile</dt><dd>{benchmark.targetDeviceProfile}</dd></div></dl><p>{benchmark.notes}</p></article>
    </section>
  </main>
}
