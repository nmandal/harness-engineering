# Build Recipes

Owner: Nick
Last Verified: 2026-03-05
Status: Active

## Recipe 1: Add a New Product Domain

```bash
pnpm scaffold:app --name billing
```

Then edit:

1. `docs/product-specs/billing.md` (problem/scope/acceptance criteria)
2. `app/src/domains/billing/service/billingService.ts` (actual business logic)
3. `app/src/domains/billing/ui/BillingPanel.tsx` (UI behavior)

Validate:

```bash
pnpm check:all
```

## Recipe 2: Add External API Integration Safely

1. Add provider wrapper in `<domain>/providers/`.
2. Call provider from `<domain>/service/` only.
3. Keep API response mapping in `<domain>/repo/` or `<domain>/service/`.
4. Add docs note in `docs/product-specs/<domain>.md`.

Validate with:

```bash
pnpm lint:architecture
pnpm verify
```

## Recipe 3: Tighten Reliability Budgets

1. Update startup/error budgets in `docs/RELIABILITY.md`.
2. Run `pnpm verify:obs`.
3. If failures occur, capture remediation plan in your PR.

## Recipe 4: Add New Guardrail

1. Add script in `scripts/`.
2. Add npm command in `package.json`.
3. Add workflow step in `.github/workflows/ci.yml`.
4. Add test in `tests/`.
5. Update `AGENTS.md` and docs index if needed.
