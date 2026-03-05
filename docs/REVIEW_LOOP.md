# Review Loop

Owner: Nick
Last Verified: 2026-03-05
Status: Active

## Local Self-Review

Before PR creation:

1. `pnpm lint:docs`
2. `pnpm lint:architecture`
3. `pnpm test`
4. `pnpm verify:ui`
5. `pnpm verify:obs`

## Second-Pass Agent Review

Ask an agent to review:

1. architectural boundary compliance
2. evidence artifact integrity
3. rollback clarity

## Escalation Criteria

Human review is required when:

1. Security policy is modified.
2. Architecture layer model changes.
3. Reliability budgets change.

## Risk-Class Merge Policy

- Low risk (`docs/**`, `workshops/**`): automerge allowed after CI passes.
- Medium risk (scripts and non-runtime app changes): agent review + CI required.
- High risk (runtime behavior, policy, architecture): human signoff required.

## PR Evidence Checklist

PR description must include:

- `UI Evidence:` link or artifact reference
- `OBS Evidence:` link or artifact reference
- `Rollback Plan:` one concise paragraph
