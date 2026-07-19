import type {
  VercelRequest,
} from "@vercel/node";

import {
  getSupabaseAdmin,
} from "../database/supabaseAdmin.js";

export type ForgeActorRole =
  | "owner"
  | "admin"
  | "moderator"
  | "content_creator"
  | "beta_tester"
  | "contributor"
  | "viewer";

export interface ForgeActor {
  userId: string;
  role: ForgeActorRole;
  roles: ForgeActorRole[];
  permissionKeys: string[];
}

function readBearerToken(
  request: VercelRequest,
): string {
  const authorization =
    request.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    throw new ForgeAuthenticationError(
      "A valid bearer token is required.",
    );
  }

  const token = authorization
    .slice("Bearer ".length)
    .trim();

  if (!token) {
    throw new ForgeAuthenticationError(
      "A valid bearer token is required.",
    );
  }

  return token;
}

export class ForgeAuthenticationError
extends Error {
  readonly statusCode = 401;

  constructor(message: string) {
    super(message);
    this.name = "ForgeAuthenticationError";
  }
}

export async function requireForgeActor(
  request: VercelRequest,
): Promise<ForgeActor> {
  const token = readBearerToken(request);
  const supabase = getSupabaseAdmin();

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    throw new ForgeAuthenticationError(
      "Your Forge session is invalid or has expired.",
    );
  }

  const {
    data: roleData,
    error: roleError,
  } = await supabase
    .from("forge_user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (roleError) {
    throw new Error(
      `Unable to load Forge role: ${roleError.message}`,
    );
  }

  const role =
    (roleData?.role as ForgeActorRole | undefined) ??
    "viewer";

  const {
    data: permissionData,
    error: permissionError,
  } = await supabase
    .from("forge_role_permissions")
    .select("permission_key")
    .eq("role", role);

  if (permissionError) {
    throw new Error(
      `Unable to load Forge capabilities: ${permissionError.message}`,
    );
  }

  return {
    userId: userData.user.id,
    role,
    roles: [role],
    permissionKeys: (permissionData ?? []).map(
      (item) => String(item.permission_key),
    ),
  };
}
