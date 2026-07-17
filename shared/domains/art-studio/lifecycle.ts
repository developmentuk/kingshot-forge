import {
  ArtStudioDomainError,
} from "./errors.js";
import type {
  ArtStudioArtworkStatus,
  ArtStudioCapability,
  ArtStudioReportStatus,
} from "./types.js";

export interface ArtStudioArtworkTransitionRule {
  from: ArtStudioArtworkStatus;
  to: ArtStudioArtworkStatus;
  capability: ArtStudioCapability;
  actorRelationship: "owner" | "non_owner";
}

export const ART_STUDIO_ARTWORK_TRANSITIONS = [
  { from: "draft", to: "submitted", capability: "contributions.submit", actorRelationship: "owner" },
  { from: "draft", to: "archived", capability: "contributions.submit", actorRelationship: "owner" },
  { from: "submitted", to: "draft", capability: "contributions.submit", actorRelationship: "owner" },
  { from: "submitted", to: "changes_requested", capability: "moderation.manage", actorRelationship: "non_owner" },
  { from: "submitted", to: "approved", capability: "moderation.manage", actorRelationship: "non_owner" },
  { from: "submitted", to: "rejected", capability: "moderation.manage", actorRelationship: "non_owner" },
  { from: "changes_requested", to: "submitted", capability: "contributions.submit", actorRelationship: "owner" },
  { from: "changes_requested", to: "archived", capability: "contributions.submit", actorRelationship: "owner" },
  { from: "approved", to: "published", capability: "cms.publish", actorRelationship: "non_owner" },
  { from: "approved", to: "rejected", capability: "moderation.manage", actorRelationship: "non_owner" },
  { from: "approved", to: "archived", capability: "moderation.manage", actorRelationship: "non_owner" },
  { from: "published", to: "unpublished", capability: "moderation.manage", actorRelationship: "non_owner" },
  { from: "unpublished", to: "published", capability: "cms.publish", actorRelationship: "non_owner" },
  { from: "unpublished", to: "archived", capability: "moderation.manage", actorRelationship: "non_owner" },
  { from: "rejected", to: "draft", capability: "contributions.submit", actorRelationship: "owner" },
  { from: "rejected", to: "archived", capability: "contributions.submit", actorRelationship: "owner" },
] as const satisfies readonly ArtStudioArtworkTransitionRule[];

export interface ArtStudioArtworkTransitionContext {
  actorUserId: string;
  ownerUserId: string;
  capabilities: ReadonlySet<ArtStudioCapability>;
}

export function getArtworkTransitionRule(
  from: ArtStudioArtworkStatus,
  to: ArtStudioArtworkStatus,
): ArtStudioArtworkTransitionRule | undefined {
  return ART_STUDIO_ARTWORK_TRANSITIONS.find(
    (rule) => rule.from === from && rule.to === to,
  );
}

export function assertArtworkTransition(
  from: ArtStudioArtworkStatus,
  to: ArtStudioArtworkStatus,
  context: ArtStudioArtworkTransitionContext,
): ArtStudioArtworkTransitionRule {
  const rule = getArtworkTransitionRule(from, to);

  if (!rule) {
    throw new ArtStudioDomainError({
      code: "ART_STUDIO_INVALID_TRANSITION",
      message: `Artwork cannot transition from ${from} to ${to}.`,
      statusCode: 409,
      details: { from, to },
    });
  }

  const isOwner = context.actorUserId === context.ownerUserId;
  if (
    (rule.actorRelationship === "owner" && !isOwner) ||
    (rule.actorRelationship === "non_owner" && isOwner)
  ) {
    const code = to === "approved"
      ? "ART_STUDIO_SELF_APPROVAL_FORBIDDEN"
      : to === "published"
        ? "ART_STUDIO_SELF_PUBLICATION_FORBIDDEN"
        : "ART_STUDIO_FORBIDDEN";
    throw new ArtStudioDomainError({
      code,
      message: "The actor relationship does not permit this artwork transition.",
      statusCode: 403,
    });
  }

  if (!context.capabilities.has(rule.capability)) {
    throw new ArtStudioDomainError({
      code: "ART_STUDIO_CAPABILITY_REQUIRED",
      message: `Capability ${rule.capability} is required.`,
      statusCode: 403,
      details: { capability: rule.capability },
    });
  }

  return rule;
}

export const ART_STUDIO_REPORT_TRANSITIONS = {
  open: ["reviewing", "resolved", "dismissed"],
  reviewing: ["resolved", "dismissed"],
  resolved: [],
  dismissed: [],
} as const satisfies Record<
  ArtStudioReportStatus,
  readonly ArtStudioReportStatus[]
>;

export function assertReportTransition(
  from: ArtStudioReportStatus,
  to: ArtStudioReportStatus,
  capabilities: ReadonlySet<ArtStudioCapability>,
): void {
  const validTargets = ART_STUDIO_REPORT_TRANSITIONS[from];
  if (!(validTargets as readonly ArtStudioReportStatus[]).includes(to)) {
    throw new ArtStudioDomainError({
      code: "ART_STUDIO_INVALID_TRANSITION",
      message: `Report cannot transition from ${from} to ${to}.`,
      statusCode: 409,
      details: { from, to },
    });
  }

  if (!capabilities.has("moderation.manage")) {
    throw new ArtStudioDomainError({
      code: "ART_STUDIO_CAPABILITY_REQUIRED",
      message: "Capability moderation.manage is required.",
      statusCode: 403,
      details: { capability: "moderation.manage" },
    });
  }
}
