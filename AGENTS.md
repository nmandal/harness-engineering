# AGENTS.md

This repository is optimized for agent-first development. Keep this file short and navigational; deeper instructions live in `docs/`.

## Purpose

Demonstrate Codex Deployment Engineering capability end-to-end:

1. Harness design
2. Agent legibility
3. Mechanical enforcement
4. Review-loop operations
5. Reusable enablement assets

## First 5 Minutes

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Read [docs/index.md](./docs/index.md)
3. Read [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)
4. Run `pnpm lint:docs && pnpm lint:architecture`
5. Run `pnpm verify:ui && pnpm verify:obs`
6. Update [docs/QUALITY_SCORE.md](./docs/QUALITY_SCORE.md) if domain quality changed

## Source of Truth

- Architecture rules: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Design rationale: [docs/design-docs/index.md](./docs/design-docs/index.md)
- Product scope: [docs/product-specs/index.md](./docs/product-specs/index.md)
- Active execution plans: [docs/exec-plans/active/harness-bootstrap.md](./docs/exec-plans/active/harness-bootstrap.md)
- Completed plans: [docs/exec-plans/completed/initial-scaffold.md](./docs/exec-plans/completed/initial-scaffold.md)
- Quality baseline: [docs/QUALITY_SCORE.md](./docs/QUALITY_SCORE.md)
- Reliability policy: [docs/RELIABILITY.md](./docs/RELIABILITY.md)
- Security policy: [docs/SECURITY.md](./docs/SECURITY.md)
- Review loop: [docs/REVIEW_LOOP.md](./docs/REVIEW_LOOP.md)

## Required Command Interface

- `pnpm lint:docs`
- `pnpm lint:architecture`
- `pnpm verify:ui`
- `pnpm verify:obs`
- `pnpm quality:update`
- `pnpm doc:garden`

## Starter Bootstrap Commands

- `pnpm scaffold:app --name <domain>` for single-app domain growth
- `pnpm scaffold:workforce --web <app> --api <service>` for monorepo workforce bootstrap
- `pnpm scaffold:next-app --web <app>` for Next-only bootstrap
- `pnpm scaffold:fastapi-service --api <service>` for FastAPI-only bootstrap
- `pnpm dev:all` for running all JS apps in `app/` and `apps/*`

## Agent Operating Rules

1. If docs and code disagree, update docs in the same PR.
2. Preserve architecture layers in `app/src/domains/*`.
3. Generate evidence artifacts for UI and observability checks.
4. Keep changes small and reviewable.
5. If a rule is repeated in review comments, encode it into scripts or CI.

## Documentation Metadata Rules

All non-index docs under `docs/` must include:

- `Owner: ...`
- `Last Verified: YYYY-MM-DD`
- `Status: Active|Draft|Deprecated`

`pnpm lint:docs` enforces this.

## Evidence Contracts

- UI evidence: `artifacts/ui-evidence.json`
- Observability evidence: `artifacts/obs-evidence.json`

## Skills

- [skills/pr-ready-change/SKILL.md](./skills/pr-ready-change/SKILL.md)
- [skills/safe-refactor-migration/SKILL.md](./skills/safe-refactor-migration/SKILL.md)
- [skills/ci-flake-wrangler/SKILL.md](./skills/ci-flake-wrangler/SKILL.md)

## Escalation

Escalate to a human when:

1. Security policy conflicts with delivery urgency.
2. Architectural invariants need modification.
3. Evidence checks fail due to environmental instability.
