import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright'

const root = path.resolve('fixtures/community-art/adaptive-clipboard')
const output = path.resolve(process.env.ART006_CAPTURE_DIR ?? 'artifacts/art006/candidates')
const cases = process.env.ART006_CASES?.split(',').filter(Boolean) ?? ['i-have-come-to', 'dont-ask-me', 'ah-ah-oops', 'free-hard-spanking', 'where-is-all-the-good-text-art', 'alliance-coffee-time', 'wow-im-so-cute-expanded']
const viewports = [{ name: 'mobile', width: 390, height: 844 }, { name: 'tablet', width: 768, height: 1024 }]
const temporary = await mkdtemp(path.join(os.tmpdir(), 'kingshot-art006-capture-'))
await mkdir(output, { recursive: true })

const reservePort = () => new Promise((resolve, reject) => {
  const socket = net.createServer()
  socket.once('error', reject)
  socket.listen(0, '127.0.0.1', () => {
    const address = socket.address()
    socket.close(() => resolve(address.port))
  })
})

const localPort = process.env.ART006_BASE_URL ? null : await reservePort()
const baseUrl = process.env.ART006_BASE_URL ?? `http://127.0.0.1:${localPort}`
let server
let serverLog = ''
if (!process.env.ART006_BASE_URL) {
  server = spawn(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(localPort), '--strictPort'], {
    cwd: process.cwd(),
    env: { ...process.env, VITE_SUPABASE_URL: 'http://127.0.0.1:9', VITE_SUPABASE_PUBLISHABLE_KEY: 'art006-local-fixture-only' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout.on('data', (chunk) => { serverLog += chunk })
  server.stderr.on('data', (chunk) => { serverLog += chunk })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) break
    try {
      const response = await fetch(`${baseUrl}/art-studio/acceptance`)
      if (response.ok) { ready = true; break }
    } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  if (!ready) throw new Error(`The local ART-006 capture server did not become ready.\n${serverLog}`)
}

const browser = await chromium.launch({ headless: true })
const report = { generatedAt: new Date().toISOString(), baseUrl, captures: [] }

try {
  for (const slug of cases) {
    const directory = path.join(root, slug)
    const metadata = JSON.parse(await readFile(path.join(directory, 'metadata.json'), 'utf8'))
    const encoded = await readFile(path.join(directory, metadata.source.filename), 'utf8')
    const source = Buffer.from(encoded.replace(/\s/g, ''), 'base64')
    const fixtureDirectory = path.join(temporary, slug)
    await mkdir(fixtureDirectory, { recursive: true })
    const fixturePath = path.join(fixtureDirectory, 'cat.txt')
    await writeFile(fixturePath, source)

    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 })
      const page = await context.newPage()
      const consoleErrors = []
      const failedResponses = []
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
      page.on('pageerror', (error) => consoleErrors.push(error.message))
      page.on('response', (response) => {
        if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() })
      })
      await page.goto(`${baseUrl}/art-studio/acceptance`, { waitUntil: 'networkidle' })
      const bodyText = (await page.locator('body').innerText()).trim()
      if (!bodyText) throw new Error(`${slug}/${viewport.name}: acceptance page is blank${consoleErrors.length ? ` · ${consoleErrors.join(' | ')}` : ''}`)
      if (await page.locator('.vite-error-overlay, #webpack-dev-server-client-overlay, [data-nextjs-dialog]').count()) throw new Error(`${slug}/${viewport.name}: framework error overlay is present`)
      await page.locator('.art-acceptance-file-picker input[type=file]').setInputFiles(fixturePath)
      await page.locator('.art-acceptance-metadata').waitFor()
      await page.getByRole('button', { name: 'Open full preview modal' }).click()
      const modal = page.locator('.art-preview-modal')
      await modal.waitFor()
      await page.waitForFunction(() => {
        const fit = document.querySelector('.art-preview-modal .forge-render-engine__fit')
        return fit instanceof HTMLElement && Number(fit.dataset.fitScale) > 0
      })
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))

      const content = page.locator('.art-preview-modal__content')
      const filename = `${slug}-${viewport.name}.png`
      await content.screenshot({ path: path.join(output, filename), animations: 'disabled' })
      const geometry = await page.locator('.art-preview-modal .forge-render-engine__bubble').evaluate((bubble) => {
        const bubbleBox = bubble.getBoundingClientRect()
        const grid = bubble.querySelector('.kingshot-cell-grid')
        const gridBox = grid?.getBoundingClientRect()
        const rows = Array.from(bubble.querySelectorAll('.kingshot-cell-grid__row')).map((row) => {
          const box = row.getBoundingClientRect()
          return {
            row: Number(row.getAttribute('data-grid-row')),
            context: row.getAttribute('data-line-context'),
            visualAdvance: Number(row.getAttribute('data-visual-advance')),
            box: { left: box.left - bubbleBox.left, top: box.top - bubbleBox.top, right: box.right - bubbleBox.left, bottom: box.bottom - bubbleBox.top, width: box.width, height: box.height },
            cells: Array.from(row.querySelectorAll('.kingshot-cell-grid__cell')).map((cell) => {
              const cellBox = cell.getBoundingClientRect()
              return {
                sourceStart: Number(cell.getAttribute('data-source-start')),
                sourceEnd: Number(cell.getAttribute('data-source-end')),
                role: cell.getAttribute('data-cell-role') || 'ordinary',
                span: Number(cell.getAttribute('data-grid-span')),
                box: { left: cellBox.left - bubbleBox.left, right: cellBox.right - bubbleBox.left, width: cellBox.width },
              }
            }),
          }
        })
        return {
          bubble: { width: bubbleBox.width, height: bubbleBox.height },
          grid: gridBox ? { left: gridBox.left - bubbleBox.left, top: gridBox.top - bubbleBox.top, width: gridBox.width, height: gridBox.height } : null,
          rows,
        }
      })
      report.captures.push({ slug, viewport, filename, consoleErrors, failedResponses, geometry })
      const runtimeErrors = consoleErrors.filter((message) => message !== 'Failed to load resource: the server responded with a status of 404 (Not Found)')
      if (runtimeErrors.length) throw new Error(`${slug}/${viewport.name}: console errors: ${runtimeErrors.join(' | ')}`)
      await context.close()
    }
  }
  await writeFile(path.join(output, 'capture-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Captured ${report.captures.length} ART-006 Fit screenshots with no browser errors.`)
} finally {
  await browser.close()
  if (server && server.exitCode === null) {
    server.kill()
    await Promise.race([
      new Promise((resolve) => server.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 2_000)),
    ])
  }
  await rm(temporary, { recursive: true, force: true })
}
