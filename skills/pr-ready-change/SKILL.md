---
name: pr-ready-change
description: Use this skill when preparing any repository change for pull request readiness with explicit acceptance criteria, validation evidence, and rollback notes.
---

# PR Ready Change

## Trigger

Use when a task is implemented and needs to be finalized for review and merge.

## Workflow

1. Restate scope in 3 bullets: outcome, non-goals, risk.
2. Run required validation commands in this order:
   - `pnpm lint:docs`
   - `pnpm lint:architecture`
   - `pnpm test`
   - `pnpm verify:ui`
   - `pnpm verify:obs`
3. Generate PR summary with:
   - behavior changes
   - files touched by domain
   - risk class (low/medium/high)
4. Populate PR evidence section:
   - `UI Evidence:` from `artifacts/ui-evidence.json`
   - `OBS Evidence:` from `artifacts/obs-evidence.json`
   - `Rollback Plan:` concise, executable fallback
5. If any command fails, do not draft final PR body; fix failures first.

## Output Contract

Produce markdown with sections:

- `## Summary`
- `## Review Evidence`
- `## Checklist`
