import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { analyseClipboardDocument, ADAPTIVE_CLIPBOARD_CALIBRATION } from '../src/render-engine/adaptiveCalibration.ts'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { segmentGraphemes } from '../src/render-engine/parser/index.ts'

const root = 'fixtures/community-art/adaptive-clipboard'

async function fixture(slug) {
  const metadata = JSON.parse(await readFile(`${root}/${slug}/metadata.json`, 'utf8'))
  const encoded = await readFile(`${root}/${slug}/${metadata.source.filename}`, 'utf8')
  const bytes = Buffer.from(encoded.replace(/\s/g, ''), 'base64')
  return { metadata, bytes, source: bytes.toString('utf8'), lines: bytes.toString('utf8').split(/\r\n|\r|\n/) }
}

const iHave = await fixture('i-have-come-to')
const iHaveLayout = analyseClipboardDocument(iHave.lines, 'kingshot-clipboard')
const hybridBlock = iHaveLayout.blocks.find((block) => block.kind === 'hybrid-columns')
assert.deepEqual([hybridBlock?.startRow, hybridBlock?.endRow], [1, 3], 'multi-line hybrid region is detected as one block')
assert.ok(hybridBlock?.columnAnchor !== undefined)
assert.ok(iHaveLayout.rows.slice(1, 4).every((row) => row.columnAnchor === hybridBlock.columnAnchor), 'right-column anchor is stable across neighbouring hybrid rows')
assert.ok((hybridBlock?.semanticColumnGap ?? 0) >= ADAPTIVE_CLIPBOARD_CALIBRATION.minimumColumnSeparationCells)

const iHaveGrid = buildFixedCellGrid(iHave.lines, undefined, 'kingshot-clipboard')
const iHaveRightAnchors = iHaveGrid.slice(1, 4).map((row) => row.cells.find((cell) => /\p{Letter}/u.test(cell.glyph))?.column)
assert.ok(iHaveRightAnchors.every((column) => column === iHaveRightAnchors[0]), 'visible right-column text starts at one calibrated anchor')
assert.equal(iHaveGrid.flatMap((row) => row.cells.flatMap((cell) => cell.sourceGlyphs)).join(''), iHave.lines.join(''), 'hybrid layout retains exact source grapheme provenance')

const dontAsk = await fixture('dont-ask-me')
const dontAskLayout = analyseClipboardDocument(dontAsk.lines, 'kingshot-clipboard')
assert.deepEqual(dontAskLayout.blocks.find((block) => block.kind === 'blank-separator'), { kind: 'blank-separator', startRow: 6, endRow: 7 }, 'blank separator run is a document block')
assert.deepEqual(dontAskLayout.rows.slice(6, 8).map((row) => row.visualAdvanceCells), [ADAPTIVE_CLIPBOARD_CALIBRATION.preCaptionSeparatorAdvance, ADAPTIVE_CLIPBOARD_CALIBRATION.repeatedBlankLineAdvance])
assert.ok(dontAskLayout.rows.every((row) => row.row >= 0), 'every blank source row remains represented in provenance')

const authored = buildFixedCellGrid(dontAsk.lines, undefined, 'authored')
assert.ok(authored.every((row) => row.visualAdvanceCells === 1), 'authored mode remains literal')
assert.equal(authored.length, dontAsk.lines.length)

for (const slug of ['ah-ah-oops', 'free-hard-spanking', 'where-is-all-the-good-text-art', 'dont-ask-me', 'i-have-come-to', 'alliance-coffee-time', 'wow-im-so-cute-expanded']) {
  const item = await fixture(slug)
  assert.equal(createHash('sha256').update(item.bytes).digest('hex'), item.metadata.source.sha256, `${slug}: source hash remains exact`)
  assert.equal(item.bytes.byteLength, item.metadata.source.utf8ByteLength, `${slug}: source bytes remain exact`)
  assert.equal(segmentGraphemes(item.source).length, item.metadata.source.graphemeCount, `${slug}: graphemes remain exact`)
  const grid = buildFixedCellGrid(item.lines, undefined, 'kingshot-clipboard')
  assert.equal(grid.length, item.lines.length, `${slug}: every source row remains represented`)
  assert.equal(grid.flatMap((row) => row.cells.flatMap((cell) => cell.sourceGlyphs)).join(''), item.lines.join(''), `${slug}: clipboard payload provenance remains exact`)
}

console.log('ART-006 region-aware document, hybrid-anchor, separator, authored-mode and seven-fixture fidelity checks passed.')
