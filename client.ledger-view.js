window.__ModuleLoader__.load({
  id: '@mimier/dsh-costline',
  chunk: 'client.ledger-view.js',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const formatNumber = new Intl.NumberFormat()
    const limit = 20
    const focusable = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const css = `
html:has(.dshrc-ledger-dialog[open]), body:has(.dshrc-ledger-dialog[open]) {
  overflow: hidden !important; overscroll-behavior: none; }
.dshrc-ledger-trigger, .dshrc-ledger-dialog {
  --dshrc-ledger-edge: color-mix(in srgb, var(--dsw-alias-label-secondary, GrayText) 75%,
    var(--dsw-alias-bg-base, Canvas)); }
.dshrc-ledger-trigger, .dshrc-ledger-dialog button { font: inherit; color: inherit; cursor: pointer; }
.dshrc-ledger-trigger { -webkit-app-region: no-drag; border: 1px solid var(--dshrc-ledger-edge, GrayText);
  border-radius: 6px; padding: 4px 8px; background: transparent; white-space: nowrap; }
.dshrc-ledger-dialog { box-sizing: border-box; width: min(620px, calc(100% - 28px)); max-height: calc(100% - 28px);
  overflow: auto; border: 1px solid var(--dshrc-ledger-edge, GrayText); border-radius: 12px; margin: auto;
  padding: 20px; color: var(--dsw-alias-label-primary, CanvasText); background: var(--dsw-alias-bg-base, Canvas);
  font-size: var(--dsh-content-font-size, 14px); line-height: 1.5; overscroll-behavior: contain; }
.dshrc-ledger-dialog::backdrop { background: rgb(0 0 0 / 38%); }
.dshrc-ledger-dialog button { padding: 4px 10px; border: 1px solid var(--dshrc-ledger-edge, GrayText);
  border-radius: 6px; background: transparent; }
.dshrc-ledger-dialog button[aria-disabled=true] { cursor: default; opacity: .65; }
.dshrc-ledger-dialog :focus-visible, .dshrc-ledger-trigger:focus-visible {
  outline: 2px solid var(--dsw-alias-label-primary, CanvasText); outline-offset: 2px; }
.dshrc-ledger-heading, .dshrc-ledger-actions, .dshrc-ledger-metrics { display: flex; flex-wrap: wrap; gap: 6px 16px; }
.dshrc-ledger-heading { align-items: center; justify-content: space-between; }
.dshrc-ledger-dialog h2, .dshrc-ledger-dialog h3, .dshrc-ledger-dialog h4 { margin: 0; }
.dshrc-ledger-dialog p { margin: 6px 0; }
.dshrc-ledger-dialog section { border-top: 1px solid var(--dsw-alias-border-l2, GrayText); margin-top: 12px; padding-top: 10px; }
.dshrc-ledger-metrics { margin: 5px 0; }
.dshrc-ledger-metrics dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.dshrc-ledger-dialog ul.dshrc-ledger-amounts { display: flex; flex-wrap: wrap; gap: 4px 12px; list-style: none; padding: 0; margin: 0; }
.dshrc-ledger-dialog ul { margin: 5px 0; padding-inline-start: 20px; }
.dshrc-ledger-detail { list-style: none; padding: 0 !important; }
.dshrc-ledger-detail > li { margin-top: 8px; }
.dshrc-ledger-watermark { color: var(--dsw-alias-label-secondary, GrayText); }
@media (max-width: 450px) {
  .dshrc-ledger-dialog { padding: 14px; }
  .dshrc-ledger-metrics { flex-direction: column; gap: 4px; }
}
`

    function currencyText({ currency, amount }) {
      const precision = amount > 0 && amount < 0.000001 ? { maximumSignificantDigits: 2 }
        : { minimumFractionDigits: 0, maximumFractionDigits: amount >= 0.01 ? 3 : amount >= 0.001 ? 4 : 6 }
      return currency + ' ≈' + new Intl.NumberFormat(undefined, {
        style: 'currency', currency, currencyDisplay: 'narrowSymbol', ...precision,
      }).format(amount)
    }

    return function installLedgerView(ctx, { ledger, source, ns }) {
      const { collectLedger, createLedgerReader, ledgerReasonKey, visibleTokens, priceRows } = ledger

      function Reasons({ codes, t }) {
        const unique = [...new Set(codes)]
        return unique.length ? h('ul', null, unique.map(code => (
          h('li', { key: code, 'data-costline-ledger-reason': code }, t(ledgerReasonKey(code), { limit }))
        ))) : null
      }

      function Metrics({ sum, rows, covered, rateStatus, t }) {
        const tokens = visibleTokens(sum.totalTokens, rows, covered)
        const text = tokens === null ? t('ledger.unknown-tokens') : t('ledger.tokens-value', { tokens: formatNumber.format(tokens) })
        const costs = sum.costs.length || rows.length || !covered ? sum.costs : [{ currency: 'CNY', amount: 0 }]
        const partial = !covered || sum.reasons.length > 0
        const showCosts = rateStatus === 'ready' && costs.length > 0
        const amount = showCosts ? h('ul', { className: 'dshrc-ledger-amounts' }, costs.map(cost => (
          h('li', { key: cost.currency, 'data-costline-ledger-currency': cost.currency,
            'data-costline-ledger-amount': cost.amount }, currencyText(cost))
        ))) : t(rateStatus === 'loading' && costs.length ? 'ledger.loading-rates' : 'ledger.unknown-cost')
        return h('dl', { className: 'dshrc-ledger-metrics' },
          h('div', null, h('dt', null, t(covered ? 'ledger.tokens' : 'ledger.known-tokens')),
            h('dd', { 'data-costline-ledger-tokens': tokens ?? undefined }, text)),
          h('div', null, h('dt', null, t(partial && showCosts ? 'ledger.known-cost' : 'ledger.estimate')), h('dd', null, amount)))
      }

      function Watermark({ seq, t }) {
        if (seq === undefined) return null
        return h('p', { className: 'dshrc-ledger-watermark', 'data-costline-ledger-seq': seq },
          seq < 0 ? t('ledger.no-events') : t('ledger.as-of', { seq: formatNumber.format(seq) }))
      }

      function Section({ type, t, children }) {
        return h('section', { 'data-costline-ledger-section': type }, h('h3', null, t('ledger.' + type)), children)
      }

      function LedgerContent({ reader, mainId, t }) {
        const { entries, childrenRequested } = React.useSyncExternalStore(reader.subscribe, reader.getSnapshot)
        const rates = React.useSyncExternalStore(source.subscribe, source.getSnapshot)
        const overrides = rates.value?.overrides ?? []
        const refresh = React.useRef(null)
        const mainEntry = entries.get(mainId)
        const loading = !mainEntry || mainEntry.status === 'loading'
        const unavailable = mainEntry?.status === 'ready' && !mainEntry.frame.costlineLedger
        const failure = mainEntry?.status === 'error' || unavailable
        const actions = h('div', { className: 'dshrc-ledger-actions' }, h('button', {
          type: 'button', ref: refresh, onClick: () => { if (!loading) reader.refresh() },
          'aria-disabled': loading, 'data-costline-ledger-refresh': '',
        }, t(failure ? 'ledger.retry' : 'ledger.refresh')))
        const coverageStatus = (state, key) => h('p', {
          role: 'status', 'aria-live': 'polite', 'aria-atomic': true, 'data-costline-ledger-coverage': state,
        }, t(key))
        if (loading) return h(React.Fragment, null, actions, coverageStatus('loading', 'ledger.loading'))
        if (failure) return h(React.Fragment, null,
          actions,
          h('p', { role: 'alert' }, t('ledger.error')),
          unavailable ? h(Reasons, { codes: ['projection-unavailable'], t }) : null)
        const status = id => entries.get(id)?.status
        const account = collectLedger(mainId, id => entries.get(id)?.frame, limit, overrides, status)
        const { main, children, compactions, compactionSubtotal, total, complete, rangeReasons,
          childRangeReasons, compactionRangeReasons, childLimitCount } = account
        const childTurns = children.flatMap(child => child.turns)
        const allRows = [...main.turns, ...childTurns, ...compactions]
        const metrics = (sum, rows, covered) => h(Metrics, { sum, rows, covered, rateStatus: rates.status, t })
        const through = seq => h(Watermark, { seq, t })
        const reasons = codes => h(Reasons, { codes, t })
        const childrenPending = childrenRequested && children.some(child => (
          !child.rangeReasons.includes('session-limit') && (!status(child.id) || status(child.id) === 'loading')
        ))
        const compactionsCovered = compactionRangeReasons.length === 0 && compactions.every(row => row.usage)
        const childCoverage = childRangeReasons.length === 0 && childTurns.every(row => row.usage)
        const childSubtotal = priceRows(childTurns, overrides)
        const childNames = new Map([[mainId, t('ledger.main')],
          ...children.map((child, i) => [child.id, t('ledger.child', { number: i + 1 })])])

        return h(React.Fragment, null,
          actions,
          coverageStatus(complete ? 'complete' : 'incomplete', complete ? 'ledger.complete' : 'ledger.incomplete'),
          h('p', { className: 'dshrc-ledger-watermark' }, t('ledger.watermark-note')),
          h(Section, { type: 'total', t }, metrics(total, allRows, complete), reasons([...rangeReasons, ...total.reasons])),
          h(Section, { type: 'main', t }, metrics(main.subtotal, main.turns,
            !main.rangeReasons.includes('turn-in-progress') && main.turns.every(row => row.usage)),
          through(main.asOfSeq), reasons([...main.rangeReasons, ...main.subtotal.reasons])),
          h(Section, { type: 'children', t },
            children.length || !childCoverage ? metrics(childSubtotal, childTurns, childCoverage) : h('p', null, t('ledger.none-children')),
            reasons([...childRangeReasons, ...childSubtotal.reasons]),
            childLimitCount ? h('p', { 'data-costline-ledger-limit-count': childLimitCount },
              t('ledger.extra-children', { count: formatNumber.format(childLimitCount) })) : null,
            !childrenRequested && children.length ? h('button', {
              type: 'button', onClick: () => { refresh.current?.focus(); reader.loadChildren() }, 'data-costline-ledger-load': '',
            }, t('ledger.load-children')) : null,
            childrenPending ? h('p', { role: 'status' }, t('ledger.loading-children')) : null,
            h('ul', { className: 'dshrc-ledger-detail' }, children.filter(child => !child.rangeReasons.includes('session-limit')).map(child => {
              const readStatus = status(child.id)
              const codes = child.rangeReasons
              return h('li', { key: child.id, 'data-costline-ledger-child': readStatus ?? 'cold' },
                h('h4', null, childNames.get(child.id)),
                readStatus === 'loading' ? h('p', null, t('ledger.loading-children'))
                  : metrics(child.subtotal, child.turns, child.asOfSeq !== undefined &&
                    !codes.includes('turn-in-progress') && child.turns.every(row => row.usage)),
                through(child.asOfSeq), reasons([...codes, ...child.subtotal.reasons]))
            }))),
          h(Section, { type: 'compaction', t },
            metrics(compactionSubtotal, compactions, compactionsCovered),
            !compactions.length && compactionsCovered ? h('p', null, t('ledger.none-compactions')) : null,
            compactionRangeReasons.length ? h('p', { 'data-costline-ledger-compaction-partial': '' }, t('ledger.compaction-partial')) : null,
            reasons([...compactionRangeReasons, ...compactionSubtotal.reasons]),
            h('ul', { className: 'dshrc-ledger-detail' }, compactions.map((row, i) => {
              const subtotal = priceRows([row], overrides)
              return h('li', { key: JSON.stringify([row.sessionId, row.compactionId]) },
                h('h4', null, childNames.get(row.sessionId) + ' · ' + t('ledger.compaction-row', { number: i + 1 })),
                metrics(subtotal, [row], Boolean(row.usage)), through(row.asOfSeq), reasons(subtotal.reasons))
            }))))
      }

      function LedgerDialog({ mainId, target, opener, onClose, t }) {
        const node = React.useRef(null)
        const close = React.useRef(null)
        const title = React.useId()
        const [reader] = React.useState(() => createLedgerReader(ctx.sessions, mainId, { target, maxChildren: limit }))
        React.useLayoutEffect(() => {
          const element = node.current
          element.showModal()
          close.current.focus()
          return () => {
            element.close()
            opener.current?.focus()
          }
        }, [opener])
        React.useEffect(() => {
          reader.start()
          return reader.dispose
        }, [reader])

        function keepFocus(event) {
          if (event.key !== 'Tab') return
          const targets = [...node.current.querySelectorAll(focusable)].filter(element => (
            element.tabIndex >= 0 && !element.matches(':disabled') &&
            element.getClientRects().length > 0 && getComputedStyle(element).visibility === 'visible'
          ))
          const first = targets[0]
          const last = targets.at(-1)
          if (!first) return
          if (event.shiftKey && event.target === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && event.target === last) {
            event.preventDefault()
            first.focus()
          }
        }

        return h('dialog', {
          ref: node, className: 'dshrc-ledger-dialog', role: 'dialog', 'aria-modal': true, 'aria-labelledby': title,
          'data-costline-ledger-dialog': '',
          onKeyDown: keepFocus,
          onCancel(event) { event.preventDefault(); onClose() },
        }, h('div', { className: 'dshrc-ledger-heading' },
          h('h2', { id: title }, t('ledger.title')),
          h('button', { ref: close, type: 'button', onClick: onClose, 'data-costline-ledger-close': '' }, t('ledger.close'))),
        h(LedgerContent, { reader, mainId, t }))
      }

      function LedgerSeat({ sessionId, useSession, t }) {
        const address = useSession(snapshot => snapshot.subagent?.address)
        const [open, setOpen] = React.useState(false)
        const opener = React.useRef(null)
        return h(React.Fragment, null,
          h('button', {
            type: 'button', ref: opener, className: 'dshrc-ledger-trigger', 'aria-haspopup': 'dialog',
            'aria-expanded': open, 'data-costline-ledger-open': '', onClick: () => setOpen(true),
          }, t('ledger.title')),
          open ? h(LedgerDialog, { mainId: sessionId, target: address ?? sessionId, opener, onClose: () => setOpen(false), t }) : null)
      }

      ctx.effect(() => {
        const style = document.createElement('style')
        style.textContent = css
        document.head.append(style)
        return () => style.remove()
      }, 'costline: ledger styles')
      const slot = 'conversation.session.header.utilities'
      ctx.slots.inject(slot, () => ctx.slots.register({ name: slot, id: ns, locale: ns }, props => (
        props.sessionId && typeof props.useSession === 'function' ? h(LedgerSeat, { key: props.sessionId, ...props }) : null
      )))
    }
  },
})
