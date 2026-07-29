import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { analyseClipboardDocument, classifyClipboardLineContext } from '../src/render-engine/adaptiveCalibration.ts'
import { DEFAULT_CALIBRATION } from '../src/render-engine/configuration/index.ts'

const root = path.resolve('fixtures/community-art/adaptive-clipboard')
const evidence = path.resolve('.art006-evidence')
const output = path.resolve('artifacts/art006')
await mkdir(output, { recursive: true })

const cases = [
  ['i-have-come-to', 'i-have-come-to-production-failing.png'],
  ['dont-ask-me', 'dont-ask-me-production-failing.png'],
  ['ah-ah-oops', 'ah-ah-oops-production-control.png'],
]

function escapeHtml(value) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function pngData(file) { return `data:image/png;base64,${file.toString('base64')}` }
function candidateMarkup(grid, layout) {
  return grid.map((row) => `<div class="art-row" style="height:${row.visualAdvanceCells}em" data-row="${row.row}" data-context="${row.context}" data-advance="${row.visualAdvanceCells}">${row.cells.map((cell) => `<span class="art-cell" style="width:${cell.span}em" data-column="${cell.column}" data-span="${cell.span}">${cell.glyph === ' ' ? '&nbsp;' : escapeHtml(cell.glyph)}</span>`).join('')}</div>`).join('') + layout.blocks.map((block) => `<div class="guide guide-${block.kind}" data-block="${block.kind}" style="--guide-start:${block.regionStartColumn ?? 0};--guide-anchor:${block.columnAnchor ?? 0}"></div>`).join('')
}
function boardHtml(metadata, source, reference, production, grid, layout) {
  const contexts = source.split(/\r\n|\r|\n/).map((line, index) => `${String(index + 1).padStart(2, '0')}: ${classifyClipboardLineContext(line)}`).join('\n')
  return `<!doctype html><meta charset="utf-8"><title>ART-006 ${escapeHtml(metadata.database.title)}</title><style>
*{box-sizing:border-box}body{margin:0;padding:16px;background:#101923;color:#f8e9c0;font-family:Arial,sans-serif;overflow-x:hidden}.board{width:100%;max-width:1500px;margin:auto}.eyebrow{color:#f0b35b;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.meta{color:#b9c4d2;font-size:12px;margin:5px 0 14px;overflow-wrap:anywhere}.panels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.panel{min-width:0;padding:10px;border:1px solid #536579;border-radius:10px;background:#182433}.panel h2{margin:0 0 8px;color:#ffcf87;font-size:14px}.image-wrap,.bubble{position:relative;overflow:hidden;border:2px solid #82a67c;border-radius:8px;background:#f7f3e9}.image-wrap{background:#d9d0bd}.image-wrap img{display:block;width:100%;height:auto}.bubble{min-height:180px;padding:16px 12px;color:#252525}.art-grid{position:relative;width:max-content;max-width:none;font-family:Arial,'Segoe UI',sans-serif;font-size:12px;font-weight:600;line-height:1;white-space:nowrap}.art-row{height:1em;white-space:nowrap}.art-cell{display:inline-block;height:1em;text-align:center;vertical-align:top;overflow:visible}.guide{position:absolute;pointer-events:none;z-index:2}.guide-bubble{inset:0;border:2px solid #e879f9}.guide-centre{top:0;bottom:0;left:50%;border-left:1px dashed #d26d42}.guide-hybrid-columns{top:0;bottom:0;left:calc(var(--guide-anchor) * 12px + 12px);border-left:2px dashed #2e86de}.guide-blank-separator{left:0;right:0;border-top:2px dashed #f59e0b}.guide-trailing-caption{left:0;right:0;border-bottom:2px dashed #ef4444}.legend{margin-top:8px;color:#b9c4d2;font-size:11px}.contexts{margin-top:14px;padding:9px;border-radius:8px;background:#131e2b;color:#d7e0ea;font:11px ui-monospace,monospace;white-space:pre-wrap}.guides{margin-top:10px;color:#b9c4d2;font-size:11px}.guide-note{color:#ffcf87}@media(max-width:700px){body{padding:8px}.panels{grid-template-columns:1fr}.panel{overflow:hidden}.art-grid{font-size:10px}}
</style><main class="board"><div class="eyebrow">ART-006 region-aware clipboard rendering</div><h1>${escapeHtml(metadata.database.title)}</h1><div class="meta">Source hash: ${metadata.source.sha256} · ${metadata.source.utf8ByteLength} UTF-8 bytes · guide overlay: bubble bounds, centre, structural/region boundaries, semantic column anchor, blank separator, caption baseline</div><div class="panels"><section class="panel"><h2>Kingshot reference</h2><div class="image-wrap"><img src="${reference}" alt="Kingshot reference"></div><div class="legend">Original reference PNG · ${metadata.evidence.referenceScreenshotDimensions.width}×${metadata.evidence.referenceScreenshotDimensions.height}</div></section><section class="panel"><h2>Current production screenshot</h2><div class="image-wrap"><img src="${production}" alt="Current production screenshot"></div><div class="legend">Supplied production evidence · byte-preserved</div></section><section class="panel"><h2>ART-006 candidate</h2><div class="bubble"><div class="guide guide-bubble"></div><div class="guide guide-centre"></div><div class="art-grid">${candidateMarkup(grid, layout)}</div></div><div class="legend">Fit geometry unchanged; region/block model is visual-layout-only</div></section></div><div class="guides"><strong>Guide key:</strong> magenta bubble bounds · orange centre · blue right-column anchor · yellow separator run · red caption baseline. <span class="guide-note">Visible-ink measurements must be read from the rendered candidate.</span></div><div class="contexts"><strong>Document contexts</strong>\n${contexts}</div></main>`
}

for (const [slug, productionName] of cases) {
  const directory = path.join(root, slug)
  const metadata = JSON.parse(await readFile(path.join(directory, 'metadata.json'), 'utf8'))
  const bytes = Buffer.from((await readFile(path.join(directory, metadata.source.filename), 'utf8')).replace(/\s/g, ''), 'base64')
  const source = bytes.toString('utf8')
  const lines = source.split(/\r\n|\r|\n/)
  const layout = analyseClipboardDocument(lines, metadata.sourceContext)
  const grid = buildFixedCellGrid(lines, DEFAULT_CALIBRATION, metadata.sourceContext)
  const html = boardHtml(metadata, source, pngData(await readFile(path.join(directory, metadata.evidence.referenceScreenshot))), pngData(await readFile(path.join(evidence, productionName))), grid, layout)
  await writeFile(path.join(output, `${slug}.html`), html)
  await writeFile(path.join(output, `${slug}-mobile.html`), html)
}
console.log('Generated ART-006 comparison boards for I have come to, Dont ask me and AH AH oops.')
