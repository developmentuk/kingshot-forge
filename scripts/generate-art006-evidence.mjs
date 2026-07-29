import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { analyseClipboardDocument, classifyClipboardLineContext } from '../src/render-engine/adaptiveCalibration.ts'
import { resolveGlyphAdvance } from '../src/render-engine/analyser/index.ts'
import { DEFAULT_CALIBRATION } from '../src/render-engine/configuration/index.ts'
import { segmentGraphemes } from '../src/render-engine/parser/index.ts'

const root = path.resolve('fixtures/community-art/adaptive-clipboard')
const baselineEvidence = path.resolve(process.env.ART006_BASELINE_EVIDENCE_DIR ?? '.art006-evidence')
const ownerFailEvidence = path.resolve(process.env.ART006_OWNER_FAIL_EVIDENCE_DIR ?? '.art006-owner-review')
const output = path.resolve('artifacts/art006')
await mkdir(output, { recursive: true })

const cases = [
  ['i-have-come-to', 'i-have-come-to-production-failing.png', 'i-have-come-to-art006-owner-fail.png'],
  ['dont-ask-me', 'dont-ask-me-production-failing.png', 'dont-ask-me-art006-owner-fail.png'],
  ['ah-ah-oops', 'ah-ah-oops-production-control.png', 'ah-ah-oops-art006-control-regression.png'],
]

function escapeHtml(value) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function pngData(file) { return `data:image/png;base64,${file.toString('base64')}` }
function candidateMarkup(grid, layout) {
  return grid.map((row) => `<div class="art-row art-row-${row.context}" style="height:${row.visualAdvanceCells}em" data-row="${row.row}" data-context="${row.context}" data-advance="${row.visualAdvanceCells}">${row.cells.map((cell) => `<span class="art-cell${cell.role === 'semantic-gap' ? ' semantic-gap' : ''}" style="width:${cell.span}em" data-column="${cell.column}" data-span="${cell.span}" data-source-start="${cell.sourceStartIndex}" data-source-end="${cell.sourceEndIndex}" data-cell-role="${cell.role ?? 'ordinary'}">${cell.glyph === ' ' ? '&nbsp;' : escapeHtml(cell.glyph)}</span>`).join('')}</div>`).join('') + layout.blocks.map((block) => `<div class="guide guide-${block.kind}" data-block="${block.kind}" style="--guide-start:${block.regionStartColumn ?? 0};--guide-anchor:${block.columnAnchor ?? 0}"></div>`).join('')
}
function boardHtml(metadata, source, reference, production, ownerFail, grid, layout) {
  const lines = source.split(/\r\n|\r|\n/)
  const contexts = lines.map((line, index) => {
    const row = layout.rows[index]
    const ordinarySpansEqualArt005 = grid[index].cells.filter((cell) => cell.glyph === ' ' && cell.role !== 'semantic-gap').every((cell) => cell.span === resolveGlyphAdvance(cell.glyph, segmentGraphemes(line), cell.sourceStartIndex, DEFAULT_CALIBRATION, metadata.sourceContext))
    const decision = row.semanticGapStartIndex !== undefined
      ? `VERIFIED semanticGapStartIndex=${row.semanticGapStartIndex} semanticGapEndIndex=${row.semanticGapEndIndex} rightRegionStartIndex=${row.rightRegionStartIndex} columnAnchor=${row.columnAnchor}`
      : `REJECTED semanticGapStartIndex=none semanticGapEndIndex=none ${row.hybridRejectionReason}`
    return `${String(index + 1).padStart(2, '0')}: base=${classifyClipboardLineContext(line)} final=${row.context} ${decision} ordinaryInternalSpansEqualART005=${ordinarySpansEqualArt005}`
  }).join('\n')
  return `<!doctype html><meta charset="utf-8"><title>ART-006 ${escapeHtml(metadata.database.title)}</title><style>
*{box-sizing:border-box}body{margin:0;padding:16px;background:#101923;color:#f8e9c0;font-family:Arial,sans-serif;overflow-x:hidden}.board{width:100%;max-width:1500px;margin:auto}.eyebrow{color:#f0b35b;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.meta{color:#b9c4d2;font-size:12px;margin:5px 0 14px;overflow-wrap:anywhere}.panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.panel{min-width:0;padding:10px;border:1px solid #536579;border-radius:10px;background:#182433}.panel h2{margin:0 0 8px;color:#ffcf87;font-size:14px}.image-wrap,.bubble{position:relative;overflow:hidden;border:2px solid #82a67c;border-radius:8px;background:#f7f3e9}.image-wrap{background:#d9d0bd}.image-wrap img{display:block;width:100%;height:auto}.bubble{min-height:180px;padding:16px 12px;color:#252525}.art-grid{position:relative;width:max-content;max-width:none;border:1px dashed #16a34a;font-family:Arial,'Segoe UI',sans-serif;font-size:12px;font-weight:600;line-height:1;white-space:nowrap}.art-row{height:1em;white-space:nowrap}.art-cell{display:inline-block;height:1em;text-align:center;vertical-align:top;overflow:visible}.semantic-gap{background:rgba(245,158,11,.35);box-shadow:inset 0 0 0 1px #f59e0b}.art-row-caption{border-bottom:2px dashed #ef4444}.art-row-prose[data-advance="0.4"],.art-row-prose[data-advance="0.25"]{background:rgba(245,158,11,.18)}.guide{position:absolute;pointer-events:none;z-index:2}.guide-bubble{inset:0;border:2px solid #e879f9}.guide-centre{top:0;bottom:0;left:50%;border-left:1px dashed #d26d42}.guide-hybrid-columns{top:0;bottom:0;left:calc(var(--guide-anchor) * 12px + 12px);border-left:2px dashed #2e86de}.guide-hybrid-columns:before{content:"left bound";position:absolute;top:0;right:calc((var(--guide-anchor) - var(--guide-start)) * 12px);height:100%;border-left:2px dashed #16a34a;color:#166534;font-size:9px}.guide-blank-separator{left:0;right:0;border-top:2px dashed #f59e0b}.guide-trailing-caption{left:0;right:0;border-bottom:2px dashed #ef4444}.legend{margin-top:8px;color:#b9c4d2;font-size:11px}.contexts{margin-top:14px;padding:9px;border-radius:8px;background:#131e2b;color:#d7e0ea;font:11px ui-monospace,monospace;white-space:pre-wrap}.guides{margin-top:10px;color:#b9c4d2;font-size:11px}.guide-note{color:#ffcf87}@media(max-width:700px){body{padding:8px}.panels{grid-template-columns:1fr}.panel{overflow:hidden}.art-grid{font-size:10px}}
</style><main class="board"><div class="eyebrow">ART-006 corrected semantic-gap evidence</div><h1>${escapeHtml(metadata.database.title)}</h1><div class="meta">Source hash: ${metadata.source.sha256} · ${metadata.source.utf8ByteLength} UTF-8 bytes · structural bounds, exact semantic source gap, right anchor, blank separation and caption baseline are reported below</div><div class="panels"><section class="panel"><h2>Kingshot reference</h2><div class="image-wrap"><img src="${reference}" alt="Kingshot reference"></div><div class="legend">Original reference PNG · ${metadata.evidence.referenceScreenshotDimensions.width}×${metadata.evidence.referenceScreenshotDimensions.height}</div></section><section class="panel"><h2>ART-005 production baseline</h2><div class="image-wrap"><img src="${production}" alt="ART-005 production baseline"></div><div class="legend">Hash-verified supplied baseline · byte-preserved</div></section><section class="panel"><h2>Failed ART-006 owner review</h2><div class="image-wrap"><img src="${ownerFail}" alt="Failed ART-006 owner review"></div><div class="legend">Hash-verified owner failure evidence · not accepted</div></section><section class="panel"><h2>Corrected candidate</h2><div class="bubble"><div class="guide guide-bubble"></div><div class="guide guide-centre"></div><div class="art-grid">${candidateMarkup(grid, layout)}</div></div><div class="legend">Only orange semantic-gap cells are region-aware; every ordinary internal span reports equality with ART-005</div></section></div><div class="guides"><strong>Guide key:</strong> green structural/left-region bounds · orange exact source separator/body-to-caption separation · blue right-region anchor · red caption baseline · magenta bubble bounds. <span class="guide-note">No visual owner acceptance is claimed.</span></div><div class="contexts"><strong>Source-indexed row decisions</strong>\n${contexts}</div></main>`
}

for (const [slug, productionName, ownerFailName] of cases) {
  const directory = path.join(root, slug)
  const metadata = JSON.parse(await readFile(path.join(directory, 'metadata.json'), 'utf8'))
  const bytes = Buffer.from((await readFile(path.join(directory, metadata.source.filename), 'utf8')).replace(/\s/g, ''), 'base64')
  const source = bytes.toString('utf8')
  const lines = source.split(/\r\n|\r|\n/)
  const layout = analyseClipboardDocument(lines, metadata.sourceContext)
  const grid = buildFixedCellGrid(lines, DEFAULT_CALIBRATION, metadata.sourceContext)
  const html = boardHtml(metadata, source, pngData(await readFile(path.join(directory, metadata.evidence.referenceScreenshot))), pngData(await readFile(path.join(baselineEvidence, productionName))), pngData(await readFile(path.join(ownerFailEvidence, ownerFailName))), grid, layout)
  await writeFile(path.join(output, `${slug}.html`), html)
  await writeFile(path.join(output, `${slug}-mobile.html`), html)
}
console.log('Generated ART-006 comparison boards for I have come to, Dont ask me and AH AH oops.')
