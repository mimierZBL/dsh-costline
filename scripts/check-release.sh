#!/bin/sh
set -eu
case "${1:-}" in
  ''|--before-npm) [ "$#" -le 1 ] || exit 2 ;;
  *) printf '%s\n' 'Usage: check-release.sh [--before-npm]' >&2; exit 2 ;;
esac

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
owner_marker=$(printf '<%s>' github-owner)
status=0
blocked=0
grep -R -I -n -F --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.release --exclude-dir=outputs -- "$owner_marker" "$root" || status=$?
case "$status" in
  0) printf '%s\n' 'RELEASE BLOCKER: replace the GitHub owner placeholder before publishing or submitting to a marketplace.' >&2
     blocked=1 ;;
  1) printf '%s\n' 'Release owner check passed.' ;;
  *) exit "$status" ;;
esac

if [ "${1:-}" != --before-npm ]; then
  node - "$root/market/index.json" <<'NODE' || blocked=1
const fs = require('node:fs')
const { plugins } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
if (!Array.isArray(plugins) || plugins.length === 0 || plugins.some(plugin =>
  !Array.isArray(plugin.versions) || plugin.versions.length === 0 ||
  plugin.versions.some(({ publishTimestamp }) => !Number.isSafeInteger(publishTimestamp) || publishTimestamp <= 0)
)) {
  console.error('RELEASE BLOCKER: every market/index.json version needs a positive integer publishTimestamp. Read it back from npm after publishing.')
  process.exitCode = 1
} else {
  console.log('Market publishTimestamp check passed.')
}
NODE
fi
exit "$blocked"
