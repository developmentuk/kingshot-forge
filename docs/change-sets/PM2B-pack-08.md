# PM2B Pack 08 — Admin UI Integration

## Scope

This pack adds reusable admin UI components for the editorial platform.

## Added

- Editorial status badges
- Workflow action panel
- Role-filtered available actions
- Version history timeline
- Version comparison display
- Rollback-preview entry points
- Publish queue activity
- Scheduled publishing activity
- Retry and cancellation entry points
- Responsive editorial workspace
- Dedicated editorial admin stylesheet

## Integration Boundary

The components are controlled components.

They receive platform state and callbacks from their parent rather than creating repositories or services inside the UI.

This keeps the UI independent from the Pack 09 Supabase persistence implementation.

## Main Component

```tsx
<EditorialAdminWorkspace
  status={head.status}
  version={head.currentVersion}
  historyEntries={history.entries}
  queueItems={queueItems}
  schedules={schedules}
/>
```

## Verification

Run:

```powershell
npm run build
npm run lint
```

## Commit

```text
feat: add editorial admin workspace
```
