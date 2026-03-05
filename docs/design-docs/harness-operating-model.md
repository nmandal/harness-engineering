# Harness Operating Model

Owner: Nick
Last Verified: 2026-03-05
Status: Active

## Loop

1. Plan the change in `docs/exec-plans`.
2. Implement with boundary-aware architecture.
3. Validate with docs and architecture lint checks.
4. Capture UI and observability evidence.
5. Run review loop and merge based on risk class.

## Missing Capability Heuristic

When a task fails, avoid retrying blindly. Add missing capability as one of:

- Documentation
- Script/tooling
- Linter rule
- CI enforcement
