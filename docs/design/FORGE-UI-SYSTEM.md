# Kingshot Forge UI System

Status: UX-001 Version 1.0 experience hardening reference, 19 July 2026.

## Foundations

Forge uses the existing dark navy/gold visual language and the shared shell
styles. The canonical tokens live in `src/styles/forgeUxPolish.css`; feature
styles may extend them only when the extension is scoped to that feature.

Typography uses the system sans stack. The hierarchy is: display/page title
for the single page H1, section title for H2, card title for H3, body copy,
small body, uppercase label/eyebrow, caption and metadata. Dialog and card
headings must be scoped and must not inherit page-display rules.

The spacing scale is `.25rem`, `.5rem`, `.75rem`, `1rem`, `1.25rem` and
`1.5rem`, with page gutters and control heights represented by semantic Forge
tokens. Content is capped at 1180px in the application shell and readable
copy is capped at approximately 65 characters per line.

## Layout and layering

The shell owns the sticky header, sidebar, main content and footer. Fixed
overlays must be portalled to `document.body`, must not participate in page
flow, and must use the modal backdrop/modal layer rather than escalating
route-specific z-index values. The Global Search backdrop is layer 1000;
navigation and feedback remain below it.

Dialogs use a bounded panel, independent scrolling, explicit close controls,
dialog semantics, visible focus and restored body scroll. Mobile dialogs use
safe-area insets and must fit the visual viewport without horizontal overflow.

## Global Search

Global Search is the shared command palette launched from the header or
Ctrl/Cmd+K. It searches published/permitted records through the existing
`/api/search` contract. The client sends an `Accept: application/json` header,
checks status/content type/redirect state before parsing, and presents a
Forge-styled unavailable state for HTML, protection or authentication
responses. Results are grouped by dataset label, independently scrollable,
keyboard navigable and activated with Enter. Escape, close and deliberate
backdrop clicks close the dialog and return focus to the launcher.

## Version presentation

`package.json` is the canonical product version source. Production presents
`Version 1.0`; protected previews present `Forge Preview`; local development
presents `Forge Local`. Commit/build metadata is diagnostic-only and is not
shown as the primary ordinary-user release label.

## Responsive principles

The minimum evidence sizes for this sprint are 390px, 768px, 1280px and
1440px. Controls retain touch-sized targets, tables use their existing scoped
scroll strategy, page content remains inside the shell, and fixed navigation
does not overlap dialogs or content.

## Deferred visual debt

The repository still contains legacy feature CSS with duplicated literal
colours and route-specific selectors. This sprint reconciles shared tokens and
the evidenced search/shell defects without a blind purge. A future visual debt
pass should migrate remaining legacy selectors incrementally with route-level
screenshots.

## UX-002 release-blocker rules

Operations and settings surfaces use the same dark Forge surface, border,
focus and text tokens as the application shell. Data tables may scroll inside a
bounded container on narrow screens; they must not hide values through clipped
fixed heights. Rating cards keep stars, scores and explanations in normal flow.
Related-content components render only published, visible, deduplicated
relationships and use an explicit empty state when no relationship exists.
## UX-003 presentation rules

- Entity search results must resolve through a supported canonical destination; records without one are informational and never link back to Search.
- Forge Connections are curated cards, ranked from explicit relationships and canonical tags, with a meaningful reason and Open action.
- Rating-card grids use one column on mobile, two columns on constrained widths and four columns only when each card has a safe minimum width. Content determines card height.
- KvK card mode uses two clearly labelled kingdom panels, an explicit VS marker and text/icon result labels. Compact mode remains the dense operational table.
## Final workflow heading and status guidance

Use the shared compact page-title scale for task-oriented pages such as KvK Match History. Operational selectors must expose Ready, Metadata only, Broken reference, or Unsupported states; unavailable content cannot use ready-state controls.
