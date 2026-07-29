import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { DEFAULT_CALIBRATION } from '../src/render-engine/configuration/index.ts'
import { analyseArtworkDetailed, ARTWORK_LEADING_SPACE_ADVANCE, ARTWORK_SPACE_ADVANCE, PROSE_SPACE_ADVANCE, isArtworkLine } from '../src/render-engine/analyser/index.ts'
import { ADAPTIVE_CLIPBOARD_CALIBRATION } from '../src/render-engine/adaptiveCalibration.ts'
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
assert.equal(clipboardRun.length, 7, 'clipboard mode retains one monotonic coordinate per internal source space')
assert.ok(clipboardRun.every((cell) => cell.sourceGlyphs.length === 1 && cell.span === .42), 'clipboard structural spaces use the shared source-coordinate profile')
const leadingRun = buildFixedCellGrid([`${' '.repeat(24)}＿_＿＿_`], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.filter((cell) => cell.glyph === ' ')
assert.equal(leadingRun.length, 24, 'clipboard leading run retains every source grapheme independently')
assert.ok(leadingRun.every((cell) => cell.sourceGlyphs.length === 1 && cell.span === .38), 'clipboard artwork leading spaces use separate screenshot-grounded coordinates')
assert.equal(buildFixedCellGrid(['word gap'], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.find((cell) => cell.glyph === ' ')?.span, ADAPTIVE_CLIPBOARD_CALIBRATION.sourceAdvances.u0020Caption, 'clipboard caption spaces use the fitted source-coordinate profile')
const leading = buildFixedCellGrid([`     / |`], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.filter((cell) => cell.glyph === ' ')
assert.equal(leading.slice(0, 5).length, 5, 'clipboard leading indentation retains its source run')
assert.ok(leading.slice(0, 5).every((cell) => cell.sourceGlyphs.length === 1 && cell.span === .38), 'clipboard leading indentation uses independent source coordinates')
const trailing = buildFixedCellGrid(['/ |   '], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.filter((cell) => cell.glyph === ' ')
assert.equal(trailing.length, 4, 'clipboard trailing spaces remain represented')
assert.ok(trailing.slice(-3).every((cell) => cell.sourceGlyphs.length === 1), 'clipboard trailing spaces remain source-preserved')
const ideographic = buildFixedCellGrid(['/\u3000|'], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.find((cell) => cell.glyph === '\u3000')
assert.equal(ideographic?.span, .9, 'ideographic spaces use their independently fitted source-coordinate span')

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
