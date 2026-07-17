import type {
  ActiveCharacterResolver,
  CharacterLinkLookupResult,
} from "./activeCharacter.js"
import type {
  ActorResolver,
} from "./actors.js"
import type {
  ArtStudioAttributionProjection,
  CharacterLink,
  CharacterOwnershipVerification,
  CharacterVerificationSummary,
  GiftCentreEligibilityProjection,
  PrivateAllianceSummary,
  PrivateKingdomSummary,
  PrivatePlayerProjection,
  PublicPlayerProjection,
} from "./contracts.js"
import type {
  PlayerIdentityDomainEvent,
} from "./events.js"
import type {
  AllianceId,
  CharacterLinkId,
  ForgeUserId,
  GameCharacterId,
  KingdomId,
  PlayerIdentityRevision,
  PublicPlayerAlias,
} from "./identifiers.js"

export interface PlayerIdentitySnapshot {
  readonly forgeUserId: ForgeUserId
  readonly publicAlias?: PublicPlayerAlias
  readonly revision: PlayerIdentityRevision
}

export interface PlayerIdentityRepository {
  findByForgeUserId(
    forgeUserId: ForgeUserId,
  ): Promise<PlayerIdentitySnapshot | undefined>
}

export interface CharacterLinkRepository {
  findLinkByUserAndCharacter(input: {
    readonly forgeUserId: ForgeUserId
    readonly gameCharacterId: GameCharacterId
  }): Promise<CharacterLinkLookupResult>

  listLinksByForgeUserId(
    forgeUserId: ForgeUserId,
  ): Promise<readonly CharacterLink[]>
}

export interface CharacterVerificationRepository {
  findCurrentByCharacterLinkId(
    characterLinkId: CharacterLinkId,
  ): Promise<CharacterVerificationSummary | undefined>

  findRecordByCharacterLinkId(
    characterLinkId: CharacterLinkId,
  ): Promise<CharacterOwnershipVerification | undefined>
}

export interface PrivatePlayerProjectionPort {
  projectForOwner(input: {
    readonly actorForgeUserId: ForgeUserId
    readonly ownerForgeUserId: ForgeUserId
  }): Promise<PrivatePlayerProjection | undefined>
}

export interface PublicPlayerProjectionPort {
  projectByPublicAlias(
    publicAlias: PublicPlayerAlias,
  ): Promise<PublicPlayerProjection | undefined>
}

export interface KingdomSummaryPort {
  findPrivateSummary(
    kingdomId: KingdomId,
  ): Promise<PrivateKingdomSummary | undefined>
}

export interface AllianceSummaryPort {
  findPrivateSummary(
    allianceId: AllianceId,
  ): Promise<PrivateAllianceSummary | undefined>
}

export interface PlayerIdentityAuditPort {
  append(event: PlayerIdentityDomainEvent): Promise<void>
}

export interface PlayerIdentityClock {
  now(): Date
}

export interface GiftCentreEligibilityProjectionPort {
  projectForActiveCharacter(input: {
    readonly forgeUserId: ForgeUserId
    readonly gameCharacterId: GameCharacterId
    readonly expectedIdentityRevision: PlayerIdentityRevision
  }): Promise<GiftCentreEligibilityProjection | undefined>
}

export interface ArtStudioAttributionProjectionPort {
  projectByPublicAlias(
    publicAlias: PublicPlayerAlias,
  ): Promise<ArtStudioAttributionProjection | undefined>
}

export interface PlayerIdentityPorts {
  readonly identities: PlayerIdentityRepository
  readonly characterLinks: CharacterLinkRepository
  readonly verifications: CharacterVerificationRepository
  readonly actorResolver: ActorResolver
  readonly activeCharacterResolver: ActiveCharacterResolver
  readonly privateProjection: PrivatePlayerProjectionPort
  readonly publicProjection: PublicPlayerProjectionPort
  readonly kingdoms: KingdomSummaryPort
  readonly alliances: AllianceSummaryPort
  readonly audit: PlayerIdentityAuditPort
  readonly clock: PlayerIdentityClock
}
