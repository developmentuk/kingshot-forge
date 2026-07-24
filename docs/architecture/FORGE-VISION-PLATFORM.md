# Forge Vision Platform Service

Status: VISION-001 architecture baseline  
Owner: Kingshot Forge  
Working branch: `feature/vision-mapper`

## Purpose

Forge Vision is the shared visual-intelligence platform service for Kingshot Forge. It converts authorised screenshot evidence into governed, reviewable data proposals.

Forge Vision is not an OCR feature and no Forge domain may depend directly on one OCR engine. OCR, computer-vision and AI-vision engines are interchangeable extractor plugins behind one platform contract.

A visual extraction is evidence, not canonical truth. It cannot prove account ownership, bypass validation, publish a dataset, or write directly to a domain table.

## Platform position

Forge Vision belongs to the shared Forge platform layer and follows the same dependency direction as every other governed service:

```text
Vision Studio / authorised product flow
              ↓
      Forge Vision service
              ↓
       Mapping resolver
              ↓
  Extractor plugin orchestration
              ↓
 Confidence → Validation → Conflict
              ↓
      User/editor confirmation
              ↓
 Registered domain proposal operation
              ↓
       Forge Data / domain service
```

The service supplies structured proposals and evidence envelopes. The owning domain decides whether and how a confirmed proposal becomes domain data.

## Non-negotiable boundaries

1. Screen layouts, anchors, regions, mappings, validation overrides and extractor choices are governed data, never application constants.
2. Mappings target enabled Forge Field Registry keys only.
3. Published mapping versions are immutable. A Kingshot UI change creates a draft successor.
4. Extractors are plugins. A mapping may define primary, fallback and comparison plugins.
5. Every extracted value retains confidence, provenance, validation, conflict and screenshot evidence.
6. Raw screenshots remain private, purpose-bound and retention-controlled.
7. Screenshot extraction never silently mutates canonical or player data.
8. User confirmation does not erase the original extractor output or correction history.
9. No plugin accepts arbitrary executable paths, shell fragments, SQL, table names, column names or authored code from a mapping.
10. No screen-specific mapping is part of the VISION-001 platform foundation.

## Extractor plugin contract

Every plugin publishes a manifest with:

- stable plugin key;
- extractor family: OCR, computer vision or AI vision;
- execution mode;
- engine and plugin versions;
- supported MIME types;
- declared capabilities;
- a governed configuration schema;
- cost profile and availability status.

Every extraction returns:

- candidate value;
- raw text or raw payload where available;
- engine confidence;
- token or feature-level bounding boxes;
- diagnostics;
- plugin, engine, version, configuration and execution timestamp provenance.

The plugin registry rejects duplicate or invalid manifests. Runtime availability is independent of mapping persistence so an unavailable engine can be disabled or replaced without rewriting a published mapping.

## Execution modes

The platform contract supports:

- `local_worker` — zero-recurring-cost native tooling run outside the browser;
- `server_worker` — a managed Forge worker or container;
- `external_api` — a metered provider behind a server-only adapter;
- `browser_worker` — a sandboxed client worker where privacy and capability permit it.

Execution placement is an operational decision, not a mapping concern.

## Tesseract integration decision

The supplied `tesseract.zip` is a full upstream Tesseract source checkout, not a ready Forge runtime package. Inspection identified:

- upstream repository: `tesseract-ocr/tesseract`;
- inspected commit: `b34d7a8d7f25cada5f753d9ca68d0c2ed3056850`;
- source line: Tesseract 5.5.2 plus later commits;
- licence: Apache-2.0;
- no trained-language `.traineddata` files;
- Git history and native build sources that should not be shipped inside the Forge web application.

Forge therefore does not vendor the archive or couple application code to its source tree. The first adapter is `ocr.tesseract.cli`, implemented as a local-worker plugin that invokes an installed, pinned Tesseract executable with `execFile`, never a shell. The executable and traineddata paths are server/worker configuration. Mapping authors may choose only allowlisted OCR settings such as language, page-segmentation mode, OCR-engine mode, spacing preservation and a bounded character whitelist.

The adapter requests TSV output to preserve text, word confidence and word boxes. The crop/preprocessing pipeline supplies the configured image region to the plugin; the plugin does not own screen layout or coordinates.

This gives Forge a zero-recurring-cost first extractor while preserving the same contract for EasyOCR, PaddleOCR, OpenCV, template matching and future vision providers.

## Configurable mapping model

A screen type is a stable semantic identity, not a coordinate layout. It may have many mapping versions across game versions and layout families.

A mapping version contains:

- screen type and optional game version;
- layout family and recognition rules;
- normalised regions from 0 to 1;
- optional anchor relationships;
- governed field mappings;
- detection method;
- primary, fallback and comparison extractor bindings;
- transforms and validation overrides;
- required/optional state;
- confidence threshold;
- evidence-retention policy.

Lifecycle:

```text
Draft → Testing → Published → Deprecated
```

Only published mappings may be selected by consumer workflows. Publishing is a named server-authoritative operation. Published and deprecated mapping content, regions, extractor bindings, region bindings, reference evidence and test cases cannot be edited or deleted.

## Forge Field Registry

The Field Registry separates visual recognition from domain persistence. Every enabled field declares:

- field key, label and owning domain/service;
- value type and validation schema;
- screenshot-import permission;
- confirmation requirement;
- conflict policy and freshness expectation;
- visibility and sensitivity;
- registered proposal operation.

Mappings cannot contain arbitrary write targets. A confirmed proposal is passed to the registered server operation of the owning domain, which remains responsible for authorisation, invariants, auditing and persistence.

VISION-001 seeds no screen-specific fields. Existing and future governed Forge fields are registered through their owning domain workflow.

## Evidence model

For every extraction attempt Forge can answer: **Why do we believe this value is correct?**

The immutable evidence envelope records:

- field key and extracted value;
- scan run, mapping and immutable mapping version;
- source screenshot identity and SHA-256 digest;
- source region and token/feature bounding boxes;
- raw OCR text and structured raw payload;
- plugin key, plugin version, engine name and engine version;
- effective extractor configuration;
- confidence score, model version, contributions and rationale;
- validation status and rule results;
- conflict status and comparison detail;
- extraction timestamp.

Corrections and audit events are append-only. Deleting retained screenshot bytes does not delete the minimum governed audit metadata required to explain a past decision.

## Confidence engine

Confidence is an explainable decision-support signal, not verification. The initial deterministic model combines available contributions from:

- extractor confidence;
- screen recognition;
- region or anchor recognition;
- expected value format;
- governed validation outcome.

Missing contributions are omitted rather than fabricated. A failed validation is blocking even when the numerical confidence is high. The result is one of:

- accepted for review;
- review required;
- blocked;
- unavailable.

Every result stores the model version and human-readable rationale so future model changes do not rewrite historical meaning.

## Validation and conflict contracts

Validation runs against the Field Registry schema plus narrower mapping-level overrides. The foundation supports required/nullability, type, range, length, pattern and controlled-enumeration rules without allowing custom authored code.

Conflict resolution is separate from confidence and validation. The owning field declares one of the governed policies:

- review;
- block;
- newest confirmed;
- existing value wins.

A conflict remains visible in evidence even after a user or editor resolves it.

## Persistence foundation

The VISION-001 migration defines:

- field registry;
- extractor plugin registry;
- screen types and immutable mapping versions;
- private evidence images and mapping references;
- regions, field mappings, extractor bindings and region bindings;
- test cases and append-only test results;
- scan runs and proposed values;
- append-only extraction evidence, corrections and audit events;
- server-authoritative publication;
- capability registration, RLS and restricted grants.

The migration is checked in but remains unapplied to the connected Supabase project until the database change is explicitly approved and preflighted.

## Vision Studio foundation

Vision Studio is the administrative surface for the platform. The first foundation view exposes the programme state, extractor catalogue, lifecycle, pipeline and evidence requirements honestly. It does not pretend that mappings or native workers are configured before persistence and runtime deployment exist.

Future authoring capabilities will add:

- screenshot upload and private evidence handling;
- screen-type and version management;
- canvas-based region and anchor authoring;
- Field Registry selection;
- extractor comparison and configuration;
- test cases, diagnostics and confidence reports;
- immutable publication and successor creation;
- evidence review and retention operations.

Desktop is the primary authoring surface. Mobile must support operational review, evidence inspection and test-result decisions without desktop-only tables.

## Security, privacy and retention

- Raw screenshots and crops use private storage and server-authorised access.
- Upload purpose and consent time are explicit.
- Original evidence has a short configurable retention period.
- Deletion request, expiry and deletion timestamps are recorded.
- Secrets, provider credentials, executable paths and traineddata paths never enter browser payloads or mapping data.
- External AI providers require a future privacy, cost, retention and data-processing review before activation.
- Vision evidence is not used for model training without a separate explicit policy and consent decision.

## VISION-001 milestones

### VISION-001A — Platform contracts and persistence

- canonical architecture and ADR;
- shared Field Registry, mapping, extractor, evidence, confidence and validation contracts;
- provider-neutral persistence and immutable publication boundary;
- capability and RLS foundation;
- Vision Studio foundation;
- focused architecture and contract tests.

### VISION-001B — Extractor host and Tesseract local worker

- worker protocol and job boundary;
- image crop/preprocessing service;
- pinned Tesseract installation and traineddata procedure;
- health, timeout, resource and failure controls;
- synthetic OCR fixtures and runtime tests.

### VISION-001C — Vision Studio authoring

- screen/version administration;
- private reference uploads;
- region and anchor canvas;
- field, extractor, transform and validation configuration;
- draft persistence and successor creation.

### VISION-001D — Test, evidence and decision pipeline

- extractor comparison;
- confidence, validation and conflict orchestration;
- test cases and diagnostics;
- evidence and retention review;
- user/editor confirmation contracts.

### VISION-001E — Platform validation

- migration preflight and approved application;
- permission and RLS verification;
- desktop/mobile operational evidence;
- worker and failure-path validation;
- exact-commit preview deployment and smoke testing;
- AEGIS, Blueprint, FRKS, Roadmap and Release Notes evidence.

## Deferred from the platform foundation

- any hero, profile, troop, research, gear, charm, pet or Masters screen mapping;
- any hard-coded coordinates or text locations;
- ownership verification or identity badges;
- automatic domain mutation or publication;
- production deployment of a native OCR worker;
- EasyOCR, PaddleOCR, OpenCV and AI-provider implementations;
- model training or permanent raw-screenshot retention.

## Definition of done

VISION-001 is complete only when an authorised administrator can create, test and publish a reusable mapping through Vision Studio; at least one extractor host can execute behind the plugin boundary; extracted proposals preserve complete evidence, confidence, validation and conflict history; confirmation reaches only a registered domain proposal operation; and permissions, privacy, retention, desktop/mobile and deployed-runtime gates are validated.

## Account-linking screenshot boundary

VISION-LINK-001A uses one configured Kingshot profile/account identity screen
scope and the existing `scan_source` evidence contract. It returns structured
Player ID, display name and kingdom candidates with evidence ID, mapping
version, confidence and warnings. Raw OCR text remains server-side. Candidate
confirmation never writes canonical identity data directly; the existing
player-link service performs lookup, conflict checks and mutation only after
the user completes the separate Find Player and Link This Player steps.
## VISION-001C1 authoring boundary

Vision Studio authoring is server-authoritative. Browser code calls the Forge
Vision API boundary and never mutates Vision tables directly. The boundary
supports registry reads, Draft screen-type and mapping-version creation,
immutable Published/Deprecated successor creation, Draft/Testing metadata
updates and Draft-to-Testing submission. All targets are selected from the
governed Field Registry; arbitrary tables, columns, SQL and authored code are
not accepted. Until the VISION-001A migration is approved and applied, the
boundary reports persistence as unavailable and the Studio must not imply that
authoring succeeded. The temporary `cms.view` navigation gate remains in
place until it can be replaced by `vision.admin.read` after migration approval.
