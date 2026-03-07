# Getting Started

Owner: Nick
Last Verified: 2026-03-05
Status: Active

## Requirements

- Node 18.18+
- pnpm 9+

## Bootstrap

```bash
pnpm bootstrap
```

## Validate baseline

```bash
pnpm check:all
```

## Start local app

```bash
pnpm dev
```

## First extension step

```bash
pnpm scaffold:app --name billing
pnpm check:all
```

## Troubleshooting

- If `verify:ui` fails, inspect `artifacts/ui-evidence.json`.
- If `verify:obs` fails, inspect `artifacts/obs-evidence.json`.
- If docs lint fails, make sure metadata fields and index links are present.
- In constrained environments where local ports are blocked, run with `VERIFY_ALLOW_OFFLINE=1 pnpm check:all`.
