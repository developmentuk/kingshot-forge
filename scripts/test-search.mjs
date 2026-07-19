import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', server: { middlewareMode: true } })
try {
  const search = await vite.ssrLoadModule('/shared/search/index.ts')
  const records = [
    { id: 'hero-a', dataset: 'heroes', title: 'Ashen Guard', subtitle: 'Infantry', summary: 'A published hero', keywords: ['frontline'], tags: ['infantry'], image: null, status: 'published', published_at: '2026-07-19T00:00:00Z', permissions: { visibility: 'public' }, relationships: [{ type: 'recommended_with', targetId: 'gear-a', targetDataset: 'gear' }], canonical_url: '/heroes/hero-a', search_weight: 2 },
    { id: 'gear-a', dataset: 'gear', title: 'Iron Mantle', subtitle: null, summary: null, keywords: ['guard'], tags: ['infantry'], image: null, status: 'published', published_at: '2026-07-19T00:00:00Z', permissions: { visibility: 'public' }, relationships: [], canonical_url: null, search_weight: 1 },
    { id: 'draft', dataset: 'heroes', title: 'Unpublished Hero', subtitle: null, summary: null, keywords: [], tags: [], image: null, status: 'draft', published_at: null, permissions: { visibility: 'public' }, relationships: [], canonical_url: null, search_weight: 50 },
    { id: 'private', dataset: 'heroes', title: 'Private Hero', subtitle: null, summary: null, keywords: [], tags: [], image: null, status: 'published', published_at: '2026-07-19T00:00:00Z', permissions: { visibility: 'internal' }, relationships: [], canonical_url: null, search_weight: 50 },
  ]
  const engine = new search.SearchEngine()
  engine.index(records)
  assert.deepEqual(engine.query({ text: 'Ashen' }).results.map(({ record }) => record.id), ['hero-a'])
  assert.deepEqual(new Set(engine.query({ relationshipFrom: 'heroes:hero-a', relationshipDepth: 1 }).results.map(({ record }) => record.id)), new Set(['hero-a', 'gear-a']))
  assert.equal(engine.query({}).results.some(({ record }) => record.id === 'draft'), false)
  assert.equal(engine.query({ includeUnpublished: true, permissions: { isAdmin: true } }).results.some(({ record }) => record.id === 'draft'), true)
  assert.equal(engine.query({}).diagnostics.brokenReferences, 0)
  console.log('Search provider, published, permission, ranking, relationship and diagnostics tests passed.')
} finally { await vite.close() }

