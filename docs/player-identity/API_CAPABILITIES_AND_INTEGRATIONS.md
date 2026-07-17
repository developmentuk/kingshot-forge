# Player Identity API, capabilities and integrations

**Status:** Disabled local contracts. No capability is granted and no external event is published.

## API surface

| Handler | Methods | Purpose |
| --- | --- | --- |
| `/api/player/identity` | GET, POST | Private projection and typed actions: link proposal/state, Primary, explicit Active context, visibility and alias |
| `/api/player/public?alias=` | GET | Safe public projection by opaque alias |
| `/api/player/support?caseId=` | GET, POST reserved | Queue/case read; writes remain disabled |
| `/api/player/integrations` | POST | Internal Gift and Art projection dispatch |

The consolidated action handler is the repository’s established Vercel equivalent of separate mutation endpoints. It validates action shape in the server service and returns JSON `{status, data?, revision?}` or `{status:"error", code}`. Disabled writes return `feature_disabled`, `persistence_disabled`, or `migration_required`; no route returns a simulated success. Actor resolution is server-side and runs only after feature gates.

## Capabilities

The domain defines but does not grant:

`player_identity.read_own`, `player_identity.manage_links`, `player_identity.manage_primary`, `player_identity.manage_visibility`, `player_identity.manage_alias`, `player_identity.support.read`, `player_identity.support.manage`, `player_identity.verify`, `player_identity.approve_high_risk`, and `player_identity.audit.read`.

The production resolver denies all. No role-table change exists, no client claim is trusted, and Alliance rank is not mapped to Forge permission.

## Stable result codes

- Authentication: `authentication_required`, `actor_not_resolved`.
- Links: `character_not_found`, `character_already_linked`, `character_not_linked`, `character_link_limit_reached`, `character_link_revoked`, `character_link_disputed`, `character_link_removed`, `character_link_verification_required`.
- Primary: `primary_character_missing`, `primary_character_invalid`, `primary_character_revoked`, `primary_character_disputed`, `primary_character_revision_conflict`.
- Active: `active_character_required`, `active_character_not_linked`, `active_character_revoked`, `active_character_disputed`, `active_character_not_verified`, `active_character_verification_expired`, `active_character_revision_conflict`, `active_character_operation_not_allowed`.
- Alias/visibility: `alias_invalid`, `alias_reserved`, `alias_unavailable`, `alias_collision`, `alias_private`, `projection_not_allowed`, `field_not_visible`, `visibility_invalid`.
- Support/integration: `approval_required`, `approver_must_differ`, `dispute_not_found`, `dispute_already_resolved`, `support_action_not_allowed`, `gift_eligibility_unavailable`, `attribution_unavailable`, `showcase_projection_unavailable`.
- System: `feature_disabled`, `persistence_disabled`, `migration_required`, `stale_revision`, `conflict`, `invalid_request`, `unavailable`, `operation_not_supported`.

UI copy is kept outside these codes.

## Domain events

The immutable local event union covers link proposal/lifecycle, Primary and Active decisions, visibility, alias lifecycle, verification lifecycle, support cases/decisions, high-risk approvals, and Hero Showcase changes. Metadata rejects credentials, evidence, proof, tokens, raw IDs and secrets. `VerificationGranted` requires an explicit synthetic-test marker and is never emitted by a production route. Events are not externally published.

## Gift Centre adapter

The recommended single boundary is `PlayerIdentityIntegrationService.resolveGiftEligibility`. It exposes actor resolution, exact requested/Active character resolution, link state, verification state/expiry, dispute/revocation, identity revision, provider-ID projection availability, reason codes and a safe display summary. It excludes consent, credentials, signing, transport, redemption, retries and provider outcomes.

Codex B’s current boolean contract may temporarily call `toLegacyGiftBoolean`. It returns true only for a resolved, linked, exact Active, verified and reason-free result. This is a lossy compatibility bridge and should be deprecated after Codex B consumes reasoned results. No Codex B file was modified.

## Art Studio adapter

`resolveArtAttribution` returns only opaque public alias, allowed public display/avatar/Kingdom/Alliance fields, visibility revision and availability. It excludes all internal IDs, evidence, private settings and support history. No Codex D file was modified.

## Hero boundary

The identity request/projection contracts contain selected Hero keys, ordering, claimed progression and revision. They do not redefine Hero facts, publish skill data or store Editorial guidance. No Codex A file was modified.
