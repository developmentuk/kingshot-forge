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

const playerSection = registry.slice(registry.indexOf('const playerGroups'), registry.indexOf('const contributorGroups'))
if (playerSection.includes('/player-lookup')) throw new Error('Disabled Player Lookup leaked into Player View navigation')
if (layout.includes("path: '/player-lookup'")) throw new Error('Disabled Player Lookup leaked into mobile navigation')

for (const route of ['operations', 'contributor', 'creator', 'moderation']) {
  if (!app.includes(`path="${route}"`)) throw new Error(`Missing workspace route: ${route}`)
}

for (const route of ['operations', 'operations/users', 'operations/users/:userId', 'operations/applications', 'operations/applications/:applicationId', 'operations/roles', 'operations/audit-log', 'operations/feature-flags', 'contributor', 'creator', 'moderation']) {
  const count = (app.match(new RegExp(`<Route path="${route.replace(/[/:]/g, '\\$&')}"`, 'g')) ?? []).length
  if (count !== 1) throw new Error(`Expected exactly one route declaration for ${route}, found ${count}`)
}

for (const guard of ['permission="users.read"', 'permission="applications.read"', 'permission="platform.users.manage"']) {
  if (!app.includes(guard)) throw new Error(`Missing direct-route guard: ${guard}`)
}

if (!app.includes('permission="moderation.manage"')) throw new Error('Community Art moderation route is not capability guarded')
if (!app.includes('permission="cms.view"')) throw new Error('Operations compatibility routes lost their CMS guard')

if (!layout.includes('WorkspaceSwitcher') || !layout.includes('workspaceForPath')) throw new Error('Workspace-aware layout contract is missing')
if (!layout.includes("hasPermission('moderation.manage')")) throw new Error('Moderation capability contract is not documented in the shell')
console.log('Workspace architecture checks passed.')
