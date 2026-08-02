import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeAllianceTag, parseAccountLinkCandidates } from '../shared/domains/player-identity/accountLinkingOcr.ts'

const source = readFileSync('server/player-identity/ocrFallbackService.ts', 'utf8')
const panel = readFileSync('src/components/ScreenshotLinkingPanel.tsx', 'utf8')
const parent = readFileSync('src/components/HybridPlayerClaimPanel.tsx', 'utf8')
const service = readFileSync('src/services/playerClaimService.ts', 'utf8')

assert.deepEqual(normalizeAllianceTag('[NXS]').value, 'NXS')
assert.equal(normalizeAllianceTag('[NX]').value, undefined)

const regions = [
  { field: 'playerId', rawText: '', confidence: .95, acceptedValue: '987654321', disposition: 'recognised', warnings: [] },
  { field: 'displayName', rawText: '', confidence: .8, acceptedValue: 'EMBER FOX', disposition: 'review_required', warnings: [] },
  { field: 'kingdom', rawText: '', confidence: .9, acceptedValue: '42', disposition: 'recognised', warnings: [] },
  { field: 'allianceTag', rawText: '[NXS]', confidence: .8, acceptedValue: '[NXS]', disposition: 'review_required', warnings: [] },
  { field: 'townCenterLevel', rawText: '', confidence: .9, acceptedValue: '6', disposition: 'review_required', warnings: ['town_center_manual_confirmation_required'] },
]

const parsed = parseAccountLinkCandidates('', '99999999-9999-4999-8999-999999999999', .9, {
  mappingVersion: 'account-linking-kingshot-profile-v6',
  regions,
})

assert.deepEqual(parsed.map((item) => [item.field, item.value]), [
  ['playerId', '987654321'],
  ['displayName', 'EMBER FOX'],
  ['allianceTag', 'NXS'],
  ['kingdom', '42'],
  ['townCenterLevel', '6'],
])

assert.match(source, /verification_status: 'pending'/)
assert.match(source, /verification_method: 'none'/)
assert.match(source, /verifiedOwnership: false/)
assert.match(source, /player_verification_events/)
assert.match(source, /vision\.player\.verification_requested/)
assert.match(source, /reviewState: 'pending'/)
assert.doesNotMatch(source, /cancelOwnerScanEvidence/)
assert.match(source, /readEvidenceBytes/)
assert.match(source, /extractAccountLinkCandidates/)
assert.match(source, /Town Centre Level requires explicit manual confirmation/)
assert.doesNotMatch(source, /verified_at:\s*now/)
assert.doesNotMatch(source, /storage\.from\([^)]*\)\.list/)

assert.match(panel, /townCenterLevel/)
assert.match(panel, /townCenterLevel: ''/)
assert.match(panel, /OCR suggestion/)
assert.match(panel, /min=\{isTown \? 1 : undefined\}/)
assert.match(panel, /max=\{isTown \? 30 : undefined\}/)
assert.match(panel, /onClick=\{\(\) => void cancel\(\)\}/)

assert.match(parent, /api\/player\/ocr-fallback/)
assert.match(parent, /Submit for Verification/)
assert.match(parent, /Verification pending/)
assert.match(parent, /Kingshot State/)
assert.match(service, /api\/player\/claim/)
assert.doesNotMatch(parent, /getPlayer/)

console.log('PASS VISION-LINK-007: V6 five-field evidence creates a reviewable pending claim without external lookup')
