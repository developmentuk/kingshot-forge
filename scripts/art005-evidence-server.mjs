import http from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const mime = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
    const file = path.resolve(root, `.${pathname}`)
    if (!file.startsWith(root) || pathname === '/') { response.writeHead(404); response.end('Not found'); return }
    const content = await readFile(file)
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream', 'Content-Length': content.length })
    response.end(content)
  } catch { response.writeHead(404); response.end('Not found') }
})
server.listen(4185, '127.0.0.1', () => console.log('ART005 evidence server listening on http://127.0.0.1:4185'))
