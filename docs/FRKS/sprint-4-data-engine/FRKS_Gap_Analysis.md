# FRKS Gap Analysis — Sprint 4 Data Engine

## Architecture gaps

The foundation exists, but the end-to-end governed operation is incomplete. The registry and runner can support preview-style processing, yet the conversation does not establish a complete evidence-staging schema, immutable version integration, transactional database apply function, capability contract or publication adapter.

The current Forge constitution is stricter than the earliest Sprint 4 design. A direct source-to-heroes-table sync would now violate the required lifecycle of discovery, import, normalisation, review, verification and publication. Implementation must therefore integrate with the Editorial Intelligence and Editorial Platform domains rather than introduce a second publication path.

## Missing implementation

- Hero dataset validation and normalisation module in its final location.
- Read-only preview endpoint.
- Import source registry and import-run persistence.
- Raw payload or evidence snapshot retention.
- Dataset-level concurrency lock.
- Transactional apply operation.
- Server-side admin capability enforcement.
- Status, history and failure-detail endpoints.
- Vercel Cron route and secret verification.
- Browser API client replacing direct Supabase catalogue writes.
- End-to-end admin workflow and mobile validation.
- Tests for malformed envelopes, empty arrays, duplicate keys, timeouts, unchanged payloads and partial failures.

## Dataset gaps

### Heroes
The supplied source includes 27 records and useful provenance, but combat tier fields are editorial. Skills, widgets, exclusive gear, portraits and newer generations are outside the source. Current Forge hero requirements therefore exceed this dataset.

### Hero XP
XP values are stronger than deployment capacity values. Capacity levels 16–80 are marked estimated and require verification.

### Shards
The entire shard ladder is community-estimated with a source score of 45. It must not be published as verified data.

### Troops
The metadata describes T1–T12, while the supplied visible data covers only T1–T5 across three troop types. Completeness and naming require review: the source uses lancer/marksman while other Forge discussions have used cavalry/archer.

### Buildings
Only five core buildings are represented. Building prerequisites, effects, Truegold stages and the wider catalogue require separate governed datasets. One Town Center row is explicitly estimated.

### Governor Gear
Green through Red T2 is strongly corroborated. Red T3–T4 has source conflict; Red T5–T6 lacks independent confirmation.

### Masters
Roster and roles are comparatively strong. Total power and manuscript figures conflict materially between sources, and Cassia's skill list is incomplete.

### Events
Five recurrence examples are insufficient for a full Operations Calendar. Event timing is live and must support exceptions, state age, cadence changes and editorial overrides.

### War Academy
The source is single-source and claims Cavalry and Archer costs mirror Infantry. This needs independent or in-game verification.

## Documentation gaps

- A single canonical Data Engine document did not previously exist.
- No formal dataset module contract existed.
- The distinction between source confidence, workflow status and publication readiness needed explicit documentation.
- The meaning of “sync” was ambiguous and risked bypassing review.
- No retention policy exists for raw payloads and snapshots.
- No documented API error contract or operation-state machine exists yet.

## Human review required

1. Confirm the ADR does not conflict with newer Editorial Platform implementation details.
2. Decide whether the dataset operation uses existing editorial source/evidence tables or requires additions.
3. Approve the final capability name for manual data operations.
4. Verify that any historically exposed Supabase secret has been rotated.
5. Decide retention duration and storage limits for raw snapshots.
6. Validate all low-confidence datasets before public use.

## Recommended priorities

1. Align the hero operation with existing editorial and publication services.
2. Implement preview without mutation.
3. Design and review persistence migrations.
4. Implement transactional stage/apply with immutable audit history.
5. Replace browser-side writes.
6. Complete hero validation before expanding to additional datasets.
