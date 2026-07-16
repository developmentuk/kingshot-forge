# Development Workflow

## Standard Milestone Flow

```text
Plan
  ↓
Architecture
  ↓
Implementation
  ↓
Build
  ↓
Lint
  ↓
Manual Test
  ↓
Documentation
  ↓
Commit
  ↓
Push
  ↓
Review
  ↓
Merge
```

## 1. Plan

Define:

- the problem;
- intended user outcome;
- scope;
- exclusions;
- acceptance criteria.

Avoid starting implementation with unresolved core requirements.

## 2. Architecture

Identify:

- existing platform services;
- contracts that should be reused;
- new boundaries required;
- persistence impact;
- security impact;
- migration requirements.

Create an ADR when the decision is significant or difficult to reverse.

## 3. Implementation

Prefer complete, coherent feature work over scattered partial changes.

Platform logic belongs outside UI components.

## 4. Validation

Run:

```bash
npm run build
npm run lint
```

Resolve failures before committing.

## 5. Manual Testing

Test:

- the expected path;
- invalid input;
- empty states;
- error states;
- stale or concurrent updates where relevant;
- responsive behaviour;
- role restrictions.

## 6. Documentation

Update all documents affected by the milestone.

## 7. Commit and Push

Review the changed files before committing.

Use a clear commit message and push only validated work.

## 8. Review and Merge

Confirm the Definition of Done before merging.

Do not merge incomplete milestones simply to clear a branch.
