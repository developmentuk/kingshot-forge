import assert from 'node:assert/strict'
import fs from 'node:fs'

const migration = fs.readFileSync(
  'supabase/migrations/20260719210000_rc4_security_definer_hardening.sql',
  'utf8',
)
const normalizedMigration = migration.replace(/\s+/g, ' ')

for (const functionSignature of [
  'public.assign_forge_id()',
  'public.can_manage_alliance(uuid)',
  'public.can_manage_alliance_members(uuid)',
  'public.can_manage_transfer_window(uuid)',
  'public.current_user_role()',
  'public.generate_forge_id()',
  'public.log_transfer_application_status()',
  'public.sync_player_kingdom_membership()',
]) {
  assert.match(
    normalizedMigration,
    new RegExp(`revoke all on function ${functionSignature.replace(/[()[\]]/g, '\\$&')}`),
    `legacy function is not revoked: ${functionSignature}`,
  )
}

assert.match(normalizedMigration, /alter function public\.set_feedback_report_updated_at\(\)[\s\S]*set search_path = public/)
assert.match(normalizedMigration, /revoke all on function public\.request_alliance_membership\(uuid, text\)[\s\S]*from public, anon, authenticated/)
assert.match(normalizedMigration, /grant execute on function public\.request_alliance_membership\(uuid, text\) to authenticated/)
assert.match(normalizedMigration, /grant execute on function public\.get_my_forge_access\(\) to authenticated/)
assert.doesNotMatch(normalizedMigration, /grant execute on function public\.[^;]+ to anon/)

for (const path of ['src']) {
  const files = []
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = `${directory}/${entry.name}`
      if (entry.isDirectory()) walk(fullPath)
      else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(fullPath)
    }
  }
  walk(path)
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|VITE_SUPABASE_SERVICE_ROLE_KEY/)
  }
}

console.log('RC4 security hardening checks passed.')
