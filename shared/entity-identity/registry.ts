import type { EntityTypeDefinition } from './contracts.js'
import { parseForgeId } from './forgeId.js'

const ENTITY_TYPE_ROWS = [
  ['building', 'building', 'building', 'public.buildings', 'editorial_status=published and published_version is not null', '/buildings/:slug', 'search.building', 'entity.building.read', 'entity.building.write', false, false, true, true, 'hide'],
  ['building_progression', 'building-progression', 'building-progression', 'public.building_progression', 'parent building is published', '/buildings/:parent/progression', 'search.building-progression', 'entity.building.read', 'entity.building.write', false, false, true, true, 'hide'],
  ['item', 'item', 'item', 'forge://companion/items', 'published text-only Companion projection', '/companion/items/:slug', 'search.item', 'entity.item.read', 'entity.item.write', true, true, true, false, 'hide'],
  ['hero', 'hero', 'hero', 'public.heroes', 'published projection only', '/companion/heroes/:slug', 'search.hero', 'entity.hero.read', 'entity.hero.write', true, false, true, false, 'hide'],
  ['hero_skill', 'hero-skill', 'hero-skill', 'public.published_hero_skills', 'published projection only', '/companion/heroes/:hero/skills', 'search.hero-skill', 'entity.hero.read', 'entity.hero.write', true, false, true, false, 'hide'],
  ['hero_gear', 'hero-gear', 'hero-gear', 'public.hero_gear', 'published projection only', '/companion/heroes/:hero/gear', 'search.hero-gear', 'entity.hero.read', 'entity.hero.write', true, false, true, false, 'hide'],
  ['hero_widget', 'hero-widget', 'hero-widget', 'public.hero_widgets', 'published projection only', '/companion/heroes/:hero', 'search.hero-widget', 'entity.hero.read', 'entity.hero.write', true, false, false, false, 'hide'],
  ['event', 'event', 'event', 'public.events', 'published projection only', '', 'search.event', 'entity.event.read', 'entity.event.write', false, false, true, false, 'hide'],
  ['troop', 'troop', 'troop', 'public.troops', 'published projection only', '', 'search.troop', 'entity.troop.read', 'entity.troop.write', false, false, true, true, 'hide'],
  ['gear', 'gear', 'gear', 'public.gear', 'published projection only', '', 'search.gear', 'entity.gear.read', 'entity.gear.write', true, false, true, true, 'hide'],
  ['charm', 'charm', 'charm', 'public.charm', 'published projection only', '', 'search.charm', 'entity.charm.read', 'entity.charm.write', true, false, true, true, 'hide'],
  ['research', 'research', 'research', 'public.research', 'published projection only', '', 'search.research', 'entity.research.read', 'entity.research.write', false, false, true, true, 'hide'],
  ['war_academy', 'war-academy', 'war-academy', 'public.war_academy', 'published projection only', '', 'search.war-academy', 'entity.war-academy.read', 'entity.war-academy.write', false, false, true, true, 'hide'],
  ['player', 'player', 'player', 'public.player_profiles', 'visibility=public', '/player/:localKey', 'search.player', 'entity.player.read', 'entity.player.write', true, false, true, false, 'hide'],
  ['alliance', 'alliance', 'alliance', 'public.alliances', 'visibility=public', '/alliances/:slug', 'search.alliance', 'entity.alliance.read', 'entity.alliance.write', true, false, true, false, 'hide'],
  ['kingdom', 'kingdom', 'kingdom', 'public.kingdoms', 'visibility=public', '/kingdoms/:slug', 'search.kingdom', 'entity.kingdom.read', 'entity.kingdom.write', false, false, true, false, 'hide'],
  ['guide', 'guide', 'guide', 'public.guides', 'published projection only', '', 'search.guide', 'entity.guide.read', 'entity.guide.write', true, false, true, false, 'hide'],
  ['article', 'article', 'article', 'public.articles', 'published projection only', '', 'search.article', 'entity.article.read', 'entity.article.write', true, false, true, false, 'hide'],
  ['video', 'video', 'video', 'public.videos', 'published projection only', '', 'search.video', 'entity.video.read', 'entity.video.write', true, false, true, false, 'hide'],
  ['creator', 'creator', 'creator', 'public.creators', 'published projection only', '', 'search.creator', 'entity.creator.read', 'entity.creator.write', true, false, true, false, 'hide'],
  ['tool', 'tool', 'tool', 'public.tools', 'published projection only', '', 'search.tool', 'entity.tool.read', 'entity.tool.write', false, false, true, false, 'hide'],
  ['calculator', 'calculator', 'calculator', 'public.calculators', 'published projection only', '', 'search.calculator', 'entity.calculator.read', 'entity.calculator.write', false, false, true, false, 'hide'],
  ['dataset', 'dataset', 'dataset', 'public.datasets', 'published projection only', '', 'search.dataset', 'entity.dataset.read', 'entity.dataset.write', false, false, false, false, 'retain'],
] as const

export const ENTITY_TYPE_DEFINITIONS: readonly EntityTypeDefinition[] = ENTITY_TYPE_ROWS.map(([key, namespace, resolverKey, canonicalSource, publishedStateRule, routePolicy, searchAdapterKey, requiredReadCapability, requiredWriteCapability, mediaEligible, tagEligible, relationshipEligible, progressionEligible, archiveBehaviour]) => ({ key, namespace, resolverKey, canonicalSource, publishedStateRule, routePolicy, searchAdapterKey, requiredReadCapability, requiredWriteCapability, mediaEligible, tagEligible, relationshipEligible, progressionEligible, archiveBehaviour, enabled: true }))

export class EntityTypeRegistry {
  private readonly definitionsByKey = new Map(ENTITY_TYPE_DEFINITIONS.map((definition) => [definition.key, definition]))
  private readonly definitionsByNamespace = new Map(ENTITY_TYPE_DEFINITIONS.map((definition) => [definition.namespace, definition]))

  get(key: string): EntityTypeDefinition | null { return this.definitionsByKey.get(key) ?? null }
  byNamespace(namespace: string): EntityTypeDefinition | null { return this.definitionsByNamespace.get(namespace) ?? null }
  listEnabled(): readonly EntityTypeDefinition[] { return [...this.definitionsByKey.values()].filter((definition) => definition.enabled) }
  validate(): void {
    const namespaces = new Set<string>()
    for (const definition of this.definitionsByKey.values()) {
      if (!definition.resolverKey || namespaces.has(definition.namespace)) throw new Error(`Invalid entity registry: ${definition.key}`)
      namespaces.add(definition.namespace)
    }
  }
}

export const entityTypeRegistry = new EntityTypeRegistry()
entityTypeRegistry.validate()

export function buildPublicRoute(forgeId: string, slug?: string | null): string | null {
  const parsed = parseForgeId(forgeId)
  if (!parsed) return null
  const definition = entityTypeRegistry.byNamespace(parsed.namespace)
  if (!definition || !definition.enabled || !definition.routePolicy || definition.routePolicy.includes(':parent')) return null
  const route = definition.routePolicy.replace(':slug', encodeURIComponent(slug ?? parsed.localKey))
  return route.includes(':') ? null : route
}
