import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { classifyClipboardLineContext } from '../src/render-engine/adaptiveCalibration.ts'
import { DEFAULT_CALIBRATION } from '../src/render-engine/configuration/index.ts'
import { segmentGraphemes } from '../src/render-engine/parser/index.ts'
import { ARTWORK_LEADING_SPACE_ADVANCE, PROSE_SPACE_ADVANCE, isArtworkLine } from '../src/render-engine/analyser/index.ts'

const root = path.resolve('fixtures/community-art/adaptive-clipboard')
const output = path.resolve('artifacts/art005')
await mkdir(path.join(output, 'boards'), { recursive: true })

function oldProductionWidth(line) {
  const glyphs = segmentGraphemes(line)
  const firstContent = glyphs.findIndex((item) => item !== ' ')
  let width = 0
  for (let index = 0; index < glyphs.length; index += 1) {
    const glyph = glyphs[index]
    if (glyph === ' ') {
      if (!isArtworkLine(glyphs)) width += PROSE_SPACE_ADVANCE
      else if (index < firstContent) { if (index === 0 || glyphs[index - 1] !== ' ') width += ARTWORK_LEADING_SPACE_ADVANCE }
      else {
        const runLength = glyphs.slice(index).findIndex((item) => item !== ' ')
        if (index === 0 || glyphs[index - 1] !== ' ') width += .30 + .33 * Math.min(Math.max(runLength - 1, 0), 3)
      }
    } else if (glyph === '＿') width += 2
    else width += DEFAULT_CALIBRATION[ glyph === '\u3000' ? 'ideographic-space' : glyph === '_' ? 'line-art' : 'ascii' ]?.advanceCells ?? 1
  }
  return Number(width.toFixed(3))
}

const reports = []
for (const slug of (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()) {
  const metadata = JSON.parse(await readFile(path.join(root, slug, 'metadata.json'), 'utf8'))
  const bytes = Buffer.from((await readFile(path.join(root, slug, metadata.source.filename), 'utf8')).replace(/\s/g, ''), 'base64')
  const source = bytes.toString('utf8')
  const lines = source.split(/\r\n|\r|\n/)
  const candidateWidths = buildFixedCellGrid(lines, DEFAULT_CALIBRATION, metadata.sourceContext).map((row) => Number(row.cells.reduce((sum, cell) => sum + cell.span, 0).toFixed(3)))
  const baselineWidths = lines.map(oldProductionWidth)
  const lineContexts = lines.map((line) => classifyClipboardLineContext(line))
  const report = { fixtureId: metadata.fixtureId, title: metadata.database.title, recordId: metadata.database.recordId, sourceContext: metadata.sourceContext, sourceSha256: createHash('sha256').update(bytes).digest('hex'), byteLength: bytes.byteLength, lineContexts, baseline: { renderer: 'origin/main at 0c26cdb', widths: baselineWidths }, candidate: { renderer: 'ART-005 adaptive clipboard calibration', widths: candidateWidths }, measurements: { status: 'reference-screenshot-unavailable-in-worktree', visibleInk: null, leftRightDeltas: null, structuralAnchors: null, captionBounds: null, emojiAnchors: null }, responsive: { status: 'requires browser evidence', mobileContainment: null } }
  reports.push(report)
  const rows = lines.map((line, index) => `<text x="24" y="${92 + index * 24}" fill="#f8e9c0" font-family="monospace" font-size="14">${String(index + 1).padStart(2, '0')} ${escapeXml(line || '·')}</text>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${170 + lines.length * 24}"><rect width="100%" height="100%" fill="#101923"/><text x="24" y="28" fill="#f0b35b" font-family="sans-serif" font-size="18">ART-005 · ${escapeXml(metadata.database.title)}</text><text x="24" y="52" fill="#b9c4d2" font-family="sans-serif" font-size="12">Reference: unavailable · baseline: origin/main · candidate: adaptive · guides: bubble centre / visible bounds / anchors</text><rect x="18" y="66" width="1164" height="${40 + lines.length * 24}" fill="#182433" stroke="#536579"/><line x1="600" y1="66" x2="600" y2="${106 + lines.length * 24}" stroke="#d38c46" stroke-dasharray="4 4"/>${rows}<text x="24" y="${130 + lines.length * 24}" fill="#ffcf87" font-family="sans-serif" font-size="12">Visible-ink deltas are intentionally unreported until matching Kingshot screenshots are available.</text></svg>`
  await writeFile(path.join(output, 'boards', `${slug}.svg`), svg)
}
await writeFile(path.join(output, 'current-production-baseline.json'), JSON.stringify({ generatedAt: new Date().toISOString(), status: 'logical baseline; screenshot measurements unavailable', fixtures: reports.map(({ baseline, ...rest }) => ({ ...rest, baseline })) }, null, 2))
await writeFile(path.join(output, 'adaptive-candidate-report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), status: 'candidate logical measurements; visible-ink comparison blocked by unavailable reference screenshots', fixtures: reports }, null, 2))
console.log(`Generated ART-005 baseline, candidate report and ${reports.length} comparison-board SVGs.`)

function escapeXml(value) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
