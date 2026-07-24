import type { VisionNormalisedBox, VisionPixelBox, VisionRegionBinding } from '../../shared/platform/vision/contracts.js'

export const KINGSOT_PROFILE_MAPPING_VERSION = 'account-linking-kingshot-profile-v1' as const
export const KINGSOT_PROFILE_MAPPING_ID = 'account-linking-kingshot-profile'

export type KingshotProfileField = 'displayName' | 'playerId' | 'kingdom'

export interface KingshotProfileRegion extends VisionNormalisedBox {
  readonly field: KingshotProfileField
  readonly psm: 'single_line'
  readonly characterWhitelist: string | null
}

export const KINGSOT_PROFILE_REGIONS: readonly KingshotProfileRegion[] = [
  { field: 'displayName', x: 0.34, y: 0.18, width: 0.62, height: 0.16, psm: 'single_line', characterWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 []_-#' },
  { field: 'playerId', x: 0.34, y: 0.35, width: 0.62, height: 0.14, psm: 'single_line', characterWhitelist: '0123456789 IDid:' },
  { field: 'kingdom', x: 0.34, y: 0.62, width: 0.62, height: 0.16, psm: 'single_line', characterWhitelist: '0123456789 Kingdomkingdom#:' },
]

export function profileRegionBindings(): VisionRegionBinding[] {
  return KINGSOT_PROFILE_REGIONS.map((region, index) => ({
    id: `${KINGSOT_PROFILE_MAPPING_ID}-${region.field}`,
    regionKey: region.field,
    label: region.field === 'displayName' ? 'Unlabelled display name' : region.field === 'playerId' ? 'Player ID' : 'Kingdom',
    role: 'source',
    anchorRules: { layout: 'kingshot-profile-card', psm: region.psm, characterWhitelist: region.characterWhitelist },
    sortOrder: index,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
  }))
}

export function mapProfileRegion(region: KingshotProfileRegion, widthPx: number, heightPx: number): VisionPixelBox {
  for (const value of [region.x, region.y, region.width, region.height]) if (!Number.isFinite(value)) throw new Error('Profile OCR region must be finite.')
  if (region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0 || region.x + region.width > 1 || region.y + region.height > 1) throw new Error(`Profile OCR region ${region.field} is outside the image.`)
  return {
    left: Math.max(0, Math.floor(region.x * widthPx)),
    top: Math.max(0, Math.floor(region.y * heightPx)),
    width: Math.max(1, Math.min(widthPx, Math.ceil(region.width * widthPx))),
    height: Math.max(1, Math.min(heightPx, Math.ceil(region.height * heightPx))),
  }
}

export interface PreparedProfileRegion {
  readonly rectangle: VisionPixelBox
  readonly bytes: Uint8Array
  readonly widthPx: number
  readonly heightPx: number
  readonly scale: number
  readonly warningCodes: readonly string[]
}

/**
 * The runtime keeps image bytes in memory only. Tesseract receives a bounded
 * rectangle and a DPI hint rather than a persisted crop or raw OCR artifact.
 */
export function prepareProfileRegion(bytes: Uint8Array, widthPx: number, heightPx: number, region: KingshotProfileRegion): PreparedProfileRegion {
  const rectangle = mapProfileRegion(region, widthPx, heightPx)
  const scale = Math.min(2, Math.max(1, Math.floor(1200 / Math.max(rectangle.width, 1))))
  return { rectangle, bytes, widthPx, heightPx, scale, warningCodes: scale > 1 ? ['bounded_upscale_hint'] : [] }
}
