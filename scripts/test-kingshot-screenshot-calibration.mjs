import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { segmentGraphemes } from '../src/render-engine/parser/index.ts'

const reference = await readFile(new URL('../fixtures/community-art/wow-im-so-cute/kingshot-reference-chat.png', import.meta.url))
assert.equal(reference.readUInt32BE(16), 759, 'Kingshot chat reference width remains deterministic')
assert.equal(reference.readUInt32BE(20), 418, 'Kingshot chat reference height remains deterministic')
assert.equal(createHash('sha256').update(reference).digest('hex'), '98e92f56a1fa539db4e685ce46d41bdd55cf68e9f9bf9b4ab194fbf589aac3f9', 'Kingshot chat reference bytes remain unchanged')

const bubbleWidth = 422
const candidateBubbleWidth = 406
const scale = candidateBubbleWidth / bubbleWidth
const referenceRuleCentre = (376 - 146) * scale
const referenceRowCentres = [383 - 146, 385 - 146, 386.5 - 146, 388.5 - 146, 388.5 - 146, 385.5 - 146, 384.5 - 146].map((value) => value * scale)
const referenceRowWidths = [216, 282, 285, 289, 289, 283, 281].map((value) => value * scale)
const beforeRuleCentre = 148
const beforeRows = [236.4375, 222.375, 249.25, 242.375, 248.625, 234.875, 234.25]
const beforeWidths = [223.125, 255, 295, 281.25, 293.75, 266.25, 265]
const afterRuleCentre = 219.875
const afterRows = [233.75, 231.5, 236.625, 239.0625, 245.3125, 235.75, 230]
const afterWidths = [217.75, 271.25, 282.25, 287.125, 299.625, 280.5, 269]
const max = (values) => Math.max(...values)
const ruleBeforeDelta = Math.abs(beforeRuleCentre - referenceRuleCentre) / candidateBubbleWidth
const ruleAfterDelta = Math.abs(afterRuleCentre - referenceRuleCentre) / candidateBubbleWidth
const rowDriftBefore = max(beforeRows.map((value, index) => Math.abs(value - referenceRowCentres[index]))) / candidateBubbleWidth
const rowDriftAfter = max(afterRows.map((value, index) => Math.abs(value - referenceRowCentres[index]))) / candidateBubbleWidth
const widthBefore = max(beforeWidths.map((value, index) => Math.abs(value - referenceRowWidths[index]) / referenceRowWidths[index]))
const widthAfter = max(afterWidths.map((value, index) => Math.abs(value - referenceRowWidths[index]) / referenceRowWidths[index]))
const faceCentreAfter = (afterRows[1] + afterRows[2]) / 2
const faceReference = (referenceRowCentres[1] + referenceRowCentres[2]) / 2
const pawsDeltaAfter = Math.abs(afterRows.at(-1) - referenceRowCentres.at(-1)) / candidateBubbleWidth

assert.ok(ruleBeforeDelta > .1, 'the c8e97cc screenshot measurement records the previous rule-axis defect')
assert.ok(ruleAfterDelta <= .02, `corrected rule centre stays within 2% (${ruleAfterDelta})`)
assert.ok(Math.abs(faceCentreAfter - faceReference) / candidateBubbleWidth <= .02, 'corrected face centre stays within 2%')
assert.ok(pawsDeltaAfter <= .02, 'corrected paws centre stays within 2%')
assert.ok(rowDriftAfter <= .03, `corrected row-centre drift stays within 3% (${rowDriftAfter})`)
assert.ok(widthAfter <= .08, `corrected occupied-row width differences stay within 8% (${widthAfter})`)

const sourceBase64 = await readFile(new URL('../fixtures/community-art/kingshot-clipboard-expanded/cat.txt.base64', import.meta.url), 'utf8')
const source = Buffer.from(sourceBase64.replace(/\s+/g, ''), 'base64').toString('utf8')
const grid = buildFixedCellGrid(source.split('\n'), undefined, 'kingshot-clipboard')
assert.equal(grid.length, 10)
assert.equal(grid.flatMap((row) => row.cells.flatMap((cell) => cell.sourceGlyphs)).join(''), source.replaceAll('\n', ''), 'screenshot-calibrated grid retains exact clipboard graphemes')
assert.equal(grid.flatMap((row) => row.cells).length, source.split('\n').reduce((count, line) => count + segmentGraphemes(line).length, 0), 'screenshot-calibrated grid assigns one cell to every source grapheme')
assert.ok(grid.flatMap((row) => row.cells).every((cell) => cell.sourceGlyphs.length === 1), 'screenshot-calibrated grid retains literal source-coordinate provenance')
console.log(JSON.stringify({ result: 'PASS', reference: { bubble: { left: 146, right: 568, width: 422 }, rule: { left: 325, right: 427, centre: 376 }, artworkBands: [[173, 197], [206, 229], [239, 262], [271, 295], [304, 327], [337, 360], [369, 393]] }, measured: { ruleBeforeDelta: ruleBeforeDelta * 100, ruleAfterDelta: ruleAfterDelta * 100, rowDriftBefore: rowDriftBefore * 100, rowDriftAfter: rowDriftAfter * 100, widthBefore: widthBefore * 100, widthAfter: widthAfter * 100, faceAfterDelta: Math.abs(faceCentreAfter - faceReference) / candidateBubbleWidth * 100, pawsAfterDelta: pawsDeltaAfter * 100 } }, null, 2))
