# Forge Vision Mapper

Status: Architecture baseline for VISION-001  
Owner: Kingshot Forge  
Branch: `feature/vision-mapper`

## Purpose

Forge Vision Mapper is a governed visual data-extraction capability. It allows authorised Forge administrators to map regions from example Kingshot screenshots to approved Forge fields without introducing hard-coded coordinates or arbitrary database writes.

The first player outcome is a screenshot fallback when the external Player API is unavailable or incomplete. The long-term outcome is a reusable scanner foundation for profile, hero, troop, research, gear, charm, pet, Masters and other supported Kingshot screens.

OCR extracts evidence. It does not prove identity or account ownership.

## Product flow

```text
Player ID submitted
       |
       v
Player API attempted
       |
       +-- success --> API-backed profile proposal
       |
       +-- unavailable/incomplete
                         |
                         v
              Screenshot fallback offered
                         |
                         v
                Screen type detection
                         |
                         v
            Published mapping version selected
                         |
                         v
        Regions extracted, transformed and validated
                         |
                         v
           Confidence and conflict checks applied
                         |
                         v
                Player reviews every value
                         |
                         v
          Confirmed values saved with provenance
```

## Core design decisions

### Admin-configurable mappings

Screen layouts are data, not application code. An authorised administrator can:

1. create a screen type;
2. upload a reference screenshot;
3. draw one or more regions;
4. map each region to an approved Forge field;
5. choose an extractor and transformation rules;
6. test against additional screenshots;
7. publish an immutable mapping version.

A Kingshot UI change creates a new mapping version. Existing versions and scan evidence remain intact.

### Forge Field Registry

Mappings never target arbitrary tables or columns. Every destination is selected from a server-authoritative registry.

Each field definition declares:

- stable field key;
- domain and owning service;
- data type;
- validation constraints;
- whether screenshot import is allowed;
- whether user confirmation is required;
- conflict policy;
- freshness expectations;
- visibility and sensitivity;
- write adapter operation.

Initial governed fields:

| Field key | Type | Confirmation | Notes |
| --- | --- | --- | --- |
| `player.game_name` | text | required | Unicode allowed; API comparison when available |
| `player.game_id` | text | required | digits only; stable identity anchor |
| `player.power` | bigint | required | compact-number input supported |
| `player.kills` | bigint | required | compact-number input supported |
| `player.alliance_name` | text | required | may be blank |
| `player.kingdom_id` | integer | required | strips leading `#` |
| `player.avatar_evidence` | evidence image | required | crop reference, not canonical media |

### Relative geometry

Regions are stored as normalised coordinates from `0` to `1`:

```text
x, y, width, height
```

This allows a mapping to operate across resolutions with the same aspect/layout family. Fixed source pixels may be retained as reference metadata but are not authoritative.

### Anchors and relationships

A region may optionally declare:

- a visual or OCR label anchor;
- an expected icon anchor;
- a relationship such as right-of, below or inside;
- a fallback relative region;
- tolerance and confidence penalties.

The first vertical slice may use relative regions. The contract must allow anchors without a schema replacement.

### Extraction adapters

Supported extractor contracts:

- `ocr_text`
- `ocr_digits`
- `compact_number`
- `integer`
- `percentage`
- `presence`
- `evidence_crop`
- `icon_classification` (future implementation)
- `colour_classification` (future implementation)
- `count_markers` (future implementation)
- `repeating_grid` (future implementation)

The OCR implementation sits behind an adapter boundary. Tesseract is the initial candidate, not a permanent domain dependency.

### Transform and validation pipeline

```text
raw crop
  -> extractor output
  -> normalisation
  -> transformation
  -> field validation
  -> confidence adjustment
  -> conflict check
  -> proposed value
```

Example compact-number transformation:

```text
"300.1M" -> 300100000
"22.8M"  -> 22800000
```

Every stage may preserve diagnostic metadata. Raw values are never silently discarded.

### Version lifecycle

```text
Draft -> Testing -> Published -> Deprecated
```

Rules:

- only published versions are available to player-facing scans;
- published versions are immutable;
- editing a published version creates a draft successor;
- publication is a named server operation;
- deprecated versions remain available for historical scan evidence;
- no mapping publication automatically writes player data.

### Confidence and conflicts

Confidence is recorded per scan, field and transformation stage where available. Confidence does not equal verification.

A proposed field may be:

- accepted for player review;
- flagged as low confidence;
- blocked by validation;
- flagged as conflicting with existing/API data;
- unavailable.

The player must review screenshot-derived values before persistence in the first vertical slice.

### Provenance

Every saved screenshot-derived value records:

- scan run;
- mapping version;
- source screenshot evidence identity;
- extraction adapter and version;
- raw extractor value;
- transformed value;
- confidence and rationale;
- validation result;
- user correction, if any;
- confirmer and confirmation time;
- resulting domain mutation/audit event.

### Privacy and retention

Screenshots may contain personal identifiers and game-account data.

The implementation must support:

- explicit upload purpose;
- restricted evidence access;
- short default retention for original screenshots;
- deletion status and timestamps;
- separate retained audit metadata;
- no public access to raw screenshots;
- no use for model training without explicit future consent and policy.

## Proposed persistence model

Names remain subject to migration preflight, but the domain requires these concepts:

- `vision_field_registry`
- `vision_screen_types`
- `vision_screen_versions`
- `vision_reference_images`
- `vision_regions`
- `vision_field_mappings`
- `vision_test_cases`
- `vision_test_results`
- `vision_scan_runs`
- `vision_scan_values`
- `vision_user_corrections`
- `vision_audit_events`

Storage buckets or equivalent evidence storage must remain private and server-authorised.

## Capability model

Proposed capabilities:

- `vision.admin.read`
- `vision.admin.edit`
- `vision.admin.test`
- `vision.admin.publish`
- `vision.scan.create`
- `vision.scan.review-own`
- `vision.evidence.review`

Publication and privileged evidence access are server-authoritative.

## Admin experience

The Vision Mapper must provide:

- screen-definition list and status;
- reference screenshot canvas;
- draw, select, move and resize region interactions;
- zoom without changing stored geometry;
- approved field selector;
- extractor selector;
- transform and validation configuration;
- live region preview;
- test-run diagnostics;
- confidence and validation output;
- version comparison and publication controls;
- responsive operation, including a usable mobile review experience.

Desktop is the preferred mapping-authoring surface; mobile remains required for viewing, testing and operational review.

## Player fallback experience

The first vertical slice supports Governor Profile screenshots.

When the Player API fails or is incomplete, Forge explains that the service is unavailable and offers screenshot import. It must not imply API verification.

The user:

1. selects or captures a Governor Profile screenshot;
2. receives extracted proposals for name, ID, power, kills, alliance and kingdom;
3. sees confidence/attention states in plain language;
4. corrects mistakes;
5. confirms the values;
6. saves them as screenshot-confirmed profile data.

The UI must distinguish:

- API confirmed;
- screenshot extracted;
- user confirmed;
- moderator reviewed;
- conflicting;
- stale.

## First reference screen

Screen type: `governor-profile`  
Layout family: Android portrait  
Reference evidence: user-supplied Kingshot Governor Profile screenshot, 22 July 2026.

Initial mapped values:

- game name;
- player ID;
- power;
- kills;
- alliance;
- kingdom;
- avatar evidence crop.

Gear, charm and skin interpretation are deferred until the text-field vertical slice is complete.

## Milestones

### VISION-001A — Contracts and persistence

- field registry contract;
- screen/version/region/mapping contracts;
- migration and RLS;
- capability definitions;
- audit and immutable publication operations.

### VISION-001B — Admin Mapper

- screen and version administration;
- reference upload;
- region canvas;
- field/extractor configuration;
- draft persistence.

### VISION-001C — Test bench and extraction runtime

- crop pipeline;
- OCR adapter boundary;
- compact-number transforms;
- validation and confidence;
- test cases and diagnostics;
- Governor Profile draft mapping.

### VISION-001D — Player fallback vertical slice

- Player API failure detection;
- screenshot fallback upload;
- published mapping selection;
- player correction and confirmation;
- provenance-backed profile mutation.

### VISION-001E — Release validation

- permission and RLS tests;
- desktop/mobile workflows;
- retention and deletion checks;
- build and full check suite;
- exact-commit deployment;
- production smoke test;
- AEGIS, Roadmap and Release Notes updates.

## Deferred work

The following are intentionally outside the first vertical slice:

- account-ownership challenge verification;
- automatic identity badge issuance;
- hero, troop, research, pet or Masters scanners;
- gear/charm icon classifiers;
- machine-learning training pipelines;
- automatic publication from corrected scans;
- permanent screenshot retention;
- arbitrary custom code transforms authored in Admin.

## Definition of done

VISION-001 is complete only when an authorised administrator can create, test and publish a Governor Profile mapping and a player can use that published mapping after an API failure to review and save screenshot-derived profile values with provenance, permissions, audit history, privacy controls and validated desktop/mobile behaviour.