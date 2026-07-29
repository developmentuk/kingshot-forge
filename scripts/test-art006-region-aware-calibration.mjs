import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { analyseClipboardDocument, ADAPTIVE_CLIPBOARD_CALIBRATION } from '../src/render-engine/adaptiveCalibration.ts'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { segmentGraphemes } from '../src/render-engine/parser/index.ts'

const root = 'fixtures/community-art/adaptive-clipboard'
const slugs = ['i-have-come-to', 'dont-ask-me', 'ah-ah-oops', 'free-hard-spanking', 'where-is-all-the-good-text-art', 'alliance-coffee-time', 'wow-im-so-cute-expanded']

async function fixture(slug) {
  const metadata = JSON.parse(await readFile(`${root}/${slug}/metadata.json`, 'utf8'))
  const bytes = Buffer.from((await readFile(`${root}/${slug}/${metadata.source.filename}`, 'utf8')).replace(/\s/g, ''), 'base64')
  const source = bytes.toString('utf8')
  return { slug, metadata, bytes, source, lines: source.split(/\r\n|\r|\n/) }
}

for (const slug of slugs) {
  const item = await fixture(slug)
  const grid = buildFixedCellGrid(item.lines, undefined, 'kingshot-clipboard')
  assert.equal(createHash('sha256').update(item.bytes).digest('hex'), item.metadata.source.sha256, `${slug}: SHA-256`)
  assert.equal(item.bytes.byteLength, item.metadata.source.utf8ByteLength, `${slug}: UTF-8 bytes`)
  assert.equal(item.lines.length, item.metadata.source.lineCount, `${slug}: line count`)
  assert.equal(grid.length, item.lines.length, `${slug}: blank and nonblank source rows represented`)
  grid.forEach((row) => {
    assert.equal(row.cells.length, segmentGraphemes(item.lines[row.row]).length, `${slug}/${row.row}: every grapheme has exactly one cell`)
    row.cells.forEach((cell, index) => {
      assert.deepEqual(cell.sourceGlyphs, [cell.glyph], `${slug}/${row.row}/${index}: one literal source grapheme`)
      assert.equal(cell.sourceStartIndex, index)
      assert.equal(cell.sourceEndIndex, index + 1)
      if (index) assert.ok(cell.column > row.cells[index - 1].column, `${slug}/${row.row}/${index}: monotonic source coordinate`)
    })
  })
  assert.equal(grid.flatMap((row) => row.cells.map((cell) => cell.glyph)).join(''), item.lines.join(''), `${slug}: exact clipboard provenance`)
}

const independentSpaces = buildFixedCellGrid([' A A\u3000A'], undefined, 'kingshot-clipboard')[0].cells
const u0020 = independentSpaces.find((cell) => cell.glyph === ' ')
const u3000 = independentSpaces.find((cell) => cell.glyph === '\u3000')
assert.ok(u0020 && u3000)
assert.notEqual(u0020.span, u3000.span, 'U+0020 and U+3000 have independent fitted advances')
assert.equal(u0020.sourceRole, 'u0020-leading')
assert.equal(u3000.sourceRole, 'u3000')

const iHave = await fixture('i-have-come-to')
const iHaveLayout = analyseClipboardDocument(iHave.lines, 'kingshot-clipboard')
const hybridRows = iHaveLayout.rows.slice(1, 5)
assert.deepEqual(hybridRows.map((row) => [row.semanticGapStartIndex, row.semanticGapEndIndex]), [[37, 39], [37, 39], [34, 36], [34, 36]])
assert.ok(hybridRows.every((row) => row.sourceGapGlyphs?.join('') === '  '))
assert.ok(hybridRows.every((row) => (row.semanticGapDistortion ?? Infinity) <= ADAPTIVE_CLIPBOARD_CALIBRATION.maximumSemanticGapDistortion), 'semantic gaps remain below the 2.5× distortion limit')
assert.ok(new Set(hybridRows.map((row) => row.columnAnchor)).size > 1, 'hybrid prose coordinates arise from source advances rather than one normalised anchor')
assert.ok(Math.max(...hybridRows.map((row) => row.columnAnchor ?? 0)) - Math.min(...hybridRows.map((row) => row.columnAnchor ?? 0)) < 1.5, 'shared fitted coefficients retain measured prose alignment without an extreme row')

const dontAsk = await fixture('dont-ask-me')
const dontAskLayout = analyseClipboardDocument(dontAsk.lines, 'kingshot-clipboard')
assert.deepEqual(dontAskLayout.rows.slice(6, 8).map((row) => row.visualAdvanceCells), [1, 1], 'two literal blank advances reproduce measured caption separation')
assert.ok(dontAskLayout.rows.slice(6, 8).every((row) => row.sourceProfile === 'caption-structural'))
assert.equal(dontAskLayout.blocks.some((block) => block.kind === 'hybrid-columns'), false)

const ahAh = await fixture('ah-ah-oops')
const ahAhLayout = analyseClipboardDocument(ahAh.lines, 'kingshot-clipboard')
assert.ok(ahAhLayout.rows.every((row) => row.sourceProfile === 'emoji-structural-control'))
assert.equal(ahAhLayout.blocks.some((block) => block.kind === 'hybrid-columns'), false)
assert.ok(buildFixedCellGrid(ahAh.lines, undefined, 'kingshot-clipboard')[1].cells.some((cell) => cell.glyph === 'Д' || cell.glyph === 'Դ'), 'letter-shaped structural glyph remains literal')

const authored = buildFixedCellGrid(dontAsk.lines, undefined, 'authored')
assert.ok(authored.every((row) => row.visualAdvanceCells === 1 && row.horizontalOffsetCells === 0), 'authored mode remains literal')
assert.equal(authored.flatMap((row) => row.cells.map((cell) => cell.glyph)).join(''), dontAsk.lines.join(''))

const report = JSON.parse(await readFile('artifacts/art006/visible-ink-report.json', 'utf8'))
const measured = (slug) => report.fixtures.find((fixture) => fixture.slug === slug)
const iHaveResiduals = measured('i-have-come-to').residuals.filter((row) => row.sourceRow >= 1 && row.sourceRow <= 6)
assert.ok(iHaveResiduals.every((row) => row.leftError <= .04 && row.rightError <= .04), 'I have come to structural/prose visible bounds remain within 4%')
const iHaveLandmarks = measured('i-have-come-to').landmarkResiduals
assert.ok(iHaveLandmarks.every((row) => row.proseStartError <= .03 && row.structuralEndError <= .04), 'I have come to region landmarks meet 3%/4% tolerances')

const dontResiduals = measured('dont-ask-me').residuals
assert.ok(dontResiduals.filter((row) => row.sourceRow <= 5).every((row) => row.leftError <= .04 && row.rightError <= .04), 'Dont ask me body bounds remain within 4%')
assert.ok(measured('dont-ask-me').captionCentreError <= .03, 'Dont ask me caption centre remains within 3%')
assert.ok(measured('dont-ask-me').captionBaselineError <= .03, 'Dont ask me caption baseline remains within 3%')
assert.ok(measured('dont-ask-me').bodyToCaptionError <= .05, 'Dont ask me body-to-caption distance remains within 5%')

assert.ok(measured('ah-ah-oops').passingRegression.every((row) => row.leftError <= .02 && row.rightError <= .02 && row.centreYError <= .02), 'AH AH oops remains within 2% of passing SHA 410fa')

console.log('ART-006 source-coordinate, region-profile, visible-ink, no-regression and seven-fixture fidelity checks passed.')
