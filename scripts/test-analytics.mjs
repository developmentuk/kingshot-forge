import { readFile } from 'node:fs/promises'
const analytics = await readFile('src/platform/analytics/analytics.ts', 'utf8')
const migration = await readFile('supabase/migrations/20260720211624_rel005_analytics.sql', 'utf8')
for (const event of ['page_view', 'search_query', 'api_error', 'javascript_error', 'publication_completed']) if (!analytics.includes(`'${event}'`)) throw new Error(`Missing analytics event: ${event}`)
for (const required of ['enable row level security', 'revoke all', 'session_hash', 'properties jsonb']) if (!migration.toLowerCase().includes(required)) throw new Error(`Analytics migration missing safety contract: ${required}`)
console.log('Analytics foundation contract checks passed.')
