# Coding Standards

## Language and type safety

- TypeScript strict mode is mandatory for app, server and packages.
- Do not use `any`; use `unknown` only at trust boundaries and narrow immediately.
- External input is runtime-validated.
- Domain identifiers use branded types or clear aliases where confusion is possible.
- Exhaustive switches use a `never` assertion.

## File and module rules

- Prefer files below 300 lines; review is required above 500 lines.
- One primary responsibility per file.
- Components should orchestrate presentation, not contain persistence logic.
- Business logic belongs in domain/application functions with tests.
- Public module exports are declared through `index.ts`.
- Avoid barrel files that create circular dependencies.

## React

- Function components and hooks only.
- Keep server state, form state and display state distinct.
- Effects are for synchronisation with external systems, not derived state.
- Route pages compose feature components and use-cases.
- Lazy-load major route groups.
- Every asynchronous view has loading, empty and error states.

## API and server

- Handlers are thin and use shared request/response helpers.
- Authenticate and authorise every privileged command.
- Do not expose raw database or internal exception text.
- Mutations are idempotent where practical.
- Log structured events without secrets or sensitive payloads.

## Database

- All schema changes are migrations.
- RLS policies are included and tested.
- Use `snake_case` in PostgreSQL and map at repository boundaries.
- Never perform destructive migration without backup/rollback instructions.

## Styling

- Use design-system tokens and components.
- Feature styles are colocated or CSS modules.
- No new rules in the legacy global stylesheet except temporary migration shims.
- Avoid inline styles except calculated values that cannot be represented by classes/tokens.

## Formatting and naming

- Use one enforced formatter.
- Components/types: `PascalCase`.
- Functions/variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` only for true constants/environment keys.
- Boolean names begin with `is`, `has`, `can` or `should`.
- Use UK English in user-facing copy and documentation.

## Testing

- Unit tests for domain rules, adapters and validation.
- Component tests for interaction and accessibility.
- Integration tests for API/use-case/database boundaries.
- End-to-end tests for critical user and CMS publication journeys.
- Defects receive a regression test.
