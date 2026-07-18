import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('src/features/giftcodes/GiftRedemptionFoundationPanel.tsx', 'utf8')

assert.match(source, /\{user && \(/)
assert.match(source, /\{context \? \(/)
assert.match(source, /Checking provider availability\. Redemption remains disabled until status is confirmed\./)
assert.match(source, /<button type="button" className="button button--primary" disabled>Redeem available codes<\/button>/)
assert.doesNotMatch(source, /\{user && context && \(/)

console.log('Auto Redeem UI regression contract passed.')
