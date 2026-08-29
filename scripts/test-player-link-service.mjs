import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const service = await vite.ssrLoadModule('/server/player-identity/linkedPlayerService.ts')
  const player = {
    playerId: '123456',
    name: 'Synthetic Governor',
    kingdomId: 850,
    townCenterLevel: 30,
    avatarUrl: null,
    provider: 'mightpulse',
    providerFetchedAt: '2026-08-29T12:00:00.000Z',
  }

  const refreshFields = service.createProviderRefreshFields(player)
  assert.equal(refreshFields.player_name, 'Synthetic Governor')
  assert.equal(refreshFields.kingdom_id, 850)
  assert.equal(refreshFields.town_center_level, 30)
  assert.equal('player_level' in refreshFields, false)
  assert.equal('verification_status' in refreshFields, false)

  const linkFields = service.createNewLinkedPlayerFields(player, 'user-123')
  assert.equal(linkFields.verification_status, 'linked')
  assert.equal(linkFields.verification_method, 'none')
  assert.equal(linkFields.verified_by, null)
  assert.equal(linkFields.verified_at, null)
  assert.equal(linkFields.player_level, null)
  assert.equal(linkFields.town_center_level, 30)

  assert.throws(() => service.validatePlayerId('not-a-player-id'), /valid Kingshot Player ID/u)
  assert.throws(() => service.validateKingdomId(0), /valid Kingshot State/u)

  const source = await readFile('server/player-identity/linkedPlayerService.ts', 'utf8')
  assert.match(source, /existing\.player_id !== requestedPlayerId/u)
  assert.match(source, /error\.code === '23505'/u)
  assert.match(source, /PLAYER_ALREADY_LINKED/u)
  const operationsSource = await readFile('server/identity/userManagementService.ts', 'utf8')
  assert.match(operationsSource, /Provider-backed administrator linking is pending the governed admin-link contract update/u)
  assert.doesNotMatch(operationsSource, /existingPlayer\?\.(?:player_level|level_rendered|level_rendered_detailed|level_image|profile_photo)/u)
  assert.match(operationsSource, /p_verification_status: 'community_verified'/u)
  assert.match(operationsSource, /p_verification_method: 'forge_admin'/u)

  console.log('Player link service tests passed.')
} finally {
  await vite.close()
}
