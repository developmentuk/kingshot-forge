# AEGIS Modular Platform Addendum

**Status:** Proposed companion governance  
**Parent constitution:** `docs/AEGIS.md`  
**Decision record:** `docs/ADR/ADR-014-modular-platform-architecture.md`

This addendum extends the Kingshot Forge Project Constitution for modular platform work. It does not replace or weaken `docs/AEGIS.md`. Where there is any conflict, the parent constitution remains authoritative until the owner approves a deliberate constitutional amendment.

## Modular platform principle

Forge will prefer **trusted, statically composed modules inside one governed platform** over repeated direct integration into central route and navigation files.

Modularity exists to improve ownership, parallel development, validation and rollback. It must not weaken canonical data, security, accessibility, mobile support, provenance, observability or production acceptance.

## Binding modular rules

1. **Platform authority remains singular.** Authentication, permissions, canonical publication, entity identity, Search, audit and observability are shared platform capabilities.
2. **One canonical data authority.** Product modules consume and extend governed contracts; they do not create independent editable copies of canonical facts.
3. **Static trust boundary first.** Initial modules are installed from trusted repository source at build time. Remote runtime JavaScript and external plugin execution are prohibited without a new ADR.
4. **Contracts before movement.** Establish module definitions, entry points, ownership and dependency checks before moving feature implementation.
5. **Routes remain compatibility contracts.** Extraction must preserve accepted paths, aliases, guards and return destinations unless a separate reviewed change authorises otherwise.
6. **Server authority is unchanged.** Module composition never substitutes for RLS, API authentication, capability checks, privileged RPC controls or audit.
7. **Dependencies point inward.** Product applications depend on platform contracts. Platform contracts do not depend on product presentation.
8. **One accountable owner per object.** Every route, navigation item, API, table, view, function, policy, bucket, Edge Function, migration and test suite must have one accountable module or platform owner.
9. **Cross-module writes are controlled.** A module may not write another module's authoritative state except through an explicit owning service or reviewed database operation.
10. **Focused checks supplement release checks.** Module-level validation improves feedback and cost, but never replaces the full integration and exact-head release gate.
11. **Rollback is required.** Initial extraction must preserve a bounded route/registration rollback and must not require destructive data rollback.
12. **Active workstreams are protected.** Modularisation must publish and respect protected ownership zones before changing code.
13. **No architecture theatre.** Files are moved only when a stable contract and operational benefit exist. Directory changes alone do not count as modular progress.
14. **No premature distribution.** Separate repositories, databases and deployments require evidence and a new decision gate.
15. **Documentation is part of installation.** A module is not accepted until its catalogue, contracts, ownership, validation and rollback are documented.

## Authentication protection — AUTH-EXP-001

Authentication is Forge platform core.

While `AUTH-EXP-001 — Forge Authentication Expansion` Phase 1B remains in evidence-gathering mode, modular platform work must not change:

- Supabase Auth settings;
- provider settings or credentials;
- the Supabase client auth configuration;
- session restoration;
- OAuth callback and redirect behaviour;
- password or email flows;
- identity linking;
- `handle_new_user()` or profile metadata behaviour;
- existing users or identities.

The Phase 1B report must establish the accepted authentication contract before modules depend on it.

After acceptance, product modules may request platform capabilities such as:

- signed-out, signed-in or verified-player state;
- named Forge permissions;
- safe internal return destinations;
- account-linking availability;
- reauthentication requirements.

Product modules must not depend on OAuth provider subjects, tokens, secrets or provider-specific metadata as canonical Forge identifiers.

## Module installation gate

A module may be registered only when:

- its definition is valid and uniquely identified;
- its dependencies are declared and acyclic;
- route and navigation ownership are unambiguous;
- capability requirements are explicit;
- data ownership and shared contracts are recorded;
- focused checks pass;
- the complete integration gate passes;
- preview behaviour is accepted where applicable;
- disablement and rollback are proven;
- no protected workstream has been modified without authority.

## Module Definition of Done

In addition to the parent AEGIS Definition of Done, a module requires:

- one supported public entry point;
- no undocumented imports through another module's internals;
- one source of truth for route, navigation and capability metadata;
- a module-focused validation command;
- documented persistent-object ownership;
- observability namespace and safe error context;
- feature-state and unavailable-state behaviour;
- a compatibility and rollback record;
- an FRKS record for material architectural or domain decisions.

## Workstream method

Modular platform work follows:

```text
Audit → Contract → Registry → Low-risk proof → Product pilot → Package boundary → Operational separation
```

A later phase must not begin because its directory structure looks desirable. It begins only when the preceding contract and acceptance evidence are complete.

## Cost-conscious operation

The default remains one repository, one Vercel application, one Supabase project and one release line.

Module-focused checks should reduce unnecessary feedback and CI cost. New projects, branches, services or recurring infrastructure costs require evidence, an explicit cost statement and owner approval.

## Required supporting documents

Read these before modular platform changes:

- `docs/AEGIS.md`;
- `docs/FORGE_BLUEPRINT.md`;
- `docs/FORGE-BLUEPRINT-MODULAR-PLATFORM-ADDENDUM.md`;
- `docs/ADR/ADR-014-modular-platform-architecture.md`;
- `docs/audits/PLATFORM-MODULARITY-AUDIT-2026-08-05.md`;
- `docs/architecture/FORGE-MODULE-CATALOGUE.md`;
- `docs/plans/MODULAR-PLATFORM-WORKING-PLAN.md`;
- the final accepted `AUTH-EXP-001` Phase 1B evidence report.
