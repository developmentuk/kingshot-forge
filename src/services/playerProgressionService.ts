import { supabase } from '../lib/supabase'

export type PlayerProgressionSnapshot = {
  id: string
  playerAccountId: string
  recordedAt: string
  currentPower: number | null
  highestPower: number | null
  townCenterLevel: number | null
  truegoldLevel: number | null
  vipLevel: number | null
  infantryTier: number | null
  lancerTier: number | null
  marksmanTier: number | null
  governorGearScore: number | null
  governorCharmScore: number | null
  notes: string | null
  isPublic: boolean
}

export type PlayerProgressionInput = Omit<PlayerProgressionSnapshot, 'id' | 'recordedAt' | 'playerAccountId'>

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function mapSnapshot(row: Record<string, unknown>): PlayerProgressionSnapshot {
  return {
    id: String(row.id),
    playerAccountId: String(row.player_account_id),
    recordedAt: String(row.recorded_at),
    currentPower: asNumber(row.current_power),
    highestPower: asNumber(row.highest_power),
    townCenterLevel: asNumber(row.town_center_level),
    truegoldLevel: asNumber(row.truegold_level),
    vipLevel: asNumber(row.vip_level),
    infantryTier: asNumber(row.infantry_tier),
    lancerTier: asNumber(row.lancer_tier),
    marksmanTier: asNumber(row.marksman_tier),
    governorGearScore: asNumber(row.governor_gear_score),
    governorCharmScore: asNumber(row.governor_charm_score),
    notes: typeof row.notes === 'string' ? row.notes : null,
    isPublic: row.is_public === true,
  }
}

export async function getMyProgression(playerAccountId: string): Promise<PlayerProgressionSnapshot[]> {
  const { data, error } = await supabase.from('player_progression_snapshots').select('*').eq('player_account_id', playerAccountId).order('recorded_at', { ascending: false }).limit(24)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapSnapshot(row as Record<string, unknown>))
}

export async function getPublicProgression(playerAccountId: string): Promise<PlayerProgressionSnapshot[]> {
  const { data, error } = await supabase.from('player_progression_snapshots').select('*').eq('player_account_id', playerAccountId).eq('is_public', true).order('recorded_at', { ascending: false }).limit(12)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapSnapshot(row as Record<string, unknown>))
}

function validateTier(value: number | null, label: string, supportedValues?: ReadonlySet<number>) {
  if (value !== null && (value < 1 || value > 6)) throw new Error(`${label} must be between TG1 and TG6.`)
  if (value !== null && supportedValues && !supportedValues.has(value)) {
    throw new Error(`${label} is not available in the published dataset.`)
  }
}

function validateNonNegative(value: number | null, label: string) {
  if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error(`${label} must be zero or greater.`)
}

export function normalizeTownCenterLevel(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 30) return value
    if (typeof value !== 'string') continue
    const text = value.trim()
    const match = text.match(/(?:town\s*center|town_center|\btc\b)\s*[:#-]?\s*(\d{1,2})\b/i) ?? text.match(/\bTG\s*(\d{1,2})\s*-\s*0\b/i)
    const parsed = match ? Number(match[1]) : null
    if (parsed !== null && Number.isInteger(parsed) && parsed >= 1 && parsed <= 30) return parsed
  }
  return null
}

export function validateTownCenterLevel(value: number | null): void {
  if (value !== null && (!Number.isInteger(value) || value < 1 || value > 30)) {
    throw new Error('Town Center must be a whole level from 1 to 30, or left as Not recorded.')
  }
}

export type ProgressionValidationOptions = {
  infantryTiers?: ReadonlySet<number>
  lancerTiers?: ReadonlySet<number>
  marksmanTiers?: ReadonlySet<number>
  truegoldLevels?: ReadonlySet<number>
  vipLevels?: ReadonlySet<number>
}

export async function addProgressionSnapshot(playerAccountId: string, input: PlayerProgressionInput, options: ProgressionValidationOptions = {}): Promise<void> {
  validateTownCenterLevel(input.townCenterLevel)
  validateNonNegative(input.currentPower, 'Current power')
  validateNonNegative(input.highestPower, 'Highest power')
  validateNonNegative(input.governorGearScore, 'Governor Gear score')
  validateNonNegative(input.governorCharmScore, 'Governor Charm score')
  validateTier(input.infantryTier, 'Infantry tier', options.infantryTiers)
  validateTier(input.lancerTier, 'Cavalry tier', options.lancerTiers)
  validateTier(input.marksmanTier, 'Archer tier', options.marksmanTiers)
  if (input.vipLevel !== null && (input.vipLevel < 0 || input.vipLevel > 12)) throw new Error('VIP level must be between 0 and 12.')
  if (input.vipLevel !== null && options.vipLevels && !options.vipLevels.has(input.vipLevel)) throw new Error('VIP level is not available in the published dataset.')
  if (input.truegoldLevel !== null && (input.truegoldLevel < 0 || input.truegoldLevel > 8)) throw new Error('Truegold level must be between 0 and 8.')
  if (input.truegoldLevel !== null && options.truegoldLevels && !options.truegoldLevels.has(input.truegoldLevel)) throw new Error('Truegold level is not available in the published dataset.')

  const { error } = await supabase.from('player_progression_snapshots').insert({
    player_account_id: playerAccountId,
    current_power: input.currentPower,
    highest_power: input.highestPower,
    town_center_level: input.townCenterLevel,
    truegold_level: input.truegoldLevel,
    vip_level: input.vipLevel,
    infantry_tier: input.infantryTier,
    lancer_tier: input.lancerTier,
    marksman_tier: input.marksmanTier,
    governor_gear_score: input.governorGearScore,
    governor_charm_score: input.governorCharmScore,
    notes: input.notes?.trim() || null,
    is_public: input.isPublic,
  })
  if (error) {
    if (error.code === '23514' && error.message.includes('player_progression_town_center_range')) {
      throw new Error('Town Center must be a whole level from 1 to 30. The linked player data does not contain a valid Town Center value yet.')
    }
    throw new Error('Progression could not be saved. Check the highlighted values and try again.')
  }
}
