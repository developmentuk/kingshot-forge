import type { SearchDataset, SearchRecord } from './contracts.js'

export interface SearchProviderContext {
  readonly now: string
}

export interface SearchProvider {
  readonly dataset: SearchDataset
  readonly name: string
  load(context: SearchProviderContext): Promise<readonly SearchRecord[]>
}

export class SearchProviderRegistry {
  private readonly providers = new Map<SearchDataset, SearchProvider>()

  register(provider: SearchProvider): void {
    if (this.providers.has(provider.dataset)) {
      throw new Error(`Search provider "${provider.dataset}" is already registered.`)
    }
    this.providers.set(provider.dataset, provider)
  }

  registerMany(providers: readonly SearchProvider[]): void {
    for (const provider of providers) this.register(provider)
  }

  get(dataset: SearchDataset): SearchProvider | undefined { return this.providers.get(dataset) }
  list(): readonly SearchProvider[] { return [...this.providers.values()].sort((a, b) => a.dataset.localeCompare(b.dataset)) }
}

