# Documentation Standards

## Documentation types

- Architecture specifications: durable platform rules
- ADRs: significant decisions and trade-offs
- Feature READMEs: ownership, boundaries and behaviour
- Runbooks: operational procedures and recovery
- API contracts: request, response, errors and permissions
- Data dictionaries: tables, fields, ownership and sensitivity
- Release notes: user-visible change history

## Required metadata

Every durable document includes title, status, owner, version/date and last review date where appropriate.

## Style

- Use Markdown in the repository.
- Write direct UK English.
- State decisions explicitly.
- Separate current state, target state and migration state.
- Use diagrams as text-based Mermaid where possible so changes are reviewable.
- Link to code by stable path; avoid line numbers in durable docs.

## Change rules

- Documentation changes are part of the same pull request as behaviour changes.
- ADRs are immutable after acceptance except status and supersession links.
- Deprecated docs remain available with a banner and replacement link until safely removed.
- Broken links and stale review dates are checked in CI where practical.

## Repository `/docs` structure

```text
docs/
├─ architecture/
│  ├─ architecture-specification-v1.0.md
│  ├─ cms-framework-specification.md
│  ├─ data-engine-framework-review.md
│  └─ adr/
├─ engineering/
│  ├─ coding-standards.md
│  ├─ design-system-specification.md
│  └─ testing-strategy.md
├─ governance/
│  ├─ repository-governance.md
│  └─ technical-debt-register.md
├─ operations/
│  ├─ deployment-runbook.md
│  ├─ incident-response.md
│  └─ migration-plan.md
├─ product/
│  └─ platform-roadmap.md
└─ reference/
   ├─ api/
   ├─ database/
   └─ data-dictionary/
```
