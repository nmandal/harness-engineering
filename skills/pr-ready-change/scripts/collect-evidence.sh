#!/usr/bin/env bash
set -euo pipefail

pnpm lint:docs
pnpm lint:architecture
pnpm test
pnpm verify:ui
pnpm verify:obs

echo "Evidence ready: artifacts/ui-evidence.json and artifacts/obs-evidence.json"
