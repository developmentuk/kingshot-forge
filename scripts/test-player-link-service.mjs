import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createServer } from 'vite'

process.env.KINGSHOT_PLAYER_API_HOST = 'https://ks-giftcode.centurygame.com'
process.env.KINGSHOT_PLAYER_SIGNATURE_SALT = 'synthetic-signature-salt'
process.env.KINGSHOT_PLAYER_PROVIDER_SECRET = 'synthetic-provider-secret-that-is-long-enough-for-tests'

const vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const service = await vite.ssrLoadModule('/server/player-identity/linkedPlayerService.ts')
  const provider = await vite.ssrLoadModule('/server/player-identity/officialKingshotPlayerProvider.ts')
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
  assert.equal(fields.town_center_level, 40)
  assert.ok(Date.parse(fields.verified_at) >= before)
  assert.ok(Date.parse(fields.verified_at) <= after)
  assert.equal('verified' in fields, false)

  assert.throws(() => service.validatePlayerId('not-a-player-id'), /valid Kingshot Player ID/u)
  assert.throws(() => service.normalizeKingshotLookup({
    status: 'success',
    data: { playerId: '999999', name: 'Wrong player', kingdom: 850, level: 40 },
  }, '123456'), /invalid player record/u)
  assert.throws(() => service.normalizeKingshotLookup({ status: 'success', data: { playerId: '123456', name: '', kingdom: 850, level: 40 } }, '123456'), /invalid player record/u)

  const officialPlayer = provider.normalizeOfficialKingshotPlayer({
    code: 0,
    data: {
      fid: 125500338,
      nickname: 'Official Governor',
      furnace_level: 30,
      state_id: 850,
      avatar_image: 'https://example.com/avatar.png',
    },
  }, '125500338', 850)
  assert.equal(officialPlayer.playerId, '125500338')
  assert.equal(officialPlayer.name, 'Official Governor')
  assert.equal(officialPlayer.kingdom, 850)
  assert.equal(officialPlayer.levelRendered, 'Town Center 30')

  const issuedAt = 1_800_000_000_000
  const receipt = provider.createOfficialPlayerLookupReceipt(officialPlayer, issuedAt)
  assert.deepEqual(provider.verifyOfficialPlayerLookupReceipt(receipt, '125500338', 850, issuedAt + 1_000), officialPlayer)
  assert.throws(
    () => provider.verifyOfficialPlayerLookupReceipt(`${receipt.slice(0, -1)}x`, '125500338', 850, issuedAt + 1_000),
    (error) => error instanceof provider.OfficialKingshotProviderError && error.code === 'TOKEN_INVALID',
  )
  assert.throws(
    () => provider.verifyOfficialPlayerLookupReceipt(receipt, '125500338', 851, issuedAt + 1_000),
    (error) => error instanceof provider.OfficialKingshotProviderError && error.statusCode === 409,
  )

  const providerSource = fs.readFileSync('server/player-identity/officialKingshotPlayerProvider.ts', 'utf8')
  for (const prohibited of ['tesseract', 'playwright', 'createWorker', 'chromium.launch']) {
    assert.equal(providerSource.toLowerCase().includes(prohibited.toLowerCase()), false, `provider must not include ${prohibited}`)
  }
  assert.ok(providerSource.includes('captcha_code'))
  assert.ok(providerSource.includes("createHash('md5')"))
  assert.ok(providerSource.includes('createCipheriv'))
  assert.ok(providerSource.includes('createDecipheriv'))

  const routeSource = fs.readFileSync('api/player/lookup.ts', 'utf8')
  assert.ok(routeSource.includes("input.action === 'challenge'"))
  assert.ok(routeSource.includes("input.action === 'complete'"))
  assert.ok(routeSource.includes('enforceRateLimit'))

  console.log('Player link service and official provider tests passed.')
} finally {
  await vite.close()
}
