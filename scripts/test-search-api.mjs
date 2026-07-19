import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', server: { middlewareMode: true } })
function response() { return { statusCode: 200, body: null, headers: {}, setHeader(name, value) { this.headers[name] = value }, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } } }
try {
  const api = await vite.ssrLoadModule('/api/search.ts')
  const methodResponse = response(); await api.default({ method: 'POST', query: {} }, methodResponse); assert.equal(methodResponse.statusCode, 405)
  const longResponse = response(); await api.default({ method: 'GET', query: { q: 'x'.repeat(201) } }, longResponse); assert.equal(longResponse.statusCode, 400); assert.equal(longResponse.body.error.code, 'QUERY_TOO_LONG')
  const datasetResponse = response(); await api.default({ method: 'GET', query: { dataset: 'unknown' } }, datasetResponse); assert.equal(datasetResponse.statusCode, 400); assert.equal(datasetResponse.body.error.code, 'INVALID_DATASET')
  const depthResponse = response(); await api.default({ method: 'GET', query: { depth: '3' } }, depthResponse); assert.equal(depthResponse.statusCode, 400); assert.equal(depthResponse.body.error.code, 'INVALID_DEPTH')
  const admin = await vite.ssrLoadModule('/api/admin/search.ts')
  const adminResponse = response(); await admin.default({ method: 'GET', headers: {}, query: {} }, adminResponse); assert.equal(adminResponse.statusCode, 401)
  console.log('Search public API validation, safe error mapping and Admin authentication boundary tests passed.')
} finally { await vite.close() }

