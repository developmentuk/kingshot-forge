import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  LinkedPlayerServiceError,
  normalizeKingshotLookup,
  validateKingdomId,
  validatePlayerId,
} from '../server/player-identity/linkedPlayerService.ts'
import { validateSelfReportedClaim } from '../server/player-identity/playerClaimService.ts'

assert.equal(validatePlayerId(' 125500338 '), '125500338')
assert.equal(validateKingdomId('850'), 850)
assert.throws(() => validateKingdomId('0'), (error) => error instanceof LinkedPlayerServiceError && error.statusCode === 422)
assert.throws(() => validateKingdomId('10000'), (error) => error instanceof LinkedPlayerServiceError && error.statusCode === 422)

assert.deepEqual(
  validateSelfReportedClaim({ playerId: '125500338', kingdomId: '850', playerName: 'Claimed Governor' }),
  { playerId: '125500338', kingdomId: 850, playerName: 'Claimed Governor', townCenterLevel: null },
)

const response = {
  status: 'success',
  data: {
    playerId: '125500338',
    name: 'Verified Governor',
    kingdom: 850,
    level: 30,
    levelRendered: '30',
    levelRenderedDetailed: 'Level 30',
    levelImage: null,
    profilePhoto: null,
  },
}

const player = normalizeKingshotLookup(response, '125500338', 850)
assert.equal(player.kingdom, 850)
assert.equal(player.name, 'Verified Governor')
assert.throws(
  () => normalizeKingshotLookup(response, '125500338', 851),
  (error) => error instanceof LinkedPlayerServiceError && error.statusCode === 409 && error.message.includes('State 850'),
)

const read = (path) => fs.readFileSync(path, 'utf8')
const contracts = [
  ['hybrid claim client', read('src/services/playerClaimService.ts'), ['/api/player/claim', 'playerId', 'kingdomId', "action: 'search'", "action: 'claim'"]],
  ['hybrid claim UI', read('src/components/HybridPlayerClaimPanel.tsx'), ['Kingshot State', 'kingdomId', 'Player ID and State', 'Check Player ID', 'Claim This Player']],
  ['hybrid claim API', read('api/player/claim.ts'), ['input.kingdomId ?? input.state', "input.action === 'search'", "input.action === 'claim'"]],
  ['public indexed lookup', read('api/player/indexed-lookup.ts'), ['input.kingdomId ?? input.state', 'searchPublicIndexedPlayer']],
  ['claim service State boundary', read('server/player-identity/playerClaimService.ts'), ['state_mismatch', 'indexedKingdomId !== kingdomId', 'Number(account.kingdom_id) !== kingdomId']],
  ['legacy player account API', read('api/player/account.ts'), ['kingdomId: input.kingdomId ?? input.state']],
  ['operations API', read('api/operations/users.ts'), ['lookup_player', 'link_player', 'lookupManagedPlayer', 'linkManagedPlayer']],
  ['operations UI', read('src/features/operations/UserManagementPage.tsx'), ['Lookup details', 'Apply verified lookup', 'Apply manual link', 'Replace the existing linked Player Account']],
  ['admin permission', read('server/identity/roleCapabilities.ts'), ['users.manage_players']],
  ['audited transaction', read('supabase/migrations/20260729193000_admin_player_linking.sql'), ['admin_link_player_account', 'forge_identity_audit_events', 'player_account_linked', 'users.manage_players']],
  ['legacy edge function containment', read('supabase/functions/kingshot-player/index.ts'), ['kingdomId', 'STATE_MISMATCH', 'belongs to State', 'PLAYER_LOOKUP_UPSTREAM_UNAVAILABLE', 'No player details have been changed']],
  ['legacy server lookup containment', read('server/player-identity/linkedPlayerService.ts'), ['passthroughStatuses', '503']],
]

for (const [name, content, needles] of contracts) {
  for (const needle of needles) assert.ok(content.includes(needle), `${name}: missing ${needle}`)
}

const hybridUi = read('src/components/HybridPlayerClaimPanel.tsx')
const publicLookup = read('src/pages/PlayerLookupPage.tsx')
assert.equal(hybridUi.includes('getPlayer'), false)
assert.equal(publicLookup.includes('getPlayer'), false)
assert.ok(publicLookup.includes('not a live Century Games lookup'))

const coreWorkflow = read('.github/workflows/vision-integration-check.yml')
assert.equal(coreWorkflow.includes('Run Art Studio provenance regression'), false)
assert.equal(coreWorkflow.includes('validate:art-studio'), false)
assert.ok(coreWorkflow.includes('test:player-state-linking'))

const artWorkflow = read('.github/workflows/art-studio-check.yml')
assert.ok(artWorkflow.includes('Run Art Studio provenance regression'))
assert.ok(artWorkflow.includes('workflow_dispatch'))

console.log('Player ID and State hybrid claim contract checks passed.')
