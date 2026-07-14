export interface ServerEnvironmentStatus {
  supabaseUrlConfigured: boolean
  supabaseServerKeyConfigured: boolean
}

export function getServerEnvironmentStatus(): ServerEnvironmentStatus {
  return {
    supabaseUrlConfigured:
      Boolean(process.env.SUPABASE_URL?.trim()),

    supabaseServerKeyConfigured:
      Boolean(
        process.env.SUPABASE_SECRET_KEY?.trim() ||
          process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      ),
  }
}