import { createInterface } from 'node:readline'
import type { Readable, Writable } from 'node:stream'

import {
  VISION_WORKER_PROTOCOL_VERSION,
  type VisionWorkerJobResult,
} from '../../../shared/platform/vision/workerContracts.js'
import { toVisionWorkerFailure } from '../runtime/errors.js'
import type { VisionWorkerHost } from './visionWorkerHost.js'
import { decodeVisionWorkerJob, encodeVisionWorkerResult } from './protocol.js'

export async function runVisionWorkerStdio(
  host: VisionWorkerHost,
  input: Readable = process.stdin,
  output: Writable = process.stdout,
): Promise<void> {
  const lines = createInterface({ input, crlfDelay: Infinity, terminal: false })
  for await (const line of lines) {
    if (!line.trim()) continue
    let result: VisionWorkerJobResult
    try {
      result = await host.execute(decodeVisionWorkerJob(line))
    } catch (error) {
      const now = new Date().toISOString()
      result = {
        protocolVersion: VISION_WORKER_PROTOCOL_VERSION,
        jobId: 'invalid-envelope',
        traceId: 'invalid-envelope',
        status: 'failed',
        preprocessing: null,
        extraction: null,
        failure: toVisionWorkerFailure(error, 'acceptance'),
        timings: {
          acceptedAt: now,
          startedAt: now,
          completedAt: now,
          preprocessingMs: 0,
          extractionMs: 0,
          totalMs: 0,
        },
      }
    }
    await writeLine(output, encodeVisionWorkerResult(result))
  }
}

function writeLine(output: Writable, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    output.write(`${value}\n`, (error) => error ? reject(error) : resolve())
  })
}
