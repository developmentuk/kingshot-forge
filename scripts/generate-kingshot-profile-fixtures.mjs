import { createHash } from 'node:crypto'
import { deflateSync, inflateSync } from 'node:zlib'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const root = new URL('../fixtures/vision/account-linking/', import.meta.url)
const source = await decodePng(await readFile(new URL('synthetic-profile.png', root)))
const expected = { name: 'EMBER FOX', playerId: '987654321', kingdom: '42' }
const full = compose(source, 1600, 900)
const small = resize(full, 800, 450)
await mkdir(root, { recursive: true })
for (const [name, image] of [['kingshot-profile-v1-1600x900.png', full], ['kingshot-profile-v1-800x450.png', small]]) {
  const bytes = encodePng(image)
  await writeFile(new URL(name, root), bytes)
  await writeFile(new URL(name.replace('.png', '.manifest.json'), root), JSON.stringify({ fixture: 'synthetic-kingshot-profile-card', mappingVersion: 'account-linking-kingshot-profile-v1', mimeType: 'image/png', widthPx: image.width, heightPx: image.height, sha256: createHash('sha256').update(bytes).digest('hex'), expected }, null, 2) + '\n')
}

function compose(src, width, height) {
  const pixels = new Uint8Array(width * height * 4)
  pixels.fill(246)
  const fill = (x, y, w, h, color) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const i = (yy * width + xx) * 4; pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = 255 } }
  fill(55, 90, 460, 720, [41, 57, 82]); fill(85, 120, 400, 400, [96, 121, 151]); fill(125, 165, 320, 300, [133, 154, 178])
  fill(85, 555, 400, 95, [55, 75, 105]); fill(530, 115, 990, 650, [255, 255, 255])
  copyCrop(src, pixels, width, { x: 315, y: 240, width: 470, height: 90 }, 650, 175)
  copyCrop(src, pixels, width, { x: 515, y: 60, width: 390, height: 95 }, 650, 350)
  copyCrop(src, pixels, width, { x: 485, y: 430, width: 110, height: 90 }, 650, 555)
  fill(650, 285, 400, 2, [220, 226, 234]); fill(650, 460, 400, 2, [220, 226, 234])
  fill(1320, 165, 70, 70, [218, 180, 65]); fill(1410, 165, 70, 70, [103, 164, 115])
  return { width, height, pixels }
}

function copyCrop(src, target, targetWidth, crop, dx, dy) {
  for (let y = 0; y < crop.height; y++) for (let x = 0; x < crop.width; x++) { const sx = crop.x + x; const sy = crop.y + y; if (sx >= src.width || sy >= src.height || dx + x >= targetWidth) continue; const si = (sy * src.width + sx) * 4; const di = ((dy + y) * targetWidth + dx + x) * 4; target[di] = src.pixels[si]; target[di + 1] = src.pixels[si + 1]; target[di + 2] = src.pixels[si + 2]; target[di + 3] = 255 }
}

function resize(src, width, height) { const pixels = new Uint8Array(width * height * 4); for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const sx = Math.floor(x * src.width / width); const sy = Math.floor(y * src.height / height); const si = (sy * src.width + sx) * 4; const di = (y * width + x) * 4; pixels.set(src.pixels.subarray(si, si + 4), di) } return { width, height, pixels } }

async function decodePng(bytes) {
  let offset = 8; let width = 0; let height = 0; let type = 0; const chunks = []
  while (offset < bytes.length) { const length = read32(bytes, offset); const kind = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)); const data = bytes.subarray(offset + 8, offset + 8 + length); offset += 12 + length; if (kind === 'IHDR') { width = read32(data, 0); height = read32(data, 4); type = data[9]; if (data[8] !== 8 || ![2, 6].includes(type)) throw new Error('fixture source must be 8-bit RGB/RGBA PNG') } if (kind === 'IDAT') chunks.push(data); if (kind === 'IEND') break }
  const bpp = type === 6 ? 4 : 3; const stride = width * bpp; const filtered = inflateSync(Buffer.concat(chunks)); const pixels = new Uint8Array(width * height * 4); let src = 0; let prior = new Uint8Array(stride)
  for (let y = 0; y < height; y++) { const filter = filtered[src++]; const row = new Uint8Array(filtered.subarray(src, src + stride)); src += stride; for (let x = 0; x < stride; x++) { const left = x >= bpp ? row[x - bpp] : 0; const up = prior[x] ?? 0; const upperLeft = x >= bpp ? prior[x - bpp] ?? 0 : 0; if (filter === 1) row[x] = (row[x] + left) & 255; else if (filter === 2) row[x] = (row[x] + up) & 255; else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255; else if (filter === 4) row[x] = (row[x] + paeth(left, up, upperLeft)) & 255 } for (let x = 0; x < width; x++) { const si = x * bpp; const di = (y * width + x) * 4; pixels[di] = row[si]; pixels[di + 1] = row[si + 1]; pixels[di + 2] = row[si + 2]; pixels[di + 3] = type === 6 ? row[si + 3] : 255 } prior = row }
  return { width, height, pixels }
}

function encodePng(image) { const row = Buffer.alloc((image.width * 4 + 1) * image.height); for (let y = 0; y < image.height; y++) { row[y * (image.width * 4 + 1)] = 0; Buffer.from(image.pixels).copy(row, y * (image.width * 4 + 1) + 1, y * image.width * 4, (y + 1) * image.width * 4) } const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(image.width, 0); ihdr.writeUInt32BE(image.height, 4); ihdr[8] = 8; ihdr[9] = 6; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(row, { level: 9 })), chunk('IEND', Buffer.alloc(0))]) }
function chunk(type, data) { const name = Buffer.from(type); const out = Buffer.alloc(12 + data.length); out.writeUInt32BE(data.length, 0); name.copy(out, 4); data.copy(out, 8); out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length); return out }
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)) } return (crc ^ 0xffffffff) >>> 0 }
function read32(bytes, offset) { return bytes[offset] * 0x1000000 + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) }
function paeth(a, b, c) { const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
