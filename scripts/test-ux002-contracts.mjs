import { readFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')
const checks = [
  ['progression validates Town Center raw level 1..84', 'src/services/playerProgressionService.ts', /Town Center.*1 to 84/],
  ['progression translates raw constraint errors', 'src/services/playerProgressionService.ts', /Progression could not be saved/],
  ['Town Center contract preserves TC30 and TG formatting', 'shared/domains/player-identity/townCenterLevel.ts', /Town Center 30-.*TG\\\$\{tier\}/s],
  ['search uses router navigation', 'src/features/search/SearchExperience.tsx', /navigate\(/],
  ['search skips focus restoration after navigation', 'src/features/search/SearchExperience.tsx', /didNavigateRef/],
  ['Forge Connections has an intentional empty state', 'src/features/search/SearchExperience.tsx', /No related Forge content has been published yet/],
  ['Render Engine is permission-gated in navigation', 'src/navigation/workspaceRegistry.ts', /Render Engine.*render_engine\.view/],
  ['KvK has both presentation modes', 'src/pages/KvkTrackerPage.tsx', /KvkView.*cards.*compact/s],
  ['operations and settings use dark Forge surfaces', 'src/App.css', /UX-002 shared dark surface reconciliation/],
]

for (const [label, path, pattern] of checks) {
  const source = await read(path)
  if (!pattern.test(source)) throw new Error(`UX-002 contract failed: ${label}`)
}

console.log(`UX-002 contract checks passed (${checks.length})`)
