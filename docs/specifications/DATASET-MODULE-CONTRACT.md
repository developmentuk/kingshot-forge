# Dataset Module Contract

## Purpose

A dataset module describes one governed external dataset to the Forge Data Engine. It contains source-specific rules but does not own HTTP routing, authentication, privileged credentials, scheduling or publication.

## Required identity

Every module must declare:

- `key`: stable `DatasetKey` value;
- `title`: human-readable title;
- `version`: module contract version;
- `source`: source identity and acquisition configuration;
- `allowEmpty`: explicit empty-source policy, default false;
- `operations`: supported operations.

## Required behaviour

```ts
interface DatasetModule<TPayload, TRecord> {
  readonly key: DatasetKey
  readonly title: string
  readonly version: string
  readonly source: DatasetSource
  readonly allowEmpty?: boolean
  readonly operations: readonly DatasetOperation[]

  parsePayload(input: unknown): TPayload
  normalisePayload(payload: TPayload, context: DatasetContext): NormalisedDataset<TRecord>
  getRecordKey(record: TRecord): string
}
```

The exact TypeScript shape may evolve, but these responsibilities are binding.

## Source contract

A source definition must support:

- canonical source identifier;
- URL or acquisition adapter;
- expected content type;
- timeout;
- attribution and licence notes where known;
- source reliability metadata;
- schedule eligibility;
- optional source-specific headers that contain no secrets in client code.

## Parsing rules

`parsePayload` must:

- accept `unknown`;
- validate the source envelope;
- reject non-object or otherwise invalid top-level payloads;
- reject missing required collections;
- reject an empty collection unless `allowEmpty` is true;
- retain source metadata rather than silently discarding it;
- return a typed source payload or throw a structured validation error.

## Normalisation rules

`normalisePayload` must:

- convert source fields into canonical Forge candidate fields;
- preserve source metadata, provenance and confidence;
- normalise whitespace, enums, booleans and numbers predictably;
- avoid inventing values that the source does not support;
- distinguish facts from editorial judgements;
- produce deterministic output for the same payload and module version;
- never perform database writes.

## Stable record keys

`getRecordKey` must return a non-empty, deterministic Forge-owned key. Display names may seed a slug only when the resulting key becomes an explicit immutable contract. Duplicate keys reject the complete operation.

## Normalised result

A normalised dataset should contain:

```ts
interface NormalisedDataset<TRecord> {
  metadata: DatasetSourceMetadata | null
  records: TRecord[]
  warnings?: DatasetWarning[]
  completeness?: DatasetCompleteness
}
```

## Validation levels

Modules should support:

1. Envelope validation.
2. Record structural validation.
3. Cross-record validation, including duplicate keys.
4. Completeness validation.
5. Domain validation.
6. Provenance and confidence validation.

Errors block Stage and Apply. Warnings remain visible and may block publication according to dataset policy.

## Confidence

Confidence may exist at dataset, record and field level. It must include rationale when material. Confidence is evidence strength, not workflow state.

Recommended bands follow `docs/AEGIS.md`:

- 95–100 Verified
- 85–94 Confirmed
- 70–84 Likely
- 50–69 Estimated
- 0–49 Tentative

## Supported operations

Canonical operation values are:

```ts
type DatasetOperation = 'preview' | 'stage' | 'apply' | 'review' | 'publish' | 'rollback'
```

A module declares support, but the shared platform executes and authorises operations.

## Error contract

Dataset errors should include:

- stable error code;
- dataset key;
- operation;
- human-readable message;
- optional record key or source index;
- severity;
- safe details suitable for admin display;
- internal cause retained in server logs only.

Secrets and raw database errors must not be returned to the browser.

## Testing contract

Every dataset module requires fixtures for:

- valid payload;
- malformed envelope;
- missing collection;
- empty collection;
- invalid record;
- duplicate key;
- unknown optional fields;
- source metadata absence;
- deterministic normalisation;
- confidence and provenance preservation.

## Hero module requirements

The first module must specifically:

- accept the `_meta` plus `heroes` envelope;
- preserve canonical URL, source update date, verification and confidence metadata;
- generate stable hero keys;
- distinguish factual identity fields from editorial tier ratings;
- reject structurally invalid records and duplicate keys;
- avoid publication or direct Supabase mutation from the module itself.
