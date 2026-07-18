# Player Identity vertical slice

**Status:** The broader Player Identity contract remains feature-gated. Release 0.7.5 uses the existing `player_accounts` relationship for a narrow, server-validated Kingshot lookup trust signal.

## Release 0.7.5 verification trust model

Forge considers a player **verified** when an authenticated Forge user deliberately links a Player ID, the trusted server path successfully resolves that ID through the Kingshot player service, and Forge creates or confirms the relationship for that user. This verifies that the Player ID is valid and linked to the authenticated Forge account; it is not cryptographic proof, exclusive legal ownership proof, password verification or official Century Games account authentication.

The canonical states for this release are:

- **Unlinked:** no player relationship exists.
- **Linked and verified:** the trusted server lookup succeeded and recorded `verification_status=verified`, `verification_method=kingshot_player_lookup` and a server timestamp.
- **Invalid or stale:** lookup failed or the existing legacy link requires revalidation.

Legacy `linked` rows are not bulk-promoted. They must be revalidated through the same server path.

## Architecture

Player Identity is a server-authoritative bounded domain. Forge User, Game Character, Character Link, and Character Ownership Verification are separate concepts. Browser routes consume server APIs; the new browser components do not import a privileged Supabase client. The default runtime combines default-OFF gates, a default-deny capability resolver, and `DisabledProductionPlayerIdentityStore`. It cannot report a successful write.

The deterministic `InMemoryPlayerIdentityStore` is marked synthetic and is used by tests only. The UI preview is compiled only when both Vite test mode and the exact marker `VITE_PLAYER_IDENTITY_SYNTHETIC_FIXTURES=synthetic_unit_test` are present. Production routes contain no fixture import.

## Workflows

### Linked characters

The legacy player-facing link flow validates the Player ID in the browser for preview only; the successful link is repeated and committed by `/api/player/account` after authenticated server-side lookup. Client payloads cannot supply identity fields or verification fields. Duplicate, stale, revoked, disputed and removed states use stable result codes.

### Primary Character

A change requires an exact linked target and expected identity revision. Revoked and disputed targets are rejected. There is one Primary where linked characters exist; no sensitive failure silently chooses a replacement. Primary is never an implicit Active context.

### Active Character

The selector is per component/tab state and is not placed in local storage. Every sensitive request carries exact character, operation, and expected identity revision to the server resolver. Missing, unlinked, revoked, disputed, expired, stale and operation-ineligible requests receive stable rejection results.

### Alias, visibility and projections

Aliases have an opaque lowercase routing form, optional Unicode display form, reserved-word checks, collision checks and revisions. Proposals do not enable public visibility. Visibility is default deny and uses explicit field allowlists. Unknown or internal fields are hidden. Public projections exclude Forge User IDs, raw Player IDs, Game Character IDs, Character Link IDs, verification evidence, support activity, Gift eligibility and private membership history.

### Hero Showcase

Player Identity owns only selected Hero references, ordering, user-claimed progression context, visibility and revisions. Hero owns canonical facts; Editorial owns advice. Claims are never automatically verified.

## Routes and states

| Surface | Route | Disabled/default state |
| --- | --- | --- |
| Private profile | `/my-forge/player-identity` | Release-disabled notice |
| Public profile | `/players/:publicAlias` | Public profiles disabled/private/unavailable |
| Support queue | `/admin/player-identity` | Support tools disabled/capability denied |
| Support case | `/admin/player-identity/:caseId` | Support tools disabled/capability denied |

The responsive layout collapses to one column, maintains 44px controls, contains wide tables in internal scrolling regions, avoids page-level horizontal overflow and uses visible focus. Statuses include text and symbols rather than colour alone. Validation and Active-selection results use live regions. The approval dialog traps focus, closes on Escape and restores focus.

## Analytics

`src/platform/analytics/forgeAnalytics.ts` is the single abstraction. It declares measurement ID `G-8L3HYETN51` but never initialises analytics. It calls an already-present host `gtag` only and rejects privacy-sensitive parameter keys. Player components send only coarse surface/outcome metadata—never aliases, IDs, evidence, support notes, private visibility values, or audit references.

## Feature gates

Every server flag requires the exact string `enabled`; browser equivalents use `VITE_` prefixes. Arbitrary truthy strings are OFF.

| Area | Server environment key | Default |
| --- | --- | --- |
| Player Identity UI | `PLAYER_IDENTITY_UI` | OFF |
| Linked characters | `PLAYER_IDENTITY_LINKED_CHARACTERS` | OFF |
| Primary | `PLAYER_IDENTITY_PRIMARY_CHARACTER` | OFF |
| Active context | `PLAYER_IDENTITY_ACTIVE_CHARACTER` | OFF |
| Visibility | `PLAYER_IDENTITY_VISIBILITY` | OFF |
| Public profiles | `PLAYER_IDENTITY_PUBLIC_PROFILES` | OFF |
| Support tools | `PLAYER_IDENTITY_SUPPORT_TOOLS` | OFF |
| Persistence | `PLAYER_IDENTITY_PERSISTENCE` | OFF |
| Ownership verification | `PLAYER_IDENTITY_VERIFICATION` | OFF |
| Gift integration | `PLAYER_IDENTITY_GIFT_INTEGRATION` | OFF |
| Art integration | `PLAYER_IDENTITY_ART_INTEGRATION` | OFF |
| Hero integration | `PLAYER_IDENTITY_HERO_INTEGRATION` | OFF |

## Accessibility and mobile release checklist

- Keyboard selection uses native radio, select, checkbox and button semantics.
- Primary and Active labels are distinct; Active rejection is announced live.
- Validation summaries are assertive; save previews are polite.
- Dialog focus is trapped, Escape closes and the trigger regains focus.
- Touch targets are at least 44px and focus outlines are high contrast.
- Status meaning is present in text; no colour-only state exists.
- Tables scroll internally on narrow screens; layouts become single column below 860px.
- Public, private, queue and detail routes are browser-checked at desktop and mobile widths before enablement.
