import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../../database/supabaseAdmin.js'
import {
  VISION_EVIDENCE_BUCKET,
  VISION_EVIDENCE_MAX_BYTES,
  VISION_EVIDENCE_PROVIDER_UPLOAD_SECONDS,
  type VisionEvidenceMimeType,
  type VisionEvidenceUploadProvider,
  type VisionStoredObjectMetadata,
  VisionEvidenceValidationError,
} from '../../../shared/platform/vision/evidenceStorageContracts.js'
import { inspectVisionImage } from '../../../shared/platform/vision/imageMetadata.js'

type StorageFile = { size?: number; type?: string; arrayBuffer(): Promise<ArrayBuffer> }

export interface SupabaseVisionEvidenceProviderOptions {
  client?: SupabaseClient
  now?: () => Date
}

export class SupabaseVisionEvidenceProvider implements VisionEvidenceUploadProvider {
  readonly #client: SupabaseClient
  readonly #now: () => Date

  constructor(options: SupabaseVisionEvidenceProviderOptions = {}) {
    this.#client = options.client ?? getSupabaseAdmin()
    this.#now = options.now ?? (() => new Date())
  }

  async createSignedUploadUrl(input: { bucket: typeof VISION_EVIDENCE_BUCKET; path: string; mimeType: VisionEvidenceMimeType; maxBytes: number; intentExpiresAt: string }) {
    assertBucketAndPath(input.bucket, input.path)
    if (input.maxBytes < 1 || input.maxBytes > VISION_EVIDENCE_MAX_BYTES) throw new Error('Vision evidence upload size is outside the governed limit.')
    const { data, error } = await this.#client.storage.from(VISION_EVIDENCE_BUCKET).createSignedUploadUrl(input.path, { upsert: false })
    if (error || !data?.token) throw new Error(error?.message ?? 'Supabase did not return an upload token.')
    const expiresAt = new Date(this.#now().getTime() + VISION_EVIDENCE_PROVIDER_UPLOAD_SECONDS * 1000).toISOString()
    return { url: null, token: data.token, bucket: VISION_EVIDENCE_BUCKET, path: input.path, providerLifetimeSeconds: VISION_EVIDENCE_PROVIDER_UPLOAD_SECONDS, expiresAt }
  }

  async headObject(input: { bucket: typeof VISION_EVIDENCE_BUCKET; path: string }): Promise<VisionStoredObjectMetadata | null> {
    assertBucketAndPath(input.bucket, input.path)
    const { data, error } = await this.#client.storage.from(VISION_EVIDENCE_BUCKET).download(input.path, {}, { cache: 'no-store' })
    if (error) {
      if (isNotFound(error)) return null
      throw new Error(`Supabase evidence download failed: ${error.message}`)
    }
    const bytes = await boundedBytes(data as StorageFile)
    const declaredMimeType = normaliseMimeType((data as StorageFile).type)
    const image = inspectVisionImage(bytes, declaredMimeType ?? undefined)
    return { bucket: VISION_EVIDENCE_BUCKET, path: input.path, bytes: bytes.byteLength, mimeType: image.mimeType, sha256: createHash('sha256').update(bytes).digest('hex'), widthPx: image.widthPx, heightPx: image.heightPx }
  }

  async createSignedReadUrl(input: { bucket: typeof VISION_EVIDENCE_BUCKET; path: string; expiresAt: string }) {
    assertBucketAndPath(input.bucket, input.path)
    const seconds = Math.ceil((new Date(input.expiresAt).getTime() - this.#now().getTime()) / 1000)
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 300) throw new Error('Vision evidence signed read URL expiry is outside the governed limit.')
    const { data, error } = await this.#client.storage.from(VISION_EVIDENCE_BUCKET).createSignedUrl(input.path, seconds)
    if (error || !data?.signedUrl) throw new Error(error?.message ?? 'Supabase did not return a signed read URL.')
    return { url: data.signedUrl, expiresAt: input.expiresAt }
  }

  async deleteObject(input: { bucket: typeof VISION_EVIDENCE_BUCKET; path: string }): Promise<void> {
    assertBucketAndPath(input.bucket, input.path)
    const { data, error } = await this.#client.storage.from(VISION_EVIDENCE_BUCKET).remove([input.path])
    if (error) throw new Error(`Supabase evidence deletion failed: ${error.message}`)
    if (!Array.isArray(data) || data.length !== 1) throw new Error('Supabase did not confirm deletion of the exact Vision evidence object.')
  }

  async readObject(input: { bucket: typeof VISION_EVIDENCE_BUCKET; path: string }): Promise<Uint8Array> {
    assertBucketAndPath(input.bucket, input.path)
    const { data, error } = await this.#client.storage.from(VISION_EVIDENCE_BUCKET).download(input.path, {}, { cache: 'no-store' })
    if (error) throw new Error(`Supabase evidence download failed: ${error.message}`)
    return boundedBytes(data as StorageFile)
  }
}

function assertBucketAndPath(bucket: string, path: string): void {
  if (bucket !== VISION_EVIDENCE_BUCKET) throw new Error('Vision evidence provider received an unexpected bucket.')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/(mapping_reference|test_case|scan_source|evidence_crop)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|webp|tiff)$/i.test(path)) throw new Error('Vision evidence provider received an invalid exact object path.')
}

async function boundedBytes(file: StorageFile): Promise<Uint8Array> {
  if (!file || typeof file.arrayBuffer !== 'function') throw new VisionEvidenceValidationError('invalid_image', 'Supabase returned an invalid evidence object body.')
  if (typeof file.size === 'number' && (file.size < 1 || file.size > VISION_EVIDENCE_MAX_BYTES)) throw new VisionEvidenceValidationError('invalid_image', 'Supabase evidence object exceeds the governed byte limit.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.byteLength < 1 || bytes.byteLength > VISION_EVIDENCE_MAX_BYTES) throw new VisionEvidenceValidationError('invalid_image', 'Supabase evidence object exceeds the governed byte limit.')
  return bytes
}

function normaliseMimeType(value: string | undefined): VisionEvidenceMimeType | null {
  return value === 'image/png' || value === 'image/jpeg' || value === 'image/webp' || value === 'image/tiff' ? value : null
}

function isNotFound(error: { status?: number; message?: string }): boolean { return error.status === 404 || /not found|object does not exist/i.test(error.message ?? '') }

export function createSupabaseVisionEvidenceProvider(options: SupabaseVisionEvidenceProviderOptions = {}): VisionEvidenceUploadProvider { return new SupabaseVisionEvidenceProvider(options) }
