import { readFileSync } from 'node:fs'
const read = (file) => readFileSync(file, 'utf8')
const checks = [
  ['progression TG parser', read('src/services/playerProgressionService.ts').includes('text.match(/\\bTG\\s*')],
  ['automatic endpoint removed', !/action === 'auto-run'/.test(read('api/giftcodes.ts'))],
  ['login redemption removed', !/\/api\/giftcodes\?action=auto-run/.test(read('src/context/PlayerIdentityContext.tsx'))],
  ['notification migration', /forge_notification_deliveries/.test(read('supabase/migrations/20260720120000_ux004_notifications.sql'))],
  ['structured connection tags', /record\.tags/.test(read('src/features/search/SearchExperience.tsx'))],
  ['benchmark availability', /getBenchmarkAvailability/.test(read('src/render-engine/benchmarks/index.ts'))],
  ['embedded guide', /Render Engine workflow/.test(read('src/features/admin/RenderEngineCalibrationPage.tsx'))],
]
for (const [name, ok] of checks) if (!ok) throw new Error(`UX-004 contract failed: ${name}`)
console.log(`UX-004 contracts passed: ${checks.length}`)
