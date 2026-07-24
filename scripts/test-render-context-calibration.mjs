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

const mixedSource = '  ＿_＿＿_'
const mixed = buildFixedCellGrid([mixedSource], DEFAULT_CALIBRATION)[0].cells
const lineArt = mixed.filter((cell) => cell.family === 'line-art')
assert.equal(lineArt.map((cell) => cell.glyph).join(''), '＿_＿＿_', 'mixed line-art glyphs remain source-identical')
assert.deepEqual(lineArt.map((cell) => cell.span), [2, 1, 2, 2, 1], 'mixed line-art glyphs retain calibrated full-width/ASCII ratios')
assert.equal(analyseArtworkDetailed(mixedSource).graphemeCount, segmentGraphemes(mixedSource).length, 'analysis preserves every grapheme')

const fixturePath = '../kingshot-text-lab/fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt'
const source = fs.readFileSync(fixturePath)
assert.equal(createHash('sha256').update(source).digest('hex'), 'c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79', 'canonical fixture bytes remain unchanged')
console.log('Context calibration tests passed: prose/layout spaces, structural classifier, contiguous line-art geometry, grapheme preservation and canonical bytes.')
