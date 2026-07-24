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
