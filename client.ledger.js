;(function () {
  function createLedgerClient({ estimate }) {
    function priceRows(rows, overrides, missing = []) {
      let totalTokens = 0
      let amount = 0
      let currency
      let model
      const reasons = new Set(missing)
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
        if (row.usage.cacheReadTokens === undefined || row.usage.cacheWriteTokens === undefined) {
          reasons.add('price-cache')
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
        const reasons = [...(view?.reasons ?? [])]
        const turns = view?.turns ?? []
        const compactions = view?.compactions ?? []
        if (limit) reasons.push('session-limit')
        else if (!frame) reasons.push('session-unread')
        else if (!view) reasons.push('projection-unavailable')
        const subtotal = priceRows(turns, overrides, reasons)
        const catalog = frame?.subagentCatalog
        if (frame && !Array.isArray(catalog)) reasons.push('catalog-unavailable')
        for (const { id: child, mode } of Array.isArray(catalog) ? catalog : []) {
          if (mode === 'external' || seen.has(child)) continue
          seen.add(child)
          queue.push(child)
        }
        sessions.push({
          id, asOfSeq: view?.asOfSeq, inheritedEventCount: view?.inheritedEventCount,
          turns, compactions, reasons, subtotal,
        })
      }
      const [main, ...children] = sessions
      const compactions = sessions.flatMap(session => session.compactions.map(row => ({ ...row, sessionId: session.id })))
      const rows = [...sessions.flatMap(session => session.turns), ...compactions]
      const missing = sessions.flatMap(session => session.reasons)
      const total = priceRows(rows, overrides, missing)
      const complete = missing.length === 0 && rows.every(row => row.usage) && total.totalTokens !== null
      return {
        main, children, compactions, total,
        compactionSubtotal: priceRows(compactions, overrides, missing.filter(reason => reason !== 'turn-in-progress')),
        complete,
      }
    }

    return { collectLedger, priceRows }
  }

  if (typeof module === 'object' && module.exports) module.exports = createLedgerClient(require('./client.pricing.js'))
  else window.__ModuleLoader__.load({
    id: 'dsh-costline', chunk: 'client.ledger.js',
    factory() { return createLedgerClient },
  })
})()
