import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('src/features/giftcodes/GiftRedemptionFoundationPanel.tsx', 'utf8')

assert.match(source, /\{user && \(/)
assert.match(source, /\{context \? \(/)
assert.match(source, /Auto Redeem is currently unavailable\. Automatic redemption has been disabled by Forge administrators\./)
assert.match(source, /Auto Redeem unavailable/)
assert.match(source, /Auto Redeem status/)
assert.match(source, /Your linked Player ID was verified through the Kingshot player service\./)
for (const label of ['Unavailable', 'Paused', 'Ready', 'Redeeming codes…', 'Review consent']) {
  assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}
assert.doesNotMatch(source, /\{user && context && \(/)

console.log('Auto Redeem UI regression contract passed.')
