import {
  PUBLIC_PLAYER_FIELDS,
} from "../contracts.js"
import type {
  PlayerVisibilityMetadata,
  PublicPlayerField,
} from "../contracts.js"
import type {
  ForgeUserId,
} from "../identifiers.js"

const PUBLIC_PLAYER_FIELD_SET = new Set<string>(
  PUBLIC_PLAYER_FIELDS,
)

const INTERNAL_FIELD_KEYS = new Set([
  "allianceauthority",
  "authenticationid",
  "authid",
  "characterlinkid",
  "evidencereference",
  "forgeuserid",
  "giftcentreeligibility",
  "internalplayerid",
  "membershiphistory",
  "moderationnotes",
  "playerid",
  "providercredentials",
  "providerevidence",
  "rawplayerid",
  "servicerole",
  "supportnotes",
  "transferdata",
  "verificationevidence",
])

function normalizedFieldKey(field: string): string {
  return field.replaceAll(/[^a-z0-9]/gi, "").toLowerCase()
}

export function isProhibitedProjectionField(field: string): boolean {
  return INTERNAL_FIELD_KEYS.has(normalizedFieldKey(field))
}

export function isPublicPlayerField(
  field: string,
): field is PublicPlayerField {
  return PUBLIC_PLAYER_FIELD_SET.has(field)
}

export interface VisibilityViewer {
  readonly kind: "anonymous" | "authenticated"
  readonly forgeUserId?: ForgeUserId
  readonly sameAlliance?: boolean
}

export interface PlayerFieldVisibilityRequest {
  readonly field: string
  readonly visibility: PlayerVisibilityMetadata
  readonly ownerForgeUserId?: ForgeUserId
  readonly viewer: VisibilityViewer
}

export type PlayerFieldVisibilityDecision =
  | {
      readonly visible: true
      readonly field: PublicPlayerField
    }
  | {
      readonly visible: false
      readonly reason:
        | "unknown_field"
        | "internal_field"
        | "field_not_selected"
        | "audience_not_allowed"
    }

export function evaluatePlayerFieldVisibility(
  request: PlayerFieldVisibilityRequest,
): PlayerFieldVisibilityDecision {
  if (isProhibitedProjectionField(request.field)) {
    return {
      visible: false,
      reason: "internal_field",
    }
  }

  if (!isPublicPlayerField(request.field)) {
    return {
      visible: false,
      reason: "unknown_field",
    }
  }

  if (!request.visibility.visibleFields.includes(request.field)) {
    return {
      visible: false,
      reason: "field_not_selected",
    }
  }

  const isOwner =
    request.viewer.kind === "authenticated" &&
    request.ownerForgeUserId !== undefined &&
    request.viewer.forgeUserId === request.ownerForgeUserId
  const audienceAllowed = (() => {
    switch (request.visibility.audience) {
      case "private":
        return isOwner
      case "selected_fields":
        return true
      case "authenticated_forge_users":
        return request.viewer.kind === "authenticated"
      case "alliance":
        return request.viewer.kind === "authenticated" &&
          request.viewer.sameAlliance === true
      case "public":
        return true
    }
  })()

  if (!audienceAllowed) {
    return {
      visible: false,
      reason: "audience_not_allowed",
    }
  }

  return {
    visible: true,
    field: request.field,
  }
}

export function selectAllowlistedProjectionFields(
  source: Readonly<Record<string, unknown>>,
  allowlist: readonly string[],
): Readonly<Record<string, unknown>> {
  const selected: Record<string, unknown> = {}

  for (const field of allowlist) {
    if (
      isProhibitedProjectionField(field) ||
      !isPublicPlayerField(field) ||
      !Object.prototype.hasOwnProperty.call(source, field)
    ) {
      continue
    }

    selected[field] = source[field]
  }

  return Object.freeze(selected)
}
