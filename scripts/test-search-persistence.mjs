import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', server: { middlewareMode: true } })
try {
  const search = await vite.ssrLoadModule('/shared/search/index.ts')
  const admin = await vite.ssrLoadModule('/server/search/admin.ts')
  const record = (id, status = 'published') => ({ id, dataset: 'heroes', title: `Hero ${id}`, subtitle: null, summary: 'Synthetic published record', keywords: ['hero'], tags: ['synthetic'], image: null, status, published_at: status === 'published' ? '2026-07-19T00:00:00Z' : null, permissions: { visibility: 'public' }, relationships: [], canonical_url: `/heroes/${id}`, search_weight: 1 })
  const repository = new search.InMemorySearchProjectionRepository()
  const providers = new Map([['heroes', { dataset: 'heroes', name: 'Synthetic Heroes', async load() { return [record('a'), record('b')] } }]])
  const refresh = new search.SearchProjectionRefreshService(repository, providers)

  const first = await refresh.refresh('dataset', ['heroes'])
  assert.equal(first.records_inserted, 2)
  const second = await refresh.refresh('dataset', ['heroes'])
  assert.equal(second.records_unchanged, 2)
  providers.get('heroes').load = async () => [record('a')]
  const third = await refresh.refresh('dataset', ['heroes'])
  assert.equal(third.records_removed, 1)
  providers.get('heroes').load = async () => [record('a'), record('draft', 'draft')]
  const fourth = await refresh.refresh('dataset', ['heroes'])
  assert.equal(fourth.failures[0].code, 'not_published')
  assert.equal((await repository.listProjections()).length, 1)

  providers.set('broken', { dataset: 'broken', name: 'Broken', async load() { throw new Error('synthetic provider failure') } })
  const partial = await new search.SearchProjectionRefreshService(repository, providers).refresh('full', ['heroes', 'broken'])
  assert.ok(partial.failures.some((failure) => failure.code === 'provider_failed'))
  assert.equal((await repository.readIndexMetadata()).stale, true)

  const cache = new search.SearchIndexCache(repository)
  const result = await cache.query({ text: 'Hero a' })
  assert.equal(result.results[0].record.id, 'a')
  assert.equal((await cache.health()).projection_count, 1)
  assert.equal((await cache.health()).fallback_active, true)
  const operational = await search.buildSearchOperationalDiagnostics(repository)
  assert.equal(operational.persistedProjectionCount, 1)
  await cache.invalidate()
  const rebuilt = await cache.query({ text: 'Hero a' })
  assert.equal(rebuilt.results[0].record.id, 'a')
  const unavailable = new search.SearchIndexCache({ listProjections: async () => { throw new Error('persistence down') } })
  await assert.rejects(() => unavailable.query({}), /persistence down/)

  const actor = { userId: 'admin-1', role: 'admin', roles: ['admin'], permissionKeys: ['cms.view'] }
  const simulated = await admin.resolveSearchPermissionContext(actor, 'viewer', async () => [])
  assert.equal(simulated.roles[0], 'viewer')
  await assert.rejects(() => admin.resolveSearchPermissionContext({ ...actor, role: 'viewer', permissionKeys: ['cms.view'] }, 'admin', async () => []), /authorised administrators/)
  await assert.rejects(() => admin.resolveSearchPermissionContext(actor, 'unknown', async () => []), /not supported/)
  console.log('Search projection persistence, idempotent refresh, stale removal, failure isolation, cache and Admin simulation tests passed.')
} finally { await vite.close() }

