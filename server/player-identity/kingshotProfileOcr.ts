import sharp from 'sharp'
import type { VisionPixelBox, VisionRegionBinding } from '../../shared/platform/vision/contracts.js'
import { KINGSHOT_PROFILE_V1_REGIONS, KINGSHOT_PROFILE_V2_REGIONS, KINGSHOT_PROFILE_V3_REGIONS, KINGSHOT_PROFILE_V4_REGIONS, KINGSHOT_PROFILE_V5_REGIONS, KINGSHOT_PROFILE_V6_REGIONS, KINGSHOT_PROFILE_V7_REGIONS, KINGSHOT_PROFILE_V8_REGIONS, type KingshotProfileRegionConfig } from '../../shared/domains/player-identity/kingshotProfileMapping.js'

export const KINGSHOT_PROFILE_V1_MAPPING_VERSION = 'account-linking-kingshot-profile-v1' as const
export const KINGSHOT_PROFILE_V2_MAPPING_VERSION = 'account-linking-kingshot-profile-v2' as const
export const KINGSHOT_PROFILE_V3_MAPPING_VERSION = 'account-linking-kingshot-profile-v3' as const
export const KINGSHOT_PROFILE_V4_MAPPING_VERSION = 'account-linking-kingshot-profile-v4' as const
export const KINGSHOT_PROFILE_V5_MAPPING_VERSION = 'account-linking-kingshot-profile-v5' as const
export const KINGSHOT_PROFILE_V6_MAPPING_VERSION = 'account-linking-kingshot-profile-v6' as const
export const KINGSHOT_PROFILE_V7_MAPPING_VERSION = 'account-linking-kingshot-profile-v7' as const
export const KINGSHOT_PROFILE_V8_MAPPING_VERSION = 'account-linking-kingshot-profile-v8' as const
export const KINGSHOT_PROFILE_V2_MAPPING_ID = 'account-linking-kingshot-profile-v2'
export const KINGSHOT_PROFILE_MAX_PIXELS = 8_000_000
export const KINGSHOT_PROFILE_MAX_DIMENSION = 4_000

export type KingshotProfileRegion = KingshotProfileRegionConfig

export function profileRegionBindings(version: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' = 'v2'): VisionRegionBinding[] {
  const regions = version === 'v1' ? KINGSHOT_PROFILE_V1_REGIONS : version === 'v3' ? KINGSHOT_PROFILE_V3_REGIONS : version === 'v4' ? KINGSHOT_PROFILE_V4_REGIONS : version === 'v5' ? KINGSHOT_PROFILE_V5_REGIONS : version === 'v6' ? KINGSHOT_PROFILE_V6_REGIONS : version === 'v7' ? KINGSHOT_PROFILE_V7_REGIONS : version === 'v8' ? KINGSHOT_PROFILE_V8_REGIONS : KINGSHOT_PROFILE_V2_REGIONS
  const mappingId = version === 'v1' ? 'account-linking-kingshot-profile-v1' : version === 'v3' ? KINGSHOT_PROFILE_V3_MAPPING_VERSION : version === 'v4' ? KINGSHOT_PROFILE_V4_MAPPING_VERSION : version === 'v5' ? KINGSHOT_PROFILE_V5_MAPPING_VERSION : version === 'v6' ? KINGSHOT_PROFILE_V6_MAPPING_VERSION : version === 'v7' ? KINGSHOT_PROFILE_V7_MAPPING_VERSION : version === 'v8' ? KINGSHOT_PROFILE_V8_MAPPING_VERSION : KINGSHOT_PROFILE_V2_MAPPING_ID
  return regions.map((region, index) => ({ id: `${mappingId}-${region.key}`, regionKey: region.key, label: region.label, role: region.componentRole === 'exclusion' ? 'comparison' : 'source', anchorRules: { layout: 'kingshot-profile-card', psm: region.psm, characterWhitelist: region.characterWhitelist, observation: region.observation, componentRole: region.componentRole ?? 'ocr' }, sortOrder: index, x: region.x, y: region.y, width: region.width, height: region.height }))
}

export function mapProfileRegion(region: KingshotProfileRegion, widthPx: number, heightPx: number): VisionPixelBox {
  for (const value of [region.x, region.y, region.width, region.height]) if (!Number.isFinite(value)) throw new Error('Profile OCR region must be finite.')
  if (region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0 || region.x + region.width > 1 || region.y + region.height > 1) throw new Error(`Profile OCR region ${region.key} is outside the image.`)
  return { left: Math.max(0, Math.floor(region.x * widthPx)), top: Math.max(0, Math.floor(region.y * heightPx)), width: Math.max(1, Math.min(widthPx, Math.ceil(region.width * widthPx))), height: Math.max(1, Math.min(heightPx, Math.ceil(region.height * heightPx))) }
}

export interface PreparedProfileRegion {
  readonly bytes: Uint8Array
  readonly widthPx: number
  readonly heightPx: number
  readonly sourceRectangle: VisionPixelBox
  readonly variant: 'greyscale' | 'threshold' | 'inverted'
  readonly scale: number
  readonly warningCodes: readonly string[]
}

export async function prepareProfileRegion(input: { bytes: Uint8Array; mimeType: string; widthPx: number; heightPx: number; region: KingshotProfileRegion; variant?: 'greyscale' | 'threshold' | 'inverted'; thresholdValue?: number; focus?: { x: number; y: number; width: number; height: number } }): Promise<PreparedProfileRegion> {
  const sourceRectangle = mapProfileRegion(input.region, input.widthPx, input.heightPx)
  const cropRectangle = input.focus ? { left: sourceRectangle.left + Math.floor(sourceRectangle.width * input.focus.x), top: sourceRectangle.top + Math.floor(sourceRectangle.height * input.focus.y), width: Math.max(1, Math.floor(sourceRectangle.width * input.focus.width)), height: Math.max(1, Math.floor(sourceRectangle.height * input.focus.height)) } : sourceRectangle
  const padding = 12
  const scale = 3
  const outputWidth = Math.min(KINGSHOT_PROFILE_MAX_DIMENSION, (cropRectangle.width + padding * 2) * scale)
  const outputHeight = Math.min(KINGSHOT_PROFILE_MAX_DIMENSION, (cropRectangle.height + padding * 2) * scale)
  if (outputWidth * outputHeight > KINGSHOT_PROFILE_MAX_PIXELS) throw new Error('Profile OCR preprocessing exceeded its bounded pixel budget.')
  const variant = input.variant ?? 'greyscale'
  let pipeline = sharp(Buffer.from(input.bytes), { failOn: 'error' }).extract(cropRectangle).extend({ top: padding, bottom: padding, left: padding, right: padding, background: { r: 255, g: 255, b: 255, alpha: 1 } }).resize({ width: outputWidth, height: outputHeight, fit: 'fill', kernel: 'lanczos3' }).grayscale().linear(1.12, -12)
  if (variant === 'threshold') pipeline = pipeline.threshold(input.thresholdValue ?? 168)
  if (variant === 'inverted') pipeline = pipeline.negate()
  const { data, info } = await pipeline.png({ compressionLevel: 6 }).toBuffer({ resolveWithObject: true })
  return { bytes: new Uint8Array(data), widthPx: info.width, heightPx: info.height, sourceRectangle, variant, scale, warningCodes: variant === 'threshold' ? ['threshold_variant'] : variant === 'inverted' ? ['inverted_high_contrast_variant'] : ['bounded_3x_upscale', 'greyscale_contrast'] }
}
