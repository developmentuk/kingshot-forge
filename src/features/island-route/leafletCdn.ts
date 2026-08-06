type LeafletCoordinate = [number, number]
type LeafletBounds = [LeafletCoordinate, LeafletCoordinate]

type LeafletLayer = {
  addTo: (map: LeafletMap) => LeafletLayer
  remove?: () => void
  bindTooltip?: (content: string, options?: Readonly<Record<string, unknown>>) => LeafletLayer
}

type LeafletMap = {
  remove: () => void
  fitBounds: (bounds: LeafletBounds, options?: Readonly<Record<string, unknown>>) => LeafletMap
  invalidateSize: () => void
}

type LeafletGlobal = {
  CRS: { Simple: unknown }
  map: (element: HTMLElement, options: Readonly<Record<string, unknown>>) => LeafletMap
  imageOverlay: (url: string, bounds: LeafletBounds, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  marker: (coordinate: LeafletCoordinate, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  polyline: (coordinates: LeafletCoordinate[], options?: Readonly<Record<string, unknown>>) => LeafletLayer
  divIcon: (options: Readonly<Record<string, unknown>>) => unknown
}

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
const LEAFLET_JS_INTEGRITY = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='

function ensureLeafletStylesheet(): void {
  if (document.querySelector('link[data-forge-leaflet-css]')) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = LEAFLET_CSS_URL
  link.integrity = LEAFLET_CSS_INTEGRITY
  link.crossOrigin = ''
  link.dataset.forgeLeafletCss = 'true'
  document.head.appendChild(link)
}

export function loadLeaflet(): Promise<LeafletGlobal> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Leaflet requires a browser environment.'))
  if (window.L) return Promise.resolve(window.L)
  if (window.__forgeLeafletPromise) return window.__forgeLeafletPromise

  ensureLeafletStylesheet()

  window.__forgeLeafletPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-forge-leaflet-js]')
    if (existingScript) {
      existingScript.addEventListener('load', () => window.L ? resolve(window.L) : reject(new Error('Leaflet failed to initialise.')), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Leaflet failed to load.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS_URL
    script.integrity = LEAFLET_JS_INTEGRITY
    script.crossOrigin = ''
    script.async = true
    script.dataset.forgeLeafletJs = 'true'
    script.addEventListener('load', () => window.L ? resolve(window.L) : reject(new Error('Leaflet failed to initialise.')), { once: true })
    script.addEventListener('error', () => reject(new Error('Leaflet failed to load.')), { once: true })
    document.head.appendChild(script)
  })

  return window.__forgeLeafletPromise
}

declare global {
  interface Window {
    L?: LeafletGlobal
    __forgeLeafletPromise?: Promise<LeafletGlobal>
  }
}
