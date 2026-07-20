import type {
  VercelRequest,
} from "@vercel/node";

import {
  getSupabaseAdmin,
} from "../database/supabaseAdmin.js";
import { dedupeCapabilities, isForgeRole, primaryRole, type ForgeCapability, type ForgeRole } from "../identity/roleCapabilities.js";

export type ForgeActorRole = ForgeRole;

export interface ForgeActor {
  userId: string;
  role: ForgeActorRole;
  roles: ForgeActorRole[];
  permissionKeys: string[];
  capabilities: ForgeCapability[];
  accountStatus: 'active' | 'restricted' | 'suspended' | 'deactivated';
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

  const { data: assignmentData, error: assignmentError } = await supabase
    .from("forge_user_role_assignments")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("active", true);

  const { data: legacyData, error: legacyError } = await supabase
    .from("forge_user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  if (assignmentError && legacyError) {
    throw new Error(
      `Unable to load Forge role: ${assignmentError.message}`,
    );
  }

  const resolvedRoles: ForgeActorRole[] = [...new Set([...(assignmentData ?? []), ...(legacyData ?? [])]
    .map((row) => row.role)
    .filter((role): role is ForgeActorRole => isForgeRole(role)))];
  const safeRoles: ForgeActorRole[] = resolvedRoles.length > 0 ? resolvedRoles : ['viewer'];

  const { data: permissionData, error: permissionError } = await supabase
    .from('forge_role_permissions')
    .select('permission_key')
    .in('role', safeRoles);
  if (permissionError) throw new Error(`Unable to load Forge permissions: ${permissionError.message}`);

  const { data: statusData, error: statusError } = await supabase
    .from('forge_user_account_status')
    .select('status')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (statusError) throw new Error(`Unable to load Forge account status: ${statusError.message}`);

  const capabilities = dedupeCapabilities((permissionData ?? []).map((row) => row.permission_key));
  return {
    userId: userData.user.id,
    role: primaryRole(safeRoles),
    roles: safeRoles,
    permissionKeys: capabilities,
    capabilities,
    accountStatus: statusData?.status === 'restricted' || statusData?.status === 'suspended' || statusData?.status === 'deactivated' ? statusData.status : 'active',
  };
}
