# Forge Research & Knowledge System (FRKS)

FRKS is the permanent, version-controlled knowledge layer for Kingshot Forge.

Its purpose is to ensure that significant research, evidence, decisions, specifications, terminology, validation work and operational learning do not remain trapped in conversations, local notes or temporary tool output.

## Authority and boundaries

- `docs/AEGIS.md` remains the authoritative operational constitution.
- `docs/FORGE_BLUEPRINT.md` remains the supporting product-direction document.
- `docs/ADR/` contains binding architectural and operational decisions.
- FRKS preserves and indexes knowledge; it does not replace those authorities.
- GitHub is the canonical home for FRKS documents and registers.
- Supabase remains the canonical source for persistent platform data.

## FRKS Commit rule

Nothing of lasting value should exist only in a chat.

At the end of significant research, design, verification, migration or delivery work, review whether the repository requires updates to:

- architecture or operational documentation;
- ADRs;
- dataset contracts or validation records;
- source, terminology or confidence registers;
- unresolved gaps and action items;
- release and sprint records.

A conversation summary is not a completed FRKS Commit until the relevant repository documents have been created or updated.

## Knowledge lifecycle

```text
Discover
  ↓
Preserve evidence
  ↓
Extract and classify
  ↓
Identify conflicts and confidence
  ↓
Map to canonical documents, ADRs and datasets
  ↓
Commit to GitHub
  ↓
Review and maintain
```

## Classification

FRKS material may be classified as:

- Permanent Knowledge
- Dataset
- Documentation
- Decision Record
- Workflow
- Specification
- Research
- Reference Material
- Temporary Discussion
- Superseded

Temporary and superseded material may still be recorded when its history is important, but it must be labelled clearly and must not be presented as current canonical direction.

## Minimum metadata

Every indexed knowledge item should include, where applicable:

- unique ID;
- title and category;
- concise summary;
- importance and confidence;
- status and review requirement;
- source conversation or source URL;
- creation and review dates;
- dependencies and relationships;
- target repository location;
- related datasets, documents, decisions and features.

## Current registers

- `FRKS_Metadata.json`
- `FRKS_Dataset_Index.json`
- `FRKS_Document_Index.json`
- `FRKS_Decision_Register.json`
- `FRKS_Source_Register.json`
- `FRKS_Terminology.json`
- `FRKS_Todo.json`
- `FRKS_Gap_Analysis.md`
- `FRKS_Confidence_Report.md`

These initial registers establish the structure. They should be updated incrementally rather than regenerated destructively.
