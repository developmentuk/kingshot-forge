import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const root = new URL('../fixtures/vision/account-linking/', import.meta.url)
await mkdir(root, { recursive: true })
const expected = { name: '[FRG] EMBER FOX', playerId: '987654321', kingdom: '42' }

const svg = (width, height) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="#e7edf5"/><rect x="${width * .035}" y="${height * .1}" width="${width * .25}" height="${height * .8}" rx="${width * .02}" fill="#243b5b"/><circle cx="${width * .16}" cy="${height * .34}" r="${width * .085}" fill="#89a4c2"/><path d="M${width * .08} ${height * .58} Q${width * .16} ${height * .48} ${width * .24} ${height * .58} L${width * .24} ${height * .82} L${width * .08} ${height * .82}Z" fill="#54799e"/>
<rect x="${width * .27}" y="${height * .1}" width="${width * .58}" height="${height * .8}" rx="${width * .018}" fill="#fff" stroke="#c9d5e4" stroke-width="${Math.max(2, width / 400)}"/>
<text x="${width * .29}" y="${height * .25}" font-family="Arial, sans-serif" font-size="${width * .052}" font-weight="700" fill="#142238">[FRG] EMBER FOX</text>
<text x="${width * .29}" y="${height * .43}" font-family="Arial, sans-serif" font-size="${width * .042}" font-weight="600" fill="#243b5b">ID: 987654321</text>
<rect x="${width * .72}" y="${height * .35}" width="${width * .026}" height="${height * .045}" rx="3" fill="#91a4b9"/><path d="M${width * .726} ${height * .365}h${width * .014}M${width * .726} ${height * .378}h${width * .014}" stroke="#fff" stroke-width="2"/>
<text x="${width * .29}" y="${height * .61}" font-family="Arial, sans-serif" font-size="${width * .034}" font-weight="600" fill="#53657b">Town Center Level: 6</text><circle cx="${width * .76}" cy="${height * .59}" r="${width * .035}" fill="#e2b93f"/><text x="${width * .748}" y="${height * .604}" font-family="Arial" font-size="${width * .03}" font-weight="700" fill="#fff">6</text>
<text x="${width * .29}" y="${height * .80}" font-family="Arial, sans-serif" font-size="${width * .052}" font-weight="700" fill="#243b5b">Kingdom #42</text></svg>`

for (const item of [{ name: 'kingshot-profile-v2-large.png', width: 1600, height: 900, format: 'png' }, { name: 'kingshot-profile-v2-low-res.jpg', width: 800, height: 450, format: 'jpeg' }]) {
  let image = sharp(Buffer.from(svg(item.width, item.height))).resize(item.width, item.height)
  const bytes = item.format === 'jpeg' ? await image.jpeg({ quality: 64, chromaSubsampling: '4:2:0' }).blur(0.3).toBuffer() : await image.png({ compressionLevel: 6 }).toBuffer()
  await writeFile(new URL(item.name, root), bytes)
  await writeFile(new URL(item.name.replace(/\.(png|jpg)$/, '.manifest.json'), root), JSON.stringify({ fixture: 'independent-synthetic-kingshot-profile-v2', mappingVersion: 'account-linking-kingshot-profile-v2', mimeType: item.format === 'jpeg' ? 'image/jpeg' : 'image/png', widthPx: item.width, heightPx: item.height, sha256: createHash('sha256').update(bytes).digest('hex'), expected }, null, 2) + '\n')
}
