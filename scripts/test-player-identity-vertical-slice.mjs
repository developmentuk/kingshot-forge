import assert from "node:assert/strict"
import { createServer } from "vite"

const vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } })

function responseRecorder() {
  const record = { statusCode: 0, payload: undefined }
  return {
    record,
    response: {
      status(code) { record.statusCode = code; return this },
      json(payload) { record.payload = payload; return this },
    },
  }
}

try {
  const domain = await vite.ssrLoadModule("/shared/domains/player-identity/index.ts")
  const repositories = await vite.ssrLoadModule("/server/player-identity/repositories.ts")
  const runtimeModule = await vite.ssrLoadModule("/server/player-identity/runtime.ts")
  const http = await vite.ssrLoadModule("/server/player-identity/http.ts")
  const integrationModule = await vite.ssrLoadModule("/server/player-identity/integrations.ts")

  const flagsOff = domain.resolvePlayerIdentityFeatureFlags({})
  assert.ok(Object.values(flagsOff).every((value) => value === false), "all flags default OFF")
  assert.equal(domain.resolvePlayerIdentityFeatureFlags({ PLAYER_IDENTITY_UI: "true" }).ui, false)
  assert.equal(domain.resolvePlayerIdentityFeatureFlags({ PLAYER_IDENTITY_UI: "1" }).ui, false)
  assert.equal(domain.resolvePlayerIdentityFeatureFlags({ PLAYER_IDENTITY_UI: "enabled" }).ui, true)
  assert.equal(flagsOff.verification, false)
  assert.equal(flagsOff.persistence, false)

  const forgeUserId = "synthetic_forge_user_0001"
  const otherForgeUserId = "synthetic_forge_user_0002"
  const characterOne = "synthetic_character_0001"
  const characterTwo = "synthetic_character_0002"
  const linkOne = "synthetic_link_0001"
  const revision = 3
  assert.notEqual(forgeUserId, characterOne, "Forge User and Game Character are separate")

  const linkedCharacter = {
    id: linkOne,
    forgeUserId,
    gameCharacterId: characterOne,
    state: "linked",
    createdAt: "2026-07-17T10:00:00.000Z",
    disputeState: "none",
    revision,
    isPrimary: true,
    activeCharacterEligible: true,
  }
  const aggregate = {
    forgeUserId,
    revision,
    links: [linkedCharacter],
    linkProposals: [],
    linkHistory: [],
    visibility: { audience: "public", visibleFields: ["publicAlias", "displayName", "kingdom", "heroShowcase"], revision },
    alias: { forgeUserId, routingAlias: "forge-sentinel", enabled: true, revision },
    heroShowcase: { entries: [{ heroKey: "hero-synthetic", displayOrder: 0, progressionClaim: { heroKey: "hero-synthetic", level: 70 } }], selectionRevision: revision, visibilityRevision: revision },
    characterLimit: { baseAccountLimit: 2, entitlementAdjustment: 0, allianceRoleAdjustment: 0, subscriptionAdjustment: 0, absoluteSafetyCeiling: 8 },
  }
  const privateProjection = {
    ownerForgeUserId: forgeUserId,
    linkedCharacters: [{ characterId: characterOne, linkId: linkOne, display: { displayName: "Synthetic Sentinel" }, linkState: "linked", isPrimary: true, activeCharacterEligible: true, revision, verification: { state: "unverified", revision, assurance: "none" }, kingdom: { kingdomId: "synthetic_kingdom_0101", displayName: "Kingdom 101", kingdomNumber: 101 }, alliance: { allianceId: "synthetic_alliance_0001", displayName: "Forge Test", tag: "TST" } }],
    identityRevision: revision,
  }
  const publicProjection = {
    publicAlias: "forge-sentinel",
    displayName: "Synthetic Sentinel",
    kingdom: { displayName: "Kingdom 101", kingdomNumber: 101 },
    heroShowcase: aggregate.heroShowcase,
    visibility: aggregate.visibility,
  }
  const makeStore = () => new repositories.InMemoryPlayerIdentityStore([{ aggregate, privateProjection, publicProjection }])
  const allowCapabilities = { async hasCapability() { return true } }
  const actor = { kind: "authenticated_user", forgeUserId, globalRoles: ["viewer"] }
  const allEnabledEnvironment = Object.fromEntries(Object.values(domain.PLAYER_IDENTITY_FEATURE_FLAG_ENV).map((key) => [key, "enabled"]))
  const activeResolver = {
    async resolveActiveCharacter(request) {
      if (!request.requestedCharacterId) return { outcome: "character_required", resultCode: "active_character_required" }
      if (request.requestedCharacterId === characterTwo) return { outcome: "character_not_linked", resultCode: "active_character_not_linked" }
      if (request.expectedIdentityRevision !== revision) return { outcome: "revision_conflict", resultCode: "active_character_revision_conflict" }
      return { outcome: "resolved", context: { forgeUserId, characterId: characterOne, characterLinkId: linkOne, identityRevision: revision, verification: { state: "unverified", revision, assurance: "none" } } }
    },
  }
  const runtime = runtimeModule.createPlayerIdentityRuntime({ environment: allEnabledEnvironment, store: makeStore(), capabilities: allowCapabilities, activeCharacterResolver: activeResolver, resolveActor: async () => actor })

  const own = await runtime.identity.readOwn(actor)
  assert.equal(own.ok, true)
  assert.equal(own.value.linkedCharacters[0].verification.state, "unverified", "link is not verification")

  const proposed = await runtime.identity.proposeLink(actor, { externalCharacterReference: "player-ref-2002", displayName: "Synthetic Scout", expectedRevision: revision })
  assert.equal(proposed.ok, true)
  assert.equal(proposed.value.verificationState, "unverified")
  const duplicate = await runtime.identity.proposeLink(actor, { externalCharacterReference: "player-ref-2002", displayName: "Synthetic Scout", expectedRevision: proposed.revision })
  assert.deepEqual(duplicate, { ok: false, code: "character_already_linked" })
  const stale = await runtime.identity.proposeLink(actor, { externalCharacterReference: "player-ref-3003", displayName: "Synthetic Third", expectedRevision: revision })
  assert.deepEqual(stale, { ok: false, code: "stale_revision" })

  const primaryStore = makeStore()
  const primaryRuntime = runtimeModule.createPlayerIdentityRuntime({ environment: allEnabledEnvironment, store: primaryStore, capabilities: allowCapabilities, activeCharacterResolver: activeResolver, resolveActor: async () => actor })
  const primary = await primaryRuntime.identity.selectPrimary(actor, { linkId: linkOne, expectedRevision: revision })
  assert.equal(primary.ok, true)
  const activeRequired = await primaryRuntime.identity.selectActive({ actor, requestedOperation: "gift" })
  assert.equal(activeRequired.resultCode, "active_character_required", "Primary is not an Active fallback")
  const activeOne = await primaryRuntime.identity.selectActive({ actor, requestedCharacterId: characterOne, requestedOperation: "profile", expectedIdentityRevision: revision })
  const activeOtherTab = await primaryRuntime.identity.selectActive({ actor, requestedCharacterId: characterTwo, requestedOperation: "profile", expectedIdentityRevision: revision })
  assert.equal(activeOne.outcome, "resolved")
  assert.equal(activeOtherTab.resultCode, "active_character_not_linked", "request contexts are independent")
  const activeStale = await primaryRuntime.identity.selectActive({ actor, requestedCharacterId: characterOne, requestedOperation: "profile", expectedIdentityRevision: 2 })
  assert.equal(activeStale.resultCode, "active_character_revision_conflict")

  const projected = await runtime.identity.readPublic("forge-sentinel")
  assert.equal(projected.ok, true)
  const publicJson = JSON.stringify(projected.value).toLowerCase()
  for (const forbidden of ["forgeuserid", "characterlinkid", "rawplayerid", "evidence", "supportnotes", "giftcentre"]) assert.equal(publicJson.includes(forbidden), false, `public projection leaked ${forbidden}`)
  assert.equal(domain.evaluatePlayerFieldVisibility({ field: "futureUnknown", visibility: aggregate.visibility, viewer: { kind: "anonymous" } }).visible, false)
  assert.equal(domain.evaluatePlayerFieldVisibility({ field: "rawPlayerId", visibility: aggregate.visibility, viewer: { kind: "anonymous" } }).reason, "internal_field")

  const aliasStore = makeStore()
  const aliasRuntime = runtimeModule.createPlayerIdentityRuntime({ environment: allEnabledEnvironment, store: aliasStore, capabilities: allowCapabilities, activeCharacterResolver: activeResolver, resolveActor: async () => actor })
  assert.deepEqual(await aliasRuntime.identity.proposeAlias(actor, { routingAlias: "admin000", expectedRevision: revision }), { ok: false, code: "alias_reserved" })
  assert.deepEqual(await aliasRuntime.identity.proposeAlias(actor, { routingAlias: "UPPER", expectedRevision: revision }), { ok: false, code: "alias_invalid" })
  const collisionAggregate = { ...aggregate, forgeUserId: otherForgeUserId, alias: { ...aggregate.alias, forgeUserId: otherForgeUserId } }
  const collisionPrivate = { ...privateProjection, ownerForgeUserId: otherForgeUserId }
  const collisionStore = new repositories.InMemoryPlayerIdentityStore([{ aggregate: collisionAggregate, privateProjection: collisionPrivate, publicProjection }])
  const collisionRuntime = runtimeModule.createPlayerIdentityRuntime({ environment: allEnabledEnvironment, store: collisionStore, capabilities: allowCapabilities, activeCharacterResolver: activeResolver, resolveActor: async () => actor })
  assert.deepEqual(await collisionRuntime.identity.proposeAlias(actor, { routingAlias: "forge-sentinel", expectedRevision: revision }), { ok: false, code: "alias_collision" })

  const integrations = new integrationModule.PlayerIdentityIntegrationService(makeStore(), domain.resolvePlayerIdentityFeatureFlags(allEnabledEnvironment))
  const gift = await integrations.resolveGiftEligibility({ forgeUserId, characterId: characterOne, expectedRevision: revision })
  assert.equal(gift.ok, true)
  assert.equal(gift.value.verificationState, "unverified")
  assert.equal(gift.value.providerPlayerIdProjectionAvailable, false)
  assert.equal(integrationModule.PlayerIdentityIntegrationService.toLegacyGiftBoolean(gift), false)
  const art = await integrations.resolveArtAttribution("forge-sentinel")
  assert.equal(art.ok, true)
  assert.equal(JSON.stringify(art.value).includes(forgeUserId), false)
  assert.equal(aggregate.heroShowcase.entries[0].progressionClaim.heroKey, "hero-synthetic", "showcase holds a claim, not canonical facts")

  const approvalBase = { id: "synthetic_approval_0001", operation: "disputed_link_restoration", initiatorForgeUserId: forgeUserId, reason: "Reviewed restoration request", scope: "synthetic case", expectedRevision: revision, state: "approved" }
  assert.equal(domain.evaluateHighRiskApproval(approvalBase, revision, new Date("2026-07-17T12:00:00Z")).code, "approval_required")
  assert.equal(domain.evaluateHighRiskApproval({ ...approvalBase, approverForgeUserId: forgeUserId }, revision, new Date("2026-07-17T12:00:00Z")).code, "approver_must_differ")
  assert.equal(domain.evaluateHighRiskApproval({ ...approvalBase, approverForgeUserId: otherForgeUserId }, revision, new Date("2026-07-17T12:00:00Z")).allowed, true)

  const legacy = new repositories.ReadOnlyLegacyDiscoveryAdapter({
    async readPlayerAccount() { return { user_id: "synthetic" } }, async readPlayerProfile() { return {} }, async readKingdomMembership() { return {} }, async readAllianceMembership() { return { private_notes: "excluded" } }, async readPublicView() { return { raw_player_id: "excluded" } },
  })
  const legacyReport = await legacy.inspectByForgeUserId(forgeUserId)
  assert.equal(legacyReport.verification.value, "unverified")
  assert.equal(legacyReport.allianceMembership.classification, "unsafe")
  assert.equal(legacyReport.compatibilityIssues.includes("incomplete_migration_history"), true)

  const productionRuntime = runtimeModule.createPlayerIdentityRuntime({ resolveActor: async () => { throw new Error("actor resolution must not run while UI is disabled") } })
  const recorder = responseRecorder()
  await http.handlePlayerIdentityRequest(productionRuntime, { method: "POST", body: { action: "propose_link" }, query: {} }, recorder.response)
  assert.equal(recorder.record.statusCode, 503)
  assert.equal(recorder.record.payload.code, "feature_disabled")

  const noPersistenceEnvironment = { ...allEnabledEnvironment, PLAYER_IDENTITY_PERSISTENCE: undefined }
  const noPersistence = runtimeModule.createPlayerIdentityRuntime({ environment: noPersistenceEnvironment, store: makeStore(), capabilities: allowCapabilities, activeCharacterResolver: activeResolver, resolveActor: async () => actor })
  assert.deepEqual(await noPersistence.identity.proposeLink(actor, { externalCharacterReference: "player-ref-4004", displayName: "Synthetic Fourth", expectedRevision: revision }), { ok: false, code: "persistence_disabled" })
  assert.equal(runtimeModule.productionPlayerIdentityRuntime.store.constructor.name, "DisabledProductionPlayerIdentityStore")

  const metadataLeak = { eventId: "synthetic_event_0001", name: "SupportCaseOpened", occurredAt: "2026-07-17T12:00:00Z", identityRevision: revision, metadata: { supportNotes: "private" } }
  assert.throws(() => domain.createImmutablePlayerIdentityEvent(metadataLeak), /Sensitive event metadata key rejected/)

  console.log("Player Identity Sprint 9.4 vertical-slice tests passed.")
} finally {
  await vite.close()
}
