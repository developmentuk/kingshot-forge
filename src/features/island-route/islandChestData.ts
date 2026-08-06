import type { IslandChest, IslandReservoir } from './islandRouteTypes.js'

export const ISLAND_MAP_SIZE = {
  width: 60,
  height: 60,
} as const

export const ISLAND_DATASET_VERSION = 'island-route-seed-2026-08-06'

export const ISLAND_DATASET_NOTE =
  'Reviewable first-pass Oasis Island route geometry. Public source evidence confirms a 60x60 map and 55 chest locations, but the complete coordinate table still requires owner/community verification before canonical publication.'

export const ISLAND_RESERVOIRS: readonly IslandReservoir[] = [
  { id: 'reservoir-solo', label: 'HQ Reservoir', type: 'reservoir', runner: 'solo', x: 30, y: 30 },
  { id: 'reservoir-1', label: 'Reservoir 1', type: 'reservoir', runner: 'reservoir-1', x: 23, y: 30 },
  { id: 'reservoir-2', label: 'Reservoir 2', type: 'reservoir', runner: 'reservoir-2', x: 18, y: 39 },
] as const

export const ISLAND_CHESTS: readonly IslandChest[] = [
  { id: 'chest-01', label: 'Chest 1', type: 'chest', sector: 'Inner Oasis', x: 29, y: 32 },
  { id: 'chest-02', label: 'Chest 2', type: 'chest', sector: 'Inner Oasis', x: 33, y: 29 },
  { id: 'chest-03', label: 'Chest 3', type: 'chest', sector: 'Inner Oasis', x: 27, y: 27 },
  { id: 'chest-04', label: 'Chest 4', type: 'chest', sector: 'Inner Oasis', x: 36, y: 31 },
  { id: 'chest-05', label: 'Chest 5', type: 'chest', sector: 'Inner Oasis', x: 31, y: 35 },
  { id: 'chest-06', label: 'Chest 6', type: 'chest', sector: 'Inner Oasis', x: 24, y: 30 },
  { id: 'chest-07', label: 'Chest 7', type: 'chest', sector: 'Inner Oasis', x: 23, y: 34 },
  { id: 'chest-08', label: 'Chest 8', type: 'chest', sector: 'North-east Approach', x: 35, y: 25 },
  { id: 'chest-09', label: 'Chest 9', type: 'chest', sector: 'North-east Approach', x: 39, y: 28 },
  { id: 'chest-10', label: 'Chest 10', type: 'chest', sector: 'South-west Channel', x: 28, y: 40 },
  { id: 'chest-11', label: 'Chest 11', type: 'chest', sector: 'South-west Channel', x: 18, y: 39 },
  { id: 'chest-12', label: 'Chest 12', type: 'chest', sector: 'South-west Channel', x: 24, y: 43 },
  { id: 'chest-13', label: 'Chest 13', type: 'chest', sector: 'South-west Channel', x: 20, y: 45 },
  { id: 'chest-14', label: 'Chest 14', type: 'chest', sector: 'South-west Channel', x: 16, y: 42 },
  { id: 'chest-15', label: 'Chest 15', type: 'chest', sector: 'West Ridge', x: 12, y: 38 },
  { id: 'chest-16', label: 'Chest 16', type: 'chest', sector: 'West Ridge', x: 14, y: 33 },
  { id: 'chest-17', label: 'Chest 17', type: 'chest', sector: 'West Ridge', x: 20, y: 31 },
  { id: 'chest-18', label: 'Chest 18', type: 'chest', sector: 'Southern Basin', x: 26, y: 46 },
  { id: 'chest-19', label: 'Chest 19', type: 'chest', sector: 'Southern Basin', x: 31, y: 48 },
  { id: 'chest-20', label: 'Chest 20', type: 'chest', sector: 'Southern Basin', x: 36, y: 45 },
  { id: 'chest-21', label: 'Chest 21', type: 'chest', sector: 'South-east Basin', x: 42, y: 43 },
  { id: 'chest-22', label: 'Chest 22', type: 'chest', sector: 'South-east Basin', x: 46, y: 39 },
  { id: 'chest-23', label: 'Chest 23', type: 'chest', sector: 'East Ridge', x: 49, y: 34 },
  { id: 'chest-24', label: 'Chest 24', type: 'chest', sector: 'East Ridge', x: 44, y: 30 },
  { id: 'chest-25', label: 'Chest 25', type: 'chest', sector: 'East Ridge', x: 41, y: 25 },
  { id: 'chest-26', label: 'Chest 26', type: 'chest', sector: 'North-east Ridge', x: 38, y: 20 },
  { id: 'chest-27', label: 'Chest 27', type: 'chest', sector: 'North Ridge', x: 33, y: 18 },
  { id: 'chest-28', label: 'Chest 28', type: 'chest', sector: 'North Ridge', x: 28, y: 17 },
  { id: 'chest-29', label: 'Chest 29', type: 'chest', sector: 'North Ridge', x: 23, y: 19 },
  { id: 'chest-30', label: 'Chest 30', type: 'chest', sector: 'North-west Ridge', x: 18, y: 22 },
  { id: 'chest-31', label: 'Chest 31', type: 'chest', sector: 'North-west Ridge', x: 14, y: 26 },
  { id: 'chest-32', label: 'Chest 32', type: 'chest', sector: 'West Ridge', x: 10, y: 30 },
  { id: 'chest-33', label: 'Chest 33', type: 'chest', sector: 'West Ridge', x: 8, y: 36 },
  { id: 'chest-34', label: 'Chest 34', type: 'chest', sector: 'Far West Basin', x: 9, y: 43 },
  { id: 'chest-35', label: 'Chest 35', type: 'chest', sector: 'Far West Basin', x: 13, y: 49 },
  { id: 'chest-36', label: 'Chest 36', type: 'chest', sector: 'South-west Edge', x: 18, y: 53 },
  { id: 'chest-37', label: 'Chest 37', type: 'chest', sector: 'South Edge', x: 24, y: 55 },
  { id: 'chest-38', label: 'Chest 38', type: 'chest', sector: 'South Edge', x: 30, y: 54 },
  { id: 'chest-39', label: 'Chest 39', type: 'chest', sector: 'South Edge', x: 36, y: 52 },
  { id: 'chest-40', label: 'Chest 40', type: 'chest', sector: 'South-east Edge', x: 43, y: 50 },
  { id: 'chest-41', label: 'Chest 41', type: 'chest', sector: 'South-east Edge', x: 49, y: 46 },
  { id: 'chest-42', label: 'Chest 42', type: 'chest', sector: 'East Edge', x: 53, y: 40 },
  { id: 'chest-43', label: 'Chest 43', type: 'chest', sector: 'East Edge', x: 55, y: 33 },
  { id: 'chest-44', label: 'Chest 44', type: 'chest', sector: 'East Edge', x: 52, y: 27 },
  { id: 'chest-45', label: 'Chest 45', type: 'chest', sector: 'North-east Edge', x: 48, y: 22 },
  { id: 'chest-46', label: 'Chest 46', type: 'chest', sector: 'North-east Edge', x: 43, y: 17 },
  { id: 'chest-47', label: 'Chest 47', type: 'chest', sector: 'North-east Edge', x: 37, y: 13 },
  { id: 'chest-48', label: 'Chest 48', type: 'chest', sector: 'North Edge', x: 31, y: 10 },
  { id: 'chest-49', label: 'Chest 49', type: 'chest', sector: 'North Edge', x: 25, y: 11 },
  { id: 'chest-50', label: 'Chest 50', type: 'chest', sector: 'North-west Edge', x: 19, y: 13 },
  { id: 'chest-51', label: 'Chest 51', type: 'chest', sector: 'North-west Edge', x: 13, y: 17 },
  { id: 'chest-52', label: 'Chest 52', type: 'chest', sector: 'West Edge', x: 8, y: 23 },
  { id: 'chest-53', label: 'Chest 53', type: 'chest', sector: 'West Edge', x: 5, y: 30 },
  { id: 'chest-54', label: 'Chest 54', type: 'chest', sector: 'Far South-west', x: 6, y: 47 },
  { id: 'chest-55', label: 'Chest 55', type: 'chest', sector: 'Far South-east', x: 54, y: 49 },
] as const

export function getIslandReservoir(id: string): IslandReservoir {
  const reservoir = ISLAND_RESERVOIRS.find((candidate) => candidate.id === id)
  if (!reservoir) throw new Error(`Unknown island reservoir: ${id}`)
  return reservoir
}
