import { readFile } from 'node:fs/promises'

const api = await readFile(new URL('../api/giftcodes.ts', import.meta.url), 'utf8')
const service = await readFile(new URL('../server/giftcodes/autoRedeemService.ts', import.meta.url), 'utf8')
const page = await readFile(new URL('../src/features/admin/GiftRedemptionOperationsPage.tsx', import.meta.url), 'utf8')

for (const [label, source, needles] of [
  ['admin catalogue API', api, ['action === \'catalogue\'', 'Administrator access is required.', 'getAdminGiftCodeCatalogue']],
  ['aggregate catalogue service', service, ['recordedRequests', 'retryable', 'lastOutcome']],
  ['admin catalogue UI', page, ['Code catalogue', 'Retryable outcomes', 'aggregate outcomes only']],
]) {
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(`${label} missing contract: ${needle}`)
  }
}

if (page.includes('player_id') || page.includes('playerId')) throw new Error('Admin catalogue must not expose full Player IDs.')
console.log('Auto Redeem Admin catalogue contract passed.')
