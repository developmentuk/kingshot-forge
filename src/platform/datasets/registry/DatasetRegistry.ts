import type { DatasetDefinition } from '../contracts/index.js'

export class DatasetRegistry {
  private readonly definitions = new Map<string, DatasetDefinition>()

  register(definition: DatasetDefinition): void {
    const datasetId = definition.id.trim()

    if (datasetId.length === 0) {
      throw new Error('Dataset definitions require a non-empty id.')
    }

    if (this.definitions.has(datasetId)) {
      throw new Error(`Dataset "${datasetId}" is already registered.`)
    }

    this.definitions.set(datasetId, {
      ...definition,
      id: datasetId,
    })
  }

  registerMany(definitions: readonly DatasetDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition)
    }
  }

  get(datasetId: string): DatasetDefinition | undefined {
    return this.definitions.get(datasetId)
  }

  require(datasetId: string): DatasetDefinition {
    const definition = this.get(datasetId)

    if (!definition) {
      throw new Error(`Dataset "${datasetId}" is not registered.`)
    }

    return definition
  }

  has(datasetId: string): boolean {
    return this.definitions.has(datasetId)
  }

  list(): DatasetDefinition[] {
    return [...this.definitions.values()].sort((first, second) =>
      first.title.localeCompare(second.title),
    )
  }

  clear(): void {
    this.definitions.clear()
  }
}
