import type {
  CharacterLink,
  CharacterVerificationState,
  PlayerHeroShowcaseProjection,
  PlayerVisibilityMetadata,
  PrivatePlayerProjection,
  PublicPlayerProjection,
  SafeCharacterDisplaySummary,
} from "./contracts.js"
import type { PlayerIdentityDomainEvent } from "./events.js"
import type {
  CharacterLinkId,
  ForgeUserId,
  GameCharacterId,
  HighRiskApprovalId,
  LinkProposalId,
  PlayerIdentityRevision,
  PlayerSupportCaseId,
  PublicPlayerAlias,
} from "./identifiers.js"
import type { CharacterLimitConfiguration } from "./policies/characterLimitPolicy.js"
import type { PlayerIdentityResultCode } from "./resultCodes.js"

export type CharacterLinkProposalState = "proposed" | "withdrawn" | "accepted"

export interface CharacterLinkProposal {
  readonly id: LinkProposalId
  readonly forgeUserId: ForgeUserId
  readonly externalCharacterReference: string
  readonly displayName: string
  readonly state: CharacterLinkProposalState
  readonly verificationState: "unverified"
  readonly createdAt: string
  readonly revision: PlayerIdentityRevision
}

export interface CharacterLinkHistoryEntry {
  readonly linkId: CharacterLinkId
  readonly state: CharacterLink["state"]
  readonly disputeState: CharacterLink["disputeState"]
  readonly occurredAt: string
  readonly reasonCode: string
  readonly revision: PlayerIdentityRevision
}

export interface PublicAliasRecord {
  readonly forgeUserId: ForgeUserId
  readonly routingAlias?: PublicPlayerAlias
  readonly displayAlias?: string
  readonly enabled: boolean
  readonly revision: PlayerIdentityRevision
}

export type PlayerSupportCaseKind =
  | "link_dispute"
  | "revoked_link"
  | "stale_primary"
  | "alias_conflict"
  | "visibility_dispute"
  | "verification_dispute"
  | "migration_compatibility"
  | "revision_conflict"

export type PlayerSupportCaseState = "open" | "awaiting_information" | "approval_required" | "resolved"

export interface PlayerSupportCaseSummary {
  readonly id: PlayerSupportCaseId
  readonly kind: PlayerSupportCaseKind
  readonly state: PlayerSupportCaseState
  readonly safeTitle: string
  readonly openedAt: string
  readonly revision: PlayerIdentityRevision
}

export type HighRiskOperation =
  | "verification_grant"
  | "verification_restoration"
  | "disputed_link_restoration"
  | "character_limit_override"
  | "leadership_sensitive_restoration"
  | "migration_execution"
  | "public_identifier_exposure"

export interface HighRiskApprovalRequest {
  readonly id: HighRiskApprovalId
  readonly operation: HighRiskOperation
  readonly initiatorForgeUserId: ForgeUserId
  readonly approverForgeUserId?: ForgeUserId
  readonly reason: string
  readonly scope: string
  readonly expiresAt?: string
  readonly expectedRevision: PlayerIdentityRevision
  readonly state: "requested" | "approved" | "rejected" | "expired"
}

export interface PlayerIdentityAggregate {
  readonly forgeUserId: ForgeUserId
  readonly revision: PlayerIdentityRevision
  readonly links: readonly CharacterLink[]
  readonly linkProposals: readonly CharacterLinkProposal[]
  readonly linkHistory: readonly CharacterLinkHistoryEntry[]
  readonly visibility: PlayerVisibilityMetadata
  readonly alias: PublicAliasRecord
  readonly heroShowcase: PlayerHeroShowcaseProjection
  readonly characterLimit: CharacterLimitConfiguration
}

export type PlayerIdentityOperationResult<Value = undefined> =
  | {
      readonly ok: true
      readonly value: Value
      readonly revision: PlayerIdentityRevision
    }
  | {
      readonly ok: false
      readonly code: PlayerIdentityResultCode
    }

export interface PlayerIdentityStore {
  readAggregate(forgeUserId: ForgeUserId): Promise<PlayerIdentityAggregate | undefined>
  readPrivateProjection(forgeUserId: ForgeUserId): Promise<PrivatePlayerProjection | undefined>
  readPublicProjection(alias: PublicPlayerAlias): Promise<PublicPlayerProjection | undefined>
  findAlias(alias: PublicPlayerAlias): Promise<PublicAliasRecord | undefined>
  listSupportCases(): Promise<readonly PlayerSupportCaseSummary[]>
  readSupportCase(caseId: PlayerSupportCaseId): Promise<PlayerSupportCaseSummary | undefined>
  saveAggregate(input: {
    readonly aggregate: PlayerIdentityAggregate
    readonly expectedRevision: PlayerIdentityRevision
    readonly event: PlayerIdentityDomainEvent
  }): Promise<PlayerIdentityOperationResult<PlayerIdentityAggregate>>
  appendAudit(event: PlayerIdentityDomainEvent): Promise<PlayerIdentityOperationResult>
}

export interface GiftCentreIdentityResult {
  readonly actorResolved: boolean
  readonly requestedCharacterResolved: boolean
  readonly characterLinked: boolean
  readonly characterActiveForRequest: boolean
  readonly verificationState: CharacterVerificationState
  readonly verificationExpiresAt?: string
  readonly disputeState: CharacterLink["disputeState"]
  readonly revocationState: "current" | "revoked" | "removed"
  readonly identityRevision: PlayerIdentityRevision
  readonly providerPlayerIdProjectionAvailable: boolean
  readonly eligibilityReasonCodes: readonly PlayerIdentityResultCode[]
  readonly display: SafeCharacterDisplaySummary
}

export interface ArtStudioIdentityAttribution {
  readonly publicAlias: PublicPlayerAlias
  readonly displayName?: string
  readonly avatarUrl?: string
  readonly kingdomDisplayName?: string
  readonly allianceDisplayName?: string
  readonly visibilityRevision: PlayerIdentityRevision
  readonly attributionAvailable: boolean
}

export interface HeroShowcaseIdentityRequest {
  readonly forgeUserId: ForgeUserId
  readonly characterId: GameCharacterId
  readonly selectedHeroKeys: readonly string[]
  readonly expectedRevision: PlayerIdentityRevision
}
