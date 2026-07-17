import type {
  AuthenticatedForgeActor,
} from "./actors.js"
import type {
  CharacterLink,
  CharacterVerificationSummary,
} from "./contracts.js"
import type {
  CharacterLinkId,
  ForgeUserId,
  GameCharacterId,
  PlayerIdentityRevision,
} from "./identifiers.js"
import type {
  PlayerIdentityResultCode,
} from "./resultCodes.js"

export interface ActiveCharacterRequest {
  readonly actor: AuthenticatedForgeActor
  readonly requestedCharacterId?: GameCharacterId
  readonly requestedOperation: string
  readonly expectedIdentityRevision?: PlayerIdentityRevision
}

export interface ResolvedActiveCharacterContext {
  readonly forgeUserId: ForgeUserId
  readonly characterId: GameCharacterId
  readonly characterLinkId: CharacterLinkId
  readonly identityRevision: PlayerIdentityRevision
  readonly verification: CharacterVerificationSummary
}

export type ActiveCharacterResolutionOutcome =
  | "resolved"
  | "character_required"
  | "character_not_linked"
  | "character_revoked"
  | "character_disputed"
  | "character_not_verified"
  | "verification_expired"
  | "revision_conflict"
  | "operation_not_allowed"

export type ActiveCharacterResolutionResult =
  | {
      readonly outcome: "resolved"
      readonly resultCode?: never
      readonly context: ResolvedActiveCharacterContext
    }
  | {
      readonly outcome: Exclude<ActiveCharacterResolutionOutcome, "resolved">
      readonly resultCode: PlayerIdentityResultCode
    }

export interface CharacterLinkLookupResult {
  readonly link?: CharacterLink
  readonly identityRevision: PlayerIdentityRevision
}

export interface ActiveCharacterOperationDecision {
  readonly allowed: boolean
  readonly requiresVerifiedCharacter: boolean
}

export interface ActiveCharacterOperationPolicy {
  evaluateOperation(input: {
    readonly actor: AuthenticatedForgeActor
    readonly operation: string
    readonly link: CharacterLink
  }): Promise<ActiveCharacterOperationDecision>
}

export interface ActiveCharacterResolver {
  resolveActiveCharacter(
    request: ActiveCharacterRequest,
  ): Promise<ActiveCharacterResolutionResult>
}
