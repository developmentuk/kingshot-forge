import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

async function read(path) {
  return readFile(resolve(process.cwd(), path), 'utf8')
}

function stripSqlComments(sql) {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

const migrationPath = 'supabase/migrations/20260823171000_castle_command_profile_privacy_write_boundary.sql'
const sql = stripSqlComments(await read(migrationPath))

for (const required of [
  'drop policy if exists "Players can view owned or explicitly shared Castle Command profiles"',
  'drop policy if exists "Players can view their own Castle Command profiles"',
  'create policy "Players can view their own Castle Command profiles"',
  'drop policy if exists "Visible Castle Command profile targets are readable"',
  'drop policy if exists "Players can view targets for their own Castle Command profile"',
  'create policy "Players can view targets for their own Castle Command profile"',
  'user_id = auth.uid()',
  "public.current_user_role() in ('admin', 'owner')",
  'revoke insert, update on public.castle_command_profiles from authenticated;',
  'revoke insert, update, delete on public.castle_command_profile_targets from authenticated;',
  'drop policy if exists "Players can create their own Castle Command profile"',
  'drop policy if exists "Players can update their own Castle Command profile"',
  'drop policy if exists "Players can create targets for their own Castle Command profile"',
  'drop policy if exists "Players can update targets for their own Castle Command profile"',
  'drop policy if exists "Players can delete targets for their own Castle Command profile"',
]) {
  assert.ok(sql.includes(required), `F18/F19 final privacy boundary missing ${required}`)
}

assert.equal(sql.includes('users_share_current_alliance'), false, 'final raw-read policies must not use same-alliance relationship sharing')
assert.equal(/share_with_alliance\s*=\s*true/i.test(sql), false, 'final raw-read RLS must not expose another user merely because sharing is enabled')
assert.equal(/grant\s+(?:insert|update)\b[^;]*\bon\s+public\.castle_command_profiles\b[^;]*\bto\s+authenticated\s*;/i.test(sql), false, 'final migration must not re-grant authenticated raw profile writes')
assert.equal(/grant\s+(?:insert|update|delete)\b[^;]*\bon\s+public\.castle_command_profile_targets\b[^;]*\bto\s+authenticated\s*;/i.test(sql), false, 'final migration must not re-grant authenticated raw timing writes')

const scopedSharing = stripSqlComments(await read('supabase/migrations/20260823155500_castle_command_alliance_scoped_sharing.sql'))
assert.ok(scopedSharing.includes('profile.shared_alliance_id = target_alliance_id'), 'alliance projection must enforce exact selected sharing scope')

const lockedSave = stripSqlComments(await read('supabase/migrations/20260823163500_castle_command_deputy_consent_serialization.sql'))
const explicitSaveStart = lockedSave.indexOf('create or replace function public.save_castle_command_profile')
const compatibilitySaveStart = lockedSave.indexOf('create or replace function public.save_castle_command_profile', explicitSaveStart + 1)
const explicitSave = lockedSave.slice(explicitSaveStart, compatibilitySaveStart)
const membershipLock = explicitSave.indexOf('for update of membership;')
const profileWrite = explicitSave.indexOf('insert into public.castle_command_profiles')
assert.ok(membershipLock >= 0 && profileWrite > membershipLock, 'sharing RPC must lock exact membership before profile persistence')
assert.ok(explicitSave.includes('target_shared_alliance_id'))

const service = await read('src/features/castle-command/castleCommandCloudService.ts')
assert.ok(service.includes("supabase.rpc('save_castle_command_profile'"), 'client save must use governed profile-save RPC')
assert.equal(/\.from\(['"]castle_command_profiles['"]\)[\s\S]{0,400}\.(?:insert|update|upsert)\(/.test(service), false, 'client must not raw-write Castle profiles')
assert.equal(/\.from\(['"]castle_command_profile_targets['"]\)[\s\S]{0,400}\.(?:insert|update|upsert|delete)\(/.test(service), false, 'client must not raw-write Castle timing rows')

const migrationFiles = (await readdir(resolve(process.cwd(), 'supabase/migrations')))
  .filter((name) => name.includes('_castle_command_') && name.endsWith('.sql'))
  .sort()
assert.equal(migrationFiles.length, 27, 'Castle Command release chain must contain exactly 27 ordered migrations')
assert.equal(migrationFiles.at(-1), '20260823171000_castle_command_profile_privacy_write_boundary.sql', 'F18/F19 privacy boundary must be the final Castle migration')

const addendum = await read('docs/releases/CASTLE-COMMAND-001F-F18-F19-RELEASE-ADDENDUM.md')
assert.ok(addendum.includes('27 ordered Castle Command migrations'))
assert.ok(addendum.includes('20260823171000_castle_command_profile_privacy_write_boundary.sql'))
assert.ok(addendum.includes('F18'))
assert.ok(addendum.includes('F19'))
assert.ok(addendum.includes('owner/admin-only direct reads'))
assert.ok(addendum.includes('RPC-only authenticated writes'))

console.log('CASTLE-COMMAND-001F F18/F19 tests passed')
