import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { analyseClipboardDocument, ADAPTIVE_CLIPBOARD_CALIBRATION } from '../src/render-engine/adaptiveCalibration.ts'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { classifyGlyph, isLogicalInternalSpaceRun, isLogicalLeadingSpaceRun, resolveGlyphAdvance } from '../src/render-engine/analyser/index.ts'
import { DEFAULT_CALIBRATION } from '../src/render-engine/configuration/index.ts'
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
assert.deepEqual([hybridBlock?.startRow, hybridBlock?.endRow], [1, 4], 'all neighbouring prose-bearing rows form one verified block')
assert.ok(hybridBlock?.columnAnchor !== undefined)
assert.ok(iHaveLayout.rows.slice(1, 5).every((row) => row.columnAnchor === hybridBlock.columnAnchor), 'right-column anchor is stable across neighbouring hybrid rows')
assert.ok((hybridBlock?.semanticColumnGap ?? 0) >= ADAPTIVE_CLIPBOARD_CALIBRATION.minimumColumnSeparationCells)
assert.deepEqual(iHaveLayout.rows.slice(1, 5).map((row) => [row.semanticGapStartIndex, row.semanticGapEndIndex]), [[37, 39], [37, 39], [34, 36], [34, 36]], 'semantic separators use exact source indexes')
assert.ok(iHaveLayout.rows.slice(1, 5).every((row) => row.sourceGapGlyphs?.join('') === '  '), 'the exact two-space source runs are retained')

const iHaveGrid = buildFixedCellGrid(iHave.lines, undefined, 'kingshot-clipboard')
const iHaveRightAnchors = iHaveLayout.rows.slice(1, 5).map((layoutRow) => iHaveGrid[layoutRow.row].cells.find((cell) => cell.sourceStartIndex === layoutRow.rightRegionStartIndex)?.column)
assert.ok(iHaveRightAnchors.every((column) => column === iHaveRightAnchors[0]), 'visible right-column text starts at one calibrated anchor')
for (const layoutRow of iHaveLayout.rows.slice(1, 5)) {
  const glyphs = segmentGraphemes(iHave.lines[layoutRow.row])
  const cells = iHaveGrid[layoutRow.row].cells
  const semanticGap = cells.find((cell) => cell.role === 'semantic-gap')
  assert.deepEqual([semanticGap?.sourceStartIndex, semanticGap?.sourceEndIndex], [layoutRow.semanticGapStartIndex, layoutRow.semanticGapEndIndex], `row ${layoutRow.row}: only the verified source run is semantic`)
  assert.equal(semanticGap?.sourceGlyphs.join(''), layoutRow.sourceGapGlyphs?.join(''), `row ${layoutRow.row}: semantic source provenance`)
  for (const cell of cells.filter((cell) => cell.glyph === ' ' && cell.role !== 'semantic-gap')) {
    assert.equal(cell.span, resolveGlyphAdvance(cell.glyph, glyphs, cell.sourceStartIndex, DEFAULT_CALIBRATION, 'kingshot-clipboard'), `row ${layoutRow.row} index ${cell.sourceStartIndex}: ordinary space retains ART-005 span`)
  }
}
assert.equal(iHaveGrid.flatMap((row) => row.cells.flatMap((cell) => cell.sourceGlyphs)).join(''), iHave.lines.join(''), 'hybrid layout retains exact source grapheme provenance')

function art005Baseline(lines) {
  return lines.map((line, row) => {
    const glyphs = segmentGraphemes(line)
    let column = 0
    const cells = []
    for (let index = 0; index < glyphs.length; index += 1) {
      const glyph = glyphs[index]
      const logicalRun = isLogicalInternalSpaceRun(glyphs, index, 'kingshot-clipboard') || isLogicalLeadingSpaceRun(glyphs, index, 'kingshot-clipboard')
      if (logicalRun && index > 0 && glyphs[index - 1] === ' ') continue
      const runLength = logicalRun ? glyphs.slice(index).findIndex((item) => item !== ' ') : 1
      const sourceGlyphs = runLength > 0 ? glyphs.slice(index, index + runLength) : [glyph]
      const span = resolveGlyphAdvance(glyph, glyphs, index, DEFAULT_CALIBRATION, 'kingshot-clipboard')
      cells.push({ glyph, family: classifyGlyph(glyph), sourceStartIndex: index, sourceEndIndex: index + sourceGlyphs.length, sourceGlyphs, span, row, column })
      column += span
      if (runLength > 1) index += runLength - 1
    }
    return cells
  })
}

for (const row of [0, 5, 6, 7, 8]) {
  assert.deepEqual(iHaveGrid[row].cells, art005Baseline(iHave.lines)[row], `I have come to row ${row}: non-column structural geometry equals ART-005`)
}

const dontAsk = await fixture('dont-ask-me')
const dontAskLayout = analyseClipboardDocument(dontAsk.lines, 'kingshot-clipboard')
assert.deepEqual(dontAskLayout.blocks.find((block) => block.kind === 'blank-separator'), { kind: 'blank-separator', startRow: 6, endRow: 7 }, 'blank separator run is a document block')
assert.deepEqual(dontAskLayout.rows.slice(6, 8).map((row) => row.visualAdvanceCells), [ADAPTIVE_CLIPBOARD_CALIBRATION.preCaptionSeparatorAdvance, ADAPTIVE_CLIPBOARD_CALIBRATION.repeatedBlankLineAdvance])
assert.ok(dontAskLayout.rows.every((row) => row.row >= 0), 'every blank source row remains represented in provenance')
assert.equal(dontAskLayout.blocks.some((block) => block.kind === 'hybrid-columns'), false, 'Dont ask me has no hybrid prose column')
const dontAskGrid = buildFixedCellGrid(dontAsk.lines, undefined, 'kingshot-clipboard')
assert.ok(dontAskGrid.every((row) => row.cells.every((cell) => cell.role !== 'semantic-gap')), 'Dont ask me applies no semantic horizontal gap')
assert.deepEqual(dontAskGrid.map((row) => row.cells), art005Baseline(dontAsk.lines), 'Dont ask me horizontal body and caption geometry equal ART-005')

const ahAh = await fixture('ah-ah-oops')
const ahAhLayout = analyseClipboardDocument(ahAh.lines, 'kingshot-clipboard')
const ahAhGrid = buildFixedCellGrid(ahAh.lines, undefined, 'kingshot-clipboard')
assert.equal(ahAhLayout.blocks.some((block) => block.kind === 'hybrid-columns'), false, 'AH AH oops has no hybrid prose region')
assert.ok(ahAhLayout.rows.every((row) => row.semanticGapStartIndex === undefined), 'AH AH oops rejects every semantic-gap proposal')
assert.ok(ahAhGrid[1].cells.some((cell) => cell.glyph === 'Д' || cell.glyph === 'Դ'), 'letter-shaped Д/Դ remains structural source content')
assert.deepEqual(ahAhGrid.map((row) => row.cells), art005Baseline(ahAh.lines), 'AH AH oops horizontal positions exactly equal ART-005')

const negativeLines = [
  '  ( ´Դ` )',
  '  ( • ω •)',
  '/|    U    |',
  '/|      I',
  '/\\',
  '',
  'ordinary caption below artwork',
  '/\\      💦 BODY',
]
const negativeLayout = analyseClipboardDocument(negativeLines, 'kingshot-clipboard')
assert.equal(negativeLayout.blocks.some((block) => block.kind === 'hybrid-columns'), false, 'structural Unicode/ASCII letters, captions and mixed emoji rows do not create prose columns')
assert.ok(negativeLayout.rows.every((row) => row.semanticGapStartIndex === undefined), 'negative rows expose no verified semantic gaps')

const punctuationPositive = analyseClipboardDocument(['/|      |  F*UCK', '/ |     |  A*SS!'], 'kingshot-clipboard')
assert.deepEqual(punctuationPositive.rows.map((row) => [row.semanticGapStartIndex, row.semanticGapEndIndex]), [[9, 11], [9, 11]], 'punctuated ASCII word clusters support exact semantic separators')
assert.equal(punctuationPositive.blocks.filter((block) => block.kind === 'hybrid-columns').length, 1, 'punctuated prose rows form one supported block')

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

console.log('ART-006 exact semantic-gap, negative detection, stable-anchor, ART-005 geometry, separator, authored-mode and seven-fixture fidelity checks passed.')
