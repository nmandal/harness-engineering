# Harness Engineering Starter

Build real apps fast with an agent-first harness: docs as source-of-truth, mechanical guardrails, runtime evidence checks, and scaffolding that keeps architecture clean.

## Start in 2 Minutes

```bash
git clone https://github.com/nmandal/harness-engineering.git
cd harness-engineering
pnpm bootstrap
pnpm quickstart --name billing
pnpm dev
```

`pnpm quickstart` will scaffold a full domain, wire it into the app shell, run all checks, and print exact next edits.

## Why this starter is useful

- **Immediate build path**: one command (`pnpm quickstart`) creates a real domain you can extend.
- **Guardrails by default**: docs and architecture drift are blocked by scripts + CI.
- **Evidence contracts**: UI/observability checks emit machine-readable artifacts.
- **Agent legibility**: repo structure and docs support long-horizon agent work.

## Core Commands

- `pnpm dev` — start app on deterministic worktree port
- `pnpm quickstart --name <domain>` — scaffold + wire + validate a new domain
- `pnpm scaffold:domain --name <domain> [--wire]` — scaffold only
- `pnpm check:all` — lint + tests + UI/obs verification
- `pnpm verify` — UI + observability evidence generation
- `pnpm quality:update` — refresh managed quality score block
- `pnpm doc:garden` — generate stale/orphan docs report

## Build Recipes

- [Getting Started](./docs/GETTING_STARTED.md)
- [Extending Guide](./docs/EXTENDING.md)
- [Build Recipes](./docs/BUILD_RECIPES.md)

## Architecture Contract

Layering inside each domain:

`types -> config -> repo -> providers -> service -> runtime -> ui`

- imports must not move backward
- cross-domain imports are blocked except via provider boundaries

## Open Source

- License: [MIT](./LICENSE)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](./SECURITY.md)
- Releases: [release.yml](./.github/workflows/release.yml) + Release Please
