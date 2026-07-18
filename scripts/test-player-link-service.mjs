import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const service = await vite.ssrLoadModule('/server/player-identity/linkedPlayerService.ts')
  const player = service.normalizeKingshotLookup({
    status: 'success',
    data: {
      playerId: '123456',
      name: 'Synthetic Governor',
      kingdom: 850,
      level: 40,
      levelRendered: 'Level 40',
      levelRenderedDetailed: 'Town Center 40',
      levelImage: null,
      profilePhoto: null,
    },
  }, '123456')

  const before = Date.now()
  const fields = service.createVerifiedPlayerFields(player, 'user-123')
  const after = Date.now()

  assert.equal(fields.verification_status, 'verified')
  assert.equal(fields.verification_method, 'kingshot_player_lookup')
  assert.equal(fields.verified_by, 'user-123')
  assert.equal(fields.player_name, 'Synthetic Governor')
  assert.ok(Date.parse(fields.verified_at) >= before)
  assert.ok(Date.parse(fields.verified_at) <= after)
  assert.equal('verified' in fields, false)

  assert.throws(() => service.validatePlayerId('not-a-player-id'), /valid Kingshot Player ID/u)
  assert.throws(() => service.normalizeKingshotLookup({
    status: 'success',
    data: { playerId: '999999', name: 'Wrong player', kingdom: 850, level: 40 },
  }, '123456'), /invalid player record/u)
  assert.throws(() => service.normalizeKingshotLookup({ status: 'success', data: { playerId: '123456', name: '', kingdom: 850, level: 40 } }, '123456'), /invalid player record/u)

  console.log('Player link service tests passed.')
} finally {
  await vite.close()
}
