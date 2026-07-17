declare const playerIdentityIdentifierBrand: unique symbol

type PlayerIdentityIdentifier<Name extends string> = string & {
  readonly [playerIdentityIdentifierBrand]: Name
}

declare const playerIdentityRevisionBrand: unique symbol

export type ForgeUserId = PlayerIdentityIdentifier<"ForgeUserId">
export type GameCharacterId = PlayerIdentityIdentifier<"GameCharacterId">
export type CharacterLinkId = PlayerIdentityIdentifier<"CharacterLinkId">
export type PublicPlayerAlias = PlayerIdentityIdentifier<"PublicPlayerAlias">
export type KingdomId = PlayerIdentityIdentifier<"KingdomId">
export type AllianceId = PlayerIdentityIdentifier<"AllianceId">
export type VerificationRecordId = PlayerIdentityIdentifier<"VerificationRecordId">
export type PlayerIdentityEventId = PlayerIdentityIdentifier<"PlayerIdentityEventId">
export type PlayerIdentityRevision = number & {
  readonly [playerIdentityRevisionBrand]: "PlayerIdentityRevision"
}
