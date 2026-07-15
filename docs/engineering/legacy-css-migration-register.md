# Legacy CSS Migration Register

## Purpose

This register controls retirement of the historical Forge application stylesheet. It prevents unmanaged global CSS growth and provides a measurable path from legacy selectors to the Forge Design System.

## Baseline

- Legacy source before CS-002B: `src/App.css`
- Baseline size: 14,893 lines
- Manifest size after CS-002B: 15 lines
- Legacy declarations retained: 14,893 lines across eight ordered modules
- Visual intent: unchanged
- Cascade verification: exact source content preserved in original order

## Module register

| Module | Current responsibility | Migration destination | Status |
| --- | --- | --- | --- |
| `01-application-shell.css` | Shell, account menu, responsive navigation and early shared page styles | Design-system layout/navigation plus feature styles | Modularised |
| `02-studios.css` | Art Studio and Name Studio responsive rules | Feature-local studio styles | Modularised |
| `03-public-pages.css` | Home, profiles, gift codes, lookup, kingdoms, KVK, roadmap and release notes | Shared primitives plus page-local styles | Modularised |
| `04-community.css` | Kingdom, alliance and identity/community experiences | Community feature styles | Modularised |
| `05-transfer-and-profiles.css` | Transfer Hub, public profiles, My Forge and progression | Transfer/profile feature styles | Modularised |
| `06-profile-editor.css` | Player profile editing and API-managed fields | Profile editor feature styles | Modularised |
| `07-heroes.css` | Hero showcase, collection, cards and editor | Heroes feature styles | Modularised |
| `08-admin.css` | Admin states, dashboard, Data Engine and record editor refinements | CMS/design-system patterns | Modularised |

## Migration states

1. **Modularised** — moved from the monolith without selector changes.
2. **Audited** — selectors and React consumers mapped.
3. **Tokenised** — hard-coded visual values replaced by semantic tokens.
4. **Component-owned** — shared rules moved to design-system components.
5. **Feature-owned** — feature rules colocated with their owner.
6. **Retired** — no remaining consumers; legacy module or section deleted.

## Change controls

- Migrate one coherent UI area at a time.
- Preserve selector behaviour until the owning React component is verified.
- Do not combine migration with a visual redesign.
- Run TypeScript, production build and lint after each migration.
- Record deleted selectors and affected pages in the implementation pack.
- Prefer component APIs and semantic tokens over replacement global selectors.

## Recommended next migration order

1. Admin/CMS shared patterns.
2. Application shell and navigation.
3. Shared public-page primitives.
4. Profile and transfer experiences.
5. Heroes.
6. Community.
7. Studios.

Admin/CMS is first because Milestone 2 depends on it and it offers the highest reuse across future dataset editors.
