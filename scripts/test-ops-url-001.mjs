import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { readSingleQueryParameter } from '../server/http/requestQuery.ts'

const root = process.cwd()

assert.equal(readSingleQueryParameter(undefined, 'dataset'), null)
assert.equal(readSingleQueryParameter('/', 'dataset'), null)
assert.equal(readSingleQueryParameter('/api/data-engine/dataset?dataset=vip', 'dataset'), 'vip')
assert.equal(
  readSingleQueryParameter('https://ksforge.app/api/data-engine/dataset?dataset=buildings', 'dataset'),
  'buildings',
)
assert.equal(readSingleQueryParameter('/api/data-engine/dataset?dataset=v%69p', 'dataset'), 'vip')
assert.equal(
  readSingleQueryParameter('/api/data-engine/dataset?dataset=vip&dataset=heroes', 'dataset'),
  null,
)
assert.equal(
  readSingleQueryParameter('/api/data-engine/dataset?dataset=vip&other=one&other=two', 'dataset'),
  'vip',
)
assert.equal(readSingleQueryParameter('/api/art-studio?action=', 'action'), '')
assert.equal(readSingleQueryParameter('/api/art-studio?action=queue', 'action'), 'queue')
assert.equal(readSingleQueryParameter('/api/art-studio?action=queue&action=gallery', 'action'), null)
assert.equal(readSingleQueryParameter('/api/art-studio?action=queue', ''), null)

function collectTypeScriptFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry)
    if (statSync(path).isDirectory()) files.push(...collectTypeScriptFiles(path))
    else if (entry.endsWith('.ts')) files.push(path)
  }
  return files
}

const apiFiles = collectTypeScriptFiles(resolve(root, 'api'))
const legacyQueryUsers = apiFiles
  .filter((path) => /\b(?:request|req)\.query\b/u.test(readFileSync(path, 'utf8')))
  .map((path) => path.slice(root.length + 1).replaceAll('\\', '/'))

assert.deepEqual(
  legacyQueryUsers,
  [],
  `VercelRequest.query must not be used because it can enter the legacy url.parse() path: ${legacyQueryUsers.join(', ')}`,
)

const firstPartyServerFiles = [
  ...apiFiles,
  ...collectTypeScriptFiles(resolve(root, 'server')),
]
const legacyUrlUsers = firstPartyServerFiles
  .filter((path) => {
    const source = readFileSync(path, 'utf8')
    return /\burl\.parse\s*\(/u.test(source)
      || /import\s*\{[^}]*\bparse\s+as\s+parseURL\b[^}]*\}\s*from\s*['"](?:node:)?url['"]/u.test(source)
  })
  .map((path) => path.slice(root.length + 1).replaceAll('\\', '/'))

assert.deepEqual(
  legacyUrlUsers,
  [],
  `First-party API/server code must not use Node's legacy url.parse(): ${legacyUrlUsers.join(', ')}`,
)

const datasetRoute = readFileSync(resolve(root, 'api/data-engine/dataset.ts'), 'utf8')
const previewRoute = readFileSync(resolve(root, 'api/data-engine/preview.ts'), 'utf8')
const artStudioRoute = readFileSync(resolve(root, 'api/art-studio.ts'), 'utf8')

assert.match(datasetRoute, /readSingleQueryParameter\(request\.url, "dataset"\)/u)
assert.match(previewRoute, /readSingleQueryParameter\(request\.url, 'dataset'\)/u)
assert.match(artStudioRoute, /readSingleQueryParameter\(request\.url, 'action'\) \?\? 'gallery'/u)

console.log('OPS-URL-001 request query contracts passed: WHATWG parsing, duplicate fail-closed semantics and zero VercelRequest.query usage verified.')
