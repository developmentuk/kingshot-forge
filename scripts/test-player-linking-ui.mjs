import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const screenshot = readFileSync('src/components/ScreenshotLinkingPanel.tsx', 'utf8')
const parent = readFileSync('src/components/HybridPlayerClaimPanel.tsx', 'utf8')
const wrapper = readFileSync('src/components/LinkedPlayerPanel.tsx', 'utf8')
const service = readFileSync('src/services/playerClaimService.ts', 'utf8')

assert.match(screenshot, /const safePlayerId = payload\.data\.candidates\.find/)
assert.match(screenshot, /if \(\/\^\\d\{1,20\}\$\/\.test\(safePlayerId\)\) onCandidate\(safePlayerId\)/)
assert.doesNotMatch(screenshot, /api\/player\/account/)
assert.match(parent, /Check Player ID/)
assert.match(parent, /Claim This Player/)
assert.match(parent, /Kingshot State/)
assert.match(parent, /Self-reported claim/)
assert.match(parent, /Submit for Verification/)
assert.match(parent, /corrections: ocrReview\.userConfirmed/)
assert.doesNotMatch(parent, /getPlayer/)
assert.match(service, /api\/player\/claim/)
assert.match(service, /Authorization: `Bearer \$\{accessToken\}`/)
assert.match(wrapper, /HybridPlayerClaimPanel/)
assert.match(screenshot, /cancel-evidence/)
assert.match(screenshot, /URL\.revokeObjectURL/)
assert.match(screenshot, /townCenterLevel: ''/)
assert.match(screenshot, /OCR suggestion/)
assert.match(screenshot, /min=\{isTown \? 1 : undefined\}/)
assert.match(screenshot, /max=\{isTown \? 30 : undefined\}/)

console.log('PASS player-linking-ui: hybrid claims are non-blocking, screenshot-assisted and explicit about verification')
