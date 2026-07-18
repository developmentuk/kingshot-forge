import { readFileSync } from 'node:fs'

const registry = readFileSync('src/navigation/workspaceRegistry.ts', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const layout = readFileSync('src/components/AppLayout.tsx', 'utf8')

const requiredWorkspaces = ['player', 'contributor', 'creator', 'moderation', 'operations']
for (const workspace of requiredWorkspaces) {
  if (!registry.includes(`id: '${workspace}'`)) throw new Error(`Missing workspace: ${workspace}`)
}

for (const forbidden of ['/admin/datasets', '/admin/verification', '/admin/gift-redemption']) {
  const playerSection = registry.slice(registry.indexOf('const playerGroups'), registry.indexOf('const contributorGroups'))
  if (playerSection.includes(forbidden)) throw new Error(`Internal route leaked into Player View: ${forbidden}`)
}

for (const route of ['operations', 'contributor', 'creator', 'moderation']) {
  if (!app.includes(`path="${route}"`)) throw new Error(`Missing workspace route: ${route}`)
}

if (!layout.includes('WorkspaceSwitcher') || !layout.includes('workspaceForPath')) throw new Error('Workspace-aware layout contract is missing')
console.log('Workspace architecture checks passed.')
