import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const screenshot = readFileSync('src/components/ScreenshotLinkingPanel.tsx', 'utf8')
const parent = readFileSync('src/components/LinkedPlayerPanel.tsx', 'utf8')
assert.match(screenshot, /const safePlayerId = payload\.data\.candidates\.find/)
assert.match(screenshot, /if \(\/\^\\d\{1,20\}\$\/\.test\(safePlayerId\)\) onCandidate\(safePlayerId\)/)
assert.doesNotMatch(screenshot, /api\/player\/account/)
assert.match(parent, /Find Player/)
assert.match(parent, /Link This Player/)
assert.match(screenshot, /cancel-evidence/)
assert.match(screenshot, /URL\.revokeObjectURL/)
console.log('PASS player-linking-ui: OCR prefills the manual field without lookup or link mutation')
