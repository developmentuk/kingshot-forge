import type {
  PlayerVisibilityAudience,
} from "./contracts.js"
import type {
  CharacterLinkId,
  ForgeUserId,
  GameCharacterId,
  PlayerIdentityEventId,
  PlayerIdentityRevision,
  VerificationRecordId,
} from "./identifiers.js"

type EventMetadataValue =
  | string
  | number
  | boolean
  | null
  | readonly EventMetadataValue[]
  | { readonly [key: string]: EventMetadataValue }

export type PlayerIdentityEventMetadata = Readonly<
  Record<string, EventMetadataValue>
>

interface PlayerIdentityEventBase<Name extends string> {
  readonly eventId: PlayerIdentityEventId
  readonly name: Name
  readonly occurredAt: string
  readonly identityRevision: PlayerIdentityRevision
  readonly actorForgeUserId?: ForgeUserId
  readonly characterId?: GameCharacterId
  readonly characterLinkId?: CharacterLinkId
  readonly verificationRecordId?: VerificationRecordId
  readonly metadata: PlayerIdentityEventMetadata
  readonly syntheticUnitTestData?: true
}

export type PlayerIdentityDomainEvent =
  | PlayerIdentityEventBase<"CharacterLinkProposed">
  | PlayerIdentityEventBase<"CharacterLinked">
  | PlayerIdentityEventBase<"CharacterLinkRevoked">
  | PlayerIdentityEventBase<"CharacterLinkDisputed">
  | PlayerIdentityEventBase<"CharacterLinkRemoved">
  | PlayerIdentityEventBase<"PrimaryCharacterChanged">
  | PlayerIdentityEventBase<"ActiveCharacterResolved">
  | PlayerIdentityEventBase<"ActiveCharacterRejected">
  | PlayerIdentityEventBase<"VerificationRequested">
  | PlayerIdentityEventBase<"VerificationGranted">
  | PlayerIdentityEventBase<"VerificationExpired">
  | PlayerIdentityEventBase<"VerificationRevoked">
  | PlayerIdentityEventBase<"VerificationDisputed">
  | PlayerIdentityEventBase<"PublicAliasProposed">
  | PlayerIdentityEventBase<"PublicAliasChanged">
  | PlayerIdentityEventBase<"PublicAliasDisabled">
  | PlayerIdentityEventBase<"SupportCaseOpened">
  | PlayerIdentityEventBase<"SupportDecisionRecorded">
  | PlayerIdentityEventBase<"HighRiskApprovalRequested">
  | PlayerIdentityEventBase<"HighRiskApprovalGranted">
  | PlayerIdentityEventBase<"HighRiskApprovalRejected">
  | PlayerIdentityEventBase<"HeroShowcaseSelectionChanged">
  | (PlayerIdentityEventBase<"PlayerVisibilityChanged"> & {
      readonly visibilityAudience: PlayerVisibilityAudience
    })

const SENSITIVE_METADATA_KEY_PATTERN =
  /(audit|authorization|cookie|credential|evidence|identifier|password|proof|providersecret|rawplayerid|servicerole|secret|support|token)/i
const SENSITIVE_METADATA_VALUE_PATTERN =
  /(^Bearer\s|sb_(secret|service_role)_|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/i

function assertSafeMetadataValue(
  value: EventMetadataValue,
  path: string,
): void {
  if (
    typeof value === "string" &&
    SENSITIVE_METADATA_VALUE_PATTERN.test(value)
  ) {
    throw new Error(`Sensitive event metadata value rejected at ${path}.`)
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      assertSafeMetadataValue(entry, `${path}[${index}]`)
    })
    return
  }

  if (value !== null && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (SENSITIVE_METADATA_KEY_PATTERN.test(key)) {
        throw new Error(`Sensitive event metadata key rejected at ${path}.${key}.`)
      }

      assertSafeMetadataValue(nested, `${path}.${key}`)
    }
  }
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value)

    for (const nested of Object.values(value)) {
      deepFreeze(nested)
    }
  }

  return value
}

export function createImmutablePlayerIdentityEvent<
  Event extends PlayerIdentityDomainEvent,
>(event: Event): Event {
  for (const [key, value] of Object.entries(event.metadata)) {
    if (SENSITIVE_METADATA_KEY_PATTERN.test(key)) {
      throw new Error(`Sensitive event metadata key rejected: ${key}.`)
    }

    assertSafeMetadataValue(value, `metadata.${key}`)
  }

  if (
    event.name === "VerificationGranted" &&
    event.syntheticUnitTestData !== true
  ) {
    throw new Error(
      "Positive verification events are disabled until an approved provider exists.",
    )
  }

  return deepFreeze(event)
}
