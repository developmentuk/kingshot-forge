import { keyOf } from './relationships.js'
import type { SearchDiagnostics, SearchRecord } from './contracts.js'

export function diagnoseSearchIndex(records: readonly SearchRecord[], indexedAt: string): SearchDiagnostics {
  const seen = new Set<string>()
  const coverage: Record<string, number> = {}
  let duplicates = 0
  let relationships = 0
  let broken = 0
  let permissionMismatches = 0
  const byKey = new Map(records.map((record) => [keyOf(record), record]))
  for (const record of records) {
    const key = keyOf(record)
    if (seen.has(key)) duplicates++
    seen.add(key)
    coverage[record.dataset] = (coverage[record.dataset] ?? 0) + 1
    relationships += record.relationships.length
    if (record.status === 'published' && record.published_at === null) permissionMismatches++
    for (const relationship of record.relationships) {
      if (!byKey.has(`${relationship.targetDataset}:${relationship.targetId}`)) broken++
    }
  }
  return {
    recordsIndexed: records.length,
    relationshipsIndexed: relationships,
    orphanedRecords: records.filter((record) => record.relationships.length === 0).length,
    brokenReferences: broken,
    duplicateIdentifiers: duplicates,
    relationshipCycles: countCycles(records),
    permissionMismatches,
    indexFreshness: indexedAt,
    datasetCoverage: coverage,
  }
}

function countCycles(records: readonly SearchRecord[]): number {
  const graph = new Map(records.map((record) => [keyOf(record), record.relationships.map((r) => `${r.targetDataset}:${r.targetId}`)]))
  let cycles = 0
  const visit = (node: string, path: Set<string>) => {
    if (path.has(node)) { cycles++; return }
    const next = graph.get(node)
    if (!next) return
    const nextPath = new Set(path).add(node)
    for (const child of next) visit(child, nextPath)
  }
  for (const node of graph.keys()) visit(node, new Set())
  return cycles
}

