import type {
  ActorResolutionResult,
  ActorResolver,
  ForgeGlobalRole,
  ResolvedForgeActor,
} from "../../shared/domains/player-identity/actors.js"
import type {
  AllianceId,
  ForgeUserId,
} from "../../shared/domains/player-identity/identifiers.js"

export interface AuthenticatedForgeIdentity {
  readonly forgeUserId: ForgeUserId
  readonly globalRoles: readonly ForgeGlobalRole[]
}

export interface ForgeCredentialAuthenticator {
  authenticateCredential(
    credential: string,
  ): Promise<AuthenticatedForgeIdentity | undefined>
}

export type ServerActorClassification =
  | {
      readonly kind: "authenticated_user"
    }
  | {
      readonly kind: "support"
      readonly supportGrantReference: string
    }
  | {
      readonly kind: "administrator"
    }
  | {
      readonly kind: "alliance_resource_candidate"
      readonly allianceId: AllianceId
    }

export interface ServerActorClassifier {
  classifyActor(input: {
    readonly identity: AuthenticatedForgeIdentity
    readonly requestedAllianceContext?: AllianceId
  }): Promise<ServerActorClassification>
}

export interface ServerActorResolverDependencies {
  readonly authenticator: ForgeCredentialAuthenticator
  readonly classifier: ServerActorClassifier
  readonly requestReader: ServerActorRequestReader
}

export interface ServerActorResolutionRequest {
  readonly authorizationCredential?: string
  readonly requestedAllianceContext?: AllianceId
}

export interface ServerActorRequestReader {
  readRequestContext(
    requestContext: unknown,
  ): ServerActorResolutionRequest | undefined
}

export function createServerActorResolver(
  dependencies: ServerActorResolverDependencies,
): ActorResolver {
  return {
    async resolveActor(
      requestContext: unknown,
    ): Promise<ActorResolutionResult> {
      const request = dependencies.requestReader.readRequestContext(
        requestContext,
      )

      if (!request) {
        return {
          outcome: "actor_not_resolved",
        }
      }

      if (!request.authorizationCredential) {
        return {
          outcome: "resolved",
          actor: {
            kind: "anonymous",
          },
        }
      }

      const identity = await dependencies.authenticator.authenticateCredential(
        request.authorizationCredential,
      )

      if (!identity) {
        return {
          outcome: "actor_not_resolved",
        }
      }

      const classification = await dependencies.classifier.classifyActor({
        identity,
        requestedAllianceContext: request.requestedAllianceContext,
      })
      const actor: ResolvedForgeActor = {
        ...identity,
        ...classification,
      }

      return {
        outcome: "resolved",
        actor,
      }
    },
  }
}
