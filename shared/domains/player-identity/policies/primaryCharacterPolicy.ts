import type {
  CharacterLink,
} from "../contracts.js"
import type {
  CharacterLinkId,
  PlayerIdentityRevision,
} from "../identifiers.js"

export type PrimaryCharacterState =
  | {
      readonly status: "no_linked_characters"
    }
  | {
      readonly status: "primary_missing"
      readonly linkedCharacterCount: number
    }
  | {
      readonly status: "primary_resolved"
      readonly characterLinkId: CharacterLinkId
    }
  | {
      readonly status: "primary_invalid"
      readonly characterLinkId?: CharacterLinkId
      readonly reason:
        | "multiple_primary_links"
        | "revoked"
        | "disputed"
        | "removed"
    }

export function evaluatePrimaryCharacterState(
  links: readonly CharacterLink[],
): PrimaryCharacterState {
  const linked = links.filter(({ state }) => state === "linked")
  const primaryLinks = links.filter(({ isPrimary }) => isPrimary)

  if (links.length === 0) {
    return {
      status: "no_linked_characters",
    }
  }

  if (primaryLinks.length === 0) {
    return {
      status: "primary_missing",
      linkedCharacterCount: linked.length,
    }
  }

  if (primaryLinks.length > 1) {
    return {
      status: "primary_invalid",
      reason: "multiple_primary_links",
    }
  }

  if (linked.length === 0 && primaryLinks.length === 0) {
    return {
      status: "no_linked_characters",
    }
  }

  const primary = primaryLinks[0]

  if (primary.state !== "linked") {
    return {
      status: "primary_invalid",
      characterLinkId: primary.id,
      reason: primary.state,
    }
  }

  return {
    status: "primary_resolved",
    characterLinkId: primary.id,
  }
}

export interface PrimaryCharacterChangeRequest {
  readonly links: readonly CharacterLink[]
  readonly requestedCharacterLinkId: CharacterLinkId
  readonly expectedIdentityRevision: PlayerIdentityRevision
  readonly currentIdentityRevision: PlayerIdentityRevision
}

export type PrimaryCharacterChangeDecision =
  | {
      readonly outcome: "allowed"
      readonly previousCharacterLinkId?: CharacterLinkId
      readonly requestedCharacterLinkId: CharacterLinkId
    }
  | {
      readonly outcome: "unchanged"
      readonly requestedCharacterLinkId: CharacterLinkId
    }
  | {
      readonly outcome:
        | "no_linked_characters"
        | "target_not_linked"
        | "target_revoked"
        | "target_disputed"
        | "target_removed"
        | "revision_conflict"
    }

export function evaluatePrimaryCharacterChange(
  request: PrimaryCharacterChangeRequest,
): PrimaryCharacterChangeDecision {
  if (
    request.expectedIdentityRevision !==
    request.currentIdentityRevision
  ) {
    return {
      outcome: "revision_conflict",
    }
  }

  const linked = request.links.filter(
    ({ state }) => state === "linked",
  )

  if (linked.length === 0) {
    return {
      outcome: "no_linked_characters",
    }
  }

  const requested = request.links.find(
    ({ id }) => id === request.requestedCharacterLinkId,
  )

  if (!requested) {
    return {
      outcome: "target_not_linked",
    }
  }

  if (requested.state !== "linked") {
    return {
      outcome: `target_${requested.state}`,
    }
  }

  if (requested.isPrimary) {
    return {
      outcome: "unchanged",
      requestedCharacterLinkId: requested.id,
    }
  }

  return {
    outcome: "allowed",
    previousCharacterLinkId: request.links.find(
      ({ isPrimary }) => isPrimary,
    )?.id,
    requestedCharacterLinkId: requested.id,
  }
}
