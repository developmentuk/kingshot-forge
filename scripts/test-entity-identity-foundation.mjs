import assert from 'node:assert/strict'
import { createForgeId, forgeIdsEqual, isValidForgeId, namespaceOf, localKeyOf, parseForgeId } from '../shared/entity-identity/forgeId.ts'
import { entityTypeRegistry, buildPublicRoute } from '../shared/entity-identity/registry.ts'
import { EntityResolver, createCatalogAdapter } from '../server/entity-identity/resolver.ts'
import { createLegacyIndex, translateLegacyIdentifier } from '../server/entity-identity/legacy.ts'

for (const value of ['hero.amadeus', 'building.town-center', 'hero-skill.amadeus.royal-command', 'troop.infantry.tg6']) assert.equal(isValidForgeId(value), true)
for (const value of ['Building.Town Center', '/buildings/town-center', 'town-center', '00000000-0000-4000-8000-000000000000', '.town-center', 'building.', 'building..town-center', 'building.town_center', 'building.town/center']) assert.equal(isValidForgeId(value), false, value)
assert.equal(parseForgeId(' Hero.Amadeus ')?.forgeId, 'hero.amadeus')
assert.equal(createForgeId('hero', 'amadeus'), 'hero.amadeus')
assert.equal(namespaceOf('hero.amadeus'), 'hero')
assert.equal(localKeyOf('hero-skill.amadeus.royal-command'), 'amadeus.royal-command')
assert.equal(forgeIdsEqual('hero.amadeus', 'hero.amadeus'), true)
assert.equal(buildPublicRoute('building.town-center'), '/buildings/town-center')
assert.equal(buildPublicRoute('event.bear-hunt'), null)
assert.equal(entityTypeRegistry.listEnabled().length, 22)

const resolver = new EntityResolver()
resolver.register(createCatalogAdapter('building', [{ forgeId: 'building.town-center', canonicalRecordId: 'tc-1', displayName: 'Town Center', slug: 'town-center', route: '/buildings/town-center', lifecycle: 'published' }, { forgeId: 'building.barracks', canonicalRecordId: 'b-1', displayName: 'Barracks', slug: 'barracks', route: '/buildings/barracks', lifecycle: 'draft' }]))
assert.equal((await resolver.resolve('building.town-center', 'published')).found, true)
assert.equal((await resolver.resolve('building.barracks', 'published')).found, false)
assert.equal((await resolver.resolve('building.barracks', 'internal')).found, false)
assert.equal((await resolver.resolve('unknown.value', 'published')).found, false)

const legacy = createLegacyIndex([{ identifier: { kind: 'slug', value: 'town-center' }, forgeId: 'building.town-center', source: 'public.buildings.slug' }])
assert.deepEqual(translateLegacyIdentifier({ kind: 'slug', value: 'town-center' }, legacy), { forgeId: 'building.town-center' })
assert.equal(translateLegacyIdentifier({ kind: 'slug', value: 'missing' }, legacy).code, 'not_found')
console.log('Entity identity foundation contract tests passed.')
