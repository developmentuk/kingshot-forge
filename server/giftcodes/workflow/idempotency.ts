import { createHash } from 'node:crypto'
import type { GiftCodeResultCode } from '../../../shared/domains/giftcodes/resultCodes.ts'
import type { GiftCodeRedemptionRequestState } from '../../../shared/domains/giftcodes/workflow.ts'

export const GIFT_CODE_IDEMPOTENCY_VERSION =
  'giftcode-redemption:v2'

export type GiftCodeIdempotencyIdentity = Readonly<{
  environment: string
  providerId: string
  operation: 'redeem'
  verifiedCharacterInternalId: string
  giftCodePublicationId: string
  publicationVersion: string
}>
export type GiftCodeIdempotencyResult =
  | Readonly<{
      ok: true
      version: typeof GIFT_CODE_IDEMPOTENCY_VERSION
      canonicalMaterial: string
      hash: string
    }>
  | Readonly<{
      ok: false
      code: 'request_conflict'
      field: keyof GiftCodeIdempotencyIdentity
    }>

function encodeField(name: string, value: string) {
  return `${name}:${Buffer.byteLength(value, 'utf8')}:${value}`
}

export function createGiftCodeIdempotencyIdentity(
  identity: GiftCodeIdempotencyIdentity,
): GiftCodeIdempotencyResult {
  const orderedFields: ReadonlyArray<
    readonly [keyof GiftCodeIdempotencyIdentity, string]
  > = [
    ['environment', identity.environment],
    ['providerId', identity.providerId],
    ['operation', identity.operation],
    [
      'verifiedCharacterInternalId',
      identity.verifiedCharacterInternalId,
    ],
    ['giftCodePublicationId', identity.giftCodePublicationId],
    ['publicationVersion', identity.publicationVersion],
  ]

  for (const [field, value] of orderedFields) {
    if (value.trim().length === 0) {
      return Object.freeze({
        ok: false,
        code: 'request_conflict',
        field,
      })
    }
  }

  const canonicalMaterial = [
    GIFT_CODE_IDEMPOTENCY_VERSION,
    ...orderedFields.map(([name, value]) =>
      encodeField(name, value.trim()),
    ),
  ].join('|')

  return Object.freeze({
    ok: true,
    version: GIFT_CODE_IDEMPOTENCY_VERSION,
    canonicalMaterial,
    hash: createHash('sha256')
      .update(canonicalMaterial, 'utf8')
      .digest('hex'),
  })
}

export function resolveGiftCodeDuplicate(
  existingState: GiftCodeRedemptionRequestState | null,
): Readonly<{
  createNew: boolean
  code: GiftCodeResultCode
}> {
  if (existingState === null) {
    return Object.freeze({
      createNew: true,
      code: 'request_accepted',
    })
  }

  if (existingState === 'ambiguous') {
    return Object.freeze({
      createNew: false,
      code: 'ambiguous_existing_request',
    })
  }

  if (existingState === 'already_claimed') {
    return Object.freeze({
      createNew: false,
      code: 'already_claimed',
    })
  }

  return Object.freeze({
    createNew: false,
    code: 'duplicate_existing_request',
  })
}

export type GiftCodeIdempotentRequestRepository = Readonly<{
  insertOrGetExisting: (
    identity: Readonly<{
      version: typeof GIFT_CODE_IDEMPOTENCY_VERSION
      hash: string
    }>,
  ) => Promise<
    | Readonly<{ inserted: true; requestId: string }>
    | Readonly<{
        inserted: false
        requestId: string
        state: GiftCodeRedemptionRequestState
      }>
  >
}>
