import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { calculateResponsiveLayout, calculateResponsiveScale } from '../src/components/art/fitToContainer.ts'

const widthSource = await readFile('src/components/art/fitToContainer.ts', 'utf8')
const renderer = await readFile('src/components/art/KingshotArtRenderer.tsx', 'utf8')
const page = await readFile('src/pages/ArtStudioPage.tsx', 'utf8')
const styles = await readFile('src/styles/legacy/02-studios.css', 'utf8')

assert.deepEqual(calculateResponsiveLayout(390, 780, 520), {
  availableWidth: 390, availableHeight: 0, naturalWidth: 780, naturalHeight: 520,
  scale: .5, scaledWidth: 390, scaledHeight: 260, offsetLeft: 0, offsetTop: 0,
})
assert.equal(calculateResponsiveScale(0, 780), 1, 'unmeasured width is safe')
assert.equal(calculateResponsiveScale(390, 0), 1, 'unmeasured natural width is safe')
const wideContain = calculateResponsiveLayout(390, 780, 520, { mode: 'contain', availableHeight: 300 })
assert.equal(wideContain.scale, .5, 'contain respects width when width is the limiting ratio')
assert.equal(wideContain.scaledWidth, 390)
assert.equal(wideContain.scaledHeight, 260)
const tallContain = calculateResponsiveLayout(390, 780, 1040, { mode: 'contain', availableHeight: 300 })
assert.equal(tallContain.scale, 300 / 1040, 'contain respects height when height is the limiting ratio')
assert.ok(tallContain.scaledWidth <= tallContain.availableWidth)
assert.ok(tallContain.scaledHeight <= tallContain.availableHeight)
assert.equal(calculateResponsiveLayout(390, 780, 1040, { mode: 'contain', availableHeight: 0 }).scale, 0.5, 'zero height falls back to width safely')
assert.equal(calculateResponsiveLayout(0, 780, 1040, { mode: 'contain', availableHeight: 300 }).scale, 1, 'zero width remains unscaled until measured')

assert.match(widthSource, /export type ArtworkFitMode = 'width' \| 'contain'/)
assert.match(renderer, /availableHeight = container\.clientHeight/)
assert.match(renderer, /data-fit-mode=\{mode\}/)
assert.match(renderer, /visualViewport\?\.addEventListener\('resize', measure\)/)
assert.match(page, /fitMode=\{zoom === 'fit' && mode === 'kingshot' \? 'contain' : undefined\}/)
assert.match(page, /fitMode="width"/)
assert.doesNotMatch(page, /fitToContainer=/)
assert.match(styles, /grid-template-rows: auto auto auto minmax\(0, 1fr\) auto auto/)
assert.match(styles, /\.art-preview-stage--fit/)
assert.match(styles, /height: calc\(100dvh - env\(safe-area-inset-top\)\)/)

for (const fixture of [
  ['dont-ask-me', 9],
  ['free-hard-spanking', 8],
  ['ah-ah-oops', 9],
  ['i-have-come-to', 9],
  ['where-is-all-the-good-text-art', 7],
]) {
  const metadata = JSON.parse(await readFile(`fixtures/community-art/adaptive-clipboard/${fixture[0]}/metadata.json`, 'utf8'))
  assert.equal(metadata.sourceContext, 'kingshot-clipboard', `${fixture[0]} uses clipboard rendering`) 
  assert.equal(metadata.source.lineCount, fixture[1], `${fixture[0]} keeps all source rows`)
  const layout = calculateResponsiveLayout(358, 358, fixture[1] * 24, { mode: 'contain', availableHeight: 520 })
  assert.ok(layout.scaledHeight <= layout.availableHeight, `${fixture[0]} fits the constrained modal height`)
}

console.log('ART-005 full-preview width/contain fit tests passed.')
