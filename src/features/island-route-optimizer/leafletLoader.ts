const LEAFLET_VERSION = '1.9.4'
const LEAFLET_CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`
const LEAFLET_JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
const LEAFLET_JS_INTEGRITY = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='

export type LeafletLatLngExpression = readonly [number, number]
export type LeafletBoundsExpression = readonly [LeafletLatLngExpression, LeafletLatLngExpression]

export type LeafletLayer = Readonly<{
  addTo: (map: LeafletMap) => LeafletLayer
  bindTooltip?: (content: string, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  on?: (event: string, handler: () => void) => LeafletLayer
}>

export type LeafletMap = Readonly<{
  fitBounds: (bounds: LeafletBoundsExpression, options?: Readonly<Record<string, unknown>>) => void
  remove: () => void
}>

export type LeafletApi = Readonly<{
  CRS: Readonly<{ Simple: unknown }>
  map: (element: HTMLElement, options: Readonly<Record<string, unknown>>) => LeafletMap
  latLngBounds: (bounds: LeafletBoundsExpression) => LeafletBoundsExpression
  polyline: (points: ReadonlyArray<LeafletLatLngExpression>, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  rectangle: (bounds: LeafletBoundsExpression, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  marker: (point: LeafletLatLngExpression, options?: Readonly<Record<string, unknown>>) => LeafletLayer
  divIcon: (options: Readonly<Record<string, unknown>>) => unknown
}>

let leafletPromise: Promise<LeafletApi> | undefined

function ensureStylesheet(): void {
  if (document.querySelector('link[data-forge-leaflet]')) return

  const stylesheet = document.createElement('link')
  stylesheet.rel = 'stylesheet'
  stylesheet.href = LEAFLET_CSS_URL
  stylesheet.integrity = LEAFLET_CSS_INTEGRITY
  stylesheet.crossOrigin = 'anonymous'
  stylesheet.dataset.forgeLeaflet = LEAFLET_VERSION
  document.head.appendChild(stylesheet)
}

function existingLeaflet(): LeafletApi | undefined {
  return window.L
}

export function loadLeaflet(): Promise<LeafletApi> {
  const loaded = existingLeaflet()
  if (loaded) return Promise.resolve(loaded)
  if (leafletPromise) return leafletPromise

  ensureStylesheet()

  leafletPromise = new Promise<LeafletApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-forge-leaflet]')
    const script = existingScript ?? document.createElement('script')
    const timeout = window.setTimeout(() => {
      leafletPromise = undefined
      reject(new Error('The interactive Island map took too long to load.'))
    }, 12_000)

    function cleanup(): void {
      window.clearTimeout(timeout)
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
    }

    function handleLoad(): void {
      cleanup()
      const api = existingLeaflet()
      if (!api) {
        leafletPromise = undefined
        reject(new Error('The interactive Island map library did not initialise.'))
        return
      }
      resolve(api)
    }

    function handleError(): void {
      cleanup()
      script.remove()
      leafletPromise = undefined
      reject(new Error('The interactive Island map could not be loaded. The route list remains available below.'))
    }

    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)

    if (!existingScript) {
      script.src = LEAFLET_JS_URL
      script.integrity = LEAFLET_JS_INTEGRITY
      script.crossOrigin = 'anonymous'
      script.dataset.forgeLeaflet = LEAFLET_VERSION
      document.head.appendChild(script)
    }
  })

  return leafletPromise
}

declare global {
  interface Window {
    L?: LeafletApi
  }
}
