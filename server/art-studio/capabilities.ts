import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  ForgeActor,
} from "../auth/requireForgeActor.js";
import {
  getSupabaseAdmin,
} from "../database/supabaseAdmin.js";
import type {
  ArtStudioCapability,
  ArtStudioCapabilityResolver,
  ArtStudioActor,
} from "../../shared/domains/art-studio/index.js";
import {
  ArtStudioDomainError,
} from "../../shared/domains/art-studio/index.js";

export class SupabaseArtStudioCapabilityResolver
implements ArtStudioCapabilityResolver {
  constructor(
    private readonly client: SupabaseClient,
  ) {}

  async hasCapability(
    actor: ArtStudioActor,
    capability: ArtStudioCapability,
  ): Promise<boolean> {
    const {
      data: roleData,
      error: roleError,
    } = await this.client
      .from("forge_user_roles")
      .select("role")
      .eq("user_id", actor.userId)
      .maybeSingle();

    if (roleError) {
      throw new Error(
        `Unable to resolve Forge role: ${roleError.message}`,
      );
    }

    const role = typeof roleData?.role === "string"
      ? roleData.role
      : null;
    if (!role) {
      return false;
    }

    const { data, error } = await this.client
      .from("forge_role_permissions")
      .select("permission_key")
      .eq("role", role)
      .eq("permission_key", capability)
      .limit(1);

    if (error) {
      throw new Error(
        `Unable to resolve Forge capability: ${error.message}`,
      );
    }

    return (data?.length ?? 0) > 0;
  }
}

export function createArtStudioCapabilityResolver(): ArtStudioCapabilityResolver {
  return new SupabaseArtStudioCapabilityResolver(
    getSupabaseAdmin(),
  );
}

export async function assertArtStudioCapability(
  actor: ForgeActor,
  capability: ArtStudioCapability,
  resolver: ArtStudioCapabilityResolver,
): Promise<void> {
  if (!(await resolver.hasCapability(actor, capability))) {
    throw new ArtStudioDomainError({
      code: "ART_STUDIO_CAPABILITY_REQUIRED",
      message: `Capability ${capability} is required.`,
      statusCode: 403,
      details: { capability },
    });
  }
}

export async function assertArtStudioModerationCapability(
  actor: ForgeActor,
  artworkOwnerUserId: string,
  resolver: ArtStudioCapabilityResolver,
): Promise<void> {
  if (actor.userId === artworkOwnerUserId) {
    throw new ArtStudioDomainError({
      code: "ART_STUDIO_SELF_APPROVAL_FORBIDDEN",
      message: "Artwork owners cannot moderate or approve their own work.",
      statusCode: 403,
    });
  }
  await assertArtStudioCapability(
    actor,
    "moderation.manage",
    resolver,
  );
}

export async function assertArtStudioPublicationCapability(
  actor: ForgeActor,
  artworkOwnerUserId: string,
  resolver: ArtStudioCapabilityResolver,
): Promise<void> {
  if (actor.userId === artworkOwnerUserId) {
    throw new ArtStudioDomainError({
      code: "ART_STUDIO_SELF_PUBLICATION_FORBIDDEN",
      message: "Artwork owners cannot publish their own work.",
      statusCode: 403,
    });
  }
  await assertArtStudioCapability(
    actor,
    "cms.publish",
    resolver,
  );
}
