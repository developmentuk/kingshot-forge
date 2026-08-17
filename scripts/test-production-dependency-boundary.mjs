import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const packageLock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'))

assert.equal(packageJson.dependencies?.sharp, '0.35.3', 'sharp must remain a pinned production dependency')
assert.equal(Object.hasOwn(packageJson.devDependencies ?? {}, 'sharp'), false, 'sharp must not be duplicated in devDependencies')
assert.equal(packageLock.packages?.['']?.dependencies?.sharp, '0.35.3', 'the lockfile root must retain sharp in the production dependency graph')
assert.equal(Object.hasOwn(packageLock.packages?.['']?.devDependencies ?? {}, 'sharp'), false, 'the lockfile root must not classify sharp as development-only')
assert.ok(packageLock.packages?.['node_modules/sharp'], 'the lockfile must contain the sharp package')
assert.notEqual(packageLock.packages['node_modules/sharp'].dev, true, 'the locked sharp package must be installable with npm ci --omit=dev')

const sharp = await import('sharp')
assert.equal(typeof sharp.default, 'function', 'the production sharp module must load')
await import('../server/player-identity/kingshotProfileOcr.ts')
await import('../server/player-identity/townCenterGlyphOcr.ts')
await import('../api/player/link-ocr.ts')

console.log('Production dependency boundary passed: sharp and the player-link OCR import graph remain available outside devDependencies.')
