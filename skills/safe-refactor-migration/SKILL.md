---
name: safe-refactor-migration
description: Use this skill for refactors or migrations that require phased delivery, compatibility guards, and explicit rollback strategy.
---

# Safe Refactor / Migration

## Trigger

Use for structural changes touching multiple modules or dependency edges.

## Workflow

1. Split delivery into phases:
   - PR1: scaffolding + compatibility layer + tests
   - PR2: behavior switch + cleanup
2. For each phase, define a stop condition and rollback command.
3. Enforce architecture boundaries before and after each phase.
4. Keep old path operational until new path is validated.
5. Remove compatibility code only after verification artifacts are green.

## Required Checks

- `pnpm lint:architecture`
- `pnpm test`
- `pnpm verify:ui`
- `pnpm verify:obs`

## Output Contract

Produce:

1. Migration plan markdown with phase gates.
2. PR body including evidence and rollback.
