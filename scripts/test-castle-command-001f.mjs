import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function read(path) {
  return readFile(resolve(process.cwd(), path), 'utf8')
}

async function testCurrentMembershipAuthority() {
  const sql = await read('supabase/migrations/20260823154500_castle_command_current_membership_authority_hardening.sql')

  for (const required of [
    'public.current_user_is_alliance_member(session.alliance_id)',
    "return 'denied';",
    "Castle Command participant is no longer a current alliance member",
    "Castle Command deputy must be a current alliance member",
  ]) assert.ok(sql.includes(required), `001F membership hardening missing ${required}`)

  assert.ok(sql.includes('create or replace function public.can_manage_castle_command_session'))
  assert.ok(sql.includes('create or replace function public.can_participate_castle_command_session'))
  assert.ok(sql.includes('create or replace function public.get_castle_command_session_authority'))
  assert.ok(sql.includes('create or replace function public.set_castle_command_acknowledgement'))
  assert.ok(sql.includes('create or replace function public.set_castle_command_session_deputy'))
}

async function testPrivacyAndCreationIntegrity() {
  const sql = await read('supabase/migrations/20260823155000_castle_command_release_privacy_integrity_hardening.sql')

  for (const required of [
    'revoke select on public.castle_command_sessions from authenticated;',
    'revoke select on public.castle_command_session_assignments from authenticated;',
    'revoke select on public.castle_command_session_acknowledgements from authenticated;',
    "new.status is distinct from 'planning'",
    'new.created_by is distinct from auth.uid()',
    'new.id := gen_random_uuid();',
    'new.title := btrim(new.title);',
  ]) assert.ok(sql.includes(required), `001F privacy/integrity hardening missing ${required}`)

  const sessionGrant = sql.match(/grant select \(([\s\S]*?)\) on public\.castle_command_sessions to authenticated;/i)?.[1] ?? ''
  const assignmentGrant = sql.match(/grant select \(([\s\S]*?)\) on public\.castle_command_session_assignments to authenticated;/i)?.[1] ?? ''
  const acknowledgementGrant = sql.match(/grant select \(([\s\S]*?)\) on public\.castle_command_session_acknowledgements to authenticated;/i)?.[1] ?? ''
  assert.equal(/\bcreated_by\b/i.test(sessionGrant), false, 'session audit creator must not be directly readable')
  assert.equal(/\bprofile_id\b|\badded_by\b/i.test(assignmentGrant), false, 'assignment internal/audit ids must not be directly readable')
  assert.equal(/\blast_changed_by\b/i.test(acknowledgementGrant), false, 'acknowledgement audit user must not be directly readable')

  const projectionSignature = sql.match(/create function public\.list_castle_command_alliance_profiles[\s\S]*?returns table \(([\s\S]*?)\)\nlanguage/i)?.[1] ?? ''
  assert.equal(/\bprofile_id\b/i.test(projectionSignature), false, 'shared alliance projection must not return raw Castle profile id')
}

async function testAllianceScopedConsent() {
  const scoped = await read('supabase/migrations/20260823155500_castle_command_alliance_scoped_sharing.sql')
  const compatibility = await read('supabase/migrations/20260823160000_castle_command_scoped_sharing_compatibility.sql')
  const assignment = await read('supabase/migrations/20260823160500_castle_command_assignment_scope_hardening.sql')

  for (const required of [
    'add column shared_alliance_id uuid',
    'castle_command_profiles_sharing_scope_check',
    'public.current_user_is_alliance_member(target_shared_alliance_id)',
    'profile.shared_alliance_id = target_alliance_id',
  ]) assert.ok(scoped.includes(required), `001F scoped sharing migration missing ${required}`)

  assert.ok(compatibility.includes('current_alliance_count <> 1'))
  assert.ok(compatibility.includes("membership.status = 'current'::public.alliance_membership_status"))
  assert.equal(/min\s*\(\s*membership\.alliance_id\s*\)/i.test(compatibility), false, 'UUID sharing scope must not use unsupported min(uuid)')

  for (const required of [
    'profile.shared_alliance_id = command_session.alliance_id',
    "Closed Castle Command session assignments are immutable",
    'target_use_howler is null',
    'user_id = command_profile.user_id',
  ]) assert.ok(assignment.includes(required), `001F assignment scope hardening missing ${required}`)
}

async function testTacticalPostgresCompatibility() {
  const sql = await read('supabase/migrations/20260823161000_castle_command_tactical_json_compatibility.sql')

  for (const required of [
    'from jsonb_object_keys(wave);',
    'wave_key_count <> 3',
    "Castle Command tactical plan contains a player who is no longer a current alliance member",
    'session_impact_at_snapshot',
    'rally_preparation_seconds_snapshot',
    "raise exception 'Castle Command tactical plan version conflict' using errcode = '40001'",
  ]) assert.ok(sql.includes(required), `001F tactical compatibility hardening missing ${required}`)

  assert.equal(sql.includes('jsonb_object_length'), false, 'final tactical save RPC must not use unsupported jsonb_object_length')
}

async function testClosedHistoryImmutability() {
  const sql = await read('supabase/migrations/20260823161500_castle_command_closed_session_ack_hardening.sql')
  assert.ok(sql.includes('for update;'))
  assert.ok(sql.includes("command_session.status = 'closed'"))
  assert.ok(sql.includes('Closed Castle Command acknowledgements are immutable'))
  assert.ok(sql.includes('public.can_manage_castle_command_session(target_session_id)'))
}

async function testClientProjectionBoundary() {
  const service = await read('src/features/castle-command/castleCommandCloudService.ts')

  assert.ok(service.includes('shared_alliance_id'))
  assert.ok(service.includes(".rpc('current_user_is_alliance_member'"))
  assert.ok(service.includes("shareWithAlliance: profileResult.data.share_with_alliance === true && shareScopeIsCurrent"))
  assert.equal(service.includes("profile_id: string"), false, 'alliance projection parser must not expect raw Castle profile id')
  assert.equal(service.includes("created_by, closed_at"), false, 'session reader must not request created_by audit id')
  assert.ok(service.includes(".select('id, alliance_id, title, impact_at, rally_preparation_seconds, status, closed_at, created_at, updated_at')"))
}

async function testFinalMigrationSequenceIsDocumented() {
  const release = await read('docs/releases/CASTLE-COMMAND-001F-ACTIVATION-ACCEPTANCE.md')
  const required = [
    '20260823120400_castle_command_session_foundation.sql',
    '20260823121800_castle_command_atomic_profile_save.sql',
    '20260823122200_castle_command_shared_projection_lockdown.sql',
    '20260823132500_castle_command_live_command_room.sql',
    '20260823133600_castle_command_live_authority_hardening.sql',
    '20260823134100_castle_command_assignment_ack_reset.sql',
    '20260823141000_castle_command_battle_tactics_deputies.sql',
    '20260823151500_castle_command_shared_tactical_operations.sql',
    '20260823152000_castle_command_tactical_context_snapshot.sql',
    '20260823154500_castle_command_current_membership_authority_hardening.sql',
    '20260823155000_castle_command_release_privacy_integrity_hardening.sql',
    '20260823155500_castle_command_alliance_scoped_sharing.sql',
    '20260823160000_castle_command_scoped_sharing_compatibility.sql',
    '20260823160500_castle_command_assignment_scope_hardening.sql',
    '20260823161000_castle_command_tactical_json_compatibility.sql',
    '20260823161500_castle_command_closed_session_ack_hardening.sql',
  ]
  let cursor = -1
  for (const migration of required) {
    const position = release.indexOf(migration)
    assert.ok(position > cursor, `001F release migration order missing/out of order: ${migration}`)
    cursor = position
  }
}

await testCurrentMembershipAuthority()
await testPrivacyAndCreationIntegrity()
await testAllianceScopedConsent()
await testTacticalPostgresCompatibility()
await testClosedHistoryImmutability()
await testClientProjectionBoundary()
await testFinalMigrationSequenceIsDocumented()
console.log('CASTLE-COMMAND-001F tests passed')
