import type {
  AllianceId,
  ForgeUserId,
} from "./identifiers.js"

export type ForgeGlobalRole =
  | "owner"
  | "admin"
  | "moderator"
  | "content_creator"
  | "beta_tester"
  | "contributor"
  | "viewer"

interface AuthenticatedActorIdentity {
  readonly forgeUserId: ForgeUserId
  readonly globalRoles: readonly ForgeGlobalRole[]
}

export type ResolvedForgeActor =
  | {
      readonly kind: "anonymous"
    }
  | ({
      readonly kind: "authenticated_user"
    } & AuthenticatedActorIdentity)
  | ({
      readonly kind: "support"
      readonly supportGrantReference: string
    } & AuthenticatedActorIdentity)
  | ({
      readonly kind: "administrator"
    } & AuthenticatedActorIdentity)
  | ({
      readonly kind: "alliance_resource_candidate"
      readonly allianceId: AllianceId
    } & AuthenticatedActorIdentity)

export type AuthenticatedForgeActor = Exclude<
  ResolvedForgeActor,
  { readonly kind: "anonymous" }
>

export type ActorResolutionResult =
  | {
      readonly outcome: "resolved"
      readonly actor: ResolvedForgeActor
    }
  | {
      readonly outcome: "actor_not_resolved"
    }

export interface ActorResolver {
  resolveActor(
    requestContext: unknown,
  ): Promise<ActorResolutionResult>
}
