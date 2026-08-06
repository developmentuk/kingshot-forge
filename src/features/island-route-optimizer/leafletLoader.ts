export type LeafletLatLngExpression = readonly [number, number]
export type LeafletBoundsExpression = readonly [LeafletLatLngExpression, LeafletLatLngExpression]

export type LeafletLayer = Readonly<{
  addTo: (map: LeafletMap) => LeafletLayer
  bindTooltip?: (content: string, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  on?: (event: string, handler: () => void) => LeafletLayer
}>

export type LeafletMap = Readonly<{
  fitBounds: (bounds: LeafletBoundsExpression, options?: Readonly<Record<string, unknown>>) => void
  invalidateSize: (options?: Readonly<Record<string, unknown>>) => void
  remove: () => void
}>

export type LeafletApi = Readonly<{
  CRS: Readonly<{ Simple: unknown }>
  map: (element: HTMLElement, options: Readonly<Record<string, unknown>>) => LeafletMap
  latLngBounds: (bounds: LeafletBoundsExpression) => LeafletBoundsExpression
  polyline: (points: ReadonlyArray<LeafletLatLngExpression>, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  polygon: (points: ReadonlyArray<LeafletLatLngExpression>, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  rectangle: (bounds: LeafletBoundsExpression, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  imageOverlay: (url: string, bounds: LeafletBoundsExpression, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  marker: (point: LeafletLatLngExpression, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  divIcon: (options: Readonly<Record<string, unknown>>) => unknown
}>

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
const LEAFLET_JS_INTEGRITY = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='

function leafletFromWindow(): LeafletApi | undefined {
  return window.L
}

function ensureStylesheet(): void {
  if (document.querySelector('link[data-forge-leaflet-css]')) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = LEAFLET_CSS_URL
  link.integrity = LEAFLET_CSS_INTEGRITY
  link.crossOrigin = ''
  link.dataset.forgeLeafletCss = 'true'
  document.head.appendChild(link)
}

export function loadLeaflet(): Promise<LeafletApi> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Leaflet requires a browser environment.'))

  const existingApi = leafletFromWindow()
  if (existingApi) return Promise.resolve(existingApi)
  if (window.__forgeIslandLeafletPromise) return window.__forgeIslandLeafletPromise

  ensureStylesheet()

  window.__forgeIslandLeafletPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-forge-leaflet-js]')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        const loadedApi = leafletFromWindow()
        if (loadedApi) resolve(loadedApi)
        else reject(new Error('Leaflet loaded but did not initialise.'))
      }, { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Leaflet failed to load. Use the route list fallback.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS_URL
    script.integrity = LEAFLET_JS_INTEGRITY
    script.crossOrigin = ''
    script.async = true
    script.dataset.forgeLeafletJs = 'true'
    script.addEventListener('load', () => {
      const loadedApi = leafletFromWindow()
      if (loadedApi) resolve(loadedApi)
      else reject(new Error('Leaflet loaded but did not initialise.'))
    }, { once: true })
    script.addEventListener('error', () => reject(new Error('Leaflet failed to load. Use the route list fallback.')), { once: true })
    document.head.appendChild(script)
  })

  return window.__forgeIslandLeafletPromise
}

declare global {
  interface Window {
    L?: LeafletApi
    __forgeIslandLeafletPromise?: Promise<LeafletApi>
  }
}
