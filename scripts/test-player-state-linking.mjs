import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  LinkedPlayerServiceError,
  normalizeKingshotLookup,
  validateKingdomId,
  validatePlayerId,
} from '../server/player-identity/linkedPlayerService.ts'

assert.equal(validatePlayerId(' 125500338 '), '125500338')
assert.equal(validateKingdomId('850'), 850)
assert.throws(() => validateKingdomId('0'), (error) => error instanceof LinkedPlayerServiceError && error.statusCode === 422)
assert.throws(() => validateKingdomId('10000'), (error) => error instanceof LinkedPlayerServiceError && error.statusCode === 422)

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
  ['player API client', read('src/services/kingshotApi.ts'), ["getPlayer(\n  playerId: string,\n  kingdomId: string", "searchParams.set('kingdomId', kingdomId)", 'belongs to State']],
  ['player link UI', read('src/components/LinkedPlayerPanel.tsx'), ['Kingshot State', 'kingdomId', 'Player ID and State are both required']],
  ['player account API', read('api/player/account.ts'), ['kingdomId: input.kingdomId ?? input.state']],
  ['operations API', read('api/operations/users.ts'), ['lookup_player', 'link_player', 'lookupManagedPlayer', 'linkManagedPlayer']],
  ['operations UI', read('src/features/operations/UserManagementPage.tsx'), ['Lookup details', 'Apply verified lookup', 'Apply manual link', 'Replace the existing linked Player Account']],
  ['admin permission', read('server/identity/roleCapabilities.ts'), ['users.manage_players']],
  ['audited transaction', read('supabase/migrations/20260729193000_admin_player_linking.sql'), ['admin_link_player_account', 'forge_identity_audit_events', 'player_account_linked', 'users.manage_players']],
  ['edge function', read('supabase/functions/kingshot-player/index.ts'), ['kingdomId', 'STATE_MISMATCH', 'belongs to State']],
]

for (const [name, content, needles] of contracts) {
  for (const needle of needles) assert.ok(content.includes(needle), `${name}: missing ${needle}`)
}

const coreWorkflow = read('.github/workflows/vision-integration-check.yml')
assert.equal(coreWorkflow.includes('Run Art Studio provenance regression'), false)
assert.equal(coreWorkflow.includes('validate:art-studio'), false)
assert.ok(coreWorkflow.includes('test:player-state-linking'))

const artWorkflow = read('.github/workflows/art-studio-check.yml')
assert.ok(artWorkflow.includes('Run Art Studio provenance regression'))
assert.ok(artWorkflow.includes('workflow_dispatch'))

console.log('Player ID and State linking contract checks passed.')
