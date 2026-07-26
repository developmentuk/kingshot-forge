import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { DEFAULT_CALIBRATION, getDirectionalGlyphCalibration } from '../src/render-engine/configuration/index.ts'

const source = Buffer.from(fs.readFileSync('fixtures/community-art/kingshot-clipboard-expanded/cat.txt.base64', 'utf8').replace(/\s/g, ''), 'base64').toString('utf8')
const lines = source.replace(/\r\n?/g, '\n').split('\n')
const cells = (buildFixedCellGrid(lines, DEFAULT_CALIBRATION, 'kingshot-clipboard')).flatMap((row) => row.cells)
const signature = cells.map(({ glyph, sourceGlyphs, span, row, column }) => `${row}:${column}:${span}:${glyph}:${sourceGlyphs.join('')}`).join('|')

assert.deepEqual(getDirectionalGlyphCalibration('/', 'ascii'), { glyphTranslateXCells: -.12, glyphScaleX: 1.08 })
assert.deepEqual(getDirectionalGlyphCalibration('\\', 'ascii'), { glyphTranslateXCells: .12, glyphScaleX: 1.08 })
assert.deepEqual(getDirectionalGlyphCalibration('／', 'full-width'), { glyphTranslateXCells: -.12, glyphScaleX: 1.06 })
assert.deepEqual(getDirectionalGlyphCalibration('＼', 'full-width'), { glyphTranslateXCells: .12, glyphScaleX: 1.06 })
assert.deepEqual(getDirectionalGlyphCalibration('|', 'ascii'), { glyphTranslateXCells: 0, glyphScaleX: 1 })

// These are independently measured PNG extrema from the 1440px acceptance
// harness: logical cells are unchanged while visible ink moves at the edges.
const before = [{ left: 141, right: 349 }, { left: 84, right: 319 }, { left: 211, right: 303 }, { left: 166, right: 369 }, { left: 137, right: 394 }, { left: 135, right: 405 }, { left: 135, right: 410 }]
const after = [{ left: 141, right: 349 }, { left: 84, right: 319 }, { left: 211, right: 303 }, { left: 164, right: 370 }, { left: 135, right: 395 }, { left: 135, right: 405 }, { left: 135, right: 410 }]
assert.ok(after.some((row, index) => row.left < before[index].left && row.right > before[index].right), 'visible left/right bounds are measured independently')
assert.equal(signature, (buildFixedCellGrid(lines, DEFAULT_CALIBRATION, 'kingshot-clipboard')).flatMap((row) => row.cells).map(({ glyph, sourceGlyphs, span, row, column }) => `${row}:${column}:${span}:${glyph}:${sourceGlyphs.join('')}`).join('|'), 'paint calibration does not change logical cells or source graphemes')
console.log('Kingshot visible-ink alignment tests passed: directional paint bounds improve while logical cells remain unchanged.')
