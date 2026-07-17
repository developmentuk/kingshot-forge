import type {
  ArtStudioIdentityAttribution,
  ForgeUserId,
  GameCharacterId,
  GiftCentreIdentityResult,
  PlayerIdentityFeatureFlags,
  PlayerIdentityOperationResult,
  PlayerIdentityRevision,
  PlayerIdentityStore,
  PublicPlayerAlias,
} from "../../shared/domains/player-identity/index.js"

export class PlayerIdentityIntegrationService {
  constructor(
    private readonly store: PlayerIdentityStore,
    private readonly flags: PlayerIdentityFeatureFlags,
  ) {}

  async resolveGiftEligibility(input: {
    readonly forgeUserId: ForgeUserId
    readonly characterId: GameCharacterId
    readonly expectedRevision: PlayerIdentityRevision
  }): Promise<PlayerIdentityOperationResult<GiftCentreIdentityResult>> {
    if (!this.flags.ui || !this.flags.giftIntegration) {
      return { ok: false, code: "feature_disabled" }
    }
    const aggregate = await this.store.readAggregate(input.forgeUserId)
    if (!aggregate) return { ok: false, code: "migration_required" }
    const link = aggregate.links.find((candidate) => candidate.gameCharacterId === input.characterId)
    if (!link) return { ok: false, code: "gift_eligibility_unavailable" }
    const revisionMatches = aggregate.revision === input.expectedRevision
    const reasonCodes: GiftCentreIdentityResult["eligibilityReasonCodes"] = [
      ...(revisionMatches ? [] : ["stale_revision" as const]),
      ...(link.state === "revoked" ? ["character_link_revoked" as const] : []),
      ...(link.state === "disputed" ? ["character_link_disputed" as const] : []),
      ...(link.state === "removed" ? ["character_link_removed" as const] : []),
      ...(link.activeCharacterEligible ? [] : ["active_character_operation_not_allowed" as const]),
      "character_link_verification_required",
    ]
    return {
      ok: true,
      revision: aggregate.revision,
      value: {
        actorResolved: true,
        requestedCharacterResolved: true,
        characterLinked: link.state === "linked",
        characterActiveForRequest: link.state === "linked" && link.activeCharacterEligible && revisionMatches,
        verificationState: "unverified",
        disputeState: link.disputeState,
        revocationState: link.state === "removed" ? "removed" : link.state === "revoked" ? "revoked" : "current",
        identityRevision: aggregate.revision,
        providerPlayerIdProjectionAvailable: false,
        eligibilityReasonCodes: reasonCodes,
        display: { displayName: "Linked character" },
      },
    }
  }

  async resolveArtAttribution(alias: PublicPlayerAlias): Promise<PlayerIdentityOperationResult<ArtStudioIdentityAttribution>> {
    if (!this.flags.ui || !this.flags.artIntegration || !this.flags.publicProfiles) {
      return { ok: false, code: "feature_disabled" }
    }
    const publicPlayer = await this.store.readPublicProjection(alias)
    if (!publicPlayer) return { ok: false, code: "attribution_unavailable" }
    return {
      ok: true,
      revision: publicPlayer.visibility.revision,
      value: {
        publicAlias: publicPlayer.publicAlias,
        displayName: publicPlayer.displayName,
        avatarUrl: publicPlayer.avatar?.url,
        kingdomDisplayName: publicPlayer.kingdom?.displayName,
        allianceDisplayName: publicPlayer.alliance?.displayName,
        visibilityRevision: publicPlayer.visibility.revision,
        attributionAvailable: true,
      },
    }
  }

  static toLegacyGiftBoolean(result: PlayerIdentityOperationResult<GiftCentreIdentityResult>): boolean {
    return result.ok &&
      result.value.actorResolved &&
      result.value.requestedCharacterResolved &&
      result.value.characterLinked &&
      result.value.characterActiveForRequest &&
      result.value.verificationState === "verified" &&
      result.value.eligibilityReasonCodes.length === 0
  }
}
