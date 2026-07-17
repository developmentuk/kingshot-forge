import type {
  PlayerIdentityOperationResult,
  PublicPlayerAlias,
  PublicPlayerProjection,
} from "../../shared/domains/player-identity/index.js";

export const ART_STUDIO_ATTRIBUTION_REASON_CODES = [
  "ART_STUDIO_ATTRIBUTION_DISABLED",
  "ART_STUDIO_ATTRIBUTION_UNAVAILABLE",
  "ART_STUDIO_ATTRIBUTION_PUBLIC_PROFILE",
  "ART_STUDIO_ATTRIBUTION_PUBLIC_ALIAS_ONLY",
] as const;

export type ArtStudioAttributionReasonCode =
  (typeof ART_STUDIO_ATTRIBUTION_REASON_CODES)[number];

export interface ArtStudioPlayerAttribution {
  readonly publicAlias: string;
  readonly creatorLabel: string;
  readonly avatarUrl?: string;
  readonly kingdomLabel?: string;
  readonly allianceLabel?: string;
}

export type ArtStudioPlayerAttributionResult =
  | {
      readonly available: true;
      readonly reasonCode:
        | "ART_STUDIO_ATTRIBUTION_PUBLIC_PROFILE"
        | "ART_STUDIO_ATTRIBUTION_PUBLIC_ALIAS_ONLY";
      readonly attribution: ArtStudioPlayerAttribution;
    }
  | {
      readonly available: false;
      readonly reasonCode:
        | "ART_STUDIO_ATTRIBUTION_DISABLED"
        | "ART_STUDIO_ATTRIBUTION_UNAVAILABLE";
    };

/**
 * Narrow cross-domain port. Implementations must return Player Identity's
 * visibility-filtered public projection, never an aggregate or private view.
 */
export interface ArtStudioPublicPlayerProjectionReader {
  readPublic(
    alias: PublicPlayerAlias,
  ): Promise<PlayerIdentityOperationResult<PublicPlayerProjection>>;
}

export class ArtStudioPlayerAttributionAdapter {
  constructor(
    private readonly reader: ArtStudioPublicPlayerProjectionReader,
    private readonly enabled = false,
  ) {}

  async resolve(
    alias: PublicPlayerAlias,
  ): Promise<ArtStudioPlayerAttributionResult> {
    if (!this.enabled) {
      return {
        available: false,
        reasonCode: "ART_STUDIO_ATTRIBUTION_DISABLED",
      };
    }

    const result = await this.reader.readPublic(alias);
    if (!result.ok) {
      return {
        available: false,
        reasonCode: "ART_STUDIO_ATTRIBUTION_UNAVAILABLE",
      };
    }

    const projection = result.value;
    const displayName = projection.displayName?.trim();
    return {
      available: true,
      reasonCode: displayName
        ? "ART_STUDIO_ATTRIBUTION_PUBLIC_PROFILE"
        : "ART_STUDIO_ATTRIBUTION_PUBLIC_ALIAS_ONLY",
      attribution: Object.freeze({
        publicAlias: String(projection.publicAlias),
        creatorLabel: displayName || String(projection.publicAlias),
        ...(projection.avatar?.url ? { avatarUrl: projection.avatar.url } : {}),
        ...(projection.kingdom?.displayName
          ? { kingdomLabel: projection.kingdom.displayName }
          : {}),
        ...(projection.alliance?.displayName
          ? { allianceLabel: projection.alliance.displayName }
          : {}),
      }),
    };
  }
}
