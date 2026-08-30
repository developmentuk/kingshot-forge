import { createHash } from 'node:crypto'
import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { PlayerProviderError } from '../player-identity/providers/playerProvider.js'

export type ProviderRequestCategory =
  | 'player_link'
  | 'player_sign_in'
  | 'player_manual'
  | 'player_automatic'
  | 'player_intelligence'
  | 'alliance_roster'
  | 'kingdom'
  | 'kvk_target'

export type ProviderQuotaPriority = 'high' | 'normal' | 'low'

export type ProviderQuotaReservation = Readonly<{
  allowed: boolean
  duplicate: boolean
  reservationId: string | null
  minuteUsed: number
  dayUsed: number
  minuteLimit: number
  dayLimit: number
  normalDayLimit: number
}>

export interface ProviderQuotaRepository {
  reserve(input: Readonly<{
    category: ProviderRequestCategory
    priority: ProviderQuotaPriority
    idempotencyKey?: string | null
  }>): Promise<ProviderQuotaReservation>
}

export function isProviderQuotaRuntimeEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return environment.MIGHTPULSE_PROVIDER_QUOTA_ENABLED?.trim().toLowerCase()
    === 'true'
}

export function signInProviderIdempotencyKey(
  userId: string,
  verifiedLastSignInAt: string,
): string {
  return createHash('sha256')
    .update(
      'mightpulse-player-sign-in-v1\n'
      + userId
      + '\n'
      + verifiedLastSignInAt,
    )
    .digest('hex')
}

export class SupabaseProviderQuotaRepository
implements ProviderQuotaRepository {
  async reserve(
    input: Readonly<{
      category: ProviderRequestCategory
      priority: ProviderQuotaPriority
      idempotencyKey?: string | null
    }>,
  ): Promise<ProviderQuotaReservation> {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.rpc(
      'reserve_provider_request',
      {
        p_provider: 'mightpulse',
        p_category: input.category,
        p_priority: input.priority,
        p_idempotency_key: input.idempotencyKey ?? null,
      },
    )
    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data
    if (!row || typeof row !== 'object') {
      throw new Error('Provider quota reservation returned an invalid result.')
    }

    const value = row as Record<string, unknown>
    if (
      typeof value.allowed !== 'boolean'
      || typeof value.duplicate !== 'boolean'
      || (
        value.reservation_id !== null
        && typeof value.reservation_id !== 'string'
      )
      || typeof value.minute_used !== 'number'
      || !Number.isInteger(value.minute_used)
      || typeof value.day_used !== 'number'
      || !Number.isInteger(value.day_used)
      || typeof value.minute_limit !== 'number'
      || !Number.isInteger(value.minute_limit)
      || typeof value.day_limit !== 'number'
      || !Number.isInteger(value.day_limit)
      || typeof value.normal_day_limit !== 'number'
      || !Number.isInteger(value.normal_day_limit)
    ) {
      throw new Error('Provider quota reservation returned an invalid result.')
    }

    return {
      allowed: value.allowed,
      duplicate: value.duplicate,
      reservationId: value.reservation_id as string | null,
      minuteUsed: value.minute_used,
      dayUsed: value.day_used,
      minuteLimit: value.minute_limit,
      dayLimit: value.day_limit,
      normalDayLimit: value.normal_day_limit,
    }
  }
}

export async function reserveMightPulseProviderRequest(
  input: Readonly<{
    category: ProviderRequestCategory
    priority: ProviderQuotaPriority
    idempotencyKey?: string | null
  }>,
  repository: ProviderQuotaRepository =
    new SupabaseProviderQuotaRepository(),
): Promise<ProviderQuotaReservation> {
  const reservation = await repository.reserve(input)
  if (!reservation.allowed && !reservation.duplicate) {
    throw new PlayerProviderError(
      429,
      'PLAYER_PROVIDER_QUOTA_EXHAUSTED',
      'The MightPulse request budget is temporarily exhausted. Cached data is still available.',
      true,
    )
  }
  return reservation
}
