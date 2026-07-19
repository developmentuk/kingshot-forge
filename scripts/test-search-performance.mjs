import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', server: { middlewareMode: true } })
try {
  const { SearchEngine } = await vite.ssrLoadModule('/shared/search/index.ts')
  const measurements = []
  for (const size of [100, 1000, 10000]) {
    const records = Array.from({ length: size }, (_, index) => ({ id: `hero-${index}`, dataset: 'heroes', title: `Synthetic Hero ${index}`, subtitle: 'Infantry', summary: 'Performance fixture', keywords: [`hero-${index}`, 'synthetic'], tags: ['performance'], image: null, status: 'published', published_at: '2026-07-19T00:00:00Z', permissions: { visibility: 'public' }, relationships: [], canonical_url: `/heroes/hero-${index}`, search_weight: 1 }))
    const engine = new SearchEngine()
    const buildStart = performance.now(); engine.index(records); const buildMs = performance.now() - buildStart
    const queryStart = performance.now(); const result = engine.query({ text: 'Synthetic Hero 99', limit: 20 }); const queryMs = performance.now() - queryStart
    const diagnosticsStart = performance.now(); engine.query({ limit: 0 }); const diagnosticsMs = performance.now() - diagnosticsStart
    assert.ok(result.results.length > 0)
    assert.ok(buildMs < 10000 && queryMs < 10000 && diagnosticsMs < 10000)
    measurements.push({ size, buildMs: Number(buildMs.toFixed(2)), warmQueryMs: Number(queryMs.toFixed(2)), diagnosticsMs: Number(diagnosticsMs.toFixed(2)) })
  }
  console.log(`Search performance measurements: ${JSON.stringify(measurements)}`)
  console.log('Synthetic performance coverage passed; measurements are local baselines, not production guarantees.')
} finally { await vite.close() }

