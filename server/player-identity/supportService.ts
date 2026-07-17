import {
  createImmutablePlayerIdentityEvent,
  evaluateHighRiskApproval,
} from "../../shared/domains/player-identity/index.js"
import type {
  AuthenticatedForgeActor,
  HighRiskApprovalRequest,
  PlayerIdentityCapabilityResolver,
  PlayerIdentityEventId,
  PlayerIdentityFeatureFlags,
  PlayerIdentityOperationResult,
  PlayerIdentityStore,
  PlayerSupportCaseId,
  PlayerSupportCaseSummary,
} from "../../shared/domains/player-identity/index.js"

export class PlayerIdentitySupportService {
  constructor(private readonly dependencies: {
    readonly store: PlayerIdentityStore
    readonly flags: PlayerIdentityFeatureFlags
    readonly capabilities: PlayerIdentityCapabilityResolver
    readonly now?: () => Date
  }) {}

  async list(actor: AuthenticatedForgeActor): Promise<PlayerIdentityOperationResult<readonly PlayerSupportCaseSummary[]>> {
    if (!this.dependencies.flags.ui || !this.dependencies.flags.supportTools) return { ok: false, code: "feature_disabled" }
    if (!await this.dependencies.capabilities.hasCapability({ forgeUserId: actor.forgeUserId, capability: "player_identity.support.read" })) {
      return { ok: false, code: "support_action_not_allowed" }
    }
    return { ok: true, value: await this.dependencies.store.listSupportCases(), revision: 1 as never }
  }

  async inspect(actor: AuthenticatedForgeActor, caseId: PlayerSupportCaseId): Promise<PlayerIdentityOperationResult<PlayerSupportCaseSummary>> {
    const list = await this.list(actor)
    if (!list.ok) return list
    const supportCase = await this.dependencies.store.readSupportCase(caseId)
    return supportCase ? { ok: true, value: supportCase, revision: supportCase.revision } : { ok: false, code: "dispute_not_found" }
  }

  async recordHighRiskDecision(actor: AuthenticatedForgeActor, input: {
    readonly supportCaseId: PlayerSupportCaseId
    readonly approval: HighRiskApprovalRequest
    readonly currentRevision: number
  }): Promise<PlayerIdentityOperationResult> {
    if (!this.dependencies.flags.ui || !this.dependencies.flags.supportTools) return { ok: false, code: "feature_disabled" }
    if (!this.dependencies.flags.persistence) return { ok: false, code: "persistence_disabled" }
    if (!await this.dependencies.capabilities.hasCapability({ forgeUserId: actor.forgeUserId, capability: "player_identity.approve_high_risk" })) {
      return { ok: false, code: "support_action_not_allowed" }
    }
    const now = this.dependencies.now?.() ?? new Date()
    const decision = evaluateHighRiskApproval(input.approval, input.currentRevision, now)
    if (!decision.allowed) return { ok: false, code: decision.code }
    const name = input.approval.state === "approved" ? "HighRiskApprovalGranted" : "HighRiskApprovalRejected"
    return this.dependencies.store.appendAudit(createImmutablePlayerIdentityEvent({
      eventId: `approval_event_${now.getTime().toString(36)}` as PlayerIdentityEventId,
      name,
      occurredAt: now.toISOString(),
      identityRevision: input.approval.expectedRevision,
      actorForgeUserId: actor.forgeUserId,
      metadata: { operation: input.approval.operation, scope: input.approval.scope, caseCategory: "private" },
    }))
  }
}
