# Architecture

Owner: Nick
Last Verified: 2026-03-05
Status: Active

## Goal

Preserve speed and coherence in an agent-first repo by enforcing deterministic boundaries.

## Layer Model

Business domains live under `app/src/domains/<domain>/` and use fixed layers:

1. `types`
2. `config`
3. `repo`
4. `providers`
5. `service`
6. `runtime`
7. `ui`

Allowed dependency direction is forward-only in this list.

## Cross-Domain Rule

Direct cross-domain imports are disallowed.

Use domain providers or top-level app composition points instead.

## Enforcement

- `pnpm lint:architecture` validates import boundaries.
- CI workflow `architecture-guards.yml` blocks drift.
- Lint failures include remediation text intended for agent context.

## Runtime Legibility

- App is bootable per worktree with deterministic ports via `pnpm worktree:dev`.
- UI evidence and observability evidence are generated via `verify:*` scripts.

## Review Policy Link

See [docs/REVIEW_LOOP.md](./docs/REVIEW_LOOP.md).
