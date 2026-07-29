import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { measureVisibleInk } from './art006-visible-ink.mjs'

const fixtureRoot = path.resolve('fixtures/community-art/adaptive-clipboard')
const candidateRoot = path.resolve(process.env.ART006_CAPTURE_DIR ?? 'artifacts/art006/candidates')
const ownerRoot = path.resolve(process.env.ART006_OWNER_EVIDENCE_DIR)
const productionRoot = path.resolve(process.env.ART006_PRODUCTION_EVIDENCE_DIR)
const outputRoot = path.resolve(process.env.ART006_BOARD_DIR ?? 'artifacts/art006/boards')
const fixtures = [
  { slug: 'i-have-come-to', title: 'I have come to', owner: 'i-have-come-to-art006-owner-rereview2-fail.png', production: 'i-have-come-to-production-failing.png' },
  { slug: 'dont-ask-me', title: 'Dont ask me', owner: 'dont-ask-me-art006-owner-rereview2-fail.png', production: 'dont-ask-me-production-failing.png' },
  { slug: 'ah-ah-oops', title: 'AH AH oops', owner: 'ah-ah-oops-art006-owner-rereview2-pass.png', production: 'ah-ah-oops-production-control.png' },
]
const semanticIndexes = new Map([[1, 's37–39'], [2, 's37–39'], [3, 's34–36'], [4, 's34–36']])
await mkdir(outputRoot, { recursive: true })

const xml = (value) => String(value).replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character])

async function annotatedPanel(file, sourceRows, slug) {
  const base = await sharp(file).rotate().png().toBuffer({ resolveWithObject: true })
  let measurement
  try { measurement = await measureVisibleInk(file, sourceRows) } catch { /* retain the original panel when source-row matching is unavailable */ }
  const panel = await sharp(base.data).resize({ width: 350, height: 560, fit: 'contain', background: '#fffdf8' }).png().toBuffer()
  if (!measurement) return panel
  const overlays = [
    `<rect x="${measurement.bubble.left}" y="${measurement.bubble.top}" width="${measurement.bubble.width}" height="${measurement.bubble.height}" fill="none" stroke="#2563eb" stroke-width="2"/>`,
  ]
  measurement.rows.forEach((row) => {
    const caption = slug === 'dont-ask-me' && row.sourceRow === 8
    const colour = caption ? '#f97316' : '#06b6d4'
    overlays.push(`<rect x="${row.left}" y="${row.top}" width="${Math.max(1, row.right - row.left)}" height="${Math.max(1, row.bottom - row.top)}" fill="none" stroke="${colour}" stroke-width="1"/>`)
    overlays.push(`<line x1="${row.left}" y1="${row.centreY}" x2="${row.right}" y2="${row.centreY}" stroke="${colour}" stroke-width="1" stroke-dasharray="3 3"/>`)
    overlays.push(`<text x="${row.left + 2}" y="${Math.max(10, row.top - 2)}" fill="${colour}" font-family="Arial" font-size="9">r${row.sourceRow}${slug === 'i-have-come-to' && semanticIndexes.has(row.sourceRow) ? ` ${semanticIndexes.get(row.sourceRow)}` : ''}</text>`)
    if (slug === 'i-have-come-to' && row.sourceRow >= 1 && row.sourceRow <= 4 && row.landmarks.principalGap) {
      overlays.push(`<line x1="${row.landmarks.principalGap.left}" y1="${row.top}" x2="${row.landmarks.principalGap.left}" y2="${row.bottom}" stroke="#a855f7" stroke-width="2"/>`)
      overlays.push(`<line x1="${row.landmarks.principalGap.right}" y1="${row.top}" x2="${row.landmarks.principalGap.right}" y2="${row.bottom}" stroke="#ef4444" stroke-width="2"/>`)
    }
  })
  if (slug === 'dont-ask-me') {
    const body = measurement.rows.find((row) => row.sourceRow === 5)
    const caption = measurement.rows.find((row) => row.sourceRow === 8)
    if (body && caption) overlays.push(`<line x1="${measurement.bubble.right - 8}" y1="${body.bottom}" x2="${measurement.bubble.right - 8}" y2="${caption.top}" stroke="#eab308" stroke-width="3"/>`)
  }
  const scale = Math.min(350 / base.info.width, 560 / base.info.height)
  const offsetX = (350 - base.info.width * scale) / 2
  const offsetY = (560 - base.info.height * scale) / 2
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="350" height="560" viewBox="0 0 350 560"><g transform="translate(${offsetX} ${offsetY}) scale(${scale})">${overlays.join('')}</g></svg>`)
  return sharp(panel)
    .composite([{ input: overlay, blend: 'over' }])
    .png()
    .toBuffer()
}

for (const fixture of fixtures) {
  const directory = path.join(fixtureRoot, fixture.slug)
  const metadata = JSON.parse(await readFile(path.join(directory, 'metadata.json'), 'utf8'))
  const source = Buffer.from((await readFile(path.join(directory, metadata.source.filename), 'utf8')).replace(/\s/g, ''), 'base64').toString('utf8')
  const sourceRows = source.split(/\r\n|\r|\n/)
  for (const viewport of ['mobile', 'tablet']) {
    const inputs = [
      { label: '1 · Canonical Kingshot', file: path.join(directory, metadata.evidence.referenceScreenshot) },
      { label: '2 · ART-005 production', file: path.join(productionRoot, fixture.production) },
      { label: '3 · Failed 410fa owner review', file: path.join(ownerRoot, fixture.owner) },
      { label: `4 · New ${viewport} Fit candidate`, file: path.join(candidateRoot, `${fixture.slug}-${viewport}.png`) },
    ]
    const panels = await Promise.all(inputs.map((input) => annotatedPanel(input.file, sourceRows, fixture.slug)))
    const labels = inputs.map((input, index) => ({
      input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="350" height="38"><rect width="350" height="38" rx="8" fill="#111827"/><text x="175" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="700">${xml(input.label)}</text></svg>`),
      left: 25 + index * 390,
      top: 75,
    }))
    const title = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#f3efe6"/><text x="40" y="44" fill="#111827" font-family="Arial" font-size="28" font-weight="700">ART-006 · ${xml(fixture.title)} · ${viewport} Fit</text><text x="40" y="860" fill="#374151" font-family="Arial" font-size="15">Blue: bubble · cyan: row ink/baseline · purple/red: structural/prose landmarks · orange: caption · yellow: body-caption distance</text></svg>`)
    const composites = [{ input: title }, ...labels]
    panels.forEach((panel, index) => composites.push({ input: panel, left: 25 + index * 390, top: 125 }))
    const board = await sharp({ create: { width: 1600, height: 900, channels: 4, background: '#f3efe6' } }).composite(composites).png().toBuffer()
    const filename = path.join(outputRoot, `${fixture.slug}-${viewport}.png`)
    await writeFile(filename, board)
    console.log(`Wrote ${filename}`)
  }
}
