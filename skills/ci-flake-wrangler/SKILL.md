---
name: ci-flake-wrangler
description: Use this skill when CI is intermittently failing and the goal is to isolate nondeterminism, stabilize checks, and preserve merge velocity safely.
---

# CI Flake Wrangler

## Trigger

Use when a check fails non-deterministically or passes on rerun without code changes.

## Workflow

1. Identify flaky job and failing step signature.
2. Re-run failing command locally at least 3 times.
3. Categorize failure:
   - timing/race
   - data fixture instability
   - environment dependency
4. Add deterministic guard:
   - explicit waits with timeout budget
   - stable fixture generation
   - retries only where safe and bounded
5. Document follow-up debt item if temporary quarantine is used.

## Required Output

- Flake incident note (root cause hypothesis + confidence)
- Stabilization patch
- Validation log showing repeated successful runs
