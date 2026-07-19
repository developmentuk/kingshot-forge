import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const experience = await readFile('src/features/search/SearchExperience.tsx', 'utf8')
const layout = await readFile('src/components/AppLayout.tsx', 'utf8')
const app = await readFile('src/App.tsx', 'utf8')

for (const marker of ['fetch(`/api/search?', 'forge.search.recent', 'forge.search.pinned', 'Ctrl K', 'ForgeConnections', 'KnowledgePanels', 'relationshipLabel', 'forge-confidence', 'aria-modal', 'createPortal', 'document.body.style.overflow', 'dialogRef', 'forge-search-title']) {
  assert.match(experience, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Search experience missing ${marker}`)
}
assert.match(layout, /SearchExperience/)
assert.match(layout, /ctrlKey \|\| event\.metaKey/)
assert.match(app, /path="search"/)
const styles = await readFile('src/features/search/search.css', 'utf8')
for (const marker of ['position:fixed', 'z-index:1000', 'backdrop-filter', 'overscroll-behavior:contain', 'max-height:calc(100vh']) {
  assert.ok(styles.includes(marker), `Search presentation missing ${marker}`)
}
console.log('Player-facing Search surface, local history, command launch and deep-link route checks passed.')

