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

export type ProviderQuotaReservationState =
  | 'reserved'
  | 'in_progress'
  | 'completed'
  | 'quota_exhausted'

export type ProviderRequestStatus =
  | 'missing'
  | 'pending'
  | 'completed'
  | 'failed'

export interface ProviderRequestStatusRepository {
  read(idempotencyKey: string): Promise<ProviderRequestStatus>
}

export type ProviderQuotaReservation = Readonly<{
  allowed: boolean
  duplicate: boolean
  state: ProviderQuotaReservationState
  reservationId: string | null
  attemptToken: string | null
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
  complete(input: Readonly<{
    reservationId: string
    attemptToken: string
  }>): Promise<boolean>
  fail(input: Readonly<{
    reservationId: string
    attemptToken: string
  }>): Promise<boolean>
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

export function baseSignInProviderIdempotencyKey(
  userId: string,
  verifiedLastSignInAt: string,
): string {
  return createHash('sha256')
    .update(
      'mightpulse-player-base-sign-in-v1\n'
      + userId
      + '\n'
      + verifiedLastSignInAt,
    )
    .digest('hex')
}

export class SupabaseProviderRequestStatusRepository
implements ProviderRequestStatusRepository {
  async read(idempotencyKey: string): Promise<ProviderRequestStatus> {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.rpc(
      'get_provider_request_status',
      {
        p_provider: 'mightpulse',
        p_idempotency_key: idempotencyKey,
      },
    )
    if (error) throw error
    if (
      data !== 'missing'
      && data !== 'pending'
      && data !== 'completed'
      && data !== 'failed'
    ) {
      throw new Error('Provider request status returned an invalid result.')
    }
    return data
  }
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
        value.reservation_state !== 'reserved'
        && value.reservation_state !== 'in_progress'
        && value.reservation_state !== 'completed'
        && value.reservation_state !== 'quota_exhausted'
      )
      || (
        value.attempt_token !== null
        && typeof value.attempt_token !== 'string'
      )
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
      state: value.reservation_state as ProviderQuotaReservationState,
      reservationId: value.reservation_id as string | null,
      attemptToken: value.attempt_token as string | null,
      minuteUsed: value.minute_used,
      dayUsed: value.day_used,
      minuteLimit: value.minute_limit,
      dayLimit: value.day_limit,
      normalDayLimit: value.normal_day_limit,
    }
  }

  async complete(
    input: Readonly<{
      reservationId: string
      attemptToken: string
    }>,
  ): Promise<boolean> {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.rpc(
      'complete_provider_request',
      {
        p_reservation_id: input.reservationId,
        p_attempt_token: input.attemptToken,
      },
    )
    if (error) throw error
    if (typeof data !== 'boolean') {
      throw new Error('Provider quota completion update returned an invalid result.')
    }
    return data
  }

  async fail(
    input: Readonly<{
      reservationId: string
      attemptToken: string
    }>,
  ): Promise<boolean> {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.rpc(
      'fail_provider_request',
      {
        p_reservation_id: input.reservationId,
        p_attempt_token: input.attemptToken,
      },
    )
    if (error) throw error
    if (typeof data !== 'boolean') {
      throw new Error('Provider quota failure update returned an invalid result.')
    }
    return data
  }
}

export async function readMightPulseProviderRequestStatus(
  idempotencyKey: string,
  repository: ProviderRequestStatusRepository =
    new SupabaseProviderRequestStatusRepository(),
): Promise<ProviderRequestStatus> {
  return repository.read(idempotencyKey)
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


export async function completeMightPulseProviderRequest(
  reservation: ProviderQuotaReservation,
  repository: ProviderQuotaRepository =
    new SupabaseProviderQuotaRepository(),
): Promise<boolean> {
  if (
    reservation.state !== 'reserved'
    || reservation.reservationId === null
    || reservation.attemptToken === null
  ) {
    return false
  }

  return repository.complete({
    reservationId: reservation.reservationId,
    attemptToken: reservation.attemptToken,
  })
}

export async function failMightPulseProviderRequest(
  reservation: ProviderQuotaReservation,
  repository: ProviderQuotaRepository =
    new SupabaseProviderQuotaRepository(),
): Promise<boolean> {
  if (
    reservation.state !== 'reserved'
    || reservation.reservationId === null
    || reservation.attemptToken === null
  ) {
    return false
  }

  return repository.fail({
    reservationId: reservation.reservationId,
    attemptToken: reservation.attemptToken,
  })
}
