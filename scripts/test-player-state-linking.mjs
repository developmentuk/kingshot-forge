import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  LinkedPlayerServiceError,
  createProviderRefreshFields,
  validateKingdomId,
  validatePlayerId,
} from '../server/player-identity/linkedPlayerService.ts'
import { validateSelfReportedClaim } from '../server/player-identity/playerClaimService.ts'
import { linkManagedPlayer, UserManagementError } from '../server/identity/userManagementService.ts'

assert.equal(validatePlayerId(' 125500338 '), '125500338')
assert.equal(validateKingdomId('850'), 850)
assert.throws(() => validateKingdomId('0'), (error) => error instanceof LinkedPlayerServiceError && error.statusCode === 422)
assert.throws(() => validateKingdomId('10000'), (error) => error instanceof LinkedPlayerServiceError && error.statusCode === 422)

assert.deepEqual(
  validateSelfReportedClaim({ playerId: '125500338', kingdomId: '850', playerName: 'Claimed Governor' }),
  { playerId: '125500338', kingdomId: 850, playerName: 'Claimed Governor', townCenterLevel: null },
)

const player = {
  playerId: '125500338',
  name: 'Provider Governor',
  kingdomId: 850,
  townCenterLevel: 30,
  avatarUrl: null,
  provider: 'mightpulse',
  providerFetchedAt: '2026-08-29T12:00:00.000Z',
}

const fields = createProviderRefreshFields(player)
assert.equal(fields.kingdom_id, 850)
assert.equal(fields.town_center_level, 30)
assert.equal('player_level' in fields, false)

const read = (path) => fs.readFileSync(path, 'utf8')
const contracts = [
  ['hybrid claim client', read('src/services/playerClaimService.ts'), ['/api/player/claim', 'playerId', 'kingdomId', "action: 'search'", "action: 'claim'"]],
  ['hybrid claim UI', read('src/components/HybridPlayerClaimPanel.tsx'), ['Kingshot State', 'kingdomId', 'Player ID and State', 'Check Player ID', 'Claim This Player']],
  ['hybrid claim API', read('api/player/claim.ts'), ['input.kingdomId ?? input.state', "input.action === 'search'", "input.action === 'claim'"]],
  ['disabled public lookup API', read('api/player/indexed-lookup.ts'), ['PLAYER_LOOKUP_DISABLED', 'response.status(503)', 'Public Player Lookup is temporarily unavailable']],
  ['disabled public lookup page', read('src/pages/PlayerLookupPage.tsx'), ['Player Lookup is temporarily unavailable', 'Public search is paused', 'Open Player Passport']],
  ['claim service State boundary', read('server/player-identity/playerClaimService.ts'), ['state_mismatch', 'indexedKingdomId !== kingdomId', 'Number(account.kingdom_id) !== kingdomId']],
  ['legacy player account API', read('api/player/account.ts'), ['kingdomId: input.kingdomId ?? input.state']],
  ['operations API', read('api/operations/users.ts'), ['lookup_player', 'link_player', 'lookupManagedPlayer', 'linkManagedPlayer']],
  ['operations UI', read('src/features/operations/UserManagementPage.tsx'), ['Lookup details', 'pending the governed admin-link contract update', 'Apply manual link', 'Replace the existing linked Player Account']],
  ['admin permission', read('server/identity/roleCapabilities.ts'), ['users.manage_players']],
  ['audited transaction', read('supabase/migrations/20260729193000_admin_player_linking.sql'), ['admin_link_player_account', 'forge_identity_audit_events', 'player_account_linked', 'users.manage_players']],
  ['legacy edge function containment', read('supabase/functions/kingshot-player/index.ts'), ['kingdomId', 'STATE_MISMATCH', 'belongs to State', 'PLAYER_LOOKUP_UPSTREAM_UNAVAILABLE', 'No player details have been changed']],
  ['server provider lookup containment', read('server/player-identity/linkedPlayerService.ts'), ['createMightPulsePlayerProvider', 'PLAYER_PROVIDER_FRESHNESS_TTL_MS', 'forceProviderRefresh']],
]

for (const [name, content, needles] of contracts) {
  for (const needle of needles) assert.ok(content.includes(needle), `${name}: missing ${needle}`)
}

const managementSource = read('server/identity/userManagementService.ts')
const providerGuardOffset = managementSource.indexOf("if (input.mode === 'lookup')")
const targetReadOffset = managementSource.indexOf('const target = await requireTargetExists', providerGuardOffset)
const rpcOffset = managementSource.indexOf(".rpc('admin_link_player_account'", providerGuardOffset)
assert.ok(providerGuardOffset >= 0 && providerGuardOffset < targetReadOffset && targetReadOffset < rpcOffset)
assert.equal(managementSource.includes('existingPlayer?.player_level'), false)
assert.equal(managementSource.includes('existingPlayer?.level_rendered'), false)
assert.equal(managementSource.includes('existingPlayer?.level_image'), false)
assert.equal(managementSource.includes('existingPlayer?.profile_photo'), false)
assert.ok(managementSource.includes("p_verification_status: 'community_verified'"))
assert.ok(managementSource.includes("p_verification_method: 'forge_admin'"))

await assert.rejects(
  () => linkManagedPlayer(
    { userId: 'admin-test', accountStatus: 'active', capabilities: ['users.manage_players'] },
    'target-test',
    { mode: 'lookup', playerId: '125500338', kingdomId: 850, reason: 'Synthetic test' },
  ),
  (error) => error instanceof UserManagementError
    && error.statusCode === 409
    && error.message.includes('does not change the Player Account'),
)

const operationsUi = read('src/features/operations/UserManagementPage.tsx')
assert.equal(operationsUi.includes('Apply provider link'), false)
assert.equal(operationsUi.includes("applyPlayer('lookup')"), false)

const hybridUi = read('src/components/HybridPlayerClaimPanel.tsx')
const publicLookup = read('src/pages/PlayerLookupPage.tsx')
const publicApi = read('api/player/indexed-lookup.ts')
assert.equal(hybridUi.includes('getPlayer'), false)
assert.equal(publicLookup.includes('<form'), false)
assert.equal(publicLookup.includes('Search Forge Index'), false)
assert.equal(publicApi.includes('searchPublicIndexedPlayer'), false)

const coreWorkflow = read('.github/workflows/vision-integration-check.yml')
assert.equal(coreWorkflow.includes('Run Art Studio provenance regression'), false)
assert.equal(coreWorkflow.includes('validate:art-studio'), false)
assert.ok(coreWorkflow.includes('test:player-state-linking'))

const artWorkflow = read('.github/workflows/art-studio-check.yml')
assert.ok(artWorkflow.includes('Run Art Studio provenance regression'))
assert.ok(artWorkflow.includes('workflow_dispatch'))

console.log('Player ID and State hybrid claim contracts passed with public lookup disabled.')
