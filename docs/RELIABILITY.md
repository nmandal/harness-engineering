# Reliability

Owner: Nick
Last Verified: 2026-03-05
Status: Active

## Reliability Contracts

1. Service startup target: <= 800 ms.
2. Error log budget for baseline checks: 0 errors.
3. Evidence artifacts must be produced before merge for app-affecting changes.

## Guardrails

- `pnpm verify:obs` enforces startup and error budget.
- `pnpm verify:ui` validates critical workflow path and emits artifacts.
