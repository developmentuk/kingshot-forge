import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { DEFAULT_CALIBRATION } from '../src/render-engine/configuration/index.ts'
import { analyseArtworkDetailed, ARTWORK_LEADING_SPACE_ADVANCE, ARTWORK_SPACE_ADVANCE, PROSE_SPACE_ADVANCE, isArtworkLine } from '../src/render-engine/analyser/index.ts'
import { segmentGraphemes } from '../src/render-engine/parser/index.ts'

const prose = buildFixedCellGrid(['word gap'], DEFAULT_CALIBRATION)[0].cells
const proseSpace = prose.find((cell) => cell.glyph === ' ')
assert.equal(proseSpace?.span, PROSE_SPACE_ADVANCE, 'prose spaces use the prose advance')

const layout = buildFixedCellGrid(['     / | _'], DEFAULT_CALIBRATION)[0].cells
assert.equal(layout.filter((cell) => cell.glyph === ' ').at(0)?.span, ARTWORK_LEADING_SPACE_ADVANCE, 'leading artwork spaces stay compact')
assert.equal(layout.filter((cell) => cell.glyph === ' ').at(-1)?.span, ARTWORK_SPACE_ADVANCE, 'internal artwork spaces use the layout advance')
assert.equal(isArtworkLine(segmentGraphemes('  / | _')), true, 'structural composition selects artwork spacing')
assert.equal(isArtworkLine(segmentGraphemes('a short word')), false, 'prose composition remains prose')

const runText = `/ ${' '.repeat(6)}|`
const authoredRun = buildFixedCellGrid([runText], DEFAULT_CALIBRATION, 'authored')[0].cells.filter((cell) => cell.glyph === ' ')
const clipboardRun = buildFixedCellGrid([runText], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.filter((cell) => cell.glyph === ' ')
assert.equal(authoredRun.length, 7, 'authored mode retains every ordinary space')
assert.ok(authoredRun.every((cell) => cell.sourceGlyphs.length === 1 && cell.span === ARTWORK_SPACE_ADVANCE), 'authored internal spaces remain literal')
assert.equal(clipboardRun.length, 1, 'clipboard mode collapses an internal ordinary-space run into one visual token')
assert.equal(clipboardRun[0]?.sourceGlyphs.length, 7, 'clipboard visual token retains all source graphemes')
assert.equal(clipboardRun[0]?.span, 1.29, 'clipboard logical gap uses the bounded run transfer function')
const leadingRun = buildFixedCellGrid([`${' '.repeat(24)}＿_＿＿_`], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.find((cell) => cell.glyph === ' ')
assert.equal(leadingRun?.sourceGlyphs.length, 24, 'clipboard leading run retains every source grapheme')
assert.ok(Math.abs((leadingRun?.span ?? 0) - 10.55) < 0.000001, 'clipboard artwork leading runs use separate screenshot-grounded calibration')
assert.equal(buildFixedCellGrid(['word gap'], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.find((cell) => cell.glyph === ' ')?.span, PROSE_SPACE_ADVANCE, 'clipboard prose spaces remain unchanged')
const leading = buildFixedCellGrid([`     / |`], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.filter((cell) => cell.glyph === ' ')
assert.equal(leading[0]?.sourceGlyphs.length, 5, 'clipboard leading indentation retains its source run')
assert.ok(Math.abs((leading[0]?.span ?? 0) - 2) < 0.000001, 'clipboard leading indentation uses the separate calibrated run model')
const trailing = buildFixedCellGrid(['/ |   '], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.filter((cell) => cell.glyph === ' ')
assert.equal(trailing.length, 4, 'clipboard trailing spaces remain represented')
assert.ok(trailing.slice(-3).every((cell) => cell.sourceGlyphs.length === 1), 'clipboard trailing spaces remain source-preserved')
const ideographic = buildFixedCellGrid(['/\u3000|'], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.find((cell) => cell.glyph === '\u3000')
assert.equal(ideographic?.span, 2, 'ideographic spaces retain their calibrated full-width span')

const mixedSource = '  ＿_＿＿_'
const mixed = buildFixedCellGrid([mixedSource], DEFAULT_CALIBRATION)[0].cells
const lineArt = mixed.filter((cell) => cell.family === 'line-art')
assert.equal(lineArt.map((cell) => cell.glyph).join(''), '＿_＿＿_', 'mixed line-art glyphs remain source-identical')
assert.deepEqual(lineArt.map((cell) => cell.span), [2, 1, 2, 2, 1], 'mixed line-art glyphs retain calibrated full-width/ASCII ratios')
assert.equal(analyseArtworkDetailed(mixedSource).graphemeCount, segmentGraphemes(mixedSource).length, 'analysis preserves every grapheme')

const fixturePath = 'fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt'
const source = fs.readFileSync(fixturePath)
assert.equal(createHash('sha256').update(source).digest('hex'), 'c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79', 'canonical fixture bytes remain unchanged')
console.log('Context calibration tests passed: prose/layout spaces, structural classifier, contiguous line-art geometry, grapheme preservation and canonical bytes.')
