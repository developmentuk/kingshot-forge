import {
  createImmutablePlayerIdentityEvent,
  evaluateCharacterLimit,
  evaluatePrimaryCharacterChange,
  validateDisplayName,
  validateExternalCharacterIdentifier,
  validatePublicPlayerAlias,
  validateVisibilitySelection,
} from "../../shared/domains/player-identity/index.js"
import type {
  ActiveCharacterRequest,
  ActiveCharacterResolutionResult,
  ActiveCharacterResolver,
  AuthenticatedForgeActor,
  CharacterLink,
  CharacterLinkId,
  CharacterLinkProposal,
  LinkProposalId,
  PlayerHeroShowcaseProjection,
  PlayerIdentityCapability,
  PlayerIdentityCapabilityResolver,
  PlayerIdentityDomainEvent,
  PlayerIdentityEventId,
  PlayerIdentityFeature,
  PlayerIdentityFeatureFlags,
  PlayerIdentityOperationResult,
  PlayerIdentityRevision,
  PlayerIdentityResultCode,
  PlayerIdentityStore,
  PlayerVisibilityAudience,
  PrivatePlayerProjection,
  PublicPlayerAlias,
  PublicPlayerField,
  PublicPlayerProjection,
} from "../../shared/domains/player-identity/index.js"

const RESERVED_ALIASES = new Set([
  "admin000", "api00000", "account0", "players0", "support0", "myforge0",
])

export interface PlayerIdentityServiceDependencies {
  readonly store: PlayerIdentityStore
  readonly flags: PlayerIdentityFeatureFlags
  readonly capabilities: PlayerIdentityCapabilityResolver
  readonly activeCharacterResolver: ActiveCharacterResolver
  readonly now?: () => Date
}

type OperationFailure = {
  readonly ok: false
  readonly code: PlayerIdentityResultCode
}

function failure(code: PlayerIdentityResultCode): OperationFailure {
  return { ok: false, code }
}

function failureFromResult(result: PlayerIdentityOperationResult<unknown>): OperationFailure {
  return "code" in result ? failure(result.code) : failure("invalid_request")
}

function nextRevision(revision: PlayerIdentityRevision): PlayerIdentityRevision {
  return (revision + 1) as PlayerIdentityRevision
}

function eventId(now: Date): PlayerIdentityEventId {
  return `pievent_${now.getTime().toString(36).padStart(8, "0")}` as PlayerIdentityEventId
}

function createEvent(input: {
  readonly name: PlayerIdentityDomainEvent["name"]
  readonly identityRevision: PlayerIdentityRevision
  readonly actorForgeUserId?: AuthenticatedForgeActor["forgeUserId"]
  readonly characterLinkId?: CharacterLinkId
  readonly visibilityAudience?: PlayerVisibilityAudience
  readonly metadata?: PlayerIdentityDomainEvent["metadata"]
  readonly now: Date
}): PlayerIdentityDomainEvent {
  return createImmutablePlayerIdentityEvent({
    ...input,
    eventId: eventId(input.now),
    occurredAt: input.now.toISOString(),
    metadata: input.metadata ?? {},
  } as PlayerIdentityDomainEvent)
}

export class PlayerIdentityService {
  readonly #now: () => Date

  constructor(private readonly dependencies: PlayerIdentityServiceDependencies) {
    this.#now = dependencies.now ?? (() => new Date())
  }

  #gate(feature: PlayerIdentityFeature, mutation = false): OperationFailure | undefined {
    if (!this.dependencies.flags[feature] || !this.dependencies.flags.ui) {
      return failure("feature_disabled")
    }
    if (mutation && !this.dependencies.flags.persistence) {
      return failure("persistence_disabled")
    }
    return undefined
  }

  async #authorize(actor: AuthenticatedForgeActor, capability: PlayerIdentityCapability): Promise<OperationFailure | undefined> {
    if (!await this.dependencies.capabilities.hasCapability({ forgeUserId: actor.forgeUserId, capability })) {
      return failure("operation_not_supported")
    }
    return undefined
  }

  async readOwn(actor: AuthenticatedForgeActor): Promise<PlayerIdentityOperationResult<PrivatePlayerProjection>> {
    const gate = this.#gate("ui")
    if (gate) return gate
    const denied = await this.#authorize(actor, "player_identity.read_own")
    if (denied) return denied
    const projection = await this.dependencies.store.readPrivateProjection(actor.forgeUserId)
    return projection
      ? { ok: true, value: projection, revision: projection.identityRevision }
      : failure("migration_required")
  }

  async readPublic(alias: PublicPlayerAlias): Promise<PlayerIdentityOperationResult<PublicPlayerProjection>> {
    const gate = this.#gate("publicProfiles")
    if (gate) return gate
    const validatedAlias = validatePublicPlayerAlias(alias)
    if (!validatedAlias.valid) return failure("alias_invalid")
    const projection = await this.dependencies.store.readPublicProjection(validatedAlias.value)
    return projection
      ? { ok: true, value: projection, revision: projection.visibility.revision }
      : failure("alias_private")
  }

  async proposeLink(actor: AuthenticatedForgeActor, input: {
    readonly externalCharacterReference: string
    readonly displayName: string
    readonly expectedRevision: PlayerIdentityRevision
  }): Promise<PlayerIdentityOperationResult<CharacterLinkProposal>> {
    const gate = this.#gate("linkedCharacters", true)
    if (gate) return gate
    const denied = await this.#authorize(actor, "player_identity.manage_links")
    if (denied) return denied
    const reference = validateExternalCharacterIdentifier(input.externalCharacterReference)
    const displayName = validateDisplayName(input.displayName)
    if (!reference.valid || !displayName.valid) return failure("invalid_request")
    const aggregate = await this.dependencies.store.readAggregate(actor.forgeUserId)
    if (!aggregate) return failure("migration_required")
    if (aggregate.revision !== input.expectedRevision) return failure("stale_revision")
    if (aggregate.linkProposals.some((proposal) => proposal.externalCharacterReference === reference.value && proposal.state === "proposed")) {
      return failure("character_already_linked")
    }
    const limit = evaluateCharacterLimit({
      currentLinkedCharacterCount: aggregate.links.filter((link) => link.state === "linked").length + aggregate.linkProposals.filter((proposal) => proposal.state === "proposed").length,
      configuration: aggregate.characterLimit,
    })
    if (limit.outcome === "limit_reached") return failure("character_link_limit_reached")
    if (limit.outcome === "invalid_configuration") return failure("invalid_request")
    if (limit.outcome === "override_required") return failure("approval_required")
    const now = this.#now()
    const revision = nextRevision(aggregate.revision)
    const proposal: CharacterLinkProposal = {
      id: `linkproposal_${now.getTime().toString(36)}` as LinkProposalId,
      forgeUserId: actor.forgeUserId,
      externalCharacterReference: reference.value,
      displayName: displayName.value,
      state: "proposed",
      verificationState: "unverified",
      createdAt: now.toISOString(),
      revision,
    }
    const updated = { ...aggregate, revision, linkProposals: [...aggregate.linkProposals, proposal] }
    const result = await this.dependencies.store.saveAggregate({
      aggregate: updated,
      expectedRevision: aggregate.revision,
      event: createEvent({ name: "CharacterLinkProposed", identityRevision: revision, actorForgeUserId: actor.forgeUserId, now }),
    })
    return result.ok ? { ok: true, value: proposal, revision } : failureFromResult(result)
  }

  async changeLinkState(actor: AuthenticatedForgeActor, input: {
    readonly linkId: CharacterLinkId
    readonly action: "revoke" | "dispute" | "remove"
    readonly expectedRevision: PlayerIdentityRevision
  }): Promise<PlayerIdentityOperationResult<CharacterLink>> {
    const gate = this.#gate("linkedCharacters", true)
    if (gate) return gate
    const denied = await this.#authorize(actor, "player_identity.manage_links")
    if (denied) return denied
    const aggregate = await this.dependencies.store.readAggregate(actor.forgeUserId)
    if (!aggregate) return failure("migration_required")
    if (aggregate.revision !== input.expectedRevision) return failure("stale_revision")
    const target = aggregate.links.find((link) => link.id === input.linkId)
    if (!target) return failure("character_not_linked")
    const now = this.#now()
    const revision = nextRevision(aggregate.revision)
    const state = input.action === "dispute" ? "disputed" : input.action === "remove" ? "removed" : "revoked"
    const updatedTarget: CharacterLink = {
      ...target,
      state,
      disputeState: input.action === "dispute" ? "open" : target.disputeState,
      disputedAt: input.action === "dispute" ? now.toISOString() : target.disputedAt,
      revokedAt: input.action === "revoke" ? now.toISOString() : target.revokedAt,
      removedAt: input.action === "remove" ? now.toISOString() : target.removedAt,
      isPrimary: false,
      activeCharacterEligible: false,
      revision,
    }
    const eventName = input.action === "dispute" ? "CharacterLinkDisputed" : input.action === "remove" ? "CharacterLinkRemoved" : "CharacterLinkRevoked"
    const updated = { ...aggregate, revision, links: aggregate.links.map((link) => link.id === target.id ? updatedTarget : link) }
    const result = await this.dependencies.store.saveAggregate({
      aggregate: updated,
      expectedRevision: aggregate.revision,
      event: createEvent({ name: eventName, identityRevision: revision, actorForgeUserId: actor.forgeUserId, characterLinkId: target.id, now }),
    })
    return result.ok ? { ok: true, value: updatedTarget, revision } : failureFromResult(result)
  }

  async selectPrimary(actor: AuthenticatedForgeActor, input: {
    readonly linkId: CharacterLinkId
    readonly expectedRevision: PlayerIdentityRevision
  }): Promise<PlayerIdentityOperationResult<CharacterLink>> {
    const gate = this.#gate("primaryCharacter", true)
    if (gate) return gate
    const denied = await this.#authorize(actor, "player_identity.manage_primary")
    if (denied) return denied
    const aggregate = await this.dependencies.store.readAggregate(actor.forgeUserId)
    if (!aggregate) return failure("migration_required")
    const decision = evaluatePrimaryCharacterChange({ links: aggregate.links, requestedCharacterLinkId: input.linkId, expectedIdentityRevision: input.expectedRevision, currentIdentityRevision: aggregate.revision })
    if (decision.outcome === "revision_conflict") return failure("primary_character_revision_conflict")
    if (decision.outcome === "target_revoked") return failure("primary_character_revoked")
    if (decision.outcome === "target_disputed") return failure("primary_character_disputed")
    if (decision.outcome !== "allowed" && decision.outcome !== "unchanged") return failure("primary_character_invalid")
    const target = aggregate.links.find((link) => link.id === input.linkId)
    if (!target) return failure("primary_character_invalid")
    if (decision.outcome === "unchanged") return { ok: true, value: target, revision: aggregate.revision }
    const now = this.#now()
    const revision = nextRevision(aggregate.revision)
    const links = aggregate.links.map((link) => ({ ...link, isPrimary: link.id === input.linkId, revision }))
    const selected = links.find((link) => link.id === input.linkId)!
    const result = await this.dependencies.store.saveAggregate({
      aggregate: { ...aggregate, revision, links },
      expectedRevision: aggregate.revision,
      event: createEvent({ name: "PrimaryCharacterChanged", identityRevision: revision, actorForgeUserId: actor.forgeUserId, characterLinkId: input.linkId, now }),
    })
    return result.ok ? { ok: true, value: selected, revision } : failureFromResult(result)
  }

  async selectActive(request: ActiveCharacterRequest): Promise<ActiveCharacterResolutionResult> {
    if (!this.dependencies.flags.ui || !this.dependencies.flags.activeCharacter) {
      return { outcome: "operation_not_allowed", resultCode: "feature_disabled" }
    }
    return this.dependencies.activeCharacterResolver.resolveActiveCharacter(request)
  }

  async updateVisibility(actor: AuthenticatedForgeActor, input: {
    readonly audience: PlayerVisibilityAudience
    readonly visibleFields: readonly PublicPlayerField[]
    readonly expectedRevision: PlayerIdentityRevision
  }): Promise<PlayerIdentityOperationResult> {
    const gate = this.#gate("visibility", true)
    if (gate) return gate
    const denied = await this.#authorize(actor, "player_identity.manage_visibility")
    if (denied) return denied
    const validation = validateVisibilitySelection(input)
    if (!validation.valid) return failure("visibility_invalid")
    const aggregate = await this.dependencies.store.readAggregate(actor.forgeUserId)
    if (!aggregate) return failure("migration_required")
    if (aggregate.revision !== input.expectedRevision) return failure("stale_revision")
    const now = this.#now()
    const revision = nextRevision(aggregate.revision)
    const event = createEvent({ name: "PlayerVisibilityChanged", identityRevision: revision, actorForgeUserId: actor.forgeUserId, visibilityAudience: validation.value.audience, now })
    const result = await this.dependencies.store.saveAggregate({ aggregate: { ...aggregate, revision, visibility: { ...validation.value, revision } }, expectedRevision: aggregate.revision, event })
    return result.ok ? { ok: true, value: undefined, revision } : failureFromResult(result)
  }

  async proposeAlias(actor: AuthenticatedForgeActor, input: {
    readonly routingAlias: string
    readonly displayAlias?: string
    readonly expectedRevision: PlayerIdentityRevision
  }): Promise<PlayerIdentityOperationResult<PublicPlayerAlias>> {
    const gate = this.#gate("publicProfiles", true)
    if (gate) return gate
    const denied = await this.#authorize(actor, "player_identity.manage_alias")
    if (denied) return denied
    const alias = validatePublicPlayerAlias(input.routingAlias)
    if (!alias.valid) return failure("alias_invalid")
    if (RESERVED_ALIASES.has(alias.value)) return failure("alias_reserved")
    if (input.displayAlias && !validateDisplayName(input.displayAlias).valid) return failure("alias_invalid")
    const collision = await this.dependencies.store.findAlias(alias.value)
    if (collision && collision.forgeUserId !== actor.forgeUserId) return failure("alias_collision")
    const aggregate = await this.dependencies.store.readAggregate(actor.forgeUserId)
    if (!aggregate) return failure("migration_required")
    if (aggregate.revision !== input.expectedRevision) return failure("stale_revision")
    const now = this.#now()
    const revision = nextRevision(aggregate.revision)
    const result = await this.dependencies.store.saveAggregate({
      aggregate: { ...aggregate, revision, alias: { forgeUserId: actor.forgeUserId, routingAlias: alias.value, displayAlias: input.displayAlias, enabled: false, revision } },
      expectedRevision: aggregate.revision,
      event: createEvent({ name: "PublicAliasProposed", identityRevision: revision, actorForgeUserId: actor.forgeUserId, now }),
    })
    return result.ok ? { ok: true, value: alias.value, revision } : failureFromResult(result)
  }

  async updateShowcase(actor: AuthenticatedForgeActor, input: {
    readonly showcase: PlayerHeroShowcaseProjection
    readonly expectedRevision: PlayerIdentityRevision
  }): Promise<PlayerIdentityOperationResult<PlayerHeroShowcaseProjection>> {
    const gate = this.#gate("heroIntegration", true)
    if (gate) return gate
    const denied = await this.#authorize(actor, "player_identity.manage_visibility")
    if (denied) return denied
    const aggregate = await this.dependencies.store.readAggregate(actor.forgeUserId)
    if (!aggregate) return failure("migration_required")
    if (aggregate.revision !== input.expectedRevision) return failure("stale_revision")
    if (new Set(input.showcase.entries.map((entry) => entry.heroKey)).size !== input.showcase.entries.length) return failure("invalid_request")
    const now = this.#now()
    const revision = nextRevision(aggregate.revision)
    const showcase = { ...input.showcase, selectionRevision: revision }
    const result = await this.dependencies.store.saveAggregate({ aggregate: { ...aggregate, revision, heroShowcase: showcase }, expectedRevision: aggregate.revision, event: createEvent({ name: "HeroShowcaseSelectionChanged", identityRevision: revision, actorForgeUserId: actor.forgeUserId, now }) })
    return result.ok ? { ok: true, value: showcase, revision } : failureFromResult(result)
  }
}
