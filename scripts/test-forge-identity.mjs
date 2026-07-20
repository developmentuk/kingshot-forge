import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const checks = [
  ['migration tables', read('supabase/migrations/20260718195000_forge_identity_management_foundation.sql'), ['forge_user_role_assignments', 'forge_user_account_status', 'forge_user_preferences', 'forge_identity_audit_events', 'force row level security']],
  ['migration grants', read('supabase/migrations/20260718195000_forge_identity_management_foundation.sql'), ['revoke all on table public.forge_user_role_assignments from anon, authenticated', 'revoke all on table public.forge_user_account_status from anon, authenticated', 'get_my_forge_access']],
  ['rpc grant hardening', read('supabase/migrations/20260718203000_forge_identity_rpc_grants.sql'), ['revoke all on function public.get_my_forge_access() from public', 'revoke all on function public.get_my_forge_access() from anon', 'revoke all on function public.handle_new_user() from public']],
  ['server projection', read('server/identity/userManagementService.ts'), ['auth.admin.listUsers', 'safeEmail', 'maskedPlayerId', 'forge_identity_audit_events', 'reason', 'final Owner']],
  ['server authorization', read('server/identity/roleCapabilities.ts'), ['Users cannot assign roles to themselves', 'roles.assign_owner', 'roles.assign_privileged']],
  ['protected API', read('api/operations/users.ts'), ['requireForgeActor', 'assign_role', 'revoke_role', 'change_status']],
  ['browser API boundary', read('src/services/userManagementService.ts'), ['Authorization', '/api/operations/users', 'getSession']],
  ['routes and settings', read('src/App.tsx'), ['operations/users', 'path="settings"']],
  ['workspace access', read('src/navigation/workspaceRegistry.ts'), ["permission: 'users.read'", "label: 'Settings'", 'hasPermission(\'contributions.submit\')']],
]

for (const [name, content, needles] of checks) {
  for (const needle of needles) {
    if (!content.includes(needle)) throw new Error(`${name}: missing ${needle}`)
  }
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`
    return entry.isDirectory() ? sourceFiles(path) : path.endsWith('.ts') || path.endsWith('.tsx') ? [path] : []
  })
}
for (const path of sourceFiles('src')) {
  const content = read(path)
  if (content.includes('auth.users') || content.includes('service_role') || content.includes('serviceRole')) throw new Error(`browser source references a protected auth/service-role surface: ${path}`)
}

console.log('Forge Identity contract checks passed.')
