import type { HighRiskApprovalRequest } from "./verticalSlice.js"
import type { PlayerIdentityResultCode } from "./resultCodes.js"

export type HighRiskApprovalDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly code: PlayerIdentityResultCode }

export function evaluateHighRiskApproval(
  request: HighRiskApprovalRequest,
  currentRevision: number,
  now: Date,
): HighRiskApprovalDecision {
  if (!request.approverForgeUserId) {
    return { allowed: false, code: "approval_required" }
  }
  if (request.initiatorForgeUserId === request.approverForgeUserId) {
    return { allowed: false, code: "approver_must_differ" }
  }
  if (request.reason.trim().length < 8 || request.scope.trim().length === 0) {
    return { allowed: false, code: "invalid_request" }
  }
  if (request.expectedRevision !== currentRevision) {
    return { allowed: false, code: "stale_revision" }
  }
  if (request.expiresAt && Date.parse(request.expiresAt) <= now.getTime()) {
    return { allowed: false, code: "approval_required" }
  }
  if (request.state !== "approved") {
    return { allowed: false, code: "approval_required" }
  }
  return { allowed: true }
}
