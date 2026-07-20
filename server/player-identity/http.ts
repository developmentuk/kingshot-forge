import type { VercelRequest, VercelResponse } from "@vercel/node"
import type {
  CharacterLinkId,
  GameCharacterId,
  PlayerIdentityOperationResult,
  PlayerIdentityRevision,
  PlayerSupportCaseId,
  PublicPlayerAlias,
} from "../../shared/domains/player-identity/index.js"
import type { PlayerIdentityRuntime } from "./runtime.js"

function sendResult(response: VercelResponse, result: PlayerIdentityOperationResult<unknown>): void {
  if (result.ok) {
    response.status(200).json({ status: "ok", data: result.value, revision: result.revision })
    return
  }
  const code = "code" in result ? result.code : "invalid_request"
  const status = code === "authentication_required" ? 401
    : code.includes("not_allowed") || code === "operation_not_supported" ? 403
    : code.includes("conflict") || code === "stale_revision" ? 409
    : code === "feature_disabled" || code === "persistence_disabled" || code === "migration_required" ? 503
    : 400
  response.status(status).json({ status: "error", code })
}

function body(request: VercelRequest): Readonly<Record<string, unknown>> {
  return request.body && typeof request.body === "object" ? request.body as Readonly<Record<string, unknown>> : {}
}

export async function handlePlayerIdentityRequest(runtime: PlayerIdentityRuntime, request: VercelRequest, response: VercelResponse): Promise<void> {
  if (!runtime.flags.ui) {
    sendResult(response, { ok: false, code: "feature_disabled" })
    return
  }
  const actor = await runtime.resolveActor(request)
  if (request.method === "GET") {
    sendResult(response, await runtime.identity.readOwn(actor))
    return
  }
  if (request.method !== "POST") {
    response.status(405).json({ status: "error", code: "operation_not_supported" })
    return
  }
  const input = body(request)
  const action = input.action
  if (action === "propose_link") {
    sendResult(response, await runtime.identity.proposeLink(actor, { externalCharacterReference: String(input.externalCharacterReference ?? ""), displayName: String(input.displayName ?? ""), expectedRevision: Number(input.expectedRevision) as PlayerIdentityRevision }))
    return
  }
  if (action === "revoke_link" || action === "dispute_link" || action === "remove_link") {
    sendResult(response, await runtime.identity.changeLinkState(actor, { linkId: String(input.linkId) as CharacterLinkId, action: action.replace("_link", "") as "revoke" | "dispute" | "remove", expectedRevision: Number(input.expectedRevision) as PlayerIdentityRevision }))
    return
  }
  if (action === "select_primary") {
    sendResult(response, await runtime.identity.selectPrimary(actor, { linkId: String(input.linkId) as CharacterLinkId, expectedRevision: Number(input.expectedRevision) as PlayerIdentityRevision }))
    return
  }
  if (action === "select_active") {
    const result = await runtime.identity.selectActive({ actor, requestedCharacterId: String(input.characterId) as GameCharacterId, requestedOperation: String(input.operation ?? "profile"), expectedIdentityRevision: Number(input.expectedRevision) as PlayerIdentityRevision })
    if (result.outcome === "resolved") response.status(200).json({ status: "ok", data: result.context })
    else response.status(409).json({ status: "error", code: result.resultCode })
    return
  }
  if (action === "update_visibility") {
    sendResult(response, await runtime.identity.updateVisibility(actor, { audience: String(input.audience) as never, visibleFields: Array.isArray(input.visibleFields) ? input.visibleFields.map(String) as never : [], expectedRevision: Number(input.expectedRevision) as PlayerIdentityRevision }))
    return
  }
  if (action === "propose_alias") {
    sendResult(response, await runtime.identity.proposeAlias(actor, { routingAlias: String(input.routingAlias ?? ""), displayAlias: typeof input.displayAlias === "string" ? input.displayAlias : undefined, expectedRevision: Number(input.expectedRevision) as PlayerIdentityRevision }))
    return
  }
  sendResult(response, { ok: false, code: "invalid_request" })
}

export async function handlePublicPlayerRequest(runtime: PlayerIdentityRuntime, request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== "GET") { response.status(405).json({ status: "error", code: "operation_not_supported" }); return }
  const alias = Array.isArray(request.query.alias) ? request.query.alias[0] : request.query.alias
  if (!alias) { sendResult(response, { ok: false, code: "alias_invalid" }); return }
  sendResult(response, await runtime.identity.readPublic(alias as PublicPlayerAlias))
}

export async function handlePlayerSupportRequest(runtime: PlayerIdentityRuntime, request: VercelRequest, response: VercelResponse): Promise<void> {
  if (!runtime.flags.ui || !runtime.flags.supportTools) { sendResult(response, { ok: false, code: "feature_disabled" }); return }
  const actor = await runtime.resolveActor(request)
  if (request.method !== "GET") { sendResult(response, { ok: false, code: runtime.flags.persistence ? "operation_not_supported" : "persistence_disabled" }); return }
  const caseId = Array.isArray(request.query.caseId) ? request.query.caseId[0] : request.query.caseId
  sendResult(response, caseId ? await runtime.support.inspect(actor, caseId as PlayerSupportCaseId) : await runtime.support.list(actor))
}

export async function handlePlayerIntegrationRequest(runtime: PlayerIdentityRuntime, request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== "POST") { response.status(405).json({ status: "error", code: "operation_not_supported" }); return }
  const input = body(request)
  if (input.integration === "gift") {
    if (!runtime.flags.ui || !runtime.flags.giftIntegration) { sendResult(response, { ok: false, code: "feature_disabled" }); return }
    const actor = await runtime.resolveActor(request)
    sendResult(response, await runtime.integrations.resolveGiftEligibility({ forgeUserId: actor.forgeUserId, characterId: String(input.characterId) as never, expectedRevision: Number(input.expectedRevision) as PlayerIdentityRevision }))
    return
  }
  if (input.integration === "art") {
    sendResult(response, await runtime.integrations.resolveArtAttribution(String(input.publicAlias) as PublicPlayerAlias))
    return
  }
  sendResult(response, { ok: false, code: "invalid_request" })
}
