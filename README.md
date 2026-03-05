# Harness Engineering Starter

A production-minded starter for building agent-first applications with Codex-style harness patterns.

It includes:

- docs-as-system-of-record
- mechanical guardrails (docs + architecture linting)
- runtime evidence contracts (UI + observability)
- worktree-aware local development
- reusable domain scaffolding

## Who this is for

Use this repo if you want to:

1. start a real app quickly
2. keep architecture coherent as velocity increases
3. encode review quality into scripts and CI
4. make projects legible to coding agents and humans

## Quick start

```bash
git clone <your-fork-url>
cd harness-eng
pnpm bootstrap
pnpm check:all
pnpm dev
```

## Day-to-day commands

- `pnpm dev` — start app on deterministic worktree port
- `pnpm check:all` — run all enforced checks
- `pnpm verify` — generate UI + observability evidence
- `pnpm quality:update` — refresh `docs/QUALITY_SCORE.md`
- `pnpm doc:garden` — generate stale/orphan docs report

## Scaffold a new domain

```bash
pnpm scaffold:domain --name billing --wire
```

Generates:

- `app/src/domains/billing/{types,config,repo,providers,service,runtime,ui}/*`
- `docs/product-specs/billing.md`
- index update in `docs/product-specs/index.md`
- optional app-shell wiring (`--wire`)

Then run:

```bash
pnpm check:all
```

## Architecture contract

Domain layers:

`types -> config -> repo -> providers -> service -> runtime -> ui`

- imports must not move backward
- cross-domain imports are blocked except through provider boundaries

## Project docs

- [AGENTS.md](./AGENTS.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [docs/index.md](./docs/index.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SECURITY.md](./SECURITY.md)

## Open source

- License: [MIT](./LICENSE)
- Code of Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](./SECURITY.md)
- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Releases

This repository uses Release Please via [`.github/workflows/release.yml`](./.github/workflows/release.yml).

- Pushes to `main` update or create a release PR.
- Merging the release PR updates `CHANGELOG.md`, tags a new version (`v*`), and creates a GitHub release.

Use Conventional Commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`) to get accurate changelog entries.
