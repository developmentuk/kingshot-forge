import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function read(path) {
  return readFile(resolve(process.cwd(), path), 'utf8')
}

function stripSqlComments(sql) {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
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
  assert.equal(/\bcreated_by\b/i.test(sessionGrant), false)
  assert.equal(/\bprofile_id\b|\badded_by\b/i.test(assignmentGrant), false)
  assert.equal(/\blast_changed_by\b/i.test(acknowledgementGrant), false)
  const projectionSignature = sql.match(/create function public\.list_castle_command_alliance_profiles[\s\S]*?returns table \(([\s\S]*?)\)\nlanguage/i)?.[1] ?? ''
  assert.equal(/\bprofile_id\b/i.test(projectionSignature), false)
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
  assert.equal(/min\s*\(\s*membership\.alliance_id\s*\)/i.test(compatibility), false)
  for (const required of [
    'profile.shared_alliance_id = command_session.alliance_id',
    'Closed Castle Command session assignments are immutable',
    'target_use_howler is null',
    'user_id = command_profile.user_id',
  ]) assert.ok(assignment.includes(required), `001F assignment scope hardening missing ${required}`)
}

async function testTacticalPostgresCompatibility() {
  const sql = await read('supabase/migrations/20260823161000_castle_command_tactical_json_compatibility.sql')
  for (const required of [
    'from jsonb_object_keys(wave);',
    'wave_key_count <> 3',
    'Castle Command tactical plan contains a player who is no longer a current alliance member',
    'session_impact_at_snapshot',
    'rally_preparation_seconds_snapshot',
    "raise exception 'Castle Command tactical plan version conflict' using errcode = '40001'",
  ]) assert.ok(sql.includes(required), `001F tactical compatibility hardening missing ${required}`)
  assert.equal(/jsonb_object_length\s*\(/i.test(stripSqlComments(sql)), false)
}

async function testClosedHistoryImmutability() {
  const sql = await read('supabase/migrations/20260823161500_castle_command_closed_session_ack_hardening.sql')
  assert.ok(sql.includes('for update;'))
  assert.ok(sql.includes("command_session.status = 'closed'"))
  assert.ok(sql.includes('Closed Castle Command acknowledgements are immutable'))
  assert.ok(sql.includes('public.can_manage_castle_command_session(target_session_id)'))
}

async function testAcknowledgementTransitionSerialization() {
  const sql = await read('supabase/migrations/20260823162000_castle_command_ack_transition_serialization.sql')
  for (const required of [
    'create or replace function public.set_castle_command_acknowledgement',
    'from public.castle_command_sessions',
    'from public.castle_command_session_acknowledgements acknowledgement',
    "Castle Command session is closed",
    "Castle Command session must be active before marking sent",
    "Sent acknowledgement cannot be moved backwards",
  ]) assert.ok(sql.includes(required), `001F acknowledgement serialization missing ${required}`)

  const lockCount = (stripSqlComments(sql).match(/for update;/gi) ?? []).length
  assert.ok(lockCount >= 2, 'participant acknowledgement transition must lock both session and existing acknowledgement state')
}

async function testAssignmentProfileSerialization() {
  const sql = await read('supabase/migrations/20260823162500_castle_command_assignment_profile_serialization.sql')
  const executable = stripSqlComments(sql)
  for (const required of [
    'create or replace function public.set_castle_command_session_assignment',
    'profile.share_with_alliance = true',
    'profile.shared_alliance_id = command_session.alliance_id',
    'for update of profile;',
    'profile_updated_at_snapshot',
    "Player has no explicitly shared Castle Command profile in this alliance",
  ]) assert.ok(executable.includes(required), `001F assignment/profile serialization missing ${required}`)

  const profileLock = executable.indexOf('for update of profile;')
  const timingRead = executable.indexOf('from public.castle_command_profile_targets')
  assert.ok(profileLock >= 0 && timingRead > profileLock, 'assignment must lock the shared profile before reading target timings')

  const profileSave = await read('supabase/migrations/20260823155500_castle_command_alliance_scoped_sharing.sql')
  assert.ok(profileSave.includes('on conflict (player_account_id) do update set'))
  const profileUpsert = profileSave.indexOf('insert into public.castle_command_profiles')
  const timingUpsert = profileSave.indexOf('insert into public.castle_command_profile_targets')
  assert.ok(profileUpsert >= 0 && timingUpsert > profileUpsert, 'profile save must own/update the profile row before changing timing rows')
}

async function testMembershipTransitionSerialization() {
  const sql = stripSqlComments(await read('supabase/migrations/20260823163000_castle_command_membership_transition_serialization.sql'))
  for (const required of [
    'create or replace function public.set_castle_command_session_assignment',
    'create or replace function public.set_castle_command_acknowledgement',
    'create or replace function public.set_castle_command_session_deputy',
    'create or replace function public.save_castle_command_tactical_plan',
    "membership.status = 'current'::public.alliance_membership_status",
    'for update of membership;',
    'order by membership.user_id',
  ]) assert.ok(sql.includes(required), `001F membership transition serialization missing ${required}`)

  const assignmentStart = sql.indexOf('create or replace function public.set_castle_command_session_assignment')
  const assignmentEnd = sql.indexOf('revoke all on function public.set_castle_command_session_assignment', assignmentStart)
  const assignment = sql.slice(assignmentStart, assignmentEnd)
  const assignmentSessionLock = assignment.indexOf('from public.castle_command_sessions')
  const assignmentMembershipLock = assignment.indexOf('for update of membership;')
  const assignmentProfileLock = assignment.indexOf('for update of profile;')
  const assignmentTimingRead = assignment.indexOf('from public.castle_command_profile_targets')
  assert.ok(assignmentSessionLock >= 0)
  assert.ok(assignmentMembershipLock > assignmentSessionLock, 'assignment must lock membership after session')
  assert.ok(assignmentProfileLock > assignmentMembershipLock, 'assignment lock order must be session -> membership -> profile')
  assert.ok(assignmentTimingRead > assignmentProfileLock, 'assignment must read timing only after membership and profile locks')
  assert.ok(assignment.includes("Castle Command player is no longer a current alliance member"))

  const acknowledgementStart = sql.indexOf('create or replace function public.set_castle_command_acknowledgement')
  const acknowledgementEnd = sql.indexOf('revoke all on function public.set_castle_command_acknowledgement', acknowledgementStart)
  const acknowledgement = sql.slice(acknowledgementStart, acknowledgementEnd)
  const acknowledgementSessionLock = acknowledgement.indexOf('from public.castle_command_sessions')
  const acknowledgementMembershipLock = acknowledgement.indexOf('for update of membership;')
  const acknowledgementStateLock = acknowledgement.indexOf('from public.castle_command_session_acknowledgements')
  assert.ok(acknowledgementMembershipLock > acknowledgementSessionLock, 'acknowledgement must lock caller membership after session')
  assert.ok(acknowledgementStateLock > acknowledgementMembershipLock, 'acknowledgement state must be read after membership is locked')

  const deputyStart = sql.indexOf('create or replace function public.set_castle_command_session_deputy')
  const deputyEnd = sql.indexOf('revoke all on function public.set_castle_command_session_deputy', deputyStart)
  const deputy = sql.slice(deputyStart, deputyEnd)
  assert.ok(deputy.includes('for update of membership;'), 'deputy appointment must lock target membership')
  assert.ok(deputy.indexOf('for update of membership;') < deputy.indexOf('insert into public.castle_command_session_deputies'))

  const tacticalStart = sql.indexOf('create or replace function public.save_castle_command_tactical_plan')
  const tacticalEnd = sql.indexOf('revoke all on function public.save_castle_command_tactical_plan', tacticalStart)
  const tactical = sql.slice(tacticalStart, tacticalEnd)
  const tacticalMembershipLock = tactical.indexOf('for update of membership;')
  const tacticalEligibilityCheck = tactical.indexOf("Castle Command tactical plan contains a player who is no longer a current alliance member")
  const tacticalSnapshot = tactical.indexOf('public.build_castle_command_assignment_snapshot')
  assert.ok(tacticalMembershipLock >= 0)
  assert.ok(tactical.includes('order by membership.user_id'), 'tactical membership locks must use deterministic order')
  assert.ok(tacticalEligibilityCheck > tacticalMembershipLock, 'tactical eligibility must be rechecked after membership locking')
  assert.ok(tacticalSnapshot > tacticalEligibilityCheck, 'tactical assignment snapshot must follow locked membership eligibility check')
}

async function testDeputyAndConsentSerialization() {
  const sql = stripSqlComments(await read('supabase/migrations/20260823163500_castle_command_deputy_consent_serialization.sql'))

  const explicitProfileStart = sql.indexOf('create or replace function public.save_castle_command_profile')
  const compatibilityProfileStart = sql.indexOf('create or replace function public.save_castle_command_profile', explicitProfileStart + 1)
  const lifecycleStart = sql.indexOf('create or replace function public.set_castle_command_session_status')
  const resetStart = sql.indexOf('create or replace function public.reset_castle_command_acknowledgement')
  assert.ok(explicitProfileStart >= 0 && compatibilityProfileStart > explicitProfileStart)
  assert.ok(lifecycleStart > compatibilityProfileStart && resetStart > lifecycleStart)

  const explicitProfile = sql.slice(explicitProfileStart, compatibilityProfileStart)
  const explicitMembershipLock = explicitProfile.indexOf('for update of membership;')
  const explicitProfileUpsert = explicitProfile.indexOf('insert into public.castle_command_profiles')
  const explicitTimingUpsert = explicitProfile.indexOf('insert into public.castle_command_profile_targets')
  assert.ok(explicitMembershipLock >= 0, 'explicit shared profile save must lock the exact current membership')
  assert.ok(explicitProfileUpsert > explicitMembershipLock, 'profile row must persist only after membership lock')
  assert.ok(explicitTimingUpsert > explicitProfileUpsert, 'timings must remain after profile persistence')

  const compatibilityProfile = sql.slice(compatibilityProfileStart, lifecycleStart)
  const compatibilityMembershipLock = compatibilityProfile.indexOf('for update of membership;')
  const compatibilityCount = compatibilityProfile.indexOf('select count(*)::integer')
  const compatibilityStrictScope = compatibilityProfile.indexOf('into strict resolved_alliance_id')
  const compatibilityDelegation = compatibilityProfile.indexOf('return public.save_castle_command_profile')
  assert.ok(compatibilityMembershipLock >= 0, 'compatibility save must lock current memberships before scope resolution')
  assert.ok(compatibilityProfile.includes('order by membership.alliance_id'), 'compatibility membership locks must be deterministic')
  assert.ok(compatibilityCount > compatibilityMembershipLock, 'compatibility alliance count must follow membership locking')
  assert.ok(compatibilityStrictScope > compatibilityCount, 'compatibility scope selection must fail closed after count')
  assert.ok(compatibilityDelegation > compatibilityStrictScope, 'compatibility save must delegate only after locked scope resolution')

  const lifecycle = sql.slice(lifecycleStart, resetStart)
  const lifecycleSessionLock = lifecycle.indexOf('from public.castle_command_sessions')
  const lifecycleManagerCheck = lifecycle.indexOf('public.can_manage_castle_command(command_session.alliance_id)')
  const lifecycleDeputyMembershipLock = lifecycle.indexOf('for update of membership;')
  const lifecycleUpdate = lifecycle.indexOf('update public.castle_command_sessions')
  assert.ok(lifecycleSessionLock >= 0)
  assert.ok(lifecycleManagerCheck > lifecycleSessionLock, 'lifecycle authority must be evaluated after session locking')
  assert.ok(lifecycleDeputyMembershipLock > lifecycleManagerCheck, 'deputy lifecycle authority must lock caller membership')
  assert.ok(lifecycleUpdate > lifecycleDeputyMembershipLock, 'lifecycle update must follow deputy membership serialization')
  assert.ok(lifecycle.includes('public.castle_command_session_deputies deputy'))

  const resetEnd = sql.indexOf('revoke all on function public.reset_castle_command_acknowledgement', resetStart)
  const reset = sql.slice(resetStart, resetEnd)
  const resetSessionLock = reset.indexOf('from public.castle_command_sessions')
  const resetManagerCheck = reset.indexOf('public.can_manage_castle_command(command_session.alliance_id)')
  const resetDeputyMembershipLock = reset.indexOf('for update of membership;')
  const resetWrite = reset.indexOf('insert into public.castle_command_session_acknowledgements')
  assert.ok(resetSessionLock >= 0)
  assert.ok(resetManagerCheck > resetSessionLock, 'ack reset authority must be evaluated after session locking')
  assert.ok(resetDeputyMembershipLock > resetManagerCheck, 'deputy ack reset must lock caller membership')
  assert.ok(resetWrite > resetDeputyMembershipLock, 'ack reset must persist only after deputy membership serialization')
  assert.ok(reset.includes("command_session.status = 'closed'"))
}

async function testWriteAuthorityBoundary() {
  const sql = stripSqlComments(await read('supabase/migrations/20260823164000_castle_command_write_authority_boundary.sql'))

  for (const required of [
    'create or replace function public.lock_castle_command_event_manager',
    'create or replace function public.lock_castle_command_deputy_authority',
    'create or replace function public.lock_castle_command_participant_authority',
    'revoke update, delete on public.castle_command_sessions from authenticated;',
    'drop policy if exists "Castle Command managers can update sessions"',
    'drop policy if exists "Castle Command managers can delete sessions"',
    'create trigger castle_command_sessions_authorize_write',
    'create trigger castle_command_assignments_authorize_write',
    'create trigger castle_command_deputies_authorize_write',
    'create trigger castle_command_tactical_versions_authorize_write',
    'create trigger castle_command_tactical_plans_authorize_write',
    'create trigger castle_command_acknowledgements_authorize_write',
  ]) assert.ok(sql.includes(required), `001F write-authority boundary missing ${required}`)

  const eventAuthorityStart = sql.indexOf('create or replace function public.lock_castle_command_event_manager')
  const eventAuthorityEnd = sql.indexOf('revoke all on function public.lock_castle_command_event_manager', eventAuthorityStart)
  const eventAuthority = sql.slice(eventAuthorityStart, eventAuthorityEnd)
  const roleLock = eventAuthority.indexOf('for update of profile;')
  const eventGrantLock = eventAuthority.indexOf('for update of administrator;')
  assert.ok(roleLock >= 0, 'event-manager mutation authority must lock the Forge profile role row')
  assert.ok(eventGrantLock > roleLock, 'event-manager mutation authority must lock the alliance event grant after role evaluation')
  assert.ok(eventAuthority.includes('administrator.can_manage_events = true'))
  assert.ok(eventAuthority.includes('administrator.revoked_at is null'))

  const sessionBoundaryStart = sql.indexOf('create or replace function public.enforce_castle_command_session_write_authority')
  const managerBoundaryStart = sql.indexOf('create or replace function public.enforce_castle_command_manager_write_authority')
  const sessionBoundary = sql.slice(sessionBoundaryStart, managerBoundaryStart)
  assert.ok(sessionBoundary.includes("tg_op = 'INSERT'"))
  assert.ok(sessionBoundary.includes('public.lock_castle_command_event_manager(new.alliance_id)'))
  assert.ok(sessionBoundary.includes("Castle Command session deletion is not permitted"))
  assert.ok(sessionBoundary.includes('public.lock_castle_command_deputy_authority(old.id, old.alliance_id)'))

  const commandBoundaryStart = sql.indexOf('create or replace function public.enforce_castle_command_command_write_authority')
  const acknowledgementBoundaryStart = sql.indexOf('create or replace function public.enforce_castle_command_acknowledgement_write_authority')
  const commandBoundary = sql.slice(commandBoundaryStart, acknowledgementBoundaryStart)
  assert.ok(commandBoundary.includes('public.lock_castle_command_event_manager(command_session.alliance_id)'))
  assert.ok(commandBoundary.includes('public.lock_castle_command_deputy_authority(command_session.id, command_session.alliance_id)'))

  const acknowledgementBoundary = sql.slice(acknowledgementBoundaryStart)
  assert.ok(acknowledgementBoundary.includes("target_status = 'waiting'"), 'WAITING/reset writes must use command authority')
  assert.ok(acknowledgementBoundary.includes('public.lock_castle_command_participant_authority('), 'READY/SENT writes must re-lock exact participant authority')
  assert.ok(acknowledgementBoundary.includes("Closed Castle Command acknowledgements are immutable"))
}

async function testClientProjectionBoundary() {
  const service = await read('src/features/castle-command/castleCommandCloudService.ts')
  assert.ok(service.includes('shared_alliance_id'))
  assert.ok(service.includes(".rpc('current_user_is_alliance_member'"))
  assert.ok(service.includes('shareWithAlliance: profileResult.data.share_with_alliance === true && shareScopeIsCurrent'))
  assert.equal(service.includes('profile_id: string'), false)
  assert.equal(service.includes('created_by, closed_at'), false)
  assert.ok(service.includes(".select('id, alliance_id, title, impact_at, rally_preparation_seconds, status, closed_at, created_at, updated_at')"))
}

async function testFinalReleaseContract() {
  const release = await read('docs/releases/CASTLE-COMMAND-001F-ACTIVATION-ACCEPTANCE.md')
  const orderStart = release.indexOf('## Final migration dependency order')
  const orderEnd = release.indexOf('## Permanent regression gate', orderStart)
  assert.ok(orderStart >= 0 && orderEnd > orderStart, '001F governed migration-order section is missing')
  const governedOrder = release.slice(orderStart, orderEnd)

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
    '20260823162000_castle_command_ack_transition_serialization.sql',
    '20260823162500_castle_command_assignment_profile_serialization.sql',
    '20260823163000_castle_command_membership_transition_serialization.sql',
    '20260823163500_castle_command_deputy_consent_serialization.sql',
    '20260823164000_castle_command_write_authority_boundary.sql',
  ]
  let cursor = -1
  for (const migration of required) {
    const position = governedOrder.indexOf(migration)
    assert.ok(position > cursor, `001F release migration order missing/out of order: ${migration}`)
    cursor = position
  }
  assert.ok(release.includes('**STOP. Do not apply Castle Command migrations to production yet.**'))
  assert.ok(release.includes('fresh independent exact-head review'))
  assert.ok(release.includes('real authenticated role/Realtime acceptance'))
  assert.ok(release.includes('Finding F7 — participant acknowledgement transitions were not serialized with session closure'))
  assert.ok(release.includes('Finding F8 — assignment snapshots were not serialized with profile sharing/timing saves'))
  assert.ok(release.includes('Finding F9 — durable membership-sensitive writes were not serialized with membership transitions'))
  assert.ok(release.includes('Finding F10 — deputy lifecycle/reset authority was not serialized with membership removal'))
  assert.ok(release.includes('Finding F11 — sharing opt-in was not serialized with membership removal'))
  assert.ok(release.includes('Finding F12 — durable write authority could outlive manager revocation and raw session lifecycle writes remained exposed'))
  assert.ok(release.includes('The corrected candidate must pass fresh A–F CI and fresh independent exact-head review'))
}

async function testPermanentGateIncludes001F() {
  const workflow = await read('.github/workflows/vision-integration-check.yml')
  assert.ok(workflow.includes('node --import tsx scripts/test-castle-command-001f.mjs'))
}

await testCurrentMembershipAuthority()
await testPrivacyAndCreationIntegrity()
await testAllianceScopedConsent()
await testTacticalPostgresCompatibility()
await testClosedHistoryImmutability()
await testAcknowledgementTransitionSerialization()
await testAssignmentProfileSerialization()
await testMembershipTransitionSerialization()
await testDeputyAndConsentSerialization()
await testWriteAuthorityBoundary()
await testClientProjectionBoundary()
await testFinalReleaseContract()
await testPermanentGateIncludes001F()
console.log('CASTLE-COMMAND-001F tests passed')