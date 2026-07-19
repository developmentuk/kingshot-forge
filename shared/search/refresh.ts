import type { SearchProvider } from './providers.js'
import { buildSearchProjection, relationshipProjectionIsValid } from './projectionBuilder.js'
import type { SearchRecord } from './contracts.js'
import type { SearchProjectionRepository, SearchRefreshFailure, SearchRefreshMode, SearchRefreshRun } from './persistence.js'

export class SearchProjectionRefreshService {
  constructor(private readonly repository: SearchProjectionRepository, private readonly providers: { get(dataset: string): SearchProvider | undefined }) {}

  async refresh(mode: SearchRefreshMode, datasets: readonly string[], recordIds?: readonly string[]): Promise<SearchRefreshRun> {
    const startedAt = new Date().toISOString(); const startMs = Date.now(); const failures: SearchRefreshFailure[] = []
    let inspected = 0; let inserted = 0; let updated = 0; let unchanged = 0; let removed = 0; let relationshipsInserted = 0; let relationshipsRemoved = 0
    for (const dataset of datasets) {
      const provider = this.providers.get(dataset)
      if (!provider) { failures.push({ dataset, code: 'provider_not_found', message: `No provider is registered for ${dataset}.` }); continue }
      let records: readonly SearchRecord[]
      try { records = await provider.load({ now: startedAt }) } catch (error) { failures.push({ dataset, code: 'provider_failed', message: error instanceof Error ? error.message : 'Provider failed.' }); continue }
      const accepted = new Set<string>(); const projections = []
      for (const record of records) {
        if (recordIds?.length && !recordIds.includes(record.id)) continue
        inspected++; const relationships = record.relationships.filter(relationshipProjectionIsValid); const built = buildSearchProjection(record, startedAt, relationships)
        if (!built.projection) { failures.push({ dataset, record_id: record.id, ...built.failure! }); continue }
        accepted.add(record.id); projections.push(built.projection)
      }
      const counts = await this.repository.bulkUpsertProjections(projections); inserted += counts.inserted; updated += counts.updated; unchanged += counts.unchanged
      if (mode === 'full' || mode === 'dataset' || (mode === 'record' && Boolean(recordIds?.length))) {
        const existing = await this.repository.listProjections({ dataset }); const stale = existing.filter((projection) => !accepted.has(projection.source_record_id))
        for (const projection of stale) if (await this.repository.deleteProjection(projection.projection_id)) removed++
      }
      for (const projection of projections) { const relationCounts = await this.repository.replaceRelationships(projection.projection_id, projection.relationships); relationshipsInserted += relationCounts.inserted; relationshipsRemoved += relationCounts.removed }
    }
    const finishedAt = new Date().toISOString(); const metadata = await this.repository.readIndexMetadata(); const nextMetadata = { ...metadata, index_version: metadata.index_version + 1, projection_count: (await this.repository.listProjections()).length, relationship_count: (await this.repository.listRelationships()).length, last_successful_refresh: failures.length ? metadata.last_successful_refresh : finishedAt, last_failed_refresh: failures.length ? finishedAt : metadata.last_failed_refresh, stale: failures.length > 0 }
    await this.repository.updateIndexMetadata(nextMetadata)
    const run: SearchRefreshRun = { run_id: `search-refresh-${startMs}`, mode, datasets_requested: datasets, records_inspected: inspected, records_inserted: inserted, records_updated: updated, records_unchanged: unchanged, records_removed: removed, relationships_inserted: relationshipsInserted, relationships_removed: relationshipsRemoved, failures, started_at: startedAt, finished_at: finishedAt, duration_ms: Date.now() - startMs, resulting_index_version: nextMetadata.index_version }
    await this.repository.recordRefreshRun(run); for (const failure of failures) await this.repository.recordRefreshError(failure, finishedAt); return run
  }
}

