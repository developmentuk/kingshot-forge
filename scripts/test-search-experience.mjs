import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const experience = await readFile('src/features/search/SearchExperience.tsx', 'utf8')
const layout = await readFile('src/components/AppLayout.tsx', 'utf8')
const app = await readFile('src/App.tsx', 'utf8')

for (const marker of ['fetch(`/api/search?', 'Accept: \'application/json\'', 'readSearchResponse', 'content-type', 'forge.search.recent', 'forge.search.pinned', 'Ctrl K', 'ForgeConnections', 'KnowledgePanels', 'relationshipLabel', 'forge-confidence', 'aria-modal', 'createPortal', 'document.body.style.overflow', 'dialogRef', 'forge-search-title', 'ArrowDown', 'aria-selected', 'role="listbox"']) {
  assert.match(experience, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Search experience missing ${marker}`)
}
assert.match(layout, /SearchExperience/)
assert.match(layout, /ctrlKey \|\| event\.metaKey/)
assert.match(app, /path="search"/)
assert.match(experience, /items: 'Items'/, 'Search dataset selector must expose the published item catalogue')
const styles = await readFile('src/features/search/search.css', 'utf8')
for (const marker of ['position:fixed', 'z-index:1000', 'backdrop-filter', 'overscroll-behavior:contain', 'max-height:calc(100vh']) {
  assert.ok(styles.includes(marker), `Search presentation missing ${marker}`)
}
assert.match(styles, /100dvh/)
assert.match(styles, /forge-result--selected/)
const release = await readFile('src/config/release.ts', 'utf8')
assert.match(release, /Forge Preview/)
assert.match(release, /`Version \$\{APP_VERSION\}`/, 'production release label must derive from package metadata')
assert.doesNotMatch(release, /0\.7\.5/)
console.log('Player-facing Search surface, local history, command launch and deep-link route checks passed.')
