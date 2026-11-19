;(function () {
  const testedHeaderVersions = new Set(['0.2.2-rc.3', '0.2.2-rc.5'])
  const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

  function parseVersion(value) {
    const match = typeof value === 'string' ? semver.exec(value) : null
    if (!match || match[4]?.split('.').some(part => /^0\d+$/.test(part))) return undefined
    const release = match.slice(1, 4).join('.')
    return match[4] ? release + '-' + match[4] : release
  }

  function selectDisplay(preference, release, failure, settingsStatus = 'ready') {
    if (settingsStatus !== 'ready') return { actual: 'pending', reason: undefined }
    if (preference === 'footer-only') return { actual: 'footer-only', reason: undefined }
    const version = parseVersion(release)
    if (version !== undefined && !testedHeaderVersions.has(version)) return { actual: 'footer-only', reason: 'version' }
    if (failure !== undefined) return { actual: 'footer-only', reason: failure }
    return { actual: 'header', reason: undefined }
  }

  function firstFailure(current, reason) {
    return current ?? reason
  }

  function tailSource(turn) {
    const store = turn?.data
    if (typeof store?.source !== 'function') return undefined
    const source = store.source('turn-tail')
    return typeof source?.getSnapshot === 'function' && typeof source?.subscribe === 'function' ? source : undefined
  }

  function turnOf(node) {
    const location = node?.location
    return location?.kind === 'turn' || location?.kind === 'step' ? location.turn : undefined
  }

  const count = value => Number.isSafeInteger(value) && value >= 0

  function inspectHeader(node, controller) {
    const data = node?.data
    if (!count(data?.turn) || !count(data?.messageCount)) return undefined
    if (typeof controller?.setOpen !== 'function' || controller.spec?.turn !== data.turn ||
        typeof controller.hasContent !== 'boolean' || typeof controller.foldable !== 'boolean' ||
        typeof controller.open !== 'boolean') return undefined
    const turn = turnOf(node)
    if (turn?.turn !== data.turn || !['open', 'closed', 'unknown'].includes(turn.status) ||
        !('start' in turn) || !('end' in turn)) return undefined
    // Paginated history can legitimately lack the start of a closed turn.
    if ((turn.start !== undefined && !Number.isFinite(turn.start?.time)) ||
        (turn.end !== undefined && !Number.isFinite(turn.end?.time)) ||
        (turn.status === 'closed' && typeof turn.end?.data?.reason?.kind !== 'string')) return undefined
    try {
      const tail = tailSource(turn)
      return tail ? { turn, tail } : undefined
    } catch {
      return undefined
    }
  }

  const compat = Object.freeze({ parseVersion, selectDisplay, firstFailure, inspectHeader, tailSource, turnOf })
  if (typeof module === 'object' && module.exports) module.exports = compat
  else window.__ModuleLoader__.load({ id: 'dsh-costline', chunk: 'client.compat.js', factory: () => compat })
})()
