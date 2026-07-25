import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createTextPasteProvenance } from '../shared/domains/art-studio/textProvenance.ts'
import { analyseArtworkDetailed, suggestKingshotClipboardMode } from '../src/render-engine/analyser/index.ts'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { calculateResponsiveLayout, calculateResponsiveScale } from '../src/components/art/fitToContainer.ts'

const expected = { bytes: 431, codepoints: 321, lines: 10, sha256: 'fe6bfe732d320f75e810be9071788a5b749424a7cff20e7e2407161964cf14d2' }
const fixtureBase64 = await readFile(new URL('../fixtures/community-art/kingshot-clipboard-expanded/cat.txt.base64', import.meta.url), 'utf8')
const source = Buffer.from(fixtureBase64.replace(/\s+/g, ''), 'base64').toString('utf8')
assert.equal(new TextEncoder().encode(source).byteLength, expected.bytes)
assert.equal(Array.from(source).length, expected.codepoints)
assert.equal(source.split('\n').length, expected.lines)
assert.equal(createHash('sha256').update(source, 'utf8').digest('hex'), expected.sha256)
assert.equal(source.endsWith('\n'), false)
const provenance = await createTextPasteProvenance(source)
const authored = analyseArtworkDetailed(source, undefined, 'authored')
const clipboard = analyseArtworkDetailed(source, undefined, 'kingshot-clipboard')
assert.equal(provenance.byteLength, new TextEncoder().encode(source).byteLength)
assert.equal(provenance.sha256.length, 64)
assert.ok(clipboard.widestLine < authored.widestLine, 'clipboard mode narrows expanded internal artwork spaces')
assert.deepEqual(buildFixedCellGrid(source.split('\n'), undefined, 'authored').map((row) => row.cells.map((cell) => cell.glyph)).flat(), Array.from(source).filter((glyph) => glyph !== '\n'))
assert.equal(suggestKingshotClipboardMode(source), true)
assert.equal(suggestKingshotClipboardMode('hello world\nplain text'), false)
assert.equal(calculateResponsiveScale(390, 390), 1)
assert.equal(calculateResponsiveScale(390, 780), 0.5)
assert.equal(calculateResponsiveScale(768, 960), 0.8)
assert.equal(calculateResponsiveScale(1280, 960), 1)
assert.ok(calculateResponsiveScale(390, 780) * 780 <= 390)
const mobileLayout = calculateResponsiveLayout(390, 780, 520)
assert.equal(mobileLayout.scaledWidth, mobileLayout.naturalWidth * mobileLayout.scale)
assert.equal(mobileLayout.scaledHeight, mobileLayout.naturalHeight * mobileLayout.scale)
assert.ok(mobileLayout.scaledWidth <= mobileLayout.availableWidth)
assert.equal(mobileLayout.offsetLeft, (390 - mobileLayout.scaledWidth) / 2)
assert.ok(mobileLayout.offsetLeft >= 0)
assert.ok(mobileLayout.offsetLeft + mobileLayout.scaledWidth <= mobileLayout.availableWidth)
assert.equal(mobileLayout.scale, 0.5)
assert.equal(mobileLayout.naturalWidth > mobileLayout.availableWidth, true)
assert.equal(mobileLayout.scaledWidth, 390)
assert.equal(mobileLayout.scaledHeight, 260)
assert.equal(mobileLayout.offsetLeft, 0)
const wideLayout = calculateResponsiveLayout(1280, 780, 520)
assert.equal(wideLayout.scale, 1)
assert.equal(wideLayout.scaledWidth, 780)
assert.equal(wideLayout.scaledHeight, 520)
assert.equal(wideLayout.offsetLeft, 250)
assert.equal(mobileLayout.naturalWidth * mobileLayout.scale, 390)
console.log('Kingshot clipboard rendering profile tests passed.')
