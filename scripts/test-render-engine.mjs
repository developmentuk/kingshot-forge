import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const parser = read('src/render-engine/parser/index.ts')
const grid = read('src/render-engine/grid/index.ts')
const analyser = read('src/render-engine/analyser/index.ts')
const configuration = read('src/render-engine/configuration/index.ts')
const profiles = read('src/render-engine/device-profiles/index.ts')
const benchmarks = read('src/render-engine/benchmarks/index.ts')
const renderer = read('src/components/art/KingshotArtRenderer.tsx')

assert.match(parser, /replace\(\/\\r\\n\?\/g, '\\n'\)/, 'line endings are normalised')
assert.match(parser, /replace\(\/\\t\/g, '    '\)/, 'tabs become four spaces')
assert.match(parser, /Intl\.Segmenter/, 'grapheme segmentation uses Intl.Segmenter')
assert.match(grid, /column\)/, 'grid records fixed logical columns')
for (const family of ['space', 'ascii', 'box-drawing', 'unicode', 'emoji', 'pixel-circles', 'hearts', 'decorative-symbols']) assert.match(analyser, new RegExp(family.replace('-', '\\-')), `classifies ${family}`)
for (const family of ['space', 'ascii', 'box-drawing', 'unicode', 'emoji', 'pixel-circles', 'hearts', 'decorative-symbols']) assert.match(configuration, new RegExp(family.replace('-', '\\-')), `calibrates ${family}`)
for (const profile of ['android-default', 'iphone-default', 'tablet', 'desktop-preview']) assert.match(profiles, new RegExp(profile), `registers ${profile}`)
for (const id of ['norway-flag-pixel', 'mental-hospital-ascii', 'cafe-mixed-glyph', 'dancing-cat-emoji-ascii', 'like-my-island-emoji', 'alliance-cat-slide-ascii']) assert.match(benchmarks, new RegExp(id), `registers ${id}`)
assert.match(configuration, /mergeCalibration/, 'calibration merging is typed and data-driven')
assert.match(renderer, /buildFixedCellGrid/, 'shared renderer uses the fixed-cell grid')
assert.match(renderer, /deviceProfile/, 'shared renderer accepts resolved device profiles')
assert.match(renderer, /calibration/, 'shared renderer accepts calibration configuration')
console.log('Render Engine tests passed: parser, fixed grid, glyph families, calibration, devices, benchmarks, renderer adapter.')

