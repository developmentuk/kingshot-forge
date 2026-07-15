# CMS Framework Specification

## Objective

The Forge CMS manages trusted Kingshot reference content from source import through editorial review to publication. It must support structured records without hard-coding a separate editor application for every dataset.

## Core model

### Dataset definition

- dataset key and display name
- schema version
- source configuration
- record identity rule
- list columns and filters
- editor schema
- validation rules
- publication strategy
- permissions

### Record lifecycle

`source → staged → draft → in_review → approved → published → archived`

Rejected records return to draft with review notes. Published records are not directly edited; a new draft version is created.

### Core entities

- `cms_datasets`
- `cms_records`
- `cms_record_versions`
- `cms_validation_results`
- `cms_reviews`
- `cms_publications`
- `cms_publication_items`
- `cms_audit_events`
- `data_import_runs`
- `data_import_items`

## Versioning

Each save creates or updates a draft using optimistic concurrency. Approval fixes an immutable version. Publication references approved versions. Rollback creates a new publication pointing to earlier approved versions; history is never deleted.

## Validation

Three levels:

1. Field validation: type, required, range and format.
2. Record validation: internal relationships and business rules.
3. Dataset validation: duplicate keys, referential integrity and completeness.

Warnings may be accepted with a recorded justification. Errors block approval and publication.

## Permissions

Recommended policy:

- Viewer: browse published and permitted CMS views
- Contributor/content creator: create/edit drafts
- Moderator: review, request changes and approve within scope
- Admin: imports, schema configuration and publication
- Owner: platform policy and emergency operations

Permissions are checked in server commands and RLS, not only in route guards.

## Publishing

Publication is an explicit transaction:

1. Select approved changes.
2. Run full validation.
3. Display diff and impact summary.
4. Require publish permission and confirmation.
5. Create immutable publication record.
6. Update active publication pointer atomically.
7. Invalidate caches.
8. emit audit and operational events.

## Dataset adapter contract

Adapters should declare configuration rather than own arbitrary transformation logic wherever possible:

- schema parser
- identity selector
- browser columns
- editor field definitions
- normaliser/serializer
- validation functions
- preview renderer

Complex datasets such as Buildings may supply specialised fields, but they remain inside the common lifecycle.

## CMS Definition of Done

A dataset is CMS-ready only when it supports browsing, editing, validation, persistence, review, publication, history, permission enforcement, audit, tests and documentation.
