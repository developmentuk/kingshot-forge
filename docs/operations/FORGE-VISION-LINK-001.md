# Forge Vision — VISION-LINK-001

Status: MVP implementation complete; owner preview and real-screen accuracy acceptance remain open.

## Journey

The signed-in Player Identity surface now offers an optional screenshot-assisted route. A selected PNG, JPEG, WebP or TIFF is previewed locally, then sent through the existing private Vision evidence service using an owner-bound `scan_source` upload intent. The server verifies the exact object metadata before the OCR adapter reads it.

OCR is provider-neutral at the account-linking boundary. The first adapter is the existing local Tesseract CLI extractor, with bounded input, timeout, health and typed runtime failures. Candidates are limited to the existing identity fields: Player ID, display name and kingdom. Each candidate carries the evidence ID, mapping version, confidence, raw/normalised value, source and warnings.

Candidates are review values only. The user can edit the Player ID or continue with the existing manual-entry form. Explicit confirmation continues through `/api/player/account` and `linkOrRevalidatePlayerAccount`, which remains authoritative for Kingshot lookup, duplicate ownership, existing-primary conflict and the resulting verified state. OCR never writes canonical player data or marks ownership verified.

## Retention and safety

Cancelled or failed pre-completion flows abandon the exact upload intent. Completed evidence follows the existing `scan_source` retention policy; no Storage path or signed URL is exposed as ordinary client state. No prefix, wildcard, `storage.objects` SQL or closed incident cleanup harness is used.

The current implementation deliberately does not claim Kingshot OCR accuracy. Synthetic fixtures cover the parser and adapter boundary; owner-supplied profile screenshots are required for calibration and acceptance. A Vercel preview must have a runtime Tesseract decision before live OCR is accepted.

## Validation

- `npm run test:player-identity` passes, including the no-network OCR adapter test.
- `npm run test:forge-vision-evidence-storage` passes.
- `npm run lint` passes with pre-existing non-fatal warnings.
- `npm run build` passes.
- `npm run check` passes in 133.6 seconds.
- No migration or live Supabase mutation was performed during implementation.

## VISION-LINK-001A corrective pass

The manual Player ID field is now populated immediately when OCR returns a
safe numeric candidate. This only pre-fills the existing form: `Find Player`
and `Link This Player` remain separate explicit actions, and the existing
server-authoritative player-link service remains the source of truth.

Completed account-linking evidence is tracked separately from its upload
intent. Before completion, failures abandon the exact intent. After
completion, cancellation or OCR failure uses the owner-only
`cancel-evidence` operation, which deletes exactly the verified
owner-scoped `scan_source` object through the Storage API, marks the metadata
deleted, and retains an append-only `vision.evidence.owner_cancelled` audit.
The operation is idempotent and rejects other owners, legal holds and
unrelated evidence purposes. Raw OCR text is retained server-side only and
is not returned to the browser.

The Vercel preview reached READY, but authenticated Tesseract runtime health
acceptance remains pending until the preview function can prove executable,
language data, timeout and temporary-file support. No production promotion
or live synthetic acceptance was performed in this corrective code pass.
## VISION-LINK-001C runtime acceptance fixture

The real-runtime acceptance fixture is the deterministic checked-in PNG at
`fixtures/vision/account-linking/synthetic-profile.png`, with expected values
and SHA-256 recorded in its adjacent manifest. It uses ordinary high-contrast
sans-serif text and is explicitly not a real-screen accuracy fixture. The
bundled Tesseract.js integration test loads the PNG rather than feeding
hard-coded parser text, prohibits network fetches, and asserts the actual OCR
Player ID candidate `987654321`. Name `EMBER FOX` and kingdom `42` are
recorded when recognised. The preview handoff remains limited to one
owner-scoped synthetic acceptance followed by exact cancellation.
