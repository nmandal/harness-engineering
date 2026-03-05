#!/usr/bin/env bash
set -euo pipefail

cat <<'MARKDOWN'
# Migration Checklist

- [ ] Define PR1 and PR2 boundaries
- [ ] Add compatibility layer
- [ ] Run architecture lint
- [ ] Run tests
- [ ] Collect UI and OBS evidence
- [ ] Include rollback steps in PR body
MARKDOWN
