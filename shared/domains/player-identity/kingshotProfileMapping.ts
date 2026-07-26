export type KingshotProfileField = 'displayName' | 'playerId' | 'kingdom' | 'allianceTag' | 'townCenterLevel'
export type KingshotProfileRegionKey = KingshotProfileField | 'profilePanel'
  | 'playerIdNumeric' | 'avatar' | 'clipboardIcon' | 'playerIdLabel' | 'playerIdDigits'
  | 'townCenterLabel' | 'townCenterBadge' | 'townCenterBadgeTight' | 'townCenterBadgeContext' | 'townCenterGlyph' | 'kingdomLabel' | 'kingdomDigits' | 'kingdomLine'
export type KingshotProfileObservation = 'panel' | 'line' | 'numeric' | 'component' | 'exclusion' | 'layout'
export type KingshotProfileComponentRole = 'ocr' | 'layout' | 'exclusion'
export type KingshotProfileRegionConfig = {
  readonly key: KingshotProfileRegionKey
  readonly field?: KingshotProfileField
  readonly label: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly psm: 'single_char' | 'single_line' | 'single_word' | 'sparse_text'
  readonly characterWhitelist: string | null
  readonly observation: KingshotProfileObservation
  readonly componentRole?: KingshotProfileComponentRole
}

export const KINGSHOT_PROFILE_V1_REGIONS: readonly KingshotProfileRegionConfig[] = [
  { key: 'displayName', field: 'displayName', label: 'Unlabelled display name', x: 0.34, y: 0.18, width: 0.62, height: 0.16, psm: 'single_line', characterWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 []_-#', observation: 'line' },
  { key: 'playerId', field: 'playerId', label: 'Player ID', x: 0.34, y: 0.35, width: 0.62, height: 0.14, psm: 'single_line', characterWhitelist: '0123456789 IDid:', observation: 'line' },
  { key: 'kingdom', field: 'kingdom', label: 'Kingdom', x: 0.34, y: 0.62, width: 0.62, height: 0.16, psm: 'single_line', characterWhitelist: '0123456789 Kingdomkingdom#:', observation: 'line' },
]

export const KINGSHOT_PROFILE_V2_REGIONS: readonly KingshotProfileRegionConfig[] = [
  { key: 'profilePanel', label: 'Profile text panel', x: 0.27, y: 0.10, width: 0.58, height: 0.84, psm: 'sparse_text', characterWhitelist: null, observation: 'panel' },
  { key: 'displayName', field: 'displayName', label: 'Display name', x: 0.27, y: 0.13, width: 0.48, height: 0.18, psm: 'single_line', characterWhitelist: null, observation: 'line' },
  { key: 'playerId', field: 'playerId', label: 'Player ID', x: 0.27, y: 0.34, width: 0.43, height: 0.20, psm: 'single_line', characterWhitelist: '0123456789 IDid:', observation: 'line' },
  { key: 'playerIdNumeric', field: 'playerId', label: 'Player ID digits', x: 0.36, y: 0.34, width: 0.30, height: 0.20, psm: 'single_line', characterWhitelist: null, observation: 'numeric' },
  { key: 'kingdom', field: 'kingdom', label: 'Kingdom', x: 0.27, y: 0.70, width: 0.48, height: 0.20, psm: 'single_line', characterWhitelist: '0123456789 Kingdomkingdom#:', observation: 'line' },
]

export const KINGSHOT_PROFILE_V3_REGIONS: readonly KingshotProfileRegionConfig[] = [
  { key: 'profilePanel', label: 'Profile text panel', x: 0.27, y: 0.10, width: 0.58, height: 0.84, psm: 'sparse_text', characterWhitelist: null, observation: 'panel' },
  { key: 'displayName', field: 'displayName', label: 'Display name', x: 0.27, y: 0.13, width: 0.48, height: 0.18, psm: 'single_line', characterWhitelist: null, observation: 'line' },
  { key: 'playerId', field: 'playerId', label: 'Player ID line', x: 0.27, y: 0.34, width: 0.43, height: 0.20, psm: 'single_line', characterWhitelist: '0123456789 IDid:', observation: 'line' },
  { key: 'playerIdNumeric', field: 'playerId', label: 'Player ID digits', x: 0.36, y: 0.34, width: 0.30, height: 0.20, psm: 'single_line', characterWhitelist: null, observation: 'numeric' },
  { key: 'kingdom', field: 'kingdom', label: 'Kingdom', x: 0.27, y: 0.70, width: 0.48, height: 0.20, psm: 'single_line', characterWhitelist: '0123456789 Kingdomkingdom#:', observation: 'line' },
]

export const KINGSHOT_PROFILE_V4_REGIONS: readonly KingshotProfileRegionConfig[] = [
  { key: 'profilePanel', label: 'Profile panel', x: 0.29, y: 0.10, width: 0.67, height: 0.84, psm: 'sparse_text', characterWhitelist: null, observation: 'panel', componentRole: 'layout' },
  { key: 'avatar', label: 'Avatar layout region', x: 0.03, y: 0.05, width: 0.26, height: 0.89, psm: 'sparse_text', characterWhitelist: null, observation: 'layout', componentRole: 'layout' },
  { key: 'allianceTag', field: 'allianceTag', label: 'Alliance tag', x: 0.30, y: 0.12, width: 0.09, height: 0.22, psm: 'single_line', characterWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789[]()_-', observation: 'component', componentRole: 'ocr' },
  { key: 'displayName', field: 'displayName', label: 'Display name', x: 0.39, y: 0.12, width: 0.56, height: 0.22, psm: 'single_line', characterWhitelist: null, observation: 'component', componentRole: 'ocr' },
  { key: 'playerIdLabel', field: 'playerId', label: 'Player ID label', x: 0.30, y: 0.37, width: 0.05, height: 0.18, psm: 'single_word', characterWhitelist: 'IDid1:', observation: 'component', componentRole: 'ocr' },
  { key: 'playerIdDigits', field: 'playerId', label: 'Player ID digits', x: 0.35, y: 0.37, width: 0.19, height: 0.18, psm: 'single_word', characterWhitelist: '0123456789', observation: 'numeric', componentRole: 'ocr' },
  { key: 'clipboardIcon', label: 'Clipboard exclusion', x: 0.55, y: 0.36, width: 0.07, height: 0.20, psm: 'single_word', characterWhitelist: null, observation: 'exclusion', componentRole: 'exclusion' },
  { key: 'townCenterLabel', label: 'Town Centre label', x: 0.30, y: 0.53, width: 0.30, height: 0.20, psm: 'single_line', characterWhitelist: null, observation: 'layout', componentRole: 'layout' },
  { key: 'townCenterBadge', label: 'Town Centre badge', x: 0.70, y: 0.51, width: 0.08, height: 0.18, psm: 'single_word', characterWhitelist: '0123456789', observation: 'layout', componentRole: 'layout' },
  { key: 'kingdomLabel', field: 'kingdom', label: 'Kingdom label', x: 0.30, y: 0.76, width: 0.18, height: 0.16, psm: 'single_word', characterWhitelist: null, observation: 'component', componentRole: 'ocr' },
  { key: 'kingdomDigits', field: 'kingdom', label: 'Kingdom digits', x: 0.50, y: 0.76, width: 0.14, height: 0.16, psm: 'single_word', characterWhitelist: '0123456789', observation: 'numeric', componentRole: 'ocr' },
]

export const KINGSHOT_PROFILE_V5_REGIONS: readonly KingshotProfileRegionConfig[] = [
  ...KINGSHOT_PROFILE_V4_REGIONS,
  { key: 'kingdomLine', field: 'kingdom', label: 'Kingdom labelled line', x: 0.27, y: 0.70, width: 0.48, height: 0.20, psm: 'single_line', characterWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#: ', observation: 'line', componentRole: 'ocr' },
]

export const KINGSHOT_PROFILE_V6_REGIONS: readonly KingshotProfileRegionConfig[] = KINGSHOT_PROFILE_V5_REGIONS.map((region) => region.key === 'townCenterLabel'
  ? { ...region, x: 0.30, y: 0.50, width: 0.42, height: 0.24, observation: 'component' as const, componentRole: 'ocr' as const }
  : region.key === 'townCenterBadge'
    ? { ...region, x: 0.67, y: 0.47, width: 0.16, height: 0.25, observation: 'numeric' as const, componentRole: 'ocr' as const }
    : region)

export const KINGSHOT_PROFILE_V7_REGIONS: readonly KingshotProfileRegionConfig[] = KINGSHOT_PROFILE_V6_REGIONS.filter((region) => region.key !== 'townCenterBadge').concat([
  { key: 'townCenterBadgeTight', field: 'townCenterLevel', label: 'Town Centre badge tight', x: 0.59, y: 0.43, width: 0.13, height: 0.31, psm: 'single_word', characterWhitelist: '0123456789', observation: 'numeric', componentRole: 'ocr' },
  { key: 'townCenterBadgeContext', field: 'townCenterLevel', label: 'Town Centre badge context', x: 0.56, y: 0.40, width: 0.19, height: 0.36, psm: 'single_line', characterWhitelist: '0123456789', observation: 'numeric', componentRole: 'ocr' },
])

export const KINGSHOT_PROFILE_V8_REGIONS: readonly KingshotProfileRegionConfig[] = KINGSHOT_PROFILE_V7_REGIONS.concat([
  { key: 'townCenterGlyph', field: 'townCenterLevel', label: 'Town Centre glyph', x: 0.635, y: 0.52, width: 0.055, height: 0.14, psm: 'single_char', characterWhitelist: '0123456789', observation: 'numeric', componentRole: 'ocr' },
])
