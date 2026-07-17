import {
  PUBLIC_PLAYER_FIELDS,
} from "./contracts.js"
import type {
  CharacterOwnershipVerification,
  PlayerVisibilityAudience,
  PublicPlayerField,
} from "./contracts.js"
import type {
  CharacterLimitConfiguration,
} from "./policies/characterLimitPolicy.js"
import type {
  AllianceId,
  CharacterLinkId,
  ForgeUserId,
  GameCharacterId,
  KingdomId,
  PlayerIdentityEventId,
  PlayerIdentityRevision,
  PublicPlayerAlias,
  VerificationRecordId,
} from "./identifiers.js"

export type ValidationResult<Value> =
  | {
      readonly valid: true
      readonly value: Value
    }
  | {
      readonly valid: false
      readonly reason: string
    }

const OPAQUE_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]{7,127}$/
const PUBLIC_ALIAS_PATTERN = /^[a-z][a-z0-9_-]{7,47}$/
const CHARACTER_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{3,63}$/
const UNSAFE_INVISIBLE_PATTERN = /[\u200B\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/u
const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u
const PUBLIC_PLAYER_FIELD_SET = new Set<string>(PUBLIC_PLAYER_FIELDS)

const VISIBILITY_AUDIENCES = new Set<PlayerVisibilityAudience>([
  "private",
  "selected_fields",
  "authenticated_forge_users",
  "alliance",
  "public",
])

function hasWellFormedUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)

    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = value.charCodeAt(index + 1)

      if (!Number.isFinite(next) || next < 0xDC00 || next > 0xDFFF) {
        return false
      }

      index += 1
      continue
    }

    if (code >= 0xDC00 && code <= 0xDFFF) {
      return false
    }
  }

  return true
}

function validateOpaqueIdentifier<Value extends string>(
  value: unknown,
  label: string,
): ValidationResult<Value> {
  if (
    typeof value !== "string" ||
    !OPAQUE_IDENTIFIER_PATTERN.test(value)
  ) {
    return {
      valid: false,
      reason: `${label} must be an opaque ASCII identifier between 8 and 128 characters.`,
    }
  }

  return {
    valid: true,
    value: value as Value,
  }
}

export function validateForgeUserId(
  value: unknown,
): ValidationResult<ForgeUserId> {
  return validateOpaqueIdentifier<ForgeUserId>(value, "Forge User ID")
}

export function validateGameCharacterId(
  value: unknown,
): ValidationResult<GameCharacterId> {
  return validateOpaqueIdentifier<GameCharacterId>(value, "Game Character ID")
}

export function validateCharacterLinkId(
  value: unknown,
): ValidationResult<CharacterLinkId> {
  return validateOpaqueIdentifier<CharacterLinkId>(value, "Character Link ID")
}

export function validateKingdomId(
  value: unknown,
): ValidationResult<KingdomId> {
  return validateOpaqueIdentifier<KingdomId>(value, "Kingdom ID")
}

export function validateAllianceId(
  value: unknown,
): ValidationResult<AllianceId> {
  return validateOpaqueIdentifier<AllianceId>(value, "Alliance ID")
}

export function validateVerificationRecordId(
  value: unknown,
): ValidationResult<VerificationRecordId> {
  return validateOpaqueIdentifier<VerificationRecordId>(value, "Verification Record ID")
}

export function validatePlayerIdentityEventId(
  value: unknown,
): ValidationResult<PlayerIdentityEventId> {
  return validateOpaqueIdentifier<PlayerIdentityEventId>(value, "Player Identity Event ID")
}

export function validatePublicPlayerAlias(
  value: unknown,
): ValidationResult<PublicPlayerAlias> {
  if (
    typeof value !== "string" ||
    !PUBLIC_ALIAS_PATTERN.test(value)
  ) {
    return {
      valid: false,
      reason: "Public aliases must be lowercase opaque identifiers between 8 and 48 characters.",
    }
  }

  return {
    valid: true,
    value: value as PublicPlayerAlias,
  }
}

export function validateExternalCharacterIdentifier(
  value: unknown,
): ValidationResult<string> {
  if (
    typeof value !== "string" ||
    !CHARACTER_IDENTIFIER_PATTERN.test(value)
  ) {
    return {
      valid: false,
      reason: "Character identifiers must contain 4 to 64 safe ASCII characters.",
    }
  }

  return {
    valid: true,
    value,
  }
}

export function validateDisplayName(
  value: unknown,
): ValidationResult<string> {
  if (typeof value !== "string" || !hasWellFormedUnicode(value)) {
    return {
      valid: false,
      reason: "Display names must contain well-formed Unicode.",
    }
  }

  const normalized = value.normalize("NFC").trim()
  const length = Array.from(normalized).length

  if (
    length < 1 ||
    length > 64 ||
    CONTROL_CHARACTER_PATTERN.test(normalized) ||
    UNSAFE_INVISIBLE_PATTERN.test(normalized)
  ) {
    return {
      valid: false,
      reason: "Display names must contain 1 to 64 visible Unicode characters without controls or unsafe invisible sequences.",
    }
  }

  return {
    valid: true,
    value: normalized,
  }
}

export function validatePlayerIdentityRevision(
  value: unknown,
): ValidationResult<PlayerIdentityRevision> {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    return {
      valid: false,
      reason: "Identity revisions must be positive safe integers.",
    }
  }

  return {
    valid: true,
    value: value as PlayerIdentityRevision,
  }
}

export interface VisibilitySelectionInput {
  readonly audience: string
  readonly visibleFields: readonly string[]
}

export interface ValidatedVisibilitySelection {
  readonly audience: PlayerVisibilityAudience
  readonly visibleFields: readonly PublicPlayerField[]
}

export function validateVisibilitySelection(
  input: VisibilitySelectionInput,
): ValidationResult<ValidatedVisibilitySelection> {
  if (!VISIBILITY_AUDIENCES.has(input.audience as PlayerVisibilityAudience)) {
    return {
      valid: false,
      reason: "Unknown visibility audience.",
    }
  }

  if (
    input.visibleFields.some((field) => !PUBLIC_PLAYER_FIELD_SET.has(field)) ||
    new Set(input.visibleFields).size !== input.visibleFields.length
  ) {
    return {
      valid: false,
      reason: "Visibility fields must be unique and explicitly allowlisted.",
    }
  }

  return {
    valid: true,
    value: {
      audience: input.audience as PlayerVisibilityAudience,
      visibleFields: input.visibleFields as readonly PublicPlayerField[],
    },
  }
}

function parseTimestamp(
  value: string | undefined,
  label: string,
): ValidationResult<number | undefined> {
  if (value === undefined) {
    return {
      valid: true,
      value: undefined,
    }
  }

  const parsed = Date.parse(value)

  if (!Number.isFinite(parsed)) {
    return {
      valid: false,
      reason: `${label} must be a valid timestamp.`,
    }
  }

  return {
    valid: true,
    value: parsed,
  }
}

export function validateVerificationTimestamps(
  verification: CharacterOwnershipVerification,
): ValidationResult<CharacterOwnershipVerification> {
  const issued = parseTimestamp(verification.issuedAt, "issuedAt")
  const expires = parseTimestamp(verification.expiresAt, "expiresAt")
  const revoked = parseTimestamp(verification.revokedAt, "revokedAt")
  const disputed = parseTimestamp(verification.disputedAt, "disputedAt")

  if (!issued.valid) {
    return {
      valid: false,
      reason: issued.reason,
    }
  }

  if (!expires.valid) {
    return {
      valid: false,
      reason: expires.reason,
    }
  }

  if (!revoked.valid) {
    return {
      valid: false,
      reason: revoked.reason,
    }
  }

  if (!disputed.valid) {
    return {
      valid: false,
      reason: disputed.reason,
    }
  }

  if (
    issued.value !== undefined &&
    expires.value !== undefined &&
    expires.value <= issued.value
  ) {
    return {
      valid: false,
      reason: "Verification expiry must be after issuance.",
    }
  }

  if (
    verification.state === "verified" &&
    issued.value === undefined
  ) {
    return {
      valid: false,
      reason: "A verified state requires an issuance timestamp from an approved future provider.",
    }
  }

  if (verification.state === "expired" && expires.value === undefined) {
    return {
      valid: false,
      reason: "An expired state requires an expiry timestamp.",
    }
  }

  if (verification.state === "revoked" && revoked.value === undefined) {
    return {
      valid: false,
      reason: "A revoked state requires a revocation timestamp.",
    }
  }

  if (verification.state === "disputed" && disputed.value === undefined) {
    return {
      valid: false,
      reason: "A disputed state requires a dispute timestamp.",
    }
  }

  return {
    valid: true,
    value: verification,
  }
}

export function validateCharacterLimitConfiguration(
  configuration: CharacterLimitConfiguration,
): ValidationResult<CharacterLimitConfiguration> {
  const numericValues = [
    configuration.baseAccountLimit,
    configuration.entitlementAdjustment,
    configuration.allianceRoleAdjustment,
    configuration.subscriptionAdjustment,
    configuration.absoluteSafetyCeiling,
  ]

  if (
    numericValues.some((value) => !Number.isSafeInteger(value)) ||
    configuration.baseAccountLimit < 1 ||
    configuration.absoluteSafetyCeiling < 1 ||
    configuration.entitlementAdjustment < 0 ||
    configuration.allianceRoleAdjustment < 0 ||
    configuration.subscriptionAdjustment < 0
  ) {
    return {
      valid: false,
      reason: "Character-limit values must be finite safe integers with a positive base and ceiling.",
    }
  }

  return {
    valid: true,
    value: configuration,
  }
}
