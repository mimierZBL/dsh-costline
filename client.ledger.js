;(function () {
  const childModes = new Set(['one-shot', 'continuable', 'unknown', 'external'])
  const reasonCodes = new Set([
    'session-unread', 'session-limit', 'session-error', 'projection-unavailable', 'catalog-unavailable',
    'turn-in-progress', 'turn-usage-unavailable', 'summary-usage-unavailable', 'summary-call-unverified',
    'price-model', 'price-mixed', 'price-cache', 'price-usage', 'price-time',
    'mixed-model', 'mixed-currency', 'token-overflow',
  ])
  const ledgerReasonKey = code => 'ledger.reason.' + (reasonCodes.has(code) ? code : 'other')
  const visibleTokens = (total, rows, covered) => covered || rows.some(row => row.usage) ? total : null

  function childAddress(parentSessionId, entry) {
    if (typeof entry?.id !== 'string' || entry.id.length === 0 || !childModes.has(entry.mode)) return undefined
    return { parentSessionId, childSessionId: entry.id, mode: entry.mode }
  }

  function createLedgerReader(sessions, mainId, { target = mainId, maxChildren = 20 } = {}) {
    const listeners = new Set()
    let generation
    let childrenRequested = false
    let snapshot = { entries: new Map(), childrenRequested }

    function publish(entries) {
      snapshot = { entries: new Map(entries), childrenRequested }
      for (const listener of listeners) listener()
    }

    function nextChild(entries) {
      const seen = new Set([mainId])
      const queue = [mainId]
      for (const parent of queue) {
        const catalog = entries.get(parent)?.frame?.subagentCatalog
        for (const row of Array.isArray(catalog) ? catalog : []) {
          const address = childAddress(parent, row)
          if (!address || address.mode === 'external' || seen.has(address.childSessionId)) continue
          const id = address.childSessionId
          seen.add(id)
          if (seen.size - 1 > maxChildren) return undefined
          if (!entries.has(id)) return address
          queue.push(id)
        }
      }
    }

    async function read(current, id, address) {
      const { entries, controller, cleanups } = current
      entries.set(id, { status: 'loading' })
      publish(entries)
      let release
      try {
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)])
        const ref = sessions.retain(address, { source: 'costlineLedger', signal })
        const off = []
        release = () => {
          cleanups.delete(release)
          for (const unsubscribe of off) unsubscribe()
          ref.release()
        }
        cleanups.add(release)
        const { session } = await ref.ready
        if (generation !== current) return
        if (session.getSnapshot().openState !== 'open') throw new Error('Session is not open')
        const ledger = session.projections.faceOf('costlineLedger')
        const catalog = session.projections.faceOf('subagentCatalog')
        const update = () => {
          if (generation !== current) return
          entries.set(id, { status: 'ready', frame: {
            costlineLedger: ledger.getSnapshot(), subagentCatalog: catalog.getSnapshot(),
          } })
          publish(entries)
          void pump(current)
        }
        off.push(ledger.subscribe(update))
        off.push(catalog.subscribe(update))
        update()
      } catch {
        if (generation !== current) return
        release?.()
        entries.set(id, { status: 'error' })
        publish(entries)
      }
    }

    async function pump(current) {
      if (generation !== current || current.running) return
      current.running = true
      const { entries } = current
      try {
        if (!entries.has(mainId)) await read(current, mainId, target)
        while (generation === current && childrenRequested && entries.size - 1 < maxChildren) {
          const address = nextChild(entries)
          if (!address) break
          await read(current, address.childSessionId, address)
        }
      } finally {
        current.running = false
      }
    }

    function start() {
      if (generation) return
      generation = { entries: new Map(), cleanups: new Set(), controller: new AbortController(), running: false }
      void pump(generation)
    }

    function dispose() {
      const current = generation
      if (!current) return
      generation = undefined
      current.controller.abort()
      for (const cleanup of current.cleanups) cleanup()
    }

    return {
      start, dispose,
      refresh() { dispose(); start() },
      loadChildren() {
        if (!generation || childrenRequested) return
        childrenRequested = true
        publish(generation.entries)
        void pump(generation)
      },
      getSnapshot: () => snapshot,
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    }
  }

  function createLedgerClient({ estimate }) {
    function priceRows(rows, overrides) {
      let totalTokens = 0
      let amount = 0
      let currency
      let model
      const reasons = new Set()
      for (const row of rows) {
        if (!row.usage) {
          reasons.add(row.reason)
          continue
        }
        totalTokens += row.usage.totalTokens
        const price = estimate(row.usage, row.endedAt, overrides)
        if (price.cost === null) {
          reasons.add('price-' + price.reason)
          continue
        }
        if (currency !== undefined && price.currency !== currency) reasons.add('mixed-currency')
        if (model !== undefined && price.priced !== model) reasons.add('mixed-model')
        currency = price.currency
        model = price.priced
        amount += price.cost
      }
      if (!Number.isSafeInteger(totalTokens)) {
        totalTokens = null
        reasons.add('token-overflow')
      }
      return { totalTokens, cost: reasons.size ? null : { currency: currency ?? 'CNY', amount }, reasons: [...reasons] }
    }

    function collectLedger(mainId, snapshot, maxChildren, overrides = []) {
      const queue = [mainId]
      const seen = new Set(queue)
      const sessions = []
      for (const id of queue) {
        const limit = sessions.length > maxChildren
        const frame = limit ? undefined : snapshot(id)
        const view = frame?.costlineLedger
        const rangeReasons = new Set(view?.reasons)
        const turns = view?.turns ?? []
        const compactions = view?.compactions ?? []
        if (limit) rangeReasons.add('session-limit')
        else if (!frame) rangeReasons.add('session-unread')
        else if (!view) rangeReasons.add('projection-unavailable')
        const catalog = frame?.subagentCatalog
        if (catalog !== undefined && !Array.isArray(catalog)) rangeReasons.add('catalog-unavailable')
        for (const entry of Array.isArray(catalog) ? catalog : []) {
          const address = childAddress(id, entry)
          if (!address) {
            rangeReasons.add('catalog-unavailable')
            continue
          }
          const child = address.childSessionId
          if (address.mode === 'external' || seen.has(child)) continue
          seen.add(child)
          queue.push(child)
        }
        sessions.push({
          id, asOfSeq: view?.asOfSeq, inheritedEventCount: view?.inheritedEventCount,
          turns, compactions, rangeReasons: [...rangeReasons], subtotal: priceRows(turns, overrides),
        })
      }
      const [main, ...children] = sessions
      const compactions = sessions.flatMap(session => session.compactions.map(row => ({ ...row, sessionId: session.id })))
      const rows = [...sessions.flatMap(session => session.turns), ...compactions]
      const rangeReasons = [...new Set(sessions.flatMap(session => session.rangeReasons))]
      const total = priceRows(rows, overrides)
      if (rangeReasons.length) total.cost = null
      const complete = rangeReasons.length === 0 && rows.every(row => row.usage) && total.totalTokens !== null
      return {
        main, children, compactions, total, rangeReasons, complete,
        compactionSubtotal: priceRows(compactions, overrides),
      }
    }

    return { collectLedger, priceRows, createLedgerReader, ledgerReasonKey, visibleTokens }
  }

  if (typeof module === 'object' && module.exports) module.exports = createLedgerClient(require('./client.pricing.js'))
  else window.__ModuleLoader__.load({
    id: 'dsh-costline', chunk: 'client.ledger.js',
    factory() { return createLedgerClient },
  })
})()
