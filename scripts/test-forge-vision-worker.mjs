import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { VisionExtractorRegistry } from '../server/vision/extractors/registry.ts'
import {
  ImageMagickCliProcessor,
  buildImageMagickArguments,
  normalisedRegionToPixelBox,
} from '../server/vision/imageProcessing/imageMagickCliProcessor.ts'
import { VisionWorkerHost, resolveVisionWorkerLimits } from '../server/vision/worker/visionWorkerHost.ts'
import {
  decodeVisionWorkerJob,
  encodeVisionWorkerJob,
  encodeVisionWorkerResult,
} from '../server/vision/worker/protocol.ts'
import { VISION_WORKER_PROTOCOL_VERSION } from '../shared/platform/vision/workerContracts.ts'

const now = () => new Date('2026-07-23T16:00:00.000Z')
const sourceBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
const sourceSha = createHash('sha256').update(sourceBytes).digest('hex')
const region = {
  id: 'region-1',
  regionKey: 'source',
  label: 'Source',
  role: 'source',
  anchorRules: {},
  sortOrder: 0,
  x: 0.1,
  y: 0.2,
  width: 0.5,
  height: 0.4,
}
const job = {
  protocolVersion: VISION_WORKER_PROTOCOL_VERSION,
  jobId: 'job-1',
  traceId: 'trace-1',
  submittedAt: now().toISOString(),
  extractorPluginKey: 'ocr.fake',
  extractionRequest: {
    runId: 'run-1',
    mappingVersionId: 'version-1',
    mappingId: 'mapping-1',
    fieldKey: 'example.field',
    image: {
      evidenceId: 'evidence-1',
      sha256: sourceSha,
      mimeType: 'image/png',
      widthPx: 100,
      heightPx: 50,
      bytes: sourceBytes,
    },
    region,
    configuration: {},
  },
  preprocessingSteps: [{ operation: 'grayscale' }, { operation: 'resize', scale: 2 }],
}

const transport = encodeVisionWorkerJob(job)
const decoded = decodeVisionWorkerJob(transport)
assert.deepEqual([...decoded.extractionRequest.image.bytes], [...sourceBytes])
assert.equal(decoded.extractionRequest.region?.regionKey, 'source')
assert.throws(
  () => decodeVisionWorkerJob(transport.replace(/"bytesBase64":"[^"]+"/, '"bytesBase64":"%%%="')),
  /base64/,
)
assert.throws(() => resolveVisionWorkerLimits({ maxPixels: 90_000_000 }), /maxPixels/)

assert.deepEqual(
  normalisedRegionToPixelBox(region, 100, 50),
  { left: 10, top: 10, width: 50, height: 20 },
)
assert.throws(
  () => normalisedRegionToPixelBox({ ...region, x: 0.9, width: 0.2 }, 100, 50),
  /invalid normalised/,
)
const imageArgs = buildImageMagickArguments(
  '/safe/input.png',
  { left: 10, top: 10, width: 50, height: 20 },
  job.preprocessingSteps,
)
assert.ok(imageArgs.includes('-limit'))
assert.ok(imageArgs.includes('40000000'))
const inputIndex = imageArgs.indexOf('/safe/input.png')
assert.deepEqual(
  imageArgs.slice(inputIndex, inputIndex + 4),
  ['/safe/input.png', '-crop', '50x20+10+10', '+repage'],
)
assert.ok(imageArgs.includes('-colorspace'))
assert.ok(imageArgs.includes('200%'))
assert.equal(imageArgs.at(-1), 'png:-')

const commandCalls = []
const imageProcessor = new ImageMagickCliProcessor({
  executablePath: '/safe/magick',
  now,
  commandRunner: {
    async run(executable, args, timeoutMs, maxOutputBytes) {
      commandCalls.push({ executable, args: [...args], timeoutMs, maxOutputBytes })
      if (args[0] === '-version') {
        return {
          stdout: new TextEncoder().encode('Version: ImageMagick 7.1.2-1 Q16'),
          stderr: '',
        }
      }
      return {
        stdout: new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4]),
        stderr: '',
      }
    },
  },
})
const processed = await imageProcessor.process({
  image: job.extractionRequest.image,
  region,
  steps: job.preprocessingSteps,
  limits: resolveVisionWorkerLimits(undefined),
})
assert.equal(processed.image.widthPx, 100)
assert.equal(processed.image.heightPx, 40)
assert.equal(processed.record.sourcePixelBox?.width, 50)
assert.ok(commandCalls.every((call) => call.executable === '/safe/magick'))

const registry = new VisionExtractorRegistry()
const fakeExtractor = {
  manifest: {
    pluginKey: 'ocr.fake',
    displayName: 'Fake OCR',
    family: 'ocr',
    executionMode: 'local_worker',
    engineName: 'Fake',
    engineVersion: '1.0.0',
    pluginVersion: '1.0.0',
    supportedMimeTypes: ['image/png'],
    capabilities: ['text'],
    configurationSchema: {},
    costProfile: 'local_zero_cost',
  },
  async healthcheck() {
    return {
      available: true,
      checkedAt: now().toISOString(),
      engineVersion: '1.0.0',
      detail: null,
    }
  },
  async extract(request) {
    assert.equal(
      request.region,
      null,
      'worker must pass the processed crop, not the original region, to the extractor',
    )
    assert.equal(request.image.widthPx, 100)
    return {
      candidateValue: 'FORGE VISION',
      rawText: 'FORGE VISION',
      engineConfidence: 0.98,
      tokens: [{
        text: 'FORGE',
        confidence: 0.99,
        pixelBox: { left: 1, top: 1, width: 10, height: 5 },
        normalisedBox: { x: 0.01, y: 0.025, width: 0.1, height: 0.125 },
        page: 1,
        line: 1,
      }],
      diagnostics: {},
      provenance: {
        pluginKey: 'ocr.fake',
        pluginVersion: '1.0.0',
        engineName: 'Fake',
        engineVersion: '1.0.0',
        executedAt: now().toISOString(),
        configuration: request.configuration,
      },
    }
  },
}
registry.register(fakeExtractor)
const host = new VisionWorkerHost({ registry, imageProcessor, now, healthTtlMs: 30_000 })
const health = await host.healthcheck(true)
assert.equal(health.available, true)
const result = await host.execute(job)
assert.equal(result.status, 'succeeded')
assert.equal(result.extraction?.candidateValue, 'FORGE VISION')
assert.equal(result.preprocessing?.outputWidthPx, 100)
assert.doesNotThrow(() => JSON.parse(encodeVisionWorkerResult(result)))

const missing = await host.execute({
  ...job,
  jobId: 'job-missing',
  extractorPluginKey: 'ocr.missing',
})
assert.equal(missing.status, 'failed')
assert.equal(missing.failure?.code, 'extractor_not_registered')
const limited = await host.execute({
  ...job,
  jobId: 'job-limit',
  limits: { maxInputBytes: 4 },
})
assert.equal(limited.status, 'failed')
assert.equal(limited.failure?.code, 'input_too_large')

console.log('Forge Vision worker tests passed: versioned transport, bounded preprocessing, crop geometry, health gates, extraction isolation and normalised failures.')
