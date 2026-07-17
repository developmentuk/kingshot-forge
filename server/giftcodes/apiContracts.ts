import type { GiftCodeServerCapability } from './capabilities.ts'
import type { GiftCodeResultCode } from '../../shared/domains/giftcodes/resultCodes.ts'

export type GiftCodeApiSuccess<T> = Readonly<{
  status: 'success'
  data: T
  meta: Readonly<{
    requestId: string
    revision: number
    rateLimitRemaining: number | null
  }>
}>

export type GiftCodeApiError = Readonly<{
  status: 'error'
  error: Readonly<{
    code: GiftCodeResultCode
    message: string
    requestId: string
    retryable: boolean
  }>
}>

export type GiftCodeCursorPage<T> = Readonly<{
  items: readonly T[]
  nextCursor: string | null
}>

export type GiftCodeApiContract = Readonly<{
  id: string
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  authentication: 'bearer' | 'internal'
  executable: false
  cursorPaginated: boolean
  idempotencyRequired: boolean
  capability: GiftCodeServerCapability | null
}>

export const GIFT_CODE_API_CONTRACTS: readonly GiftCodeApiContract[] =
  Object.freeze([
    {
      id: 'redemption_context',
      method: 'GET',
      path: '/api/giftcodes/redemption/context',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: false,
      capability: null,
    },
    {
      id: 'redemption_eligibility',
      method: 'GET',
      path: '/api/giftcodes/redemption/eligibility',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: false,
      capability: null,
    },
    {
      id: 'grant_redemption_consent',
      method: 'POST',
      path: '/api/giftcodes/redemption/consent',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: true,
      capability: null,
    },
    {
      id: 'revoke_redemption_consent',
      method: 'DELETE',
      path: '/api/giftcodes/redemption/consent',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: true,
      capability: null,
    },
    {
      id: 'create_redemption',
      method: 'POST',
      path: '/api/giftcodes/redemptions',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: true,
      capability: null,
    },
    {
      id: 'list_redemptions',
      method: 'GET',
      path: '/api/giftcodes/redemptions',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: true,
      idempotencyRequired: false,
      capability: null,
    },
    {
      id: 'get_redemption',
      method: 'GET',
      path: '/api/giftcodes/redemptions/:id',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: false,
      capability: null,
    },
    {
      id: 'cancel_redemption',
      method: 'POST',
      path: '/api/giftcodes/redemptions/:id/cancel',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: true,
      capability: null,
    },
    {
      id: 'retry_redemption',
      method: 'POST',
      path: '/api/giftcodes/redemptions/:id/retry',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: true,
      capability: null,
    },
    {
      id: 'provider_health',
      method: 'GET',
      path: '/api/admin/giftcodes/provider-health',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: false,
      capability: 'giftcode.provider.operations',
    },
    {
      id: 'security_hold',
      method: 'POST',
      path: '/api/admin/giftcodes/redemptions/:id/security-hold',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: true,
      capability: 'giftcode.security_hold.manage',
    },
    {
      id: 'kill_switch',
      method: 'POST',
      path: '/api/admin/giftcodes/provider-health/:providerId',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: true,
      capability: 'giftcode.kill_switch.manage',
    },
    {
      id: 'redacted_request_inspection',
      method: 'GET',
      path: '/api/admin/giftcodes/redemptions/:id',
      authentication: 'bearer',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: false,
      capability: 'giftcode.audit.redacted.read',
    },
    {
      id: 'worker_invocation',
      method: 'POST',
      path: '/api/internal/giftcodes/worker',
      authentication: 'internal',
      executable: false,
      cursorPaginated: false,
      idempotencyRequired: true,
      capability: 'giftcode.provider.operations',
    },
  ] as const)

type ParsedObject = Readonly<Record<string, unknown>>

export type StrictBodyResult =
  | Readonly<{ ok: true; value: ParsedObject }>
  | Readonly<{
      ok: false
      code: 'request_conflict'
      unknownFields: readonly string[]
      missingFields: readonly string[]
    }>

export function parseStrictGiftCodeBody(input: {
  value: unknown
  requiredFields: readonly string[]
  optionalFields?: readonly string[]
}): StrictBodyResult {
  if (
    input.value === null ||
    typeof input.value !== 'object' ||
    Array.isArray(input.value)
  ) {
    return Object.freeze({
      ok: false,
      code: 'request_conflict',
      unknownFields: Object.freeze([]),
      missingFields: Object.freeze([...input.requiredFields]),
    })
  }

  const value = input.value as Record<string, unknown>
  const allowed = new Set([
    ...input.requiredFields,
    ...(input.optionalFields ?? []),
  ])
  const unknownFields = Object.keys(value)
    .filter((field) => !allowed.has(field))
    .sort()
  const missingFields = input.requiredFields.filter(
    (field) => !(field in value),
  )

  if (unknownFields.length > 0 || missingFields.length > 0) {
    return Object.freeze({
      ok: false,
      code: 'request_conflict',
      unknownFields: Object.freeze(unknownFields),
      missingFields: Object.freeze(missingFields),
    })
  }

  return Object.freeze({
    ok: true,
    value: Object.freeze({ ...value }),
  })
}
