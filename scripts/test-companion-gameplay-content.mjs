import assert from 'node:assert/strict'

import {
  COMPANION_ITEM_GAMEPLAY,
  COMPANION_ITEM_GAMEPLAY_PHASE1_KEYS,
  COMPANION_ITEM_GAMEPLAY_PHASE2_KEYS,
} from '../shared/companion/itemGameplayCatalogue.ts'
import {
  COMPANION_ITEM_PROJECTION,
} from '../shared/companion/itemProjection.ts'
import {
  loadPublishedCompanionItemsDataset,
} from '../server/data-engine/loadPublishedCompanionItemsDataset.ts'

const projectionKeys = new Set(COMPANION_ITEM_PROJECTION.map((record) => record.key))
const enrichmentKeys = Object.keys(COMPANION_ITEM_GAMEPLAY)
const phase1Keys = new Set(COMPANION_ITEM_GAMEPLAY_PHASE1_KEYS)

assert.equal(COMPANION_ITEM_PROJECTION.length, 75)
assert.ok(projectionKeys.has('mithril'))
assert.ok(!projectionKeys.has('mythril'))
assert.equal(COMPANION_ITEM_GAMEPLAY_PHASE1_KEYS.length, 38)
assert.equal(COMPANION_ITEM_GAMEPLAY_PHASE2_KEYS.length, 11)
assert.equal(enrichmentKeys.length, 49)

for (const key of COMPANION_ITEM_GAMEPLAY_PHASE2_KEYS) {
  assert.ok(!phase1Keys.has(key), `Phase 2 duplicates Phase 1 gameplay key: ${key}`)
}

for (const key of enrichmentKeys) {
  assert.ok(projectionKeys.has(key), `Gameplay content targets unknown item key: ${key}`)
  const content = COMPANION_ITEM_GAMEPLAY[key]
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

const fortuneToken = byKey.get('fortune-token')
assert.equal(fortuneToken.category, 'event_currency')
assert.ok(fortuneToken.gameplay.mechanics.some((fact) => /carry over|persist/i.test(fact)))

const truegoldDust = byKey.get('truegold-dust')
assert.equal(truegoldDust.category, 'research_material')
assert.ok(truegoldDust.gameplay.mechanics.some((fact) => /War Academy/i.test(fact)))

const advancedTeleporter = byKey.get('advanced-teleporter')
assert.ok(advancedTeleporter.gameplay.strategy.some((fact) => /Swordland/i.test(fact)))

const randomTeleporter = byKey.get('random-teleporter')
assert.ok(randomTeleporter.gameplay.strategy.some((fact) => /zeroing|Random Teleport/i.test(fact)))

const goldKey = byKey.get('gold-key')
assert.equal(goldKey.category, 'recruitment_item')
assert.ok(goldKey.gameplay.mechanics.some((fact) => /recruitment/i.test(fact)))

const luckyHeroGearChest = byKey.get('lucky-hero-gear-chest')
assert.ok(luckyHeroGearChest.gameplay.acquisition.some((fact) => /Ice Megalodon/i.test(fact)))

for (const key of ['bread', 'wood', 'stone', 'iron']) {
  const resource = byKey.get(key)
  assert.equal(resource.category, 'settlement_resource')
  assert.ok(resource.gameplay.mechanics.some((fact) => /building upgrade resource/i.test(fact)))
}

const arenaToken = byKey.get('arena-token')
assert.equal(arenaToken.category, 'arena_currency')
assert.ok(arenaToken.gameplay.mechanics.some((fact) => /Roman/i.test(fact)))

const unresolvedKeys = enrichmentKeys.length === 49
  ? COMPANION_ITEM_PROJECTION
    .map((record) => record.key)
    .filter((key) => !COMPANION_ITEM_GAMEPLAY[key])
  : []
assert.equal(unresolvedKeys.length, 26)

for (const key of unresolvedKeys) {
  const record = byKey.get(key)
  assert.equal(record.gameplay, undefined, `${key} must remain unenriched without evidence`)
  assert.equal(record.trust_state, 'research_needed', `${key} must remain research_needed`)
}

assert.ok(unresolvedKeys.includes('platinum-key'))
assert.ok(unresolvedKeys.includes('weapon-scraps'))

const mithril = byKey.get('mithril')
assert.equal(mithril.forge_id, 'item.mithril')
assert.ok(!byKey.has('mythril'))

console.log(`Companion gameplay content recovery validated (${enrichmentKeys.length} enriched / 75 canonical items; ${unresolvedKeys.length} research-needed).`)
