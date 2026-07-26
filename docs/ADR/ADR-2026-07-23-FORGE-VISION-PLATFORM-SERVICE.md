# ADR — Forge Vision as a permanent platform service

Date: 23 July 2026  
Status: Accepted for VISION-001 foundation  
Decision owners: Clark and Aegis

## Context

Forge needs to understand Kingshot screenshots and convert visual evidence into trusted structured proposals. A narrow OCR feature or a collection of screen-specific parsers would hard-code layouts, couple domains to one engine, weaken provenance and make every Kingshot UI change a code deployment.

The existing VISION-001 branch began with a Governor Profile/API-fallback framing and seeded player-specific fields. The programme has since been elevated to a permanent shared Forge Platform Service with no screen-specific implementation in its foundation.

The supplied Tesseract archive is a full upstream native source checkout without trained-language data. It is useful as a pinned source reference but is not an appropriate browser or Vercel application dependency.

## Decision

1. Establish **Forge Vision** as a provider-neutral shared platform service.
2. Treat screen types, mapping versions, regions, anchors, field targets, extractor bindings, transforms, validation overrides and thresholds as governed data authored through Vision Studio.
3. Use the existing Forge Field Registry boundary. Mappings may target only enabled registry keys and registered server proposal operations.
4. Make published mapping versions and their children immutable. Changes create draft successors.
5. Define one extractor plugin protocol spanning OCR, computer vision and AI vision, with primary, fallback and comparison bindings.
6. Preserve an immutable evidence envelope for every extraction attempt, including source screenshot identity, regions/boxes, raw output, plugin and engine versions, confidence, validation, conflict and timestamp.
7. Keep confidence, validation, conflict resolution and user confirmation as separate stages. No stage may silently bypass another.
8. Implement Tesseract first as `ocr.tesseract.cli`, an isolated local-worker plugin invoked without a shell. Do not vendor the supplied archive into the web application.
9. Keep screenshot evidence private, purpose-bound and retention-controlled.
10. Seed no screen-specific mappings or player-specific fields in the platform foundation.
11. Keep the connected Supabase project unchanged until migration application is explicitly approved.

## Consequences

### Positive

- Forge can add EasyOCR, PaddleOCR, OpenCV, template matching and AI providers without changing domain contracts.
- Kingshot layout changes become governed mapping versions rather than emergency code edits.
- Every proposed value remains explainable and auditable.
- Tesseract provides a zero-recurring-cost first path without becoming a permanent dependency.
- Domains retain authority over their own validation, permissions and persistence.

### Costs and constraints

- A worker protocol, private evidence pipeline and Vision Studio authoring surface are required before production extraction.
- Native Tesseract deployment and traineddata provisioning are separate operational work.
- The platform carries more governance than a one-off OCR script, but that cost prevents duplicated scanners and untraceable writes.
- No screen-specific user value is claimed by VISION-001A alone.

## Rejected alternatives

### Hard-code coordinates in React or server functions

Rejected because layouts cannot be versioned or maintained safely through Admin and every UI change requires a deployment.

### Depend directly on Tesseract throughout Forge

Rejected because one engine cannot satisfy all future text, icon, colour, template, feature and AI-vision needs.

### Vendor `tesseract.zip` into the repository or browser bundle

Rejected because it is a large native source checkout with Git history, no traineddata and no browser-ready runtime. It would increase supply-chain and deployment complexity without providing a working service.

### Allow mappings to name tables, columns, SQL or custom code

Rejected because it bypasses Forge Field Registry governance, domain ownership, server authority and audit controls.

### Let high confidence automatically write or verify data

Rejected because confidence is not verification and cannot replace validation, conflict handling or confirmation.

## Follow-up

- Complete VISION-001A contract and UI validation.
- Build the extractor host, crop/preprocessing boundary and pinned local Tesseract worker in VISION-001B.
- Apply the migration only after explicit approval, preflight and live RLS/advisor review.
- Preserve this decision and the archive inspection in FRKS.
