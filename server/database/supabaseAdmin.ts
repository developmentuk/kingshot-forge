import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

function readRequiredEnvironmentVariable(
  name: string,
): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(
      `Missing required server environment variable: ${name}`,
    )
  }

  return value
}

function readSupabaseServerKey(): string {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim()

  if (secretKey) {
    return secretKey
  }

  const legacyServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (legacyServiceRoleKey) {
    return legacyServiceRoleKey
  }

  throw new Error(
    'Missing Supabase server credential. Configure SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.',
  )
}

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl =
    readRequiredEnvironmentVariable(
      'SUPABASE_URL',
    )

  const supabaseServerKey =
    readSupabaseServerKey()

  adminClient = createClient(
    supabaseUrl,
    supabaseServerKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  )

  return adminClient
}