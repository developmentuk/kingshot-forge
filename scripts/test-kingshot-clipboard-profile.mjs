import assert from 'node:assert/strict'
import { createTextPasteProvenance } from '../shared/domains/art-studio/textProvenance.ts'
import { analyseArtworkDetailed, suggestKingshotClipboardMode } from '../src/render-engine/analyser/index.ts'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'

const source = '|          /\\_/\\          |\n|          (  o.o  )          |\n|          >  ^  <          |\nplain heading'
const provenance = await createTextPasteProvenance(source)
const authored = analyseArtworkDetailed(source, undefined, 'authored')
const clipboard = analyseArtworkDetailed(source, undefined, 'kingshot-clipboard')
assert.equal(provenance.byteLength, new TextEncoder().encode(source).byteLength)
assert.equal(provenance.sha256.length, 64)
assert.ok(clipboard.widestLine < authored.widestLine, 'clipboard mode narrows expanded internal artwork spaces')
assert.deepEqual(buildFixedCellGrid(source.split('\n'), undefined, 'authored').map((row) => row.cells.map((cell) => cell.glyph)).flat(), Array.from(source).filter((glyph) => glyph !== '\n'))
assert.equal(source, '|          /\\_/\\          |\n|          (  o.o  )          |\n|          >  ^  <          |\nplain heading')
assert.equal(suggestKingshotClipboardMode(source), true)
assert.equal(suggestKingshotClipboardMode('hello world\nplain text'), false)
console.log('Kingshot clipboard rendering profile tests passed.')
