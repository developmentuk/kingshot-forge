import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { SupabaseSearchProjectionRepository } from '../../src/platform/persistence/supabase/SupabaseSearchProjectionRepository.js'
import { InMemorySearchProjectionRepository } from '../../shared/search/inMemoryRepository.js'
import type { SearchProjectionRepository } from '../../shared/search/persistence.js'

let repository: SearchProjectionRepository | null = null
export function getSearchProjectionRepository(): SearchProjectionRepository {
  if (repository) return repository
  repository = process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? new SupabaseSearchProjectionRepository(getSupabaseAdmin()) : new InMemorySearchProjectionRepository()
  return repository
}

