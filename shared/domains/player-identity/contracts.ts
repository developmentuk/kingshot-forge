import type {
  AllianceId,
  CharacterLinkId,
  ForgeUserId,
  GameCharacterId,
  KingdomId,
  PlayerIdentityRevision,
  PublicPlayerAlias,
  VerificationRecordId,
} from "./identifiers.js"

export type CharacterLinkState =
  | "linked"
  | "revoked"
  | "disputed"
  | "removed"

export type CharacterLinkDisputeState =
  | "none"
  | "open"
  | "resolved"

export type CharacterVerificationState =
  | "unverified"
  | "pending"
  | "verified"
  | "expired"
  | "revoked"
  | "disputed"
  | "rejected"

export type VerificationAssurance =
  | "none"
  | "low"
  | "moderate"
  | "high"

export interface ForgeUserIdentity {
  readonly id: ForgeUserId
}

export interface GameCharacterIdentity {
  readonly id: GameCharacterId
  readonly displayName: string
}

export interface CharacterLink {
  readonly id: CharacterLinkId
  readonly forgeUserId: ForgeUserId
  readonly gameCharacterId: GameCharacterId
  readonly state: CharacterLinkState
  readonly createdAt: string
  readonly revokedAt?: string
  readonly removedAt?: string
  readonly disputeState: CharacterLinkDisputeState
  readonly disputedAt?: string
  readonly revision: PlayerIdentityRevision
  readonly isPrimary: boolean
  readonly activeCharacterEligible: boolean
  readonly sourceReference?: string
  readonly evidenceReference?: string
}

export interface CharacterOwnershipVerification {
  readonly id: VerificationRecordId
  readonly characterLinkId: CharacterLinkId
  readonly state: CharacterVerificationState
  readonly methodIdentifier?: string
  readonly providerIdentifier?: string
  readonly evidenceReference?: string
  readonly issuedAt?: string
  readonly expiresAt?: string
  readonly revokedAt?: string
  readonly disputedAt?: string
  readonly revision: PlayerIdentityRevision
  readonly reasonCodes: readonly string[]
  readonly assurance: VerificationAssurance
}

export interface CharacterVerificationSummary {
  readonly state: CharacterVerificationState
  readonly expiresAt?: string
  readonly revokedAt?: string
  readonly disputedAt?: string
  readonly revision: PlayerIdentityRevision
  readonly assurance: VerificationAssurance
}

export interface PublicAvatarProjection {
  readonly url: string
  readonly altText?: string
}

export interface SafeCharacterDisplaySummary {
  readonly displayName: string
  readonly avatar?: PublicAvatarProjection
}

export interface PrivateKingdomSummary {
  readonly kingdomId: KingdomId
  readonly displayName: string
  readonly kingdomNumber?: number
}

export interface PrivateAllianceSummary {
  readonly allianceId: AllianceId
  readonly displayName: string
  readonly tag?: string
}

export interface PublicKingdomSummary {
  readonly displayName: string
  readonly kingdomNumber?: number
}

export interface PublicAllianceSummary {
  readonly displayName: string
  readonly tag?: string
}

export interface PrivateLinkedCharacterProjection {
  readonly characterId: GameCharacterId
  readonly linkId: CharacterLinkId
  readonly display: SafeCharacterDisplaySummary
  readonly linkState: CharacterLinkState
  readonly isPrimary: boolean
  readonly activeCharacterEligible: boolean
  readonly revision: PlayerIdentityRevision
  readonly verification: CharacterVerificationSummary
  readonly kingdom?: PrivateKingdomSummary
  readonly alliance?: PrivateAllianceSummary
}

export interface PrivatePlayerProjection {
  readonly ownerForgeUserId: ForgeUserId
  readonly linkedCharacters: readonly PrivateLinkedCharacterProjection[]
  readonly identityRevision: PlayerIdentityRevision
}

export const PUBLIC_PLAYER_FIELDS = [
  "publicAlias",
  "displayName",
  "avatar",
  "kingdom",
  "alliance",
  "heroShowcase",
  "visibility",
] as const

export type PublicPlayerField =
  (typeof PUBLIC_PLAYER_FIELDS)[number]

export type PlayerVisibilityAudience =
  | "private"
  | "selected_fields"
  | "authenticated_forge_users"
  | "alliance"
  | "public"

export interface PlayerVisibilityMetadata {
  readonly audience: PlayerVisibilityAudience
  readonly visibleFields: readonly PublicPlayerField[]
  readonly revision: PlayerIdentityRevision
}

export interface HeroProgressionClaimProjection {
  readonly heroKey: string
  readonly level?: number
  readonly power?: number
  readonly starLevel?: number
}

export interface HeroShowcaseEntryProjection {
  readonly heroKey: string
  readonly displayOrder: number
  readonly progressionClaim?: HeroProgressionClaimProjection
}

export interface PlayerHeroShowcaseProjection {
  readonly entries: readonly HeroShowcaseEntryProjection[]
  readonly selectionRevision: PlayerIdentityRevision
  readonly visibilityRevision: PlayerIdentityRevision
}

export interface PublicPlayerProjection {
  readonly publicAlias: PublicPlayerAlias
  readonly displayName?: string
  readonly avatar?: PublicAvatarProjection
  readonly kingdom?: PublicKingdomSummary
  readonly alliance?: PublicAllianceSummary
  readonly heroShowcase?: PlayerHeroShowcaseProjection
  readonly visibility: PlayerVisibilityMetadata
}

export type ForgeActorRelationship =
  | "owner"
  | "support"
  | "administrator"
  | "resource_scoped_candidate"
  | "none"

export type ActiveCharacterStatus =
  | "active"
  | "inactive"
  | "rejected"

export type CharacterAuthorizationState =
  | "authorised"
  | "not_authorised"
  | "unknown"

export interface GiftCentreEligibilityProjection {
  readonly characterId: GameCharacterId
  readonly actorRelationship: ForgeActorRelationship
  readonly activeCharacterStatus: ActiveCharacterStatus
  readonly authorizationState: CharacterAuthorizationState
  readonly verificationState: CharacterVerificationState
  readonly verificationExpiresAt?: string
  readonly linkState: CharacterLinkState
  readonly providerPlayerIdProjectionAvailable: boolean
  readonly identityRevision: PlayerIdentityRevision
  readonly display: SafeCharacterDisplaySummary
}

export interface ArtStudioAttributionProjection {
  readonly publicAlias: PublicPlayerAlias
  readonly displayName?: string
  readonly avatar?: PublicAvatarProjection
  readonly kingdom?: PublicKingdomSummary
  readonly alliance?: PublicAllianceSummary
  readonly visibilityRevision: PlayerIdentityRevision
}

export interface HeroShowcaseBoundary {
  readonly characterId: GameCharacterId
  readonly ownershipClaimState: "unclaimed" | "claimed" | "disputed"
  readonly progressionClaims: readonly HeroProgressionClaimProjection[]
  readonly publicSelection: PlayerHeroShowcaseProjection
  readonly canonicalHeroFactsOwner: "hero_domain"
  readonly editorialRecommendationsOwner: "editorial_domain"
}
