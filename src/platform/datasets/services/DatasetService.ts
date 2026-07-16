import type {
  DatasetCapabilityFlags,
  DatasetCategory,
  DatasetDefinition,
} from '../contracts/index.js'

export interface DatasetDefinitionSource {
  get(datasetId: string): DatasetDefinition | undefined
  require(datasetId: string): DatasetDefinition
  has(datasetId: string): boolean
  list(): DatasetDefinition[]
}

export interface DatasetQuery {
  category?: DatasetCategory
  capability?: keyof DatasetCapabilityFlags
  tag?: string
}

export class DatasetService {
  private readonly source: DatasetDefinitionSource

  constructor(source: DatasetDefinitionSource) {
    this.source = source
  }

  get(datasetId: string): DatasetDefinition | undefined {
    return this.source.get(datasetId)
  }

  require(datasetId: string): DatasetDefinition {
    return this.source.require(datasetId)
  }

  has(datasetId: string): boolean {
    return this.source.has(datasetId)
  }

  list(query: DatasetQuery = {}): DatasetDefinition[] {
    return this.source.list().filter((definition) =>
      this.matchesQuery(definition, query),
    )
  }

  supports(
    datasetId: string,
    capability: keyof DatasetCapabilityFlags,
  ): boolean {
    const definition = this.get(datasetId)

    return definition?.capabilities?.[capability] === true
  }

  private matchesQuery(
    definition: DatasetDefinition,
    query: DatasetQuery,
  ): boolean {
    if (
      query.category !== undefined &&
      definition.category !== query.category
    ) {
      return false
    }

    if (
      query.capability !== undefined &&
      definition.capabilities?.[query.capability] !== true
    ) {
      return false
    }

    if (
      query.tag !== undefined &&
      !definition.tags?.includes(query.tag)
    ) {
      return false
    }

    return true
  }
}
