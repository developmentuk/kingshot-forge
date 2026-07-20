import type { RelationshipType, SearchRecord } from './contracts.js'

export interface RelationshipExpansion {
  readonly record: SearchRecord
  readonly depth: number
  readonly path: readonly string[]
  readonly relationshipTypes: readonly RelationshipType[]
  readonly explanation?: string
}

export function expandRelationships(
  start: SearchRecord,
  records: ReadonlyMap<string, SearchRecord>,
  depth = 1,
  relationshipTypes?: readonly RelationshipType[],
): readonly RelationshipExpansion[] {
  const result: RelationshipExpansion[] = []
  const visited = new Set<string>([keyOf(start)])
  const walk = (current: SearchRecord, currentDepth: number, path: string[]) => {
    if (currentDepth > depth) return
    for (const relationship of current.relationships) {
      if (relationshipTypes?.length && !relationshipTypes.includes(relationship.type)) continue
      const target = records.get(`${relationship.targetDataset}:${relationship.targetId}`)
      if (!target) continue
      const targetKey = keyOf(target)
      if (visited.has(targetKey)) continue
      visited.add(targetKey)
      const nextPath = [...path, targetKey]
      result.push({ record: target, depth: currentDepth, path: nextPath, relationshipTypes: [relationship.type], explanation: relationship.label })
      walk(target, currentDepth + 1, nextPath)
    }
  }
  walk(start, 1, [keyOf(start)])
  return result
}

export function keyOf(record: Pick<SearchRecord, 'dataset' | 'id'>): string {
  return `${record.dataset}:${record.id}`
}

