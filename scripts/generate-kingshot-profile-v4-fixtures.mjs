import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const root = new URL('../fixtures/vision/account-linking/', import.meta.url)
await mkdir(root, { recursive: true })
const svg = (width, height, damaged = false) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<rect width="100%" height="100%" fill="#e7edf5"/><rect x="${width*.03}" y="${height*.05}" width="${width*.26}" height="${height*.89}" rx="${width*.02}" fill="#243b5b"/><circle cx="${width*.16}" cy="${height*.30}" r="${width*.08}" fill="#89a4c2"/>
<rect x="${width*.29}" y="${height*.10}" width="${width*.67}" height="${height*.84}" rx="${width*.018}" fill="#fff" stroke="#c9d5e4" stroke-width="${Math.max(2,width/400)}"/>
<text x="${width*.305}" y="${height*.25}" font-family="Arial" font-size="${width*.034}" font-weight="700" fill="#142238">[NX]</text><text x="${width*.405}" y="${height*.25}" font-family="Arial" font-size="${width*.05}" font-weight="700" fill="#142238">EMBER FOX</text>
<text x="${width*.305}" y="${height*.485}" font-family="Arial" font-size="${width*.038}" font-weight="700" fill="#243b5b">ID</text><text x="${width*.36}" y="${height*.485}" font-family="Arial" font-size="${width < 1000 ? width*.032 : width*.024}" font-weight="700" fill="#243b5b">${damaged ? '11111111111' : width < 1000 ? '111111111' : '111111111111'}</text>
<rect x="${width*.565}" y="${height*.405}" width="${width*.028}" height="${height*.07}" rx="3" fill="#91a4b9"/><path d="M${width*.57} ${height*.43}h${width*.018}M${width*.57} ${height*.45}h${width*.018}" stroke="#fff" stroke-width="3"/>
<text x="${width*.305}" y="${height*.655}" font-family="Arial" font-size="${width*.03}" font-weight="600" fill="#53657b">Town Centre Level</text><circle cx="${width*.74}" cy="${height*.625}" r="${width*.035}" fill="#e2b93f"/><text x="${width*.73}" y="${height*.645}" font-family="Arial" font-size="${width*.03}" font-weight="700" fill="#fff">6</text>
<text x="${width*.305}" y="${height*.87}" font-family="Arial" font-size="${width*.04}" font-weight="700" fill="#243b5b">Kingdom</text><text x="${width*.51}" y="${height*.87}" font-family="Arial" font-size="${width*.055}" font-weight="700" fill="#243b5b">42</text></svg>`

for (const item of [{ name: 'kingshot-profile-v4-large.png', width: 1600, height: 900, format: 'png' }, { name: 'kingshot-profile-v4-low-res.jpg', width: 800, height: 450, format: 'jpeg' }, { name: 'kingshot-profile-v4-threshold-damaged.png', width: 1600, height: 900, format: 'png', damaged: true }]) {
  const source = sharp(Buffer.from(svg(item.width, item.height, item.damaged)))
  const bytes = item.format === 'jpeg' ? await source.blur(0.3).jpeg({ quality: 64, chromaSubsampling: '4:2:0' }).toBuffer() : await source.png({ compressionLevel: 6 }).toBuffer()
  await writeFile(new URL(item.name, root), bytes)
  await writeFile(new URL(item.name.replace(/\.(png|jpg)$/, '.manifest.json'), root), JSON.stringify({ fixture: 'synthetic-kingshot-component-map-v4', mappingVersion: 'account-linking-kingshot-profile-v4', mimeType: item.format === 'jpeg' ? 'image/jpeg' : 'image/png', widthPx: item.width, heightPx: item.height, sha256: createHash('sha256').update(bytes).digest('hex'), realAccountData: false, expected: { allianceTag: '[NX]', name: 'EMBER FOX', playerId: item.width < 1000 ? '111111111' : item.damaged ? '11111111111' : '111111111111', kingdom: '42' } }, null, 2) + '\n')
}
