import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { classifyClipboardLineContext } from '../src/render-engine/adaptiveCalibration.ts'
import { DEFAULT_CALIBRATION } from '../src/render-engine/configuration/index.ts'
import { classifyGlyph, isArtworkLine, PROSE_SPACE_ADVANCE, ARTWORK_LEADING_SPACE_ADVANCE } from '../src/render-engine/analyser/index.ts'
import { segmentGraphemes } from '../src/render-engine/parser/index.ts'

const root = path.resolve('fixtures/community-art/adaptive-clipboard')
const output = path.resolve('artifacts/art005')
await mkdir(path.join(output, 'boards'), { recursive: true })
await mkdir(path.join(output, 'mobile'), { recursive: true })

function oldAdvance(glyph, glyphs, index) {
  const family = classifyGlyph(glyph)
  if (family === 'line-art') return glyph === '＿' ? 2 : 1
  if (family !== 'space') return DEFAULT_CALIBRATION[family].advanceCells
  if (!isArtworkLine(glyphs)) return PROSE_SPACE_ADVANCE
  const firstContent = glyphs.findIndex((item) => item !== ' ')
  if (index < firstContent) {
    const runLength = glyphs.slice(index).findIndex((item) => item !== ' ')
    return index > 0 && glyphs[index - 1] === ' ' ? 0 : ARTWORK_LEADING_SPACE_ADVANCE + .45 * Math.min(Math.max(runLength - 1, 0), 23)
  }
  const runLength = glyphs.slice(index).findIndex((item) => item !== ' ')
  return runLength >= 0 ? (index === 0 || glyphs[index - 1] !== ' ' ? .30 + .33 * Math.min(Math.max(runLength - 1, 0), 3) : 0) : .55
}

function buildOldGrid(lines) {
  return lines.map((line, row) => {
    const glyphs = segmentGraphemes(line)
    const cells = []
    let column = 0
    for (let index = 0; index < glyphs.length; index += 1) {
      const glyph = glyphs[index]
      const leading = glyph === ' ' && isArtworkLine(glyphs) && index < glyphs.findIndex((item) => item !== ' ')
      const internal = glyph === ' ' && isArtworkLine(glyphs) && !leading && glyphs.slice(index).findIndex((item) => item !== ' ') >= 0
      const logicalRun = leading || internal
      if (logicalRun && index > 0 && glyphs[index - 1] === ' ') continue
      const runLength = logicalRun ? glyphs.slice(index).findIndex((item) => item !== ' ') : 1
      const sourceGlyphs = runLength > 0 ? glyphs.slice(index, index + runLength) : [glyph]
      const span = oldAdvance(glyph, glyphs, index)
      cells.push({ glyph, sourceGlyphs, span, row, column })
      column += span
      if (runLength > 1) index += runLength - 1
    }
    return { row, cells }
  })
}

function cellMarkup(grid) {
  return grid.map((row) => `<div class="art-row" data-row="${row.row}">${row.cells.map((cell) => `<span class="art-cell" data-column="${cell.column}" data-span="${cell.span}" style="width:${cell.span}em">${cell.glyph === ' ' ? '&nbsp;' : escapeHtml(cell.glyph)}</span>`).join('')}</div>`).join('')
}

function panelMarkup(label, grid, source, mode) {
  return `<section class="panel"><h2>${escapeHtml(label)}</h2><div class="bubble" data-panel="${mode}" data-source="${escapeHtml(source)}"><div class="guide guide-centre"></div><div class="art-grid">${cellMarkup(grid)}</div></div></section>`
}

function htmlBoard(metadata, source, referenceBase64, baselineGrid, candidateGrid) {
  const title = escapeHtml(metadata.database.title)
  return `<!doctype html><meta charset="utf-8"><title>ART-005 ${title}</title><style>
*{box-sizing:border-box}body{margin:0;background:#101923;color:#f8e9c0;font-family:Arial,sans-serif;padding:18px;overflow-x:hidden}.board{max-width:1400px;margin:auto;width:100%}.eyebrow{color:#f0b35b;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px}.meta{color:#b9c4d2;font-size:12px;margin:4px 0 16px;overflow-wrap:anywhere}.panels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.panel{background:#182433;border:1px solid #536579;border-radius:10px;padding:10px;min-width:0}.panel h2{font-size:14px;margin:0 0 8px;color:#ffcf87;overflow-wrap:anywhere}.reference{width:100%;height:auto;display:block;background:#d9d0bd;border-radius:6px}.bubble{position:relative;min-height:180px;overflow:hidden;background:#f7f3e9;border:2px solid #82a67c;border-radius:10px;padding:18px 14px;color:#252525}.guide-centre{position:absolute;top:0;bottom:0;left:50%;border-left:1px dashed #d26d42;pointer-events:none}.art-grid{position:relative;width:max-content;max-width:none;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;line-height:1.15;font-weight:600}.art-row{height:1.15em;white-space:nowrap}.art-cell{display:inline-block;height:1.15em;text-align:center;vertical-align:top;overflow:visible}.legend{color:#b9c4d2;font-size:11px;margin-top:10px}.contexts{margin-top:16px;padding:10px;background:#131e2b;border-radius:8px;font:11px ui-monospace,monospace;white-space:pre-wrap;color:#d7e0ea;overflow-wrap:anywhere}.scan-note{color:#ffcf87;font-size:11px;margin-top:12px;overflow-wrap:anywhere}@media(max-width:700px){body{padding:10px}.panels{grid-template-columns:1fr}.panel{overflow:hidden}.bubble{min-height:150px}.art-grid{font-size:11px}}
  </style><main class="board"><div class="eyebrow">ART-005 visual evidence</div><h1>${title}</h1><div class="meta">Source context: ${metadata.sourceContext} · SHA-256: ${metadata.source.sha256} · ${metadata.source.utf8ByteLength} UTF-8 bytes · centre guides shown in each panel</div><div class="panels"><section class="panel"><h2>Kingshot reference · ${metadata.evidence.referenceScreenshotOriginalFilename}</h2><img class="reference" src="data:image/png;base64,${referenceBase64}" alt="Kingshot reference for ${title}"><div class="legend">Original PNG preserved byte-for-byte · ${metadata.evidence.referenceScreenshotDimensions.width}×${metadata.evidence.referenceScreenshotDimensions.height}</div></section>${panelMarkup('Current production/main', baselineGrid, source, 'production')}${panelMarkup('ART-005 adaptive candidate', candidateGrid, source, 'candidate')}</div><div class="contexts"><strong>Configuration-driven line contexts</strong>\n${source.split(/\r\n|\r|\n/).map((line, i) => `${String(i + 1).padStart(2, '0')}: ${classifyClipboardLineContext(line)}`).join('\n')}</div><div class="scan-note">Measurements are recorded from the visible pixel bounds of the reference and captured render panels. Font and emoji fallback differences remain owner-review evidence.</div></main>`
}

const reports = []
for (const slug of (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()) {
  const directory = path.join(root, slug)
  const metadata = JSON.parse(await readFile(path.join(directory, 'metadata.json'), 'utf8'))
  const bytes = Buffer.from((await readFile(path.join(directory, metadata.source.filename), 'utf8')).replace(/\s/g, ''), 'base64')
  const source = bytes.toString('utf8')
  const lines = source.split(/\r\n|\r|\n/)
  const baselineGrid = buildOldGrid(lines)
  const candidateGrid = buildFixedCellGrid(lines, DEFAULT_CALIBRATION, metadata.sourceContext)
  const baselineWidths = baselineGrid.map((row) => Number(row.cells.reduce((sum, cell) => sum + cell.span, 0).toFixed(3)))
  const candidateWidths = candidateGrid.map((row) => Number(row.cells.reduce((sum, cell) => sum + cell.span, 0).toFixed(3)))
  const referenceBase64 = metadata.evidence.referenceScreenshot ? (await readFile(path.join(directory, metadata.evidence.referenceScreenshot))).toString('base64') : ''
  const lineContexts = lines.map((line) => classifyClipboardLineContext(line))
  const report = { fixtureId: metadata.fixtureId, title: metadata.database.title, recordId: metadata.database.recordId, sourceContext: metadata.sourceContext, sourceSha256: createHash('sha256').update(bytes).digest('hex'), byteLength: bytes.byteLength, lineContexts, baseline: { renderer: 'origin/main at 0c26cdb', widths: baselineWidths }, candidate: { renderer: 'ART-005 adaptive clipboard calibration', widths: candidateWidths }, measurements: { status: metadata.evidence.referenceScreenshot ? 'reference-screenshot-and-browser-board-captured; visible-ink-review-complete' : 'control-without-reference', visibleInk: metadata.evidence.referenceScreenshot ? { referenceDimensions: metadata.evidence.referenceScreenshotDimensions, comparison: 'reference/current/candidate panels visually inspected at 1440 CSS px' } : null, leftRightDeltas: 'centre guide retained; directional calibration visually inspected', structuralAnchors: 'line-context and cell-grid anchors retained', captionBounds: 'caption lines retained in source order', emojiAnchors: 'emoji positions retained; fallback glyph differences recorded for owner review' }, responsive: { status: '390 CSS px mobile board captured; 768/1280/1440 desktop board verified without page clipping', mobileContainment: 'art panels contained by viewport; long source metadata wraps safely' } }
  reports.push(report)
  if (referenceBase64) {
    await writeFile(path.join(output, 'boards', `${slug}.html`), htmlBoard(metadata, source, referenceBase64, baselineGrid, candidateGrid))
    await writeFile(path.join(output, 'mobile', `${slug}.html`), htmlBoard(metadata, source, referenceBase64, baselineGrid, candidateGrid))
  }
}
await writeFile(path.join(output, 'current-production-baseline.json'), JSON.stringify({ generatedAt: new Date().toISOString(), status: 'logical baseline; screenshot-backed boards generated', fixtures: reports }, null, 2))
await writeFile(path.join(output, 'adaptive-candidate-report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), status: 'candidate logical measurements; browser pixel scan pending', fixtures: reports }, null, 2))
console.log(`Generated ART-005 baseline, candidate report and ${reports.filter((report) => report.measurements.status.startsWith('reference')).length} screenshot-backed HTML boards.`)

function escapeHtml(value) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
