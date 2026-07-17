export const GIFT_CODE_RESULT_CODES = [
  'authentication_required',
  'character_required',
  'character_not_verified',
  'character_not_active',
  'character_not_owned',
  'character_disputed',
  'character_revoked',
  'player_id_unavailable',
  'consent_required',
  'consent_expired',
  'consent_revoked',
  'consent_policy_mismatch',
  'consent_provider_mismatch',
  'consent_character_mismatch',
  'consent_user_mismatch',
  'consent_mode_mismatch',
  'consent_environment_mismatch',
  'consent_digest_mismatch',
  'invalid_consent_contract',
  'code_not_found',
  'code_not_published',
  'code_expired',
  'code_withdrawn',
  'publication_version_mismatch',
  'provider_disabled',
  'provider_unavailable',
  'provider_unhealthy',
  'environment_disabled',
  'feature_disabled',
  'simulation_only',
  'request_accepted',
  'duplicate_existing_request',
  'already_claimed',
  'request_conflict',
  'ambiguous_existing_request',
  'retry_budget_exhausted',
  'rate_limited',
  'security_hold',
  'request_cancelled',
  'request_expired',
  'request_withdrawn',
  'provider_success',
  'provider_retryable_failure',
  'provider_terminal_failure',
  'provider_ambiguous',
  'provider_not_supported',
  'provider_not_sent',
  'invalid_player',
  'invalid_code',
  'signing_failure',
  'authorisation_failure',
  'eligibility_confirmed',
  'lease_unavailable',
  'lease_expired',
  'stale_version',
  'queue_disabled',
  'queue_backpressure',
  'support_capability_required',
  'support_action_forbidden',
] as const

export type GiftCodeResultCode =
  (typeof GIFT_CODE_RESULT_CODES)[number]

export const GIFT_CODE_UI_SAFE_MESSAGES: Readonly<
  Record<GiftCodeResultCode, string>
> = Object.freeze({
  authentication_required: 'Sign in to continue.',
  character_required: 'Choose a Governor to continue.',
  character_not_verified:
    'Verify the selected Governor before continuing.',
  character_not_active:
    'Confirm the active Governor before continuing.',
  character_not_owned:
    'The selected Governor is not available to this account.',
  character_disputed:
    'This Governor needs identity review before continuing.',
  character_revoked:
    'This Governor is no longer eligible for redemption.',
  player_id_unavailable:
    'The provider identity is not currently available.',
  consent_required: 'Confirm redemption consent to continue.',
  consent_expired: 'Redemption consent must be renewed.',
  consent_revoked: 'Redemption consent has been revoked.',
  consent_policy_mismatch:
    'Redemption consent must be renewed for the current policy.',
  consent_provider_mismatch:
    'Redemption consent does not cover this provider.',
  consent_character_mismatch:
    'Redemption consent does not cover this Governor.',
  consent_user_mismatch:
    'Redemption consent is not available to this account.',
  consent_mode_mismatch:
    'Redemption consent does not cover this mode.',
  consent_environment_mismatch:
    'Redemption consent does not cover this environment.',
  consent_digest_mismatch:
    'Redemption consent must be renewed for the current policy.',
  invalid_consent_contract:
    'Redemption consent could not be validated.',
  code_not_found: 'This Gift Code is not available.',
  code_not_published: 'This Gift Code is not published.',
  code_expired: 'This Gift Code has expired.',
  code_withdrawn: 'This Gift Code is no longer available.',
  publication_version_mismatch:
    'This Gift Code changed. Review it before continuing.',
  provider_disabled: 'Automatic redemption is disabled.',
  provider_unavailable:
    'Automatic redemption is temporarily unavailable.',
  provider_unhealthy:
    'Automatic redemption is temporarily unavailable.',
  environment_disabled: 'Automatic redemption is disabled.',
  feature_disabled: 'Automatic redemption is disabled.',
  simulation_only: 'No redemption request was sent.',
  request_accepted: 'The redemption request was accepted.',
  duplicate_existing_request:
    'The existing redemption request is shown.',
  already_claimed:
    'This Governor already received this Gift Code.',
  request_conflict:
    'The redemption request conflicts with current state.',
  ambiguous_existing_request:
    'Forge could not confirm the outcome. Do not retry yet.',
  retry_budget_exhausted:
    'No further automatic retries are available.',
  rate_limited: 'Please wait before trying again.',
  security_hold:
    'This redemption request requires a safety review.',
  request_cancelled: 'The redemption request was cancelled.',
  request_expired: 'The redemption request expired.',
  request_withdrawn:
    'The Gift Code was withdrawn before redemption.',
  provider_success: 'The provider confirmed redemption.',
  provider_retryable_failure: 'A safe retry may be scheduled.',
  provider_terminal_failure:
    'The provider could not complete redemption.',
  provider_ambiguous:
    'Forge could not confirm the outcome. Do not retry yet.',
  provider_not_supported:
    'Automatic redemption is not supported.',
  provider_not_sent: 'No redemption request was sent.',
  invalid_player:
    'The provider could not validate this Governor.',
  invalid_code: 'The provider did not accept this Gift Code.',
  signing_failure:
    'Automatic redemption is temporarily unavailable.',
  authorisation_failure:
    'Automatic redemption is temporarily unavailable.',
  eligibility_confirmed: 'Redemption requirements are satisfied.',
  lease_unavailable:
    'The redemption request is already being processed.',
  lease_expired: 'The processing lease expired safely.',
  stale_version: 'The redemption request changed. Refresh and retry.',
  queue_disabled: 'Automatic processing is disabled.',
  queue_backpressure:
    'Automatic processing is temporarily paused.',
  support_capability_required:
    'This support action is not permitted.',
  support_action_forbidden:
    'This support action cannot change redemption safeguards.',
})
