import type { VercelRequest } from "@vercel/node"
import {
  denyAllPlayerIdentityCapabilities,
  resolvePlayerIdentityFeatureFlags,
} from "../../shared/domains/player-identity/index.js"
import type {
  ActiveCharacterResolutionResult,
  ActiveCharacterResolver,
  AuthenticatedForgeActor,
  ForgeUserId,
  PlayerIdentityCapabilityResolver,
  PlayerIdentityFeatureFlags,
  PlayerIdentityStore,
} from "../../shared/domains/player-identity/index.js"
import { requireForgeActor } from "../auth/requireForgeActor.js"
import { PlayerIdentityIntegrationService } from "./integrations.js"
import { DisabledProductionPlayerIdentityStore } from "./repositories.js"
import { PlayerIdentityService } from "./service.js"
import { PlayerIdentitySupportService } from "./supportService.js"

const disabledActiveResolver: ActiveCharacterResolver = {
  async resolveActiveCharacter(): Promise<ActiveCharacterResolutionResult> {
    return { outcome: "operation_not_allowed", resultCode: "feature_disabled" }
  },
}

export interface PlayerIdentityRuntime {
  readonly flags: PlayerIdentityFeatureFlags
  readonly store: PlayerIdentityStore
  readonly capabilities: PlayerIdentityCapabilityResolver
  readonly identity: PlayerIdentityService
  readonly integrations: PlayerIdentityIntegrationService
  readonly support: PlayerIdentitySupportService
  resolveActor(request: VercelRequest): Promise<AuthenticatedForgeActor>
}

export function createPlayerIdentityRuntime(input?: {
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly store?: PlayerIdentityStore
  readonly capabilities?: PlayerIdentityCapabilityResolver
  readonly activeCharacterResolver?: ActiveCharacterResolver
  readonly resolveActor?: PlayerIdentityRuntime["resolveActor"]
}): PlayerIdentityRuntime {
  const flags = resolvePlayerIdentityFeatureFlags(input?.environment ?? process.env)
  const store = input?.store ?? new DisabledProductionPlayerIdentityStore()
  const capabilities = input?.capabilities ?? denyAllPlayerIdentityCapabilities
  const activeCharacterResolver = input?.activeCharacterResolver ?? disabledActiveResolver
  const identity = new PlayerIdentityService({ store, flags, capabilities, activeCharacterResolver })
  const integrations = new PlayerIdentityIntegrationService(store, flags)
  const support = new PlayerIdentitySupportService({ store, flags, capabilities })
  return {
    flags,
    store,
    capabilities,
    identity,
    integrations,
    support,
    resolveActor: input?.resolveActor ?? (async (request) => {
      const actor = await requireForgeActor(request)
      return {
        kind: actor.role === "admin" || actor.role === "owner" ? "administrator" : "authenticated_user",
        forgeUserId: actor.userId as ForgeUserId,
        globalRoles: actor.roles,
      }
    }),
  }
}

export const productionPlayerIdentityRuntime = createPlayerIdentityRuntime()
