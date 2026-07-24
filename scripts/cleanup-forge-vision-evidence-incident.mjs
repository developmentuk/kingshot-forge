import { runVisionIncidentCleanup, VISION_INCIDENT } from '../server/vision/evidenceIncidentCleanup.ts'

const execute = process.argv.includes('--execute')
const result = await runVisionIncidentCleanup({
  execute,
  approval: process.env.FORGE_VISION_EVIDENCE_INCIDENT_APPROVED === 'true',
  projectRef: process.env.FORGE_VISION_EVIDENCE_INCIDENT_PROJECT_REF,
  repositorySha: process.env.FORGE_VISION_EVIDENCE_INCIDENT_REPOSITORY_SHA,
  checkpoint: process.env.FORGE_VISION_EVIDENCE_INCIDENT_CHECKPOINT,
  providerCredentialExpiresAt: process.env.FORGE_VISION_EVIDENCE_INCIDENT_PROVIDER_CREDENTIAL_EXPIRES_AT,
  providerCreatedAt: process.env.FORGE_VISION_EVIDENCE_INCIDENT_PROVIDER_CREATED_AT,
})
console.log(JSON.stringify({ incident: VISION_INCIDENT, ...result }, null, 2))
