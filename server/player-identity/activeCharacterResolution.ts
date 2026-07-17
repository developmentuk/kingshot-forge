import type {
  ActiveCharacterOperationPolicy,
  ActiveCharacterRequest,
  ActiveCharacterResolutionResult,
  ActiveCharacterResolver,
} from "../../shared/domains/player-identity/activeCharacter.js"
import type {
  CharacterVerificationSummary,
} from "../../shared/domains/player-identity/contracts.js"
import type {
  CharacterLinkRepository,
  CharacterVerificationRepository,
  PlayerIdentityClock,
} from "../../shared/domains/player-identity/ports.js"

export interface ServerActiveCharacterResolverDependencies {
  readonly characterLinks: CharacterLinkRepository
  readonly verifications: CharacterVerificationRepository
  readonly operationPolicy: ActiveCharacterOperationPolicy
  readonly clock: PlayerIdentityClock
}

export function createServerActiveCharacterResolver(
  dependencies: ServerActiveCharacterResolverDependencies,
): ActiveCharacterResolver {
  return {
    async resolveActiveCharacter(
      request: ActiveCharacterRequest,
    ): Promise<ActiveCharacterResolutionResult> {
      if (!request.requestedCharacterId) {
        return {
          outcome: "character_required",
          resultCode: "active_character_required",
        }
      }

      const lookup = await dependencies.characterLinks
        .findLinkByUserAndCharacter({
          forgeUserId: request.actor.forgeUserId,
          gameCharacterId: request.requestedCharacterId,
        })
      const link = lookup.link

      if (!link || link.state === "removed") {
        return {
          outcome: "character_not_linked",
          resultCode: "active_character_not_linked",
        }
      }

      if (link.state === "revoked") {
        return {
          outcome: "character_revoked",
          resultCode: "active_character_revoked",
        }
      }

      if (link.state === "disputed") {
        return {
          outcome: "character_disputed",
          resultCode: "active_character_disputed",
        }
      }

      if (
        request.expectedIdentityRevision !== undefined &&
        request.expectedIdentityRevision !== lookup.identityRevision
      ) {
        return {
          outcome: "revision_conflict",
          resultCode: "active_character_revision_conflict",
        }
      }

      if (!link.activeCharacterEligible) {
        return {
          outcome: "operation_not_allowed",
          resultCode: "operation_not_supported",
        }
      }

      const operation = await dependencies.operationPolicy.evaluateOperation({
        actor: request.actor,
        operation: request.requestedOperation,
        link,
      })

      if (!operation.allowed) {
        return {
          outcome: "operation_not_allowed",
          resultCode: "operation_not_supported",
        }
      }

      const verification = await dependencies.verifications
        .findCurrentByCharacterLinkId(link.id)

      if (operation.requiresVerifiedCharacter) {
        if (
          verification?.state === "verified" &&
          verification.expiresAt === undefined
        ) {
          return {
            outcome: "character_not_verified",
            resultCode: "active_character_not_verified",
          }
        }

        const expiryTimestamp = verification?.expiresAt === undefined
          ? undefined
          : Date.parse(verification.expiresAt)

        if (
          verification?.state === "verified" &&
          expiryTimestamp !== undefined &&
          !Number.isFinite(expiryTimestamp)
        ) {
          return {
            outcome: "character_not_verified",
            resultCode: "active_character_not_verified",
          }
        }

        if (
          verification?.state === "expired" ||
          (
            verification?.state === "verified" &&
            expiryTimestamp !== undefined &&
            expiryTimestamp <= dependencies.clock.now().getTime()
          )
        ) {
          return {
            outcome: "verification_expired",
            resultCode: "active_character_verification_expired",
          }
        }

        if (verification?.state !== "verified") {
          return {
            outcome: "character_not_verified",
            resultCode: "active_character_not_verified",
          }
        }
      }

      const safeVerification: CharacterVerificationSummary = verification ?? {
        state: "unverified",
        revision: link.revision,
        assurance: "none",
      }

      return {
        outcome: "resolved",
        context: {
          forgeUserId: request.actor.forgeUserId,
          characterId: link.gameCharacterId,
          characterLinkId: link.id,
          identityRevision: lookup.identityRevision,
          verification: safeVerification,
        },
      }
    },
  }
}
