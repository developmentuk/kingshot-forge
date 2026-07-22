import fs from 'node:fs'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)] }))
const client = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const hash = value => value == null ? null : crypto.createHash('sha256').update(value, 'utf8').digest('hex')
const { data, error } = await client.from('community_art_submissions').select('id,title,status,raw_source_text,raw_source_sha256,normalised_text,approved_copy_payload,repair_operations,character_count,line_count,created_at').order('created_at', { ascending: true })
if (error) throw error
const findings = []
for (const row of data ?? []) {
  const raw = row.raw_source_text ?? null
  const approved = row.approved_copy_payload ?? null
  const operations = Array.isArray(row.repair_operations) ? row.repair_operations : []
  const differs = raw !== null && approved !== null && raw !== approved
  if (differs) findings.push({ id: row.id, title: row.title, status: row.status, issue: 'approved_payload_differs_from_raw_source', raw_sha256: hash(raw), approved_sha256: hash(approved), explicit_moderator_approval: operations.some(operation => operation?.kind === 'moderator-confirmed' && operation?.userApproved === true) })
  if (row.raw_source_sha256 && raw && row.raw_source_sha256 !== hash(raw)) findings.push({ id: row.id, title: row.title, issue: 'raw_source_hash_mismatch' })
  if (raw !== null && row.normalised_text !== raw) findings.push({ id: row.id, title: row.title, issue: 'normalised_text_differs_from_raw_source', line_ending_only: raw.replace(/\r\n?/g, '\n') === String(row.normalised_text ?? '').replace(/\r\n?/g, '\n') })
  if (raw !== null && row.character_count !== Array.from(raw).length) findings.push({ id: row.id, title: row.title, issue: 'character_count_differs' })
  if (raw !== null && row.line_count !== raw.split('\n').length) findings.push({ id: row.id, title: row.title, issue: 'line_count_differs' })
}
const report = { generated_at: new Date().toISOString(), read_only: true, submission_count: data?.length ?? 0, findings, remediation: findings.map(item => ({ id: item.id, action: 'owner_review_only', automatic_rewrite: false })) }
fs.writeFileSync('artifacts/art002l-existing-submission-audit.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ submissionCount: report.submission_count, findingCount: findings.length, result: findings.length ? 'REVIEW_REQUIRED' : 'PASS' }))
