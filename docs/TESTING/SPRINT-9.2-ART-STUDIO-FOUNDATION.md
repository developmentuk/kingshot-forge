# Sprint 9.2 Art Studio Foundation Validation

## Scope

Validation covers the local, unapplied Art Studio Community schema/security
proposal and provider-neutral server contracts. It does not claim that a live
submission, moderation or publication journey exists.

Connected Supabase project: `hrvdhjscwitqpwjhnjkm`.

## Automated validation

`npm run check` passes and includes:

- NodeNext import validation;
- existing PM2B, Hero Skills, Editorial Platform and Verification Centre
  structural validators;
- the Art Studio schema/privacy validator;
- existing Editorial API and Verification Centre tests;
- Art Studio lifecycle, validation, capability, error, rate-limit and event
  tests;
- oxlint;
- TypeScript project build and the production Vite build.

The Art Studio validator specifically asserts:

- all seven dedicated tables, explicit grants and enabled/forced RLS;
- one-like and one-open-report constraints;
- self-like, self-approval and self-publication guards;
- immutable revisions and append-only moderation history;
- column-scoped authenticated access for private workflow rows;
- public projection exclusion of IDs and private fields;
- reporter access only for the reporter or a non-owner moderator;
- every future endpoint contract and required internal event.

The focused runtime test covers valid/invalid artwork and report transitions,
owner relationship restrictions, missing/valid capabilities, the concrete
Supabase capability resolver with an in-memory client, multilingual Unicode,
emoji/ZWJ, malformed surrogates, forbidden controls/invisible characters,
repeated-character abuse, slugs, attribution, stable error envelopes and retry
metadata. It performs no database or network access.

## SQL validation

The migration parses as 143 PostgreSQL statements with
`pgsql-parser@17.9.16`, installed in an external temporary directory for this
validation only. No parser dependency was added to the repository.

A read-only `SELECT` against the connected project verified the PostgreSQL
repetition expression boundary: 513 identical code points match the abuse
pattern and 512 do not. No DDL or DML was executed.

The repository has no Supabase `config.toml`, local Postgres client or Docker
runtime. The migration was therefore not applied locally. An applied-schema
test, pgTAP constraint test and role-switched RLS matrix remain blocked until an
approved non-production Supabase branch and a reproducible baseline are
available.

## Remote drift evidence

Read-only Supabase metadata checks show:

- remote migration history does not contain
  `art_studio_community_foundation` or version `20260717130232`;
- the public schema contains no `art_studio_*` table;
- legacy zero-row `submissions` and `favourites` remain unchanged.

These checks used migration/table listing and `SELECT` only. No migration,
policy, table, data, storage or configuration write occurred.

## Lint and dependency evidence

Oxlint exits successfully. Seven pre-existing warnings remain in Auth/Role/
Player contexts and `useDataset`; Sprint 9.2 adds no warning.

No package dependency was added. `npm audit --omit=dev` reports zero production
vulnerabilities. The full audit reports ten existing development-tool findings
(six high, four moderate) through `@vercel/node` and its transitive packages;
the proposed remediation is a semver-major downgrade according to npm and is
outside this domain milestone.

## Remaining validation gate

Before migration approval, an approved non-production branch must prove:

1. clean migration application against the full Forge baseline;
2. constraint and trigger behaviour with disposable auth users;
3. grants and RLS for anon, contributor, owner, moderator and publisher roles;
4. transactional publication/unpublication projection synchronisation;
5. rollback and audit-history retention.

Clark and Aegis approval is required before that gate begins.
