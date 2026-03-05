#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: repeat-check.sh <command>"
  exit 1
fi

for i in 1 2 3; do
  echo "run $i/3"
  "$@"
done
