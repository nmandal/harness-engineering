# Harness Engineering Starter

[![CI](https://github.com/nmandal/harness-engineering/actions/workflows/ci.yml/badge.svg)](https://github.com/nmandal/harness-engineering/actions/workflows/ci.yml)
[![Release](https://github.com/nmandal/harness-engineering/actions/workflows/release.yml/badge.svg)](https://github.com/nmandal/harness-engineering/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Open-source starter for **agent-first application development**.

This repo gives you a ready harness: docs as system-of-record, architecture guardrails, worktree-aware runtime, machine-readable evidence artifacts, and one-command scaffolding for domains or full monorepo workforce starters.

## What You Can Do Immediately

- Scaffold a new app domain in one command.
- Run enforceable docs + architecture guardrails locally and in CI.
- Generate UI/observability evidence artifacts for every change.
- Build in isolated worktrees with deterministic ports.
- Extend with your own domains, guardrails, and skills.

## Quick Start (Copy/Paste)

Requirements:
- Node `18.18+` (Node `20+` recommended)
- pnpm `9+`

```bash
git clone https://github.com/nmandal/harness-engineering.git
cd harness-engineering
pnpm bootstrap
pnpm scaffold:app --name billing
pnpm dev
```

Then open the local URL printed by Vite.

## First 15 Minutes

1. Scaffold your first domain:
```bash
pnpm scaffold:app --name payments
```
2. Implement real logic in:
`app/src/domains/payments/service/paymentsService.ts`
3. Update acceptance criteria in:
`docs/product-specs/payments.md`
4. Validate everything:
```bash
pnpm check:all
```
5. Inspect generated evidence:
- `artifacts/ui-evidence.json`
- `artifacts/obs-evidence.json`

## Monorepo Workforce Bootstrap (Composable)

You can scaffold only what you need:

```bash
pnpm scaffold:workforce --web studio --api core
pnpm install
pnpm --dir apps/studio dev
```

Generated:
- `apps/studio`: Next.js App Router + shadcn-style UI primitives + common starter dependencies
- `services/core`: FastAPI service skeleton with health endpoint and tests
- `docs/product-specs/studio-app.md` and `docs/product-specs/core-service.md`

Use alternative modes when you want less opinionated starts:

```bash
# Next.js only
pnpm scaffold:next-app --web studio

# FastAPI service only
pnpm scaffold:fastapi-service --api core
```

## Command Interface

| Command | Purpose |
| --- | --- |
| `pnpm bootstrap` | Install deps, install git hooks, refresh quality score |
| `pnpm dev` | Start app on deterministic worktree-specific port |
| `pnpm dev:all` | Start all JS app workspaces with deterministic ports |
| `pnpm scaffold:workforce --web <app> --api <service>` | Scaffold monorepo starter (Next.js app + optional FastAPI service) |
| `pnpm scaffold:next-app --web <app>` | Scaffold only a Next.js workspace app |
| `pnpm scaffold:fastapi-service --api <service>` | Scaffold only a FastAPI service |
| `pnpm scaffold:app --name <domain>` | Fast path: scaffold + wire + validate |
| `pnpm scaffold:domain --name <domain> [--wire]` | Scaffold domain only (optional wiring) |
| `pnpm check:all` | Run docs lint, architecture lint, tests, UI verify, OBS verify |
| `pnpm check:workspace` | Run `lint/typecheck/test` across JS workspace packages when available |
| `pnpm lint:docs` | Enforce docs metadata, freshness, and indexing |
| `pnpm lint:architecture` | Enforce layer and import boundaries |
| `pnpm verify` | Run both evidence verifiers (`verify:ui`, `verify:obs`) |
| `pnpm quality:update` | Refresh managed quality score section |
| `pnpm doc:garden` | Produce stale/orphan docs report |
| `pnpm worktree:dev --ports-only` | Print deterministic app/obs ports for current worktree |

## Scaffolded Domain Layout

`pnpm scaffold:app --name billing` creates:

```text
app/src/domains/billing/
  types/billingTypes.ts
  config/billingConfig.ts
  repo/billingRepo.ts
  providers/billingProvider.ts
  service/billingService.ts
  runtime/useBillingRuntime.ts
  ui/BillingPanel.tsx
docs/product-specs/billing.md
```

It can also wire the panel into `app/src/App.tsx` so you can iterate immediately.

## Architecture Contract

Domain layering is strict:

`types -> config -> repo -> providers -> service -> runtime -> ui`

Rules:
- Imports may only move forward through layers.
- Cross-domain imports are blocked unless explicitly allowed.
- Guardrail failures include remediation instructions.

## Evidence Contracts

The harness emits machine-readable evidence for review automation:

- UI evidence: `artifacts/ui-evidence.json`
- Observability evidence: `artifacts/obs-evidence.json`

Each includes pass/fail plus the signal fields used for validation.

## CI and Automation

Main workflows in `.github/workflows/`:

- `ci.yml`: full command interface (`pnpm check:all`)
- `docs-integrity.yml`: docs-only integrity checks
- `architecture-guards.yml`: architecture guardrails
- `review-loop-check.yml`: PR review evidence contract checks
- `quality-refresh.yml`: quality score refresh automation
- `doc-gardening.yml`: stale/orphan docs reporting
- `release.yml`: Release Please automation

## Worktree-Friendly Development

The repo is designed for parallel agent work:

- Deterministic ports are derived from worktree path.
- Per-worktree runtime artifact written to:
`artifacts/worktree-runtime.json`
- Use this to run multiple isolated app instances safely.

## Troubleshooting

- `verify-ui` fails:
  - Check `artifacts/ui-evidence.json`.
  - Ensure app can bind to local ports in your environment.
- `verify-obs` fails:
  - Check `artifacts/obs-evidence.json`.
  - Confirm startup budget / error budget assumptions.
- Port-constrained or sandboxed environment:
  - Use:
  ```bash
  VERIFY_ALLOW_OFFLINE=1 pnpm check:all
  ```
  - Note: CI is expected to run live verifiers.
- Docs lint fails:
  - Add required metadata (`Owner`, `Last Verified`, `Status`) and index links.
- Architecture lint fails:
  - Move imports to allowed layer directions.

## Repo Map

- [AGENTS.md](./AGENTS.md): short map for agents
- [ARCHITECTURE.md](./ARCHITECTURE.md): layer and boundary rules
- [docs/index.md](./docs/index.md): docs system-of-record
- [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md): setup walkthrough
- [docs/EXTENDING.md](./docs/EXTENDING.md): extension guide
- [docs/BUILD_RECIPES.md](./docs/BUILD_RECIPES.md): practical recipes
- [docs/QUALITY_SCORE.md](./docs/QUALITY_SCORE.md): quality rubric and score
- [skills/](./skills): reusable harness skills
- [workshops/](./workshops): kickoff and PR-lab kits

## Build Next

1. Add two real business domains with `pnpm scaffold:app`.
2. Integrate one external provider in `providers/` and call it from `service/`.
3. Tighten reliability budgets in [docs/RELIABILITY.md](./docs/RELIABILITY.md).
4. Add one custom guardrail script and wire it into CI.
5. Keep docs/quality current with `pnpm doc:garden` and `pnpm quality:update`.

## Design Principle

This starter is intentionally balanced:

- Opinionated where reliability matters (guardrails, evidence, docs contracts).
- Flexible where product shape differs (choose Next only, API only, or both; add any stack under `apps/*`, `services/*`, `packages/*`).

## Open Source

- License: [MIT](./LICENSE)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](./SECURITY.md)
