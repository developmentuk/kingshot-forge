import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const experience = await readFile('src/features/search/SearchExperience.tsx', 'utf8')
const layout = await readFile('src/components/AppLayout.tsx', 'utf8')
const app = await readFile('src/App.tsx', 'utf8')

for (const marker of ['fetch(`/api/search?', 'forge.search.recent', 'forge.search.pinned', 'Ctrl K', 'ForgeConnections', 'KnowledgePanels', 'relationshipLabel', 'forge-confidence', 'aria-modal']) {
  assert.match(experience, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Search experience missing ${marker}`)
}
assert.match(layout, /SearchExperience/)
assert.match(layout, /ctrlKey \|\| event\.metaKey/)
assert.match(app, /path="search"/)
console.log('Player-facing Search surface, local history, command launch and deep-link route checks passed.')

