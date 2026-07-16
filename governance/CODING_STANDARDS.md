# Coding Standards

## TypeScript

- Prefer explicit domain types.
- Avoid `any`.
- Use `unknown` at untrusted boundaries and validate it.
- Keep contracts separate from implementations.
- Return typed errors for expected failure modes.
- Prefer immutable data transformations.

## React

- Keep business rules out of components.
- Components should focus on rendering and interaction.
- Extract repeated behaviour into hooks, services or platform modules.
- Handle loading, empty, success and error states.
- Avoid deeply nested conditional rendering.

## Naming

- Components: `PascalCase`
- Functions and variables: `camelCase`
- Constants: `camelCase` unless truly global and fixed
- Types and interfaces: `PascalCase`
- Files should reflect their primary export or purpose

## Services

A service should:

- have one clear responsibility;
- use injected dependencies where practical;
- avoid hidden global state;
- expose predictable typed outcomes;
- preserve platform invariants.

## Errors

- Do not silently swallow errors.
- User-facing errors should explain the next action.
- Technical errors should preserve enough context for diagnosis.
- Expected domain errors should use dedicated error types.

## Imports

- Keep imports grouped and readable.
- Prefer stable public barrel exports.
- Avoid circular dependencies.
- Do not import feature code into platform modules.

## Comments

Comments should explain why, not restate what the code already says.

## Formatting and Linting

The repository's configured TypeScript and lint tooling is authoritative.

Run:

```bash
npm run build
npm run lint
```
