import { useEffect, useRef } from 'react'
import { ISLAND_HQ, ISLAND_MAP_BOUNDS, islandChestNodes } from './islandRouteData.ts'
import {
  placementsThroughRound,
  roundForChest,
  type IslandRoutePlan,
  type IslandRoutePlacement,
} from './routeEngine.ts'
import {
  loadLeaflet,
  type LeafletApi,
  type LeafletBoundsExpression,
  type LeafletLatLngExpression,
  type LeafletMap,
} from './leafletLoader.ts'

type IslandRouteMapProps = Readonly<{
  plan: IslandRoutePlan
  currentRound: number
  collectedChestIds: ReadonlySet<string>
  showFullRoute: boolean
  onSelectRound: (round: number) => void
  onStatusChange?: (message: string) => void
}>

const ISLAND_PROJECTED_BOUNDS: LeafletBoundsExpression = [[0, 0], [ISLAND_MAP_BOUNDS.height, ISLAND_MAP_BOUNDS.width * 2]]
const ISLAND_VIEW_BOUNDS: LeafletBoundsExpression = [[-8, -12], [ISLAND_MAP_BOUNDS.height + 8, (ISLAND_MAP_BOUNDS.width * 2) + 12]]

function projectIslandPoint(point: Readonly<{ x: number; y: number }>): LeafletLatLngExpression {
  const projectedX = point.x - point.y + ISLAND_MAP_BOUNDS.width
  const projectedY = (point.x + point.y) * 0.5
  return [projectedY, projectedX]
}

function fitIslandBoard(map: LeafletMap, api: LeafletApi, element: HTMLElement): void {
  const padding = element.clientWidth < 640 ? [6, 6] : [14, 14]
  map.invalidateSize({ pan: false })
  map.fitBounds(api.latLngBounds(ISLAND_PROJECTED_BOUNDS), { padding })
}

function routePlacements(plan: IslandRoutePlan, currentRound: number, showFullRoute: boolean) {
  return showFullRoute
    ? plan.rounds.flatMap((round) => round.placements)
    : placementsThroughRound(plan, currentRound)
}

function addGrid(api: LeafletApi, map: LeafletMap): void {
  const projectedCorners: ReadonlyArray<LeafletLatLngExpression> = [
    projectIslandPoint({ x: 0, y: 0 }),
    projectIslandPoint({ x: ISLAND_MAP_BOUNDS.width, y: 0 }),
    projectIslandPoint({ x: ISLAND_MAP_BOUNDS.width, y: ISLAND_MAP_BOUNDS.height }),
    projectIslandPoint({ x: 0, y: ISLAND_MAP_BOUNDS.height }),
    projectIslandPoint({ x: 0, y: 0 }),
  ]

  api.polygon(projectedCorners, {
    className: 'island-route-map__board',
    color: '#aaa2cb',
    fill: true,
    fillColor: '#526476',
    fillOpacity: 0.96,
    interactive: false,
    weight: 2,
  }).addTo(map)

  api.polyline(projectedCorners, {
    className: 'island-route-map__border',
    fill: false,
    interactive: false,
    weight: 2,
  }).addTo(map)

  for (let coordinate = 0; coordinate <= ISLAND_MAP_BOUNDS.width; coordinate += 5) {
    const major = coordinate % 10 === 0
    const options = {
      className: major ? 'island-route-map__grid island-route-map__grid--major' : 'island-route-map__grid',
      interactive: false,
      weight: major ? 1.25 : 0.7,
    }

    api.polyline([
      projectIslandPoint({ x: coordinate, y: 0 }),
      projectIslandPoint({ x: coordinate, y: ISLAND_MAP_BOUNDS.height }),
    ], options).addTo(map)
    api.polyline([
      projectIslandPoint({ x: 0, y: coordinate }),
      projectIslandPoint({ x: ISLAND_MAP_BOUNDS.width, y: coordinate }),
    ], options).addTo(map)
  }
}

function addRouteLine(api: LeafletApi, map: LeafletMap, placement: IslandRoutePlacement): void {
  api.polyline([projectIslandPoint(placement.from), projectIslandPoint(placement.chest)], {
    className: `island-route-map__path island-route-map__path--reservoir-${placement.reservoir}`,
    interactive: false,
    weight: 3,
  }).addTo(map)
}

function markerHtml(
  round: number,
  reservoir: number,
  collected: boolean,
  active: boolean,
): string {
  const state = collected ? '✓' : String(round)
  return `<span class="island-route-map__marker-number">${state}</span><span class="island-route-map__marker-reservoir" aria-hidden="true">R${reservoir}</span>${active ? '<span class="island-route-map__marker-pulse" aria-hidden="true"></span>' : ''}`
}

export default function IslandRouteMap({
  plan,
  currentRound,
  collectedChestIds,
  showFullRoute,
  onSelectRound,
  onStatusChange,
}: IslandRouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    let disposed = false
    let map: LeafletMap | undefined
    let resizeObserver: ResizeObserver | undefined

    onStatusChange?.('Loading the interactive Island map…')

    loadLeaflet()
      .then((api) => {
        if (disposed) return

        map = api.map(element, {
          crs: api.CRS.Simple,
          minZoom: -2,
          maxZoom: 3,
          zoomSnap: 0,
          zoomControl: true,
          attributionControl: false,
          maxBounds: ISLAND_VIEW_BOUNDS,
          maxBoundsViscosity: 0.8,
        })

        addGrid(api, map)
        routePlacements(plan, currentRound, showFullRoute).forEach((placement) => addRouteLine(api, map as LeafletMap, placement))

        const hqIcon = api.divIcon({
          className: 'island-route-map__hq-icon',
          html: '<span aria-hidden="true">⌂</span>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        })
        api.marker(projectIslandPoint(ISLAND_HQ), { icon: hqIcon, keyboard: true })
          .addTo(map)
          .bindTooltip?.('HQ Centre · route origin', { direction: 'top' })

        for (const chest of islandChestNodes) {
          const round = roundForChest(plan, chest.id)
          if (!round) continue
          const placement = plan.rounds[round - 1]?.placements.find((item) => item.chest.id === chest.id)
          if (!placement) continue

          const collected = collectedChestIds.has(chest.id)
          const active = round === currentRound
          const icon = api.divIcon({
            className: [
              'island-route-map__chest-icon',
              `island-route-map__chest-icon--reservoir-${placement.reservoir}`,
              collected ? 'island-route-map__chest-icon--collected' : '',
              active ? 'island-route-map__chest-icon--active' : '',
            ].filter(Boolean).join(' '),
            html: markerHtml(round, placement.reservoir, collected, active),
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          })

          const marker = api.marker(projectIslandPoint(chest), { icon, keyboard: true })
          marker.addTo(map)
          marker.bindTooltip?.(`${chest.label} · round ${round} · X ${chest.x}, Y ${chest.y}`, {
            direction: 'top',
          })
          marker.on?.('click', () => onSelectRound(round))
        }

        const refitBoard = () => {
          if (disposed || !map) return
          fitIslandBoard(map, api, element)
        }

        resizeObserver = new ResizeObserver(() => requestAnimationFrame(refitBoard))
        resizeObserver.observe(element)
        requestAnimationFrame(refitBoard)
        onStatusChange?.('Interactive Island map ready.')
      })
      .catch((error: unknown) => {
        if (disposed) return
        onStatusChange?.(error instanceof Error ? error.message : 'The interactive Island map is unavailable.')
      })

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      map?.remove()
      element.replaceChildren()
    }
  }, [collectedChestIds, currentRound, onSelectRound, onStatusChange, plan, showFullRoute])

  return <div className="island-route-map" ref={containerRef} aria-label="Interactive Oasis Island chest route map" />
}
