import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync('src/features/giftcodes/GiftRedemptionFoundationPanel.tsx', 'utf8')

assert.match(source, /\{user && \(/)
assert.match(source, /\{context \? \(/)
assert.match(source, /Auto Redeem is currently unavailable\. Automatic redemption has been disabled by Forge administrators\./)
assert.match(source, /Auto Redeem unavailable/)
assert.match(source, /Auto Redeem status/)
assert.match(source, /ownership is officially/)
assert.match(source, /public Kingshot Player ID lookup confirms that the account exists; it does not verify that you own it/)
assert.match(source, /Verify Governor ownership/)
assert.match(source, /explicitly select <strong>Redeem available codes<\/strong>/)
for (const label of ['Unavailable', 'Paused', 'Ready', 'Redeeming codes…', 'Review consent']) {
  assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}
assert.doesNotMatch(source, /\{user && context && \(/)

console.log('Auto Redeem UI regression contract passed.')
