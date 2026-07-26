import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { createLocalVisionWorker } from '../server/vision/worker/createLocalVisionWorker.ts'
import { VISION_WORKER_PROTOCOL_VERSION } from '../shared/platform/vision/workerContracts.ts'

const execFileAsync = promisify(execFile)

async function main() {
  const required = process.env.FORGE_VISION_NATIVE_REQUIRED === '1'
  const tesseractPath = process.env.FORGE_VISION_TESSERACT_PATH ?? 'tesseract'
  const imageMagickPath = process.env.FORGE_VISION_IMAGEMAGICK_PATH ?? 'magick'
  const fixture = JSON.parse(await readFile(
    new URL('../fixtures/vision/synthetic/forge-vision-ocr.fixture.json', import.meta.url),
    'utf8',
  ))
  const sourcePath = fileURLToPath(
    new URL('../fixtures/vision/synthetic/forge-vision-ocr.svg', import.meta.url),
  )
  const workingDirectory = await mkdtemp(join(tmpdir(), 'forge-vision-native-test-'))
  const pngPath = join(workingDirectory, 'fixture.png')

  try {
    try {
      await execFileAsync(
        imageMagickPath,
        [sourcePath, '-strip', pngPath],
        { timeout: 15_000, windowsHide: true },
      )
      await execFileAsync(
        tesseractPath,
        ['--version'],
        { timeout: 5_000, windowsHide: true },
      )
    } catch (error) {
      if (required) throw error
      console.log('Forge Vision native runtime test skipped: Tesseract or ImageMagick is not installed on this host.')
      return
    }

    const bytes = new Uint8Array(await readFile(pngPath))
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const worker = createLocalVisionWorker({
      tesseract: {
        executablePath: tesseractPath,
        requiredLanguages: [fixture.language],
      },
      imageMagick: { executablePath: imageMagickPath },
    })
    const health = await worker.healthcheck(true)
    assert.equal(
      health.processor.available,
      true,
      health.processor.detail ?? 'ImageMagick must be available',
    )
    assert.equal(
      health.extractors[0]?.available,
      true,
      health.extractors[0]?.detail ?? 'Tesseract must be available',
    )

    const result = await worker.execute({
      protocolVersion: VISION_WORKER_PROTOCOL_VERSION,
      jobId: 'native-fixture-1',
      traceId: 'native-fixture-1',
      submittedAt: new Date().toISOString(),
      extractorPluginKey: 'ocr.tesseract.cli',
      extractionRequest: {
        runId: 'native-run-1',
        mappingVersionId: 'synthetic-version-1',
        mappingId: 'synthetic-mapping-1',
        fieldKey: 'synthetic.ocr_text',
        image: {
          evidenceId: 'synthetic-evidence-1',
          sha256,
          mimeType: 'image/png',
          widthPx: fixture.renderedWidthPx,
          heightPx: fixture.renderedHeightPx,
          bytes,
        },
        region: null,
        configuration: {
          language: fixture.language,
          pageSegmentationMode: fixture.pageSegmentationMode,
          ocrEngineMode: fixture.ocrEngineMode,
        },
      },
      preprocessingSteps: [
        { operation: 'grayscale' },
        { operation: 'auto_level' },
        { operation: 'remove_alpha' },
      ],
    })

    assert.equal(result.status, 'succeeded', result.failure?.message)
    const normalisedText = String(result.extraction?.candidateValue ?? '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
    for (const token of fixture.expectedTokens) {
      assert.match(normalisedText, new RegExp(`\\b${token}\\b`))
    }
    assert.ok((result.extraction?.tokens.length ?? 0) >= fixture.expectedTokens.length)
    assert.ok(result.extraction?.tokens.every((token) => token.normalisedBox !== null))
    assert.match(result.extraction?.provenance.engineVersion ?? '', /^5\./)
    assert.equal(result.preprocessing?.outputMimeType, 'image/png')

    console.log(`Forge Vision native runtime test passed with Tesseract ${result.extraction?.provenance.engineVersion}: ${normalisedText}`)
  } finally {
    await rm(workingDirectory, { recursive: true, force: true })
  }
}

await main()
