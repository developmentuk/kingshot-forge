import { useEffect, useMemo, useRef, useState } from 'react'
import { ISLAND_MAP_SIZE, ISLAND_RESERVOIRS } from './islandChestData.js'
import { loadLeaflet } from './leafletCdn.js'
import { nodeLookup } from './islandRouteEngine.js'
import type { IslandChest, IslandRouteResult } from './islandRouteTypes.js'

type LeafletIslandMapProps = {
  chests: readonly IslandChest[]
  route: IslandRouteResult
  collectedChestIds: ReadonlySet<string>
  visibleSteps: number
  selectedChestId?: string
  onToggleChest: (chestId: string) => void
}

const mapBounds: [[number, number], [number, number]] = [[0, 0], [ISLAND_MAP_SIZE.height, ISLAND_MAP_SIZE.width]]

function coordinate(node: { x: number; y: number }): [number, number] {
  return [node.y, node.x]
}

function islandMapDataUri(): string {
  const gridLines = Array.from({ length: ISLAND_MAP_SIZE.width + 1 }, (_, index) => {
    const major = index % 10 === 0
    const stroke = major ? '#406252' : '#2b4037'
    const width = major ? '0.18' : '0.08'
    return `<path d="M ${index} 0 V ${ISLAND_MAP_SIZE.height} M 0 ${index} H ${ISLAND_MAP_SIZE.width}" stroke="${stroke}" stroke-width="${width}" />`
  }).join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ISLAND_MAP_SIZE.width} ${ISLAND_MAP_SIZE.height}">
    <defs>
      <radialGradient id="oasis" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#1d5f57" />
        <stop offset="55%" stop-color="#193e36" />
        <stop offset="100%" stop-color="#102821" />
      </radialGradient>
    </defs>
    <rect width="60" height="60" fill="url(#oasis)" />
    <circle cx="30" cy="30" r="8" fill="#2a8b7d" opacity="0.36" />
    <circle cx="18" cy="39" r="5" fill="#9ec9a5" opacity="0.18" />
    <circle cx="46" cy="38" r="7" fill="#9ec9a5" opacity="0.14" />
    ${gridLines}
    <path d="M4 31 C14 22 26 17 35 12 C44 18 55 26 56 37 C51 49 38 56 24 55 C12 54 4 45 4 31Z" fill="none" stroke="#9ec9a5" stroke-width="0.45" opacity="0.32" />
  </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function markerHtml(label: string, modifier: string): string {
  return `<span class="island-leaflet-marker island-leaflet-marker--${modifier}">${label}</span>`
}

export default function LeafletIslandMap({
  chests,
  route,
  collectedChestIds,
  visibleSteps,
  selectedChestId,
  onToggleChest,
}: LeafletIslandMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [mapUnavailable, setMapUnavailable] = useState('')
  const activeSteps = useMemo(() => route.steps.slice(0, visibleSteps), [route.steps, visibleSteps])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    let disposed = false
    let map: { remove: () => void; fitBounds: (bounds: [[number, number], [number, number]], options?: Readonly<Record<string, unknown>>) => unknown; invalidateSize: () => void } | null = null

    loadLeaflet()
      .then((leaflet) => {
        if (disposed) return

        map = leaflet.map(container, {
          crs: leaflet.CRS.Simple,
          minZoom: -2,
          maxZoom: 4,
          zoomControl: true,
          attributionControl: false,
        })

        leaflet.imageOverlay(islandMapDataUri(), mapBounds, { interactive: false }).addTo(map)
        map.fitBounds(mapBounds, { padding: [8, 8] })

        const nodes = nodeLookup(chests, ISLAND_RESERVOIRS)
        const activeEdgeIds = new Set(activeSteps.map((step) => step.node.id))

        route.edges.slice(0, visibleSteps).forEach((edge) => {
          const from = nodes.get(edge.fromId)
          const to = nodes.get(edge.toId)
          if (!from || !to) return
          leaflet.polyline([coordinate(from), coordinate(to)], {
            color: edge.runner === 'reservoir-2' ? '#82d6ff' : '#f4ca64',
            weight: 2.5,
            opacity: 0.9,
          }).addTo(map as never)
        })

        ISLAND_RESERVOIRS.forEach((reservoir) => {
          leaflet.marker(coordinate(reservoir), {
            icon: leaflet.divIcon({ className: 'island-leaflet-icon', html: markerHtml(reservoir.runner === 'reservoir-2' ? 'R2' : 'R1', 'reservoir'), iconSize: [32, 32], iconAnchor: [16, 16] }),
          }).bindTooltip?.(`${reservoir.label}: ${reservoir.x},${reservoir.y}`).addTo(map as never)
        })

        chests.forEach((chest) => {
          const collected = collectedChestIds.has(chest.id)
          const active = activeEdgeIds.has(chest.id)
          const selected = selectedChestId === chest.id
          const modifier = collected ? 'collected' : selected ? 'selected' : active ? 'active' : 'pending'
          const marker = leaflet.marker(coordinate(chest), {
            icon: leaflet.divIcon({ className: 'island-leaflet-icon', html: markerHtml(chest.label.replace('Chest ', ''), modifier), iconSize: [26, 26], iconAnchor: [13, 13] }),
            keyboard: true,
            title: `${chest.label} at ${chest.x},${chest.y}`,
          })
          marker.bindTooltip?.(`${chest.label} · ${chest.sector} · ${chest.x},${chest.y}`)
          marker.addTo(map as never)
          const element = container.querySelector(`[title="${chest.label} at ${chest.x},${chest.y}"]`)
          element?.addEventListener('click', () => onToggleChest(chest.id))
        })

        window.setTimeout(() => map?.invalidateSize(), 0)
      })
      .catch((error: unknown) => {
        setMapUnavailable(error instanceof Error ? error.message : 'The interactive map could not be loaded.')
      })

    return () => {
      disposed = true
      map?.remove()
    }
  }, [activeSteps, chests, collectedChestIds, onToggleChest, route.edges, selectedChestId, visibleSteps])

  return <div className="island-map-card">
    <div className="island-map-card__header">
      <div>
        <p className="eyebrow">Interactive Leaflet map</p>
        <h2>Oasis route map</h2>
      </div>
      <span>CRS.Simple · 60×60 grid</span>
    </div>
    <div ref={containerRef} className="island-map" role="application" aria-label="Interactive Oasis Island route map" />
    {mapUnavailable && <p className="island-map-card__fallback">{mapUnavailable} Use the route checklist below as the fallback.</p>}
  </div>
}
