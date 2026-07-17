export const PLAYER_IDENTITY_RESULT_CODES = [
  "authentication_required",
  "actor_not_resolved",
  "character_not_found",
  "character_already_linked",
  "character_link_limit_reached",
  "character_link_revoked",
  "character_link_disputed",
  "character_link_removed",
  "primary_character_missing",
  "primary_character_invalid",
  "active_character_required",
  "active_character_not_linked",
  "active_character_revoked",
  "active_character_disputed",
  "active_character_not_verified",
  "active_character_verification_expired",
  "active_character_revision_conflict",
  "projection_not_allowed",
  "field_not_visible",
  "public_alias_unavailable",
  "invalid_request",
  "conflict",
  "stale_revision",
  "operation_not_supported",
] as const

export type PlayerIdentityResultCode =
  (typeof PLAYER_IDENTITY_RESULT_CODES)[number]

const PLAYER_IDENTITY_RESULT_CODE_SET = new Set<string>(
  PLAYER_IDENTITY_RESULT_CODES,
)

export function isPlayerIdentityResultCode(
  value: unknown,
): value is PlayerIdentityResultCode {
  return typeof value === "string" &&
    PLAYER_IDENTITY_RESULT_CODE_SET.has(value)
}
