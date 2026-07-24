import { VisionEvidenceStorageService } from '../evidenceStorageService.js'
import { createSupabaseVisionEvidenceProvider } from './supabaseVisionEvidenceProvider.js'
import { createSupabaseVisionEvidenceRepository } from './supabaseVisionEvidenceRepository.js'

export function createSupabaseVisionEvidenceStorageService(): VisionEvidenceStorageService {
  return new VisionEvidenceStorageService({ repository: createSupabaseVisionEvidenceRepository(), provider: createSupabaseVisionEvidenceProvider() })
}
