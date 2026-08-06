import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { brotliCompressSync, constants } from 'node:zlib'

const lockfile = await readFile(new URL('../package-lock.json', import.meta.url))
const compressed = brotliCompressSync(lockfile, {
  params: {
    [constants.BROTLI_PARAM_QUALITY]: 11,
  },
})
const encoded = compressed.toString('base64')
const chunkSize = 3500
const chunkCount = Math.ceil(encoded.length / chunkSize)
const digest = createHash('sha256').update(lockfile).digest('hex')

console.log(`LOCKFILE_BEGIN bytes=${lockfile.length} brotli=${compressed.length} base64=${encoded.length} chunks=${chunkCount} sha256=${digest}`)
for (let index = 0; index < chunkCount; index += 1) {
  const chunk = encoded.slice(index * chunkSize, (index + 1) * chunkSize)
  console.log(`LOCKFILE_CHUNK ${String(index + 1).padStart(2, '0')}/${String(chunkCount).padStart(2, '0')} ${chunk}`)
}
console.log(`LOCKFILE_END sha256=${digest}`)
