import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables. Check .env.local.',
  )
}

type SafeAuthStorage = Storage & {
  readonly length: number
  key(index: number): string | null
}

function createSafeStorage(): SafeAuthStorage {
  if (typeof window !== 'undefined') {
    try {
      const storage = window.localStorage
      const probe = '__forge_auth_storage_probe__'
      storage.setItem(probe, '1')
      storage.removeItem(probe)
      return storage
    } catch {
      // Private browsing and restricted embedded contexts can deny storage.
    }
  }

  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

// Phase 2A owns the callback exchange explicitly in /auth/callback. Keeping
// detectSessionInUrl disabled prevents Supabase and the route from exchanging
// the same authorization code twice.
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: createSafeStorage(),
    },
  },
)
