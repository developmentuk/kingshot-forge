# PM2B Pack 05 — Permissions and Role Enforcement

## Scope

This pack introduces reusable dataset and editorial authorisation services.

## Added

- Dataset permission evaluation
- Role-list permission rules
- Contextual asynchronous permission rules
- Default-deny behaviour for unconfigured mutations
- Configurable unconfigured-action policy
- Structured permission decisions
- Dedicated permission-denied errors
- Editorial-operation to dataset-action mapping
- Authorised editorial facade
- Standard Forge editorial role policy

## Default Behaviour

Unconfigured `read` operations are allowed by default.

All other unconfigured actions are denied unless explicitly enabled in service options.

This protects mutations while allowing existing read-only datasets to remain accessible.

## Standard Editorial Roles

The supplied standard policy uses the existing Forge roles:

- owner
- admin
- moderator
- content_creator
- contributor
- viewer

`beta_tester` receives no editorial permissions by default.

## Security Boundary

This platform service is suitable for both client-side capability checks and server-side enforcement.

Client-side checks improve user experience but do not replace server-side authorisation.

## Verification

Run:

```powershell
npm run build
npm run lint
```

## Commit

```text
feat: add dataset and editorial permission enforcement
```
