# Data Engine Framework Review

## Current strengths

- Central dataset registry
- Consistent importer interface
- Separate fetch, parse, normalise and record-key concepts
- Payload hashing
- Duplicate record-key detection
- Shared source metadata
- Thirteen registered datasets
- Thin preview/load operations

The current external datasets carry useful provenance, confidence and licensing metadata, which should remain first-class platform data. For example, the supplied sources distinguish verified, estimated and editorial confidence rather than presenting every value as equally authoritative. fileciteturn0file0L1-L1 fileciteturn0file2L1-L1 fileciteturn0file4L1-L1

## Current limitations

- Registry erases dataset-specific types to `unknown`.
- Runtime validation relies on manual parsing rather than a common schema library.
- Fetch and normalisation are coupled to immediate HTTP requests.
- Preview and load duplicate validation logic.
- Only Heroes has a visible persistent import path.
- Import staging, comparisons, review and publication are incomplete.
- No retry, timeout policy, conditional fetch or circuit-breaker convention.
- No structured operational logging or correlation ID.
- Dataset support is repeated in multiple endpoint sets and client unions.

## Target pipeline

`discover → fetch → verify transport → parse → validate source schema → normalise → validate domain schema → diff → stage → review → approve → publish`

## Target contracts

```ts
interface DatasetDefinition<TSource, TRecord> {
  key: DatasetKey;
  schemaVersion: number;
  source: SourceAdapter<TSource>;
  sourceSchema: Schema<TSource>;
  recordSchema: Schema<TRecord>;
  normalise(source: TSource): NormalisedDataset<TRecord>;
  identity(record: TRecord): string;
  compare(previous: TRecord, next: TRecord): ChangeSet;
}
```

The registry must preserve the relation between dataset key and record type through a dataset map, not collapse all records to `unknown`.

## Operational requirements

- configurable timeout and retry with backoff
- source ETag/Last-Modified support where available
- payload size limit
- content-type validation
- idempotent import run
- per-stage timings and counts
- safe error classification
- retained raw payload reference or hash
- actor/trigger attribution
- manual rerun and cancellation semantics

## Data quality

Provenance, canonical URL, verification date, confidence and licence must be retained. Editorial values and estimates must be visually distinct in the CMS and public product where material. The source data demonstrates why this matters: hero tiers are editorial, some troop/building values are estimated, and Masters values contain acknowledged source conflicts. fileciteturn0file1L1-L1 fileciteturn0file8L1-L1 fileciteturn0file9L1-L1

Hero Skills adds a stricter evidence gate: source identity, retrieval, digest, version, permitted-use decision, attribution, reviewer and record-level approval are mandatory before canonical promotion. Scrape confidence and structural completeness do not satisfy that gate. Structured progression and unlocks are child facts with independent evidence and verification rather than fields inferred from maximum level or display text.

## Recommendation

Keep the registry/importer concept. Refactor it into a typed package and add staging/publication instead of replacing it.
