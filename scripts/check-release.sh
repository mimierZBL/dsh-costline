#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
owner_marker=$(printf '<%s>' github-owner)
status=0
grep -R -I -n -F --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.release --exclude-dir=outputs -- "$owner_marker" "$root" || status=$?
case "$status" in
  0) printf '%s\n' 'RELEASE BLOCKER: replace the GitHub owner placeholder before publishing or submitting to a marketplace.' >&2
     exit 1 ;;
  1) printf '%s\n' 'Release owner check passed.' ;;
  *) exit "$status" ;;
esac
