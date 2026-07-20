import { diagnoseSearchIndex } from './diagnostics.js'
import { expandRelationships, keyOf } from './relationships.js'
import type { SearchMatch, SearchPermissionContext, SearchQuery, SearchRecord, SearchResponse, SearchVisibility } from './contracts.js'

const PUBLIC_STATUSES = new Set(['published'])

export class SearchEngine {
  private records = new Map<string, SearchRecord>()
  private indexedAt: string | null = null

  index(records: readonly SearchRecord[], now = new Date().toISOString()): void {
    this.records = new Map(records.map((record) => [keyOf(record), record]))
    this.indexedAt = now
  }

  upsert(records: readonly SearchRecord[], now = new Date().toISOString()): void {
    for (const record of records) this.records.set(keyOf(record), record)
    this.indexedAt = now
  }

  invalidate(dataset?: string): void {
    if (!dataset) { this.records.clear(); this.indexedAt = null; return }
    for (const key of this.records.keys()) if (key.startsWith(`${dataset}:`)) this.records.delete(key)
  }

  query(query: SearchQuery = {}): SearchResponse {
    const permissions = query.permissions ?? {}
    const allowed = [...this.records.values()].filter((record) =>
      (query.includeUnpublished === true && permissions.isAdmin === true || PUBLIC_STATUSES.has(record.status)) &&
      canAccess(record.permissions, permissions) &&
      (!query.datasets?.length || query.datasets.includes(record.dataset)) &&
      (!query.tags?.length || query.tags.every((tag) => record.tags.includes(tag))) &&
      (!query.keywords?.length || query.keywords.every((word) => containsAny(record, word))),
    )
    const relationshipRecords = query.relationshipFrom ? this.records.get(query.relationshipFrom) : undefined
    const expanded = relationshipRecords
      ? new Map(expandRelationships(relationshipRecords, this.records, query.relationshipDepth ?? 1, query.relationshipTypes).map((item) => [keyOf(item.record), item]))
      : new Map()
    const results = allowed.map((record): SearchMatch => {
      const reasons: string[] = []
      let score = record.search_weight
      const connection = expanded.get(keyOf(record))
      if (connection) { score += 20 / connection.depth; reasons.push('relationship relevance') }
      if (query.text?.trim()) {
        const term = normalise(query.text)
        const title = normalise(record.title)
        const aliases = (record.aliases ?? []).map(normalise)
        if (title === term) { score += 100; reasons.push('exact title') }
        else if (title.includes(term)) { score += 60; reasons.push('title match') }
        else if (aliases.some((alias) => alias.includes(term))) { score += 45; reasons.push('alias match') }
        else if (containsAny(record, term)) { score += 20; reasons.push('keyword match') }
        else if (fuzzy(term, title)) { score += 10; reasons.push('partial match') }
        else score = -1
      }
      if (score >= 0 && record.status === 'published') { score += 5; reasons.push('published priority') }
      return { record, score, reasons, relationshipType: connection?.relationshipTypes[0], relationshipPath: connection?.path, relationshipExplanation: connection?.explanation }
    }).filter((match) => match.score >= 0).sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    return { query, results: results.slice(0, query.limit ?? 50), indexedAt: this.indexedAt ?? new Date(0).toISOString(), diagnostics: diagnoseSearchIndex([...this.records.values()], this.indexedAt ?? new Date(0).toISOString()) }
  }
}

function normalise(value: string): string { return value.toLocaleLowerCase().trim() }
function containsAny(record: SearchRecord, term: string): boolean { return [record.title, record.subtitle ?? '', record.summary ?? '', ...record.keywords, ...record.tags, ...(record.aliases ?? [])].some((value) => normalise(value).includes(normalise(term))) }
function fuzzy(term: string, value: string): boolean { let cursor = 0; for (const char of normalise(term)) { cursor = value.indexOf(char, cursor); if (cursor < 0) return false; cursor++ } return term.length >= 3 }
function canAccess(permissions: { visibility: SearchVisibility; requiredRoles?: readonly string[]; requiredPermissions?: readonly string[] }, context: SearchPermissionContext): boolean {
  if (permissions.visibility === 'internal' && context.isAdmin !== true) return false
  if (permissions.visibility === 'restricted' && context.isAdmin !== true && !context.userId) return false
  if (permissions.visibility === 'authenticated' && !context.userId && context.isAdmin !== true) return false
  if (permissions.requiredRoles?.some((role) => !context.roles?.includes(role)) && context.isAdmin !== true) return false
  if (permissions.requiredPermissions?.some((permission) => !context.permissions?.includes(permission)) && context.isAdmin !== true) return false
  return true
}

