import { artTemplates } from '../../data/art'
import type { ArtworkClass, DeviceProfileId } from '../types'

export type BenchmarkValidationStatus = 'metadata-only' | 'ready-for-review'
export type BenchmarkAvailability = 'ready' | 'metadata-only' | 'broken-reference' | 'unsupported'
export type RenderBenchmark = {
  id: string
  title: string
  expectedArtworkClass: ArtworkClass
  expectedRenderer: string
  targetDeviceProfile: DeviceProfileId
  notes: string
  validationStatus: BenchmarkValidationStatus
  sourceArtworkId?: string
}

export const RENDER_BENCHMARKS: readonly RenderBenchmark[] = [
  { id: 'norway-flag-pixel', title: 'Norway Flag', expectedArtworkClass: 'pixel', expectedRenderer: 'fixed-cell-grid', targetDeviceProfile: 'android-default', notes: 'Pixel benchmark backed by the existing Norway Flag artwork record.', validationStatus: 'ready-for-review', sourceArtworkId: 'norway-flag' },
  { id: 'mental-hospital-ascii', title: 'Mental Hospital', expectedArtworkClass: 'ascii', expectedRenderer: 'fixed-cell-grid', targetDeviceProfile: 'android-default', notes: 'ASCII architecture benchmark; source artwork record is not yet in the current registry.', validationStatus: 'metadata-only' },
  { id: 'cafe-mixed-glyph', title: 'CAFÉ', expectedArtworkClass: 'mixed', expectedRenderer: 'fixed-cell-grid', targetDeviceProfile: 'iphone-default', notes: 'Mixed glyph benchmark; add the approved source record before screenshot validation.', validationStatus: 'metadata-only' },
  { id: 'dancing-cat-emoji-ascii', title: 'Dancing Cat', expectedArtworkClass: 'mixed', expectedRenderer: 'fixed-cell-grid', targetDeviceProfile: 'iphone-default', notes: 'Emoji and ASCII benchmark; no image-comparison score is recorded.', validationStatus: 'metadata-only' },
  { id: 'like-my-island-emoji', title: 'Like My Island', expectedArtworkClass: 'pixel', expectedRenderer: 'fixed-cell-grid', targetDeviceProfile: 'tablet', notes: 'Dense emoji scene benchmark; no image-comparison score is recorded.', validationStatus: 'metadata-only' },
  { id: 'alliance-cat-slide-ascii', title: 'Alliance Cat Slide', expectedArtworkClass: 'ascii', expectedRenderer: 'fixed-cell-grid', targetDeviceProfile: 'desktop-preview', notes: 'ASCII scene and dialogue benchmark backed by the existing Alliance Cat Slide record.', validationStatus: 'ready-for-review', sourceArtworkId: 'alliance-cat-slide' },
]

export function getBenchmarkArtwork(benchmark: RenderBenchmark): string {
  return benchmark.sourceArtworkId ? artTemplates.find((item) => item.id === benchmark.sourceArtworkId)?.art ?? '' : ''
}

export function getBenchmarkAvailability(benchmark: RenderBenchmark): BenchmarkAvailability {
  if (!benchmark.sourceArtworkId) return 'metadata-only'
  return getBenchmarkArtwork(benchmark) ? 'ready' : 'broken-reference'
}

