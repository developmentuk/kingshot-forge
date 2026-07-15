# Forge Design System Specification

## Purpose

Forge UI must feel like one platform across player tools, community features and administration. The design system separates reusable visual language from feature-specific composition.

## Layers

1. **Foundations:** colour, typography, spacing, radii, elevation, motion and breakpoints.
2. **Primitives:** Box, Stack, Grid, Text, Heading, Icon and VisuallyHidden.
3. **Controls:** Button, IconButton, Link, Input, Select, Checkbox, Switch and Textarea.
4. **Feedback:** Alert, Badge, Toast, Progress, Skeleton and EmptyState.
5. **Navigation:** AppHeader, Sidebar, Tabs, Breadcrumbs and Pagination.
6. **Data display:** Card, Table, DefinitionList, Stat and CodeBlock.
7. **Overlays:** Dialog, Drawer, Popover, Tooltip and ConfirmDialog.
8. **CMS patterns:** RecordHeader, FieldGroup, ValidationSummary, StatusBadge, DiffViewer and PublishChecklist.

## Token model

Use CSS custom properties with semantic aliases:

```css
:root {
  --forge-colour-bg-canvas: ...;
  --forge-colour-bg-surface: ...;
  --forge-colour-text-primary: ...;
  --forge-colour-border-default: ...;
  --forge-colour-action-primary: ...;
  --forge-space-1: 0.25rem;
  --forge-space-2: 0.5rem;
  --forge-radius-md: 0.75rem;
  --forge-focus-ring: 0 0 0 3px ...;
}
```

Components consume semantic tokens only. Feature code must not introduce unreviewed hex values or arbitrary spacing constants.

## Accessibility

- Target WCAG 2.2 AA.
- All controls have accessible names.
- Keyboard access is equivalent to pointer access.
- Focus is visible and restored after overlays close.
- Colour is never the only status signal.
- Motion respects `prefers-reduced-motion`.
- Tables provide captions/headers and responsive alternatives.
- Form errors are associated with fields and summarised.

## Responsive model

Design mobile-first. Proposed breakpoints:

- compact: below 640px
- medium: 640–1023px
- wide: 1024–1439px
- extra-wide: 1440px+

The admin CMS may use dense layouts on wide screens but must remain operable on compact screens.

## Component governance

- Reusable CSS foundations and primitives live in `src/platform/design-system`. A future package extraction requires an ADR and demonstrated reuse outside the web application.
- Feature-specific components stay with their feature.
- Every design-system component includes usage docs, states, accessibility notes and tests.
- No new global component class is added to the monolithic stylesheet.


## CS-002A implementation baseline

The design-system foundation is now loaded globally from `src/index.css` before the legacy `src/App.css` stylesheet. This ordering is deliberate: design tokens and opt-in `.forge-*` primitives are available everywhere, while existing application selectors retain precedence until they are migrated.

Current structure:

```text
src/platform/design-system/
├── index.css
├── tokens/
├── base/
├── layout/
├── components/
└── legacy/
```

### Adoption rules

- New reusable styles use semantic `--forge-*` tokens.
- New shared CSS classes use the `.forge-*` namespace.
- Existing selectors remain in `App.css` until a dedicated migration change set verifies their consumers.
- The compatibility file contains aliases only; it must not become a second legacy stylesheet.
- Light theme variables are available through `[data-forge-theme="light"]`, but dark remains the supported production theme until a theme control and visual regression coverage are implemented.

### Import order

1. `src/main.tsx` imports `src/index.css`.
2. `src/index.css` imports the design-system entry point.
3. `src/App.tsx` imports legacy `App.css` and feature-specific Record Editor CSS.

This preserves visual behaviour while allowing controlled adoption of the new system.

## CS-002B legacy stylesheet modularisation

The former 14,893-line `src/App.css` has been converted into a 15-line ordered import manifest. Existing selectors have been moved without modification into domain-oriented files under `src/styles/legacy/`.

```text
src/styles/legacy/
├── 01-application-shell.css
├── 02-studios.css
├── 03-public-pages.css
├── 04-community.css
├── 05-transfer-and-profiles.css
├── 06-profile-editor.css
├── 07-heroes.css
└── 08-admin.css
```

The numeric prefixes are temporary cascade controls. They preserve the exact historical source order while migration continues. They must not be interpreted as permanent architecture or used for new style placement.

### Rules from CS-002B onward

- `src/App.css` is an import manifest only.
- No new selectors may be added to files in `src/styles/legacy/` without an explicit technical-debt entry.
- New reusable styles belong in `src/platform/design-system/`.
- New feature-specific styles belong beside the owning feature or page.
- A legacy module may be removed only after its selectors have been migrated, its consumers verified and its deletion recorded in the migration register.
- Import order must remain unchanged unless visual regression checks prove the cascade change is safe.

This change is structural rather than visual. The eight modules recombine byte-for-byte to the previous `App.css` content, so selector order and declarations are preserved.
