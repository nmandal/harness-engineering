# Contributing

Thanks for contributing.

## Development Setup

```bash
pnpm bootstrap
pnpm dev
```

In a second terminal, run:

```bash
pnpm check:all
```

## Contribution Workflow

1. Open an issue first for substantial changes.
2. Create a focused branch.
3. Keep changes small and include docs updates where needed.
4. Run `pnpm check:all` before opening a PR.
5. Fill all required PR template fields:
   - UI Evidence
   - OBS Evidence
   - Rollback Plan

## Scaffolding New App Domains

Use the built-in generator:

```bash
pnpm quickstart --name billing
```

This creates a full domain layer set, wires it into the app shell, and runs checks.

## What We Review For

- Documentation integrity (`pnpm lint:docs`)
- Layer constraints (`pnpm lint:architecture`)
- Evidence contracts (`pnpm verify`)
- Test stability (`pnpm test`)

## Commit Guidance

- Use concise, descriptive commit messages.
- Group related changes.
- Avoid mixing refactors with feature behavior unless necessary.
- Prefer Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) for automated release notes.

## Release Process

Releases are automated with Release Please on pushes to `main`.

1. A release PR is opened/updated with version bump + changelog updates.
2. Merge the release PR to publish a tag and GitHub release.
