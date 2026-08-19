import assert from 'node:assert/strict'

import {
  COMPANION_ITEM_GAMEPLAY_CONTENT,
} from '../shared/companion/itemGameplayContent.ts'
import {
  COMPANION_ITEM_PROJECTION,
} from '../shared/companion/itemProjection.ts'
import {
  loadPublishedCompanionItemsDataset,
} from '../server/data-engine/loadPublishedCompanionItemsDataset.ts'

const projectionKeys = new Set(COMPANION_ITEM_PROJECTION.map((record) => record.key))
const enrichmentKeys = Object.keys(COMPANION_ITEM_GAMEPLAY_CONTENT)

assert.equal(COMPANION_ITEM_PROJECTION.length, 75)
assert.ok(projectionKeys.has('mithril'))
assert.ok(!projectionKeys.has('mythril'))
assert.ok(enrichmentKeys.length >= 30)

for (const key of enrichmentKeys) {
  assert.ok(projectionKeys.has(key), `Gameplay content targets unknown item key: ${key}`)
  const content = COMPANION_ITEM_GAMEPLAY_CONTENT[key]
  assert.ok(content.summary.trim(), `${key} gameplay content must have a summary`)
  assert.ok(content.sources.length > 0, `${key} gameplay content must name at least one governed source`)
}

const loaded = await loadPublishedCompanionItemsDataset()
assert.equal(loaded.recordCount, 75)
assert.equal(loaded.records.length, 75)
assert.equal(
  loaded.metadata.provenance.gameplayEnrichmentCount,
  enrichmentKeys.length,
)

const byKey = new Map(loaded.records.map((record) => [record.key, record]))

for (const key of enrichmentKeys) {
  const record = byKey.get(key)
  assert.ok(record, `Published dataset is missing enriched item ${key}`)
  assert.ok(record.gameplay, `${key} must publish a gameplay object`)
  assert.ok(Array.isArray(record.gameplay.mechanics))
  assert.ok(Array.isArray(record.gameplay.acquisition))
  assert.ok(Array.isArray(record.gameplay.usage))
  assert.ok(Array.isArray(record.gameplay.strategy))
  assert.ok(Array.isArray(record.gameplay.sources))
  assert.ok(record.gameplay.sources.length > 0)
  assert.ok(
    !record.summary.includes('Gameplay meaning, acquisition and strategic guidance require editorial research.'),
    `${key} must not retain the media-only placeholder summary`,
  )
}

const oceanScanner = byKey.get('ocean-scanner')
assert.match(oceanScanner.summary, /Fishing Tournament/i)
assert.ok(oceanScanner.gameplay.mechanics.some((fact) => /direction and distance/i.test(fact)))

const adventureSupply = byKey.get('adventure-supply')
assert.match(adventureSupply.summary, /Master Academy/i)
assert.ok(adventureSupply.gameplay.mechanics.some((fact) => /Lostlands/i.test(fact)))

const manuscripts = byKey.get('masters-manuscript')
assert.ok(manuscripts.gameplay.usage.some((fact) => /Master skill/i.test(fact)))

const advancedTamingMark = byKey.get('advanced-taming-mark')
assert.match(advancedTamingMark.category, /pet_material/)
assert.ok(advancedTamingMark.gameplay.strategy.some((fact) => /KvK/i.test(fact)))

const unresolved = byKey.get('platinum-key')
assert.equal(unresolved.gameplay, undefined)
assert.match(unresolved.summary, /Gameplay meaning, acquisition and strategic guidance require editorial research/i)
assert.equal(unresolved.trust_state, 'research_needed')

const mithril = byKey.get('mithril')
assert.equal(mithril.forge_id, 'item.mithril')
assert.ok(!byKey.has('mythril'))

console.log(`Companion gameplay content recovery validated (${enrichmentKeys.length} enriched / 75 canonical items).`)
