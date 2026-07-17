import type {
  ArtStudioAttributionProjection,
  PrivatePlayerProjection,
  PublicPlayerProjection,
} from "./contracts.js"
import type {
  ForgeUserId,
} from "./identifiers.js"

export type PrivateProjectionResult =
  | {
      readonly outcome: "projected"
      readonly projection: PrivatePlayerProjection
    }
  | {
      readonly outcome: "projection_not_allowed"
    }

export function projectPrivatePlayerForOwner(
  actorForgeUserId: ForgeUserId,
  projection: PrivatePlayerProjection,
): PrivateProjectionResult {
  if (actorForgeUserId !== projection.ownerForgeUserId) {
    return {
      outcome: "projection_not_allowed",
    }
  }

  return {
    outcome: "projected",
    projection,
  }
}

export interface PublicPlayerProjectionSource {
  readonly publicAlias: PublicPlayerProjection["publicAlias"]
  readonly displayName?: PublicPlayerProjection["displayName"]
  readonly avatar?: PublicPlayerProjection["avatar"]
  readonly kingdom?: PublicPlayerProjection["kingdom"]
  readonly alliance?: PublicPlayerProjection["alliance"]
  readonly heroShowcase?: PublicPlayerProjection["heroShowcase"]
  readonly visibility: PublicPlayerProjection["visibility"]
}

export function projectPublicPlayer(
  source: PublicPlayerProjectionSource,
): PublicPlayerProjection {
  const projection: {
    publicAlias: PublicPlayerProjection["publicAlias"]
    displayName?: PublicPlayerProjection["displayName"]
    avatar?: PublicPlayerProjection["avatar"]
    kingdom?: PublicPlayerProjection["kingdom"]
    alliance?: PublicPlayerProjection["alliance"]
    heroShowcase?: PublicPlayerProjection["heroShowcase"]
    visibility: PublicPlayerProjection["visibility"]
  } = {
    publicAlias: source.publicAlias,
    visibility: source.visibility,
  }

  const selected = new Set(source.visibility.visibleFields)

  if (selected.has("displayName") && source.displayName !== undefined) {
    projection.displayName = source.displayName
  }

  if (selected.has("avatar") && source.avatar !== undefined) {
    projection.avatar = source.avatar
  }

  if (selected.has("kingdom") && source.kingdom !== undefined) {
    projection.kingdom = source.kingdom
  }

  if (selected.has("alliance") && source.alliance !== undefined) {
    projection.alliance = source.alliance
  }

  if (
    selected.has("heroShowcase") &&
    source.heroShowcase !== undefined
  ) {
    projection.heroShowcase = source.heroShowcase
  }

  return Object.freeze(projection)
}

export function projectArtStudioAttribution(
  source: ArtStudioAttributionProjection,
): ArtStudioAttributionProjection {
  return Object.freeze({
    publicAlias: source.publicAlias,
    displayName: source.displayName,
    avatar: source.avatar,
    kingdom: source.kingdom,
    alliance: source.alliance,
    visibilityRevision: source.visibilityRevision,
  })
}
