# FRKS Migration Report — RoeBot Reference and Engineering Governance

- **Migration date:** 2026-07-23
- **Status:** Repository assets created on `docs/frks-knowledge-governance`
- **Scope:** RoeBot Kingshot JavaDocs review, FRKS governance, cost-conscious development and safe database migrations

## Executive summary

This migration preserves the lasting knowledge from the source conversation and separates verified findings from earlier speculative claims.

The conversation produced three durable outcomes:

1. RoeBot JavaDocs are useful as a non-canonical terminology and UI-domain reference, especially for building names, search entities, navigation targets and qualitative march states.
2. FRKS is the permanent Forge knowledge layer, but `docs/AEGIS.md` remains the authoritative operational constitution and ADRs remain the binding decision records.
3. Forge defaults to zero-cost development workflows and review-only database migration generation unless the owner explicitly approves execution or paid infrastructure.

## Knowledge inventory

### FRKS-KNOW-001 — FRKS operating model

- **Classification:** Permanent Knowledge / Workflow
- **Status:** Accepted
- **Confidence:** 100
- **Summary:** Lasting research, evidence, decisions, terminology, validation and specifications must be committed to GitHub rather than retained only in chat.
- **Repository location:** `docs/frks/README.md`

### FRKS-ADR-012 — Cost-conscious development

- **Classification:** Decision Record
- **Status:** Accepted
- **Confidence:** 100
- **Summary:** Prefer local development, Git branches, migration files, review gates and existing free-tier resources. Paid infrastructure requires explicit owner approval.
- **Repository location:** `docs/ADR/ADR-012-cost-conscious-development.md`

### FRKS-ADR-013 — Safe database migration workflow

- **Classification:** Decision Record / Workflow
- **Status:** Accepted
- **Confidence:** 100
- **Summary:** Coding agents generate migration SQL only by default, leave production unchanged and require explicit approval before execution.
- **Repository location:** `docs/ADR/ADR-013-safe-database-migration-workflow.md`

### FRKS-REF-001 — RoeBot Kingshot JavaDocs

- **Classification:** Research / Reference Material
- **Status:** Reviewed; non-canonical
- **Confidence:** 85 for class and enum inventory; low for conclusions beyond documented interfaces
- **Summary:** RoeBot exposes a screen-automation domain model rather than an official game-data API. Useful concepts include building recognition, side navigation, world search categories, march UI and qualitative success labels.
- **Repository location:** `docs/frks/references/roebot/`

## Conflict and correction register

### Earlier overstatement: hidden game mechanics and IDs

The initial discussion suggested the JavaDocs might reveal hidden hero IDs, item IDs, event identifiers, research trees and internal game mechanics. The completed review did not establish those claims.

**Resolution:** Mark those claims as superseded speculation. Preserve only source-supported class and enum findings.

### Proposed Forge Constitution

A separate `FORGE_CONSTITUTION.md` was proposed. The repository already establishes `docs/AEGIS.md` as the authoritative operational constitution.

**Resolution:** Do not create a competing constitution. FRKS is subordinate to AEGIS and references it explicitly.

### Version statement

The discussion incorrectly framed FRKS as preparation for Forge v1.0. Forge is already operating in Version 1.

**Resolution:** Treat FRKS as current platform infrastructure, not a pre-v1 aspiration.

## Risks

- Conversation-generated files outside GitHub are temporary and may be lost.
- RoeBot terminology may be outdated, source-specific or based on screen-recognition labels rather than canonical game terminology.
- Paid-resource avoidance must not be used to justify unsafe migrations or inadequate backups.
- FRKS registers can become stale if significant work is not followed by an FRKS Commit.

## Recommendations

1. Merge this documentation branch after owner review.
2. Add the RoeBot extracted reference JSON and review document to the permanent repository.
3. Incrementally update FRKS registers at the end of major research and delivery work.
4. Keep evidence, editorial conclusions and canonical published data separate.
5. Use ADRs for binding decisions rather than embedding policy only in prompts.

## Migration summary

The governance and archival structure has been created in GitHub. No production code, Supabase schema or runtime configuration was changed.
