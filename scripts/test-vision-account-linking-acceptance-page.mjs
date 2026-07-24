import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile(new URL('../src/features/admin/VisionAccountLinkingAcceptancePage.tsx', import.meta.url), 'utf8')
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
for (const forbidden of ['/api/player/account', 'action: link', 'getPlayer', 'Link This Player', 'Find Player', 'LinkedPlayerPanel']) assert.equal(page.includes(forbidden), false, `acceptance page must not contain ${forbidden}`)
assert.match(page, /VITE_ENABLE_VISION_LINK_ACCEPTANCE/)
assert.match(page, /api\/vision-evidence/)
assert.match(page, /api\/player\/link-ocr/)
assert.match(page, /cancel-evidence/)
assert.match(page, /ocr\.tesseract\.js\.wasm|pluginKey/)
assert.match(app, /admin\/vision\/account-linking-acceptance/)
assert.match(app, /permission="vision\.scan\.create"/)
console.log('PASS Vision linked-owner acceptance page: exact flag, permission boundary, evidence/OCR flow and no-linking safety assertions')
