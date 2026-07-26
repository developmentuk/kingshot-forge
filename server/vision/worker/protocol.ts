import type {
  VisionExtractionRequest,
  VisionImageInput,
} from '../../../shared/platform/vision/contracts.js'
import {
  VISION_WORKER_PROTOCOL_VERSION,
  type VisionWorkerJobEnvelope,
  type VisionWorkerJobResult,
} from '../../../shared/platform/vision/workerContracts.js'
import { VisionRuntimeError } from '../runtime/errors.js'

const DEFAULT_MAX_TRANSPORT_BYTES = 24 * 1024 * 1024

export interface VisionWorkerTransportImage extends Omit<VisionImageInput, 'bytes'> {
  bytesBase64: string
}

export interface VisionWorkerTransportJobV1 extends Omit<VisionWorkerJobEnvelope, 'extractionRequest'> {
  extractionRequest: Omit<VisionExtractionRequest, 'image'> & {
    image: VisionWorkerTransportImage
  }
}

export function encodeVisionWorkerJob(job: VisionWorkerJobEnvelope): string {
  const transport: VisionWorkerTransportJobV1 = {
    ...job,
    extractionRequest: {
      ...job.extractionRequest,
      image: {
        evidenceId: job.extractionRequest.image.evidenceId,
        sha256: job.extractionRequest.image.sha256,
        mimeType: job.extractionRequest.image.mimeType,
        widthPx: job.extractionRequest.image.widthPx,
        heightPx: job.extractionRequest.image.heightPx,
        bytesBase64: Buffer.from(job.extractionRequest.image.bytes).toString('base64'),
      },
    },
  }
  return JSON.stringify(transport)
}

export function decodeVisionWorkerJob(
  line: string,
  maxTransportBytes = DEFAULT_MAX_TRANSPORT_BYTES,
): VisionWorkerJobEnvelope {
  const lineBytes = Buffer.byteLength(line, 'utf8')
  if (lineBytes === 0 || lineBytes > maxTransportBytes) {
    throw new VisionRuntimeError(
      'invalid_job',
      'acceptance',
      'Forge Vision worker transport envelope is empty or exceeds its byte limit.',
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(line)
  } catch (error) {
    throw new VisionRuntimeError(
      'invalid_job',
      'acceptance',
      'Forge Vision worker transport envelope is not valid JSON.',
      { cause: error },
    )
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision worker transport envelope must be an object.')
  }

  const transport = parsed as VisionWorkerTransportJobV1
  if (transport.protocolVersion !== VISION_WORKER_PROTOCOL_VERSION) {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Unsupported Forge Vision worker transport protocol.')
  }
  const transportImage = transport.extractionRequest?.image
  if (!transportImage || typeof transportImage.bytesBase64 !== 'string') {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision worker transport image is missing.')
  }

  const bytes = decodeStrictBase64(transportImage.bytesBase64)
  return {
    ...transport,
    extractionRequest: {
      ...transport.extractionRequest,
      image: {
        evidenceId: transportImage.evidenceId,
        sha256: transportImage.sha256,
        mimeType: transportImage.mimeType,
        widthPx: transportImage.widthPx,
        heightPx: transportImage.heightPx,
        bytes,
      },
    },
  }
}

export function encodeVisionWorkerResult(result: VisionWorkerJobResult): string {
  return JSON.stringify(result)
}

function decodeStrictBase64(value: string): Uint8Array {
  if (value.length === 0 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision worker image bytes are not valid base64.')
  }
  const bytes = Buffer.from(value, 'base64')
  if (bytes.toString('base64') !== value) {
    throw new VisionRuntimeError('invalid_job', 'acceptance', 'Forge Vision worker image base64 is not canonical.')
  }
  return new Uint8Array(bytes)
}
