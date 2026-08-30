import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  const service = await vite.ssrLoadModule('/server/player-identity/playerClaimService.ts')

  assert.deepEqual(
    service.validateSelfReportedClaim({
      playerId: ' 138025478 ',
      state: '850',
      playerName: ' BB Noone ',
      townCenterLevel: '27',
    }),
    {
      playerId: '138025478',
      kingdomId: 850,
      playerName: 'BB Noone',
      townCenterLevel: 27,
    },
  )

  assert.throws(
    () => service.validateSelfReportedClaim({ playerId: 'bad', state: '850', playerName: 'Governor' }),
    /valid Kingshot Player ID/u,
  )
  assert.throws(
    () => service.validateSelfReportedClaim({ playerId: '138025478', state: '0', playerName: 'Governor' }),
    /valid Kingshot State/u,
  )
  assert.throws(
    () => service.validateSelfReportedClaim({ playerId: '138025478', state: '850', playerName: '' }),
    /player name/u,
  )
  assert.throws(
    () => service.validateSelfReportedClaim({ playerId: '138025478', state: '850', playerName: 'Governor', townCenterLevel: 31 }),
    /between 1 and 30/u,
  )

  const claimService = readFileSync('server/player-identity/playerClaimService.ts', 'utf8')
  const claimApi = readFileSync('api/player/claim.ts', 'utf8')
  const publicApi = readFileSync('api/player/indexed-lookup.ts', 'utf8')
  const claimUi = readFileSync('src/components/HybridPlayerClaimPanel.tsx', 'utf8')
  const claimClient = readFileSync('src/services/playerClaimService.ts', 'utf8')
  const publicUi = readFileSync('src/pages/PlayerLookupPage.tsx', 'utf8')
  const ocrService = readFileSync('server/player-identity/ocrFallbackService.ts', 'utf8')

  assert.match(claimService, /from\('player_accounts'\)/u)
  assert.match(claimService, /from\('player_verification_events'\)/u)
  assert.match(claimService, /verification_status: 'linked'/u)
  assert.match(claimService, /verification_method: 'none'/u)
  assert.match(claimService, /is_public: false/u)
  assert.match(claimService, /claimed_elsewhere/u)
  assert.doesNotMatch(claimService, /centurygame|kingshot\.net|kingshot-player/iu)

  assert.match(claimApi, /requireForgeActor/u)
  assert.match(claimApi, /input\.action === 'search'/u)
  assert.match(claimApi, /input\.action === 'claim'/u)
  assert.match(claimApi, /Cache-Control/u)

  assert.match(publicApi, /PLAYER_LOOKUP_DISABLED/u)
  assert.match(publicApi, /response\.status\(503\)/u)
  assert.doesNotMatch(publicApi, /searchPublicIndexedPlayer/u)
  assert.match(publicUi, /Player Lookup is temporarily unavailable/u)
  assert.match(publicUi, /Public search is paused/u)
  assert.doesNotMatch(publicUi, /<form/u)
  assert.doesNotMatch(publicUi, /searchPublicIndexedPlayer/u)
  assert.doesNotMatch(publicUi, /Search Forge Index/u)

  assert.match(claimUi, /Self-reported claim/u)
  assert.match(claimUi, /Link live Kingshot player/u)
  assert.match(claimUi, /linkKingshotPlayer/u)
  assert.match(claimUi, /Ownership is not yet verified/u)
  assert.match(claimClient, /\/api\/player\/account/u)
  assert.match(claimClient, /action: 'link'/u)
  assert.match(claimUi, /Submit for Verification/u)
  assert.match(claimUi, /corrections: ocrReview\.userConfirmed/u)
  assert.doesNotMatch(claimUi, /getPlayer/u)

  assert.match(ocrService, /verification_status: 'pending'/u)
  assert.match(ocrService, /player_verification_events/u)
  assert.match(ocrService, /vision\.player\.verification_requested/u)
  assert.match(ocrService, /reviewState: 'pending'/u)
  assert.match(ocrService, /already has a protected verification state/u)
  assert.doesNotMatch(ocrService, /cancelOwnerScanEvidence/u)

  console.log('PASS PLAYER-IDENTITY-002: hybrid claims remain available while misleading public lookup stays disabled')
} finally {
  await vite.close()
}
