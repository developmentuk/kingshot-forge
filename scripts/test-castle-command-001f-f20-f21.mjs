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

const migrationName = '20260823171500_castle_command_membership_term_consent.sql'
const hotfixMigrationName = '20260823185129_castle_command_alliance_authority_execute_hotfix.sql'
const migration = stripSqlComments(await read(`supabase/migrations/${migrationName}`))

for (const required of [
  'create or replace function public.clear_castle_command_sharing_for_membership_term',
  'security definer',
  'share_with_alliance = false',
  'shared_alliance_id = null',
  'profile.user_id = target_user_id',
  'profile.shared_alliance_id = target_alliance_id',
  'create or replace function public.revoke_castle_command_sharing_on_membership_end()',
  "if tg_op = 'DELETE' then",
  "old.status = 'current'::public.alliance_membership_status",
  "new.status is distinct from 'current'::public.alliance_membership_status",
  'new.user_id is distinct from old.user_id',
  'new.alliance_id is distinct from old.alliance_id',
  'after update of status, user_id, alliance_id on public.alliance_memberships',
  'after delete on public.alliance_memberships',
  'not exists (',
  'membership.user_id = profile.user_id',
  'membership.alliance_id = profile.shared_alliance_id',
  "membership.status = 'current'::public.alliance_membership_status",
]) {
  assert.ok(migration.includes(required), `F20 membership-term consent boundary missing ${required}`)
}

const membershipCheck = migration.indexOf("old.status = 'current'::public.alliance_membership_status")
const consentClear = migration.indexOf('perform public.clear_castle_command_sharing_for_membership_term')
assert.ok(membershipCheck >= 0 && consentClear > membershipCheck, 'F20 trigger must identify the ending current membership before clearing consent')
assert.ok(migration.includes('revoke all on function public.clear_castle_command_sharing_for_membership_term(uuid, uuid) from public;'))
assert.ok(migration.includes('revoke all on function public.revoke_castle_command_sharing_on_membership_end() from public;'))

const service = await read('src/features/castle-command/castleCommandCloudService.ts')
assert.ok(service.includes('sharedAllianceId: string | null'), 'F21 cloud save input must carry an explicit alliance scope')
assert.ok(service.includes('target_shared_alliance_id: input.shareWithAlliance ? input.sharedAllianceId : null'), 'F21 client must invoke the explicit scoped save overload')

const workspace = await read('src/features/castle-command/CastleCommandCloudWorkspace.tsx')
assert.ok(workspace.includes("const currentMemberships = memberships.filter((membership) => membership.status === 'current')"), 'workspace must resolve current alliance memberships explicitly')
assert.ok(workspace.includes('profileResult.data?.sharedAllianceId ?? null'), 'workspace should preserve an existing current sharing scope when choosing its alliance')
assert.ok(workspace.includes('currentMemberships.find((membership) => membership.alliance_id === preferredAllianceId)'), 'workspace must prefer the saved exact alliance when it remains current')
assert.ok(workspace.includes('sharedAllianceId: shareWithAlliance ? currentAlliance?.alliance_id ?? null : null'), 'workspace must pass its selected/current alliance into profile save')
assert.ok(workspace.includes('A current Forge alliance is required before Castle Command timings can be shared.'), 'workspace must fail closed when sharing is requested without a current alliance')

const lockedSave = stripSqlComments(await read('supabase/migrations/20260823163500_castle_command_deputy_consent_serialization.sql'))
const explicitSaveStart = lockedSave.indexOf('create or replace function public.save_castle_command_profile')
const compatibilitySaveStart = lockedSave.indexOf('create or replace function public.save_castle_command_profile', explicitSaveStart + 1)
const explicitSave = lockedSave.slice(explicitSaveStart, compatibilitySaveStart)
assert.ok(explicitSave.includes('target_shared_alliance_id uuid'), 'explicit profile-save overload must accept the selected alliance')
const membershipLock = explicitSave.indexOf('for update of membership;')
const profileWrite = explicitSave.indexOf('insert into public.castle_command_profiles')
assert.ok(membershipLock >= 0 && profileWrite > membershipLock, 'explicit scoped save must lock current membership before profile persistence')

const hotfix = stripSqlComments(await read(`supabase/migrations/${hotfixMigrationName}`))
assert.ok(hotfix.includes('revoke all on function public.can_manage_alliance(uuid) from public;'))
assert.ok(hotfix.includes('revoke all on function public.can_manage_alliance_members(uuid) from public;'))
assert.ok(hotfix.includes('grant execute on function public.can_manage_alliance(uuid) to authenticated;'))
assert.ok(hotfix.includes('grant execute on function public.can_manage_alliance_members(uuid) to authenticated;'))
assert.ok(!hotfix.includes('to anon;'), 'alliance authority helpers must remain unavailable to anon')

const migrationFiles = (await readdir(resolve(process.cwd(), 'supabase/migrations')))
  .filter((name) => name.includes('_castle_command_') && name.endsWith('.sql'))
  .sort()
assert.equal(migrationFiles.length, 29, 'Castle Command release chain must contain exactly 29 ordered migrations after production activation hotfix')
assert.ok(migrationFiles.includes(migrationName), 'F20 membership-term consent migration must remain in the governed chain')
assert.equal(migrationFiles.at(-1), hotfixMigrationName, 'production alliance-authority execute hotfix must be the final Castle migration')

const addendum = await read('docs/releases/CASTLE-COMMAND-001F-F20-F21-RELEASE-ADDENDUM.md')
assert.ok(addendum.includes('29 ordered Castle Command migrations'))
assert.ok(addendum.includes(migrationName))
assert.ok(addendum.includes(hotfixMigrationName))
assert.ok(addendum.includes('F20'))
assert.ok(addendum.includes('F21'))
assert.ok(addendum.includes('membership term'))
assert.ok(addendum.includes('explicit alliance scope'))
assert.ok(addendum.includes('production activation hotfix'))

console.log('CASTLE-COMMAND-001F F20/F21 + production hotfix tests passed')
