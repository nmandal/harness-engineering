# Extending the Starter

Owner: Nick
Last Verified: 2026-03-05
Status: Active

## Add a New Domain

1. Scaffold:

```bash
pnpm scaffold:domain --name accounts --wire
```

2. Refine generated files to your product logic.
3. Update `docs/product-specs/accounts.md` with real acceptance criteria.
4. Run `pnpm check:all`.

## Add New Guardrails

1. Implement script under `scripts/`.
2. Expose command in `package.json`.
3. Add CI workflow or extend existing workflow.
4. Add tests in `tests/`.

## Add New Evidence Contracts

1. Add endpoint/signal in app runtime.
2. Extend verifier scripts under `scripts/verify-*.ts`.
3. Output machine-readable artifact under `artifacts/`.
4. Update review checklist in `docs/REVIEW_LOOP.md`.

## Keep Docs Healthy

- Link every new doc from an index.
- Keep `Last Verified` current.
- Run `pnpm doc:garden` regularly.
