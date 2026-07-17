export const PLAYER_IDENTITY_RESULT_CODES = [
  "authentication_required",
  "actor_not_resolved",
  "character_not_found",
  "character_already_linked",
  "character_not_linked",
  "character_link_limit_reached",
  "character_link_revoked",
  "character_link_disputed",
  "character_link_removed",
  "character_link_verification_required",
  "primary_character_missing",
  "primary_character_invalid",
  "primary_character_revoked",
  "primary_character_disputed",
  "primary_character_revision_conflict",
  "active_character_required",
  "active_character_not_linked",
  "active_character_revoked",
  "active_character_disputed",
  "active_character_not_verified",
  "active_character_verification_expired",
  "active_character_revision_conflict",
  "active_character_operation_not_allowed",
  "alias_invalid",
  "alias_reserved",
  "alias_unavailable",
  "alias_collision",
  "alias_private",
  "projection_not_allowed",
  "field_not_visible",
  "visibility_invalid",
  "approval_required",
  "approver_must_differ",
  "dispute_not_found",
  "dispute_already_resolved",
  "support_action_not_allowed",
  "gift_eligibility_unavailable",
  "attribution_unavailable",
  "showcase_projection_unavailable",
  "feature_disabled",
  "persistence_disabled",
  "migration_required",
  "invalid_request",
  "conflict",
  "stale_revision",
  "operation_not_supported",
  "unavailable",
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
