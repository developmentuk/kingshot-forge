export type KingshotProfileField = 'displayName' | 'playerId' | 'kingdom'
export type KingshotProfileRegionKey = KingshotProfileField | 'profilePanel'
export type KingshotProfileRegionConfig = {
  readonly key: KingshotProfileRegionKey
  readonly field?: KingshotProfileField
  readonly label: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly psm: 'single_line' | 'sparse_text'
  readonly characterWhitelist: string | null
}

export const KINGSHOT_PROFILE_V1_REGIONS: readonly KingshotProfileRegionConfig[] = [
  { key: 'displayName', field: 'displayName', label: 'Unlabelled display name', x: 0.34, y: 0.18, width: 0.62, height: 0.16, psm: 'single_line', characterWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 []_-#' },
  { key: 'playerId', field: 'playerId', label: 'Player ID', x: 0.34, y: 0.35, width: 0.62, height: 0.14, psm: 'single_line', characterWhitelist: '0123456789 IDid:' },
  { key: 'kingdom', field: 'kingdom', label: 'Kingdom', x: 0.34, y: 0.62, width: 0.62, height: 0.16, psm: 'single_line', characterWhitelist: '0123456789 Kingdomkingdom#:' },
]

export const KINGSHOT_PROFILE_V2_REGIONS: readonly KingshotProfileRegionConfig[] = [
  { key: 'profilePanel', label: 'Profile text panel', x: 0.27, y: 0.10, width: 0.58, height: 0.84, psm: 'sparse_text', characterWhitelist: null },
  { key: 'displayName', field: 'displayName', label: 'Display name', x: 0.27, y: 0.13, width: 0.48, height: 0.18, psm: 'single_line', characterWhitelist: null },
  { key: 'playerId', field: 'playerId', label: 'Player ID', x: 0.27, y: 0.34, width: 0.43, height: 0.20, psm: 'single_line', characterWhitelist: '0123456789 IDid:' },
  { key: 'kingdom', field: 'kingdom', label: 'Kingdom', x: 0.27, y: 0.70, width: 0.48, height: 0.20, psm: 'single_line', characterWhitelist: '0123456789 Kingdomkingdom#:' },
]
