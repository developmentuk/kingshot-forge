import Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

const bundledLeaflet = Leaflet as LeafletApi

export function loadLeaflet(): Promise<LeafletApi> {
  return Promise.resolve(bundledLeaflet)
}
