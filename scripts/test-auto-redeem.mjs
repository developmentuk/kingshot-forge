import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createServer } from 'vite'

const workflowSource = fs.readFileSync('server/giftcodes/autoRedeemService.ts', 'utf8')
const apiSource = fs.readFileSync('api/giftcodes.ts', 'utf8')
const identitySource = fs.readFileSync('src/context/PlayerIdentityContext.tsx', 'utf8')
assert.doesNotMatch(workflowSource, /AbortSignal\.timeout/)
assert.match(workflowSource, /new AbortController\(\)/)
assert.match(workflowSource, /kingdomId: String\(player\.kingdom_id\)/)
assert.match(workflowSource, /giftcode-redemption-v2/)
assert.match(workflowSource, /value === 'officially_verified'/)
assert.doesNotMatch(workflowSource, /value === 'verified'|value === 'community_verified'/)
assert.match(workflowSource, /evidence_version: 'auto-redeem-safety-001'/)
assert.match(workflowSource, /assertProviderReadiness\(\)/)
assert.doesNotMatch(workflowSource, /triggerAutomaticRedemption|automaticRunInFlight/)
assert.match(apiSource, /actor\.accountStatus !== 'active'/)
assert.match(apiSource, /statusCode: 403/)
assert.doesNotMatch(apiSource, /auto-run|triggerAutomaticRedemption/)
assert.doesNotMatch(identitySource, /\/api\/giftcodes\?action=auto-run/)

const vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
try {
  const provider = await vite.ssrLoadModule('/server/giftcodes/officialProvider.ts')
  const fixtureConfig = {
    codeUrl: 'https://provider.test/api/gift_code',
    signingKey: 'fixture-signing-key',
    timeoutMs: 15000,
  }
  assert.equal(provider.createSignedFields({ cdk: 'CODE', fid: 'PLAYER', kid: '850', time: '123' }, fixtureConfig.signingKey).sign, 'd0ea1d1f2dc144b1342c61acea91ef5e')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'SUCCESS' }).status, 'succeeded')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'RECEIVED', err_code: 40008 }).status, 'already_claimed')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'TIME ERROR', err_code: 40007 }).status, 'expired')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'CDK NOT FOUND', err_code: 40014 }).safeDiagnosticCode, 'invalid_code')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'TOO FREQUENT', err_code: 40019 }).failureCategory, 'rate_limited')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'USER INFO ERROR', err_code: 40020 }).safeDiagnosticCode, 'kingdom_mismatch')

  const calls = []
  const fakeFetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({ msg: 'SUCCESS', err_code: 20000 }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const client = provider.createOfficialGiftCodeProvider(fixtureConfig, fakeFetch)
  const before = Math.floor(Date.now() / 1000)
  const result = await client.redeem({ attemptId: 'attempt', playerAccountId: 'account', playerId: 'player', kingdomId: '850', giftCodeId: 'code', giftCodeVersion: 'v1', code: 'CODE', idempotencyKey: 'hash', consentVersion: 'v1' })
  const after = Math.floor(Date.now() / 1000)
  assert.equal(result.status, 'succeeded')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, fixtureConfig.codeUrl)
  const submitted = new URLSearchParams(String(calls[0].init.body))
  assert.equal(submitted.get('cdk'), 'CODE')
  assert.equal(submitted.get('fid'), 'player')
  assert.equal(submitted.get('kid'), '850')
  assert.ok(Number(submitted.get('time')) >= before)
  assert.ok(Number(submitted.get('time')) <= after)
  assert.equal(String(calls[0].init.body).includes('fixture-signing-key'), false)

  const missingKingdom = await client.redeem({ attemptId: 'attempt', playerAccountId: 'account', playerId: 'player', kingdomId: '', giftCodeId: 'code', giftCodeVersion: 'v1', code: 'CODE', idempotencyKey: 'hash', consentVersion: 'v1' })
  assert.equal(missingKingdom.safeDiagnosticCode, 'kingdom_required')
  assert.equal(calls.length, 1)
  assert.equal(provider.createOfficialGiftCodeProvider(null).productionReady, false)
  console.log('Auto Redeem provider fixtures passed.')
} finally {
  await vite.close()
}
