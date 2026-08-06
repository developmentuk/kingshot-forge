import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const lockfile = await readFile(new URL('../package-lock.json', import.meta.url))
const encoded = lockfile.toString('base64')
const chunkSize = 1800
const chunkCount = Math.ceil(encoded.length / chunkSize)
const digest = createHash('sha256').update(lockfile).digest('hex')

console.log(`LOCKFILE_BEGIN bytes=${lockfile.length} base64=${encoded.length} chunks=${chunkCount} sha256=${digest}`)
for (let index = 0; index < chunkCount; index += 1) {
  const chunk = encoded.slice(index * chunkSize, (index + 1) * chunkSize)
  console.log(`LOCKFILE_CHUNK ${String(index + 1).padStart(4, '0')}/${String(chunkCount).padStart(4, '0')} ${chunk}`)
}
console.log(`LOCKFILE_END sha256=${digest}`)
