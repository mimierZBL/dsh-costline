window.__ModuleLoader__.load({
  id: 'dsh-costline',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-costline'
    const EMPTY_OVERRIDES = Object.freeze([])
    // Header copy ships with Chat; these fallbacks cover a missing Chat locale
    // namespace instead of blanking the control.
    const CHAT_FALLBACK = {
      'message.stopped': 'Stopped',
      'message.turnProcess.failed': 'Failed',
      'message.turnProcess.worked': 'Completed',
      'message.turnProcess.took': 'Completed in ',
      'duration.hourUnit': 'h ',
      'duration.minuteUnit': 'm ',
      'duration.secondUnit': 's',
    }

    const zh = {
      'line': '本次任务消耗 {tokens} tok，{cost}',
      'lineNoCost': '本次任务消耗 {tokens} tok，费用未知',
      'model.unknown': '未知',
      'detail.model': '提供方 / 模型：{models}',
      'detail.scope': '统计范围：本轮任务在主会话中的全部模型调用（思考/推理、每次工具往返、重试），不是最终回复的文字量；不含子智能体会话与压缩摘要等独立调用',
      'detail.input': '未缓存输入 {tokens}',
      'detail.cacheRead': '缓存读取 {tokens}',
      'detail.cacheWrite': '缓存写入 {tokens}',
      'detail.output': '输出 {tokens}',
      'detail.outputReasoning': '输出 {tokens}（其中推理 {reasoning}）',
      'detail.rate': '{period} · {source}（{currency}/百万 tok）：缓存命中 {hit}，缓存未命中 {miss}，缓存写入 {write}，输出 {output}',
      'detail.default': '内置费率',
      'detail.custom': '自定义费率',
      'detail.noCost.model': '费用未知：未匹配到受支持的 DeepSeek 官方路由',
      'detail.noCost.mixed': '费用未知：本轮混用了不同模型、费率或币种',
      'detail.noCost.cache': '费用未知：本轮用量缺少缓存明细',
      'detail.noCost.usage': '费用未知：本轮用量不完整或各项合计不一致',
      'detail.noCost.time': '费用未知：缺少本轮时间',
      'detail.note': '按轮次结束时的北京时间计价。周一至周五 09:00–12:00、14:00–18:00 为高峰，周末和中国法定节假日全天为空闲。内置日历涵盖 2025–2027 年，其他年份按周一至周五时段计算。本地估算，仅供参考。',
      'period.peak': '高峰时段',
      'period.offPeak': '空闲时段',
      'settings.title': '配置',
      'settings.help': '空白字段沿用内置 CNY 费率。切换币种时，请填写该币种在两个时段的全部单价。保存后也会重算已完成的轮次。',
      'settings.provider': '提供方',
      'settings.model': '模型',
      'settings.currency': '币种代码',
      'settings.rate.cacheHit': '缓存命中',
      'settings.rate.cacheMiss': '缓存未命中',
      'settings.rate.cacheWrite': '缓存写入',
      'settings.rate.output': '输出',
      'settings.add': '添加费率',
      'settings.rule': '费率 {index}',
      'settings.remove': '移除费率 {index}',
      'settings.save': '保存费率',
      'settings.reset': '恢复默认',
      'settings.saved': '费率已保存。',
      'settings.resetDone': '已恢复内置费率。',
      'settings.failed': '未能保存。请确认设置可写，或重新打开页面后再试。',
      'settings.conflict': '费率已在其他位置更改。重新打开页面可载入最新值。',
      'settings.invalid': '费率无效。检查编号、时段和字段：{message}',
      'settings.disabled': '当前 profile 的费率设置不可写。',
    }
    const en = {
      'line': 'This task used {tokens} tok · {cost}',
      'lineNoCost': 'This task used {tokens} tok · cost unknown',
      'model.unknown': 'unknown',
      'detail.model': 'Provider / model: {models}',
      'detail.scope': 'Scope: every model call in this turn on the main session (thinking, each tool round, retries), not the final reply text; child agent sessions and compaction summaries are separate calls',
      'detail.input': 'Uncached input {tokens}',
      'detail.cacheRead': 'Cached input {tokens}',
      'detail.cacheWrite': 'Cache write {tokens}',
      'detail.output': 'Output {tokens}',
      'detail.outputReasoning': 'Output {tokens} ({reasoning} reasoning)',
      'detail.rate': '{period} · {source} ({currency} per 1M tok): cache hit {hit}, cache miss {miss}, cache write {write}, output {output}',
      'detail.default': 'Built-in rates',
      'detail.custom': 'Custom rates',
      'detail.noCost.model': 'Cost unknown: no supported official DeepSeek route matched',
      'detail.noCost.mixed': 'Cost unknown: this turn mixed models, rates, or currencies',
      'detail.noCost.cache': 'Cost unknown: cache breakdown is incomplete',
      'detail.noCost.usage': 'Cost unknown: usage is incomplete or the token counts do not add up',
      'detail.noCost.time': 'Cost unknown: the turn time is missing',
      'detail.note': 'Rates use the turn end time in Asia/Shanghai. Peak hours are 09:00–12:00 and 14:00–18:00 Monday to Friday. Weekends and Chinese public holidays are off-peak all day. The bundled calendar covers 2025–2027. Other years use the weekday schedule. Local estimate only.',
      'period.peak': 'Peak-hour',
      'period.offPeak': 'Off-peak',
      'settings.title': 'Configuration',
      'settings.help': 'Leave an amount blank to use the built-in CNY rate. If you change the currency, enter all rates in that currency for both periods. Saving also recalculates completed turns.',
      'settings.provider': 'Provider',
      'settings.model': 'Model',
      'settings.currency': 'Currency code',
      'settings.rate.cacheHit': 'Cache hit',
      'settings.rate.cacheMiss': 'Cache miss',
      'settings.rate.cacheWrite': 'Cache write',
      'settings.rate.output': 'Output',
      'settings.add': 'Add rate',
      'settings.rule': 'Rate {index}',
      'settings.remove': 'Remove rate {index}',
      'settings.save': 'Save rates',
      'settings.reset': 'Restore defaults',
      'settings.saved': 'Rates saved.',
      'settings.resetDone': 'Built-in rates restored.',
      'settings.failed': 'Could not save. Check that settings are writable or reopen the page and try again.',
      'settings.conflict': 'Rates changed elsewhere. Reopen this page to load the latest values.',
      'settings.invalid': 'Invalid rate. Check the rule, period, and field shown here: {message}',
      'settings.disabled': 'Rates are read-only for this profile.',
    }

    const NUMBER = new Intl.NumberFormat('en-US')
    const CSS = `
.dshrc-root {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: calc(33px + var(--dsh-content-font-delta, 0px));
  padding: 0 0 8px;
  border: none;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  background: none;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: var(--dsh-content-font-size, 14px);
  cursor: pointer;
  text-align: left;
  transition: color 100ms ease;
}
.dshrc-root:disabled { cursor: default; }
@media (hover: hover) {
  .dshrc-root:hover:not(:disabled) { color: var(--dsw-alias-label-secondary); }
}
.dshrc-label {
  min-width: 0;
  overflow: hidden;
  font-size: inherit;
  line-height: calc(24px + var(--dsh-content-font-delta, 0px));
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshrc-duration {
  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-variant-numeric: tabular-nums;
}
.dshrc-cost {
  flex: 0 1 auto;
  min-width: 0;
  margin-left: 8px;
  overflow: hidden;
  color: var(--dsw-alias-brand-primary-new-colorprimary-new-color, var(--dsw-alias-link));
  font-size: inherit;
  line-height: calc(24px + var(--dsh-content-font-delta, 0px));
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}
.dshrc-chevron {
  flex: none;
  width: 14px;
  height: 14px;
  margin-left: 4px;
  color: inherit;
  transition: transform 100ms ease;
}
.dshrc-root[data-open] .dshrc-chevron { transform: rotate(180deg); }
.dshrc-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
@media (prefers-reduced-motion: reduce) {
  .dshrc-root, .dshrc-chevron { transition: none; }
}
.dshrc-settings { display: grid; gap: 12px; min-width: 0; padding: 12px 0; }
.dshrc-settings :is(h4, p) { margin: 0; }
.dshrc-settings p { overflow-wrap: anywhere; }
.dshrc-settings fieldset {
  min-width: 0;
  margin: 0;
  padding: 8px 12px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
}
.dshrc-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 126px), 1fr));
  gap: 8px;
  margin-block: 6px;
}
.dshrc-settings-grid label { display: grid; gap: 4px; min-width: 0; }
.dshrc-settings-grid :is(input, select), .dshrc-settings button {
  box-sizing: border-box;
  min-width: 0;
  min-height: 32px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  padding: 4px 8px;
  background: transparent;
  color: inherit;
  font: inherit;
}
.dshrc-settings :is(input, select, button):focus-visible {
  outline: 2px solid var(--dsw-alias-link);
  outline-offset: 2px;
}
.dshrc-settings button:disabled { opacity: 0.55; }
.dshrc-settings-actions { display: flex; flex-wrap: wrap; gap: 8px; }
`

    function interpolate(dict, key, params) {
      let text = dict[key] === undefined ? key : dict[key]
      if (params !== undefined) {
        for (const [name, value] of Object.entries(params)) text = text.split(`{${name}}`).join(String(value))
      }
      return text
    }

    function fallbackTranslate(dict) {
      return (key, params) => interpolate(dict, key, params)
    }

    /** Chat copy with a host-independent fallback for a missing Chat dictionary. */
    function chatLabel(chatT, key) {
      const text = chatT(key)
      return text === key && CHAT_FALLBACK[key] !== undefined ? CHAT_FALLBACK[key] : text
    }

    function countOrZero(value) {
      return Number.isSafeInteger(value) && value >= 0 ? value : 0
    }

    function routeText(t, rows, modelLabel) {
      if (rows.length === 0) return t('model.unknown')
      const labels = rows.filter(row => typeof row.model === 'string' && row.model !== '').map(row => (
        typeof row.provider === 'string' && row.provider !== ''
          ? `${row.provider} / ${modelLabel(row.model)}` : modelLabel(row.model)
      ))
      return [...new Set(labels)].join(', ') || t('model.unknown')
    }

    function detailText(t, usage, breakdown, modelLabel) {
      const lines = [t('detail.model', { models: routeText(t, breakdown.rows, modelLabel) }), t('detail.scope')]
      if (breakdown.uncached !== undefined) {
        lines.push(t('detail.input', { tokens: NUMBER.format(breakdown.uncached) }))
      }
      if (breakdown.cacheRead !== undefined) {
        lines.push(t('detail.cacheRead', { tokens: NUMBER.format(breakdown.cacheRead) }))
      }
      if (breakdown.cacheWrite > 0) {
        lines.push(t('detail.cacheWrite', { tokens: NUMBER.format(breakdown.cacheWrite) }))
      }
      lines.push(countOrZero(usage.reasoningTokens) > 0
        ? t('detail.outputReasoning', {
          tokens: NUMBER.format(usage.outputTokens),
          reasoning: NUMBER.format(usage.reasoningTokens),
        })
        : t('detail.output', { tokens: NUMBER.format(usage.outputTokens) }))
      if (breakdown.cost !== null) {
        lines.push(t('detail.rate', {
          period: t(`period.${breakdown.period}`),
          source: t(breakdown.custom ? 'detail.custom' : 'detail.default'),
          currency: breakdown.currency,
          hit: breakdown.price.cacheHit,
          miss: breakdown.price.cacheMiss,
          write: breakdown.price.cacheWrite,
          output: breakdown.price.output,
        }))
      } else if (breakdown.reason !== undefined) {
        lines.push(t(`detail.noCost.${breakdown.reason}`))
      }
      lines.push(t('detail.note'))
      return lines.join('\n')
    }

    /** Elapsed-time fragments mirroring the shipped Chat helper. */
    function formatDuration(ms, chatT) {
      const total = Math.max(0, Math.floor(ms / 1000))
      const hours = Math.floor(total / 3600)
      const minutes = Math.floor(total / 60) % 60
      const seconds = total % 60
      const parts = []
      if (hours > 0) parts.push({ text: String(hours), numeric: true }, { text: chatLabel(chatT, 'duration.hourUnit'), numeric: false })
      if (total >= 60) parts.push({ text: String(minutes), numeric: true }, { text: chatLabel(chatT, 'duration.minuteUnit'), numeric: false })
      parts.push({ text: String(seconds), numeric: true }, { text: chatLabel(chatT, 'duration.secondUnit'), numeric: false })
      return parts
    }

    /** Shipped rule: live, stopped, and failed Turns cannot collapse. */
    function alwaysOpen(turn) {
      const reason = turn?.end?.data?.reason?.kind
      return turn?.status === 'open' || reason === 'aborted' || reason === 'interrupted' || reason === 'error'
    }

    function turnOf(node) {
      const location = node?.location
      return location?.kind === 'turn' || location?.kind === 'step' ? location.turn : undefined
    }

    /** Reuse the completed Turn's exact usage published by the Chat definition. */
    function useTurnTail(turn) {
      const source = React.useMemo(() => {
        const store = turn !== undefined ? turn.data : undefined
        return store !== null && typeof store === 'object' && typeof store.source === 'function'
          ? store.source('turn-tail')
          : null
      }, [turn])
      const subscribe = React.useCallback(listener => (
        source === null ? () => {} : source.subscribe(listener)
      ), [source])
      const getSnapshot = React.useCallback(() => (
        source === null ? undefined : source.getSnapshot()
      ), [source])
      return React.useSyncExternalStore(subscribe, getSnapshot)
    }

    function chevron() {
      return h('svg', { className: 'dshrc-chevron', viewBox: '0 0 16 16', 'aria-hidden': 'true' },
        h('path', {
          d: 'M4 6.25 8 10.25 12 6.25',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }))
    }

    function toDraft(overrides) {
      return overrides.map((rule, id) => ({ ...rule, id }))
    }

    function parseDraft(rows, pricing) {
      const number = (value) => {
        if (typeof value === 'number') return value
        const text = value.trim()
        return /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) ? Number(text) : NaN
      }
      return pricing.validateOverrides(rows.map(({ id, currency, ...rule }) => {
        if (currency?.trim()) rule.currency = currency
        for (const period of pricing.periods) {
          rule[period] = Object.fromEntries(Object.entries(rule[period] ?? {})
            .filter(([, value]) => typeof value !== 'string' || value.trim() !== '')
            .map(([field, value]) => [field, number(value)]))
        }
        return rule
      }))
    }

    function pricingSource(mirror) {
      // The Host validates with a closure-backed transform. The rc.3 generic
      // form cannot rehydrate that callback in the browser. Read the already
      // validated value from the shared mirror, and use the form to write it.
      let previous
      let snapshot
      return {
        subscribe: listener => mirror.subscribe(listener),
        getSnapshot() {
          const current = mirror.getSnapshot()
          if (current !== previous) {
            previous = current
            const entry = current.view?.namespaces.find(candidate => candidate.ns === NS)
            snapshot = {
              status: entry !== undefined ? 'ready' : (current.view === undefined ? 'loading' : 'unavailable'),
              value: entry?.value,
              user: entry?.user,
              revision: entry?.revision,
              writable: entry !== undefined && current.view.writable,
            }
          }
          return snapshot
        },
      }
    }

    function RateFields({ row, index, pricing, t, edit, remove, locked }) {
      const input = (label, attrs) => h('label', { key: attrs.name }, label, h('input', attrs))
      const select = (name, values, label, display = value => value) => h('label', { key: name }, label,
        h('select', { name, value: row[name], onChange: event => edit({ [name]: event.target.value }) },
          values.map(value => h('option', { key: value, value }, display(value)))))
      return h('fieldset', { disabled: locked, 'data-costline-rate': '' },
        h('legend', null, t('settings.rule', { index })),
        h('div', { className: 'dshrc-settings-grid' },
          select('provider', pricing.providers, t('settings.provider')),
          select('model', Object.keys(pricing.defaults), t('settings.model'), pricing.modelLabel),
          input(t('settings.currency'), {
            name: 'currency', value: row.currency ?? '', placeholder: 'CNY', maxLength: 3,
            onChange: event => edit({ currency: event.target.value }),
          })),
        pricing.periods.map(period => h('fieldset', { key: period },
          h('legend', null, t('period.' + period)),
          h('div', { className: 'dshrc-settings-grid' }, pricing.fields.map(field => input(
            t('settings.rate.' + field), {
              name: period + '.' + field,
              inputMode: 'decimal',
              value: row[period]?.[field] ?? '',
              placeholder: row.currency && row.currency.toUpperCase() !== 'CNY'
                ? undefined : pricing.defaults[row.model]?.[period][field]?.toString(),
              onChange: event => edit({ [period]: { ...row[period], [field]: event.target.value } }),
            }))))),
        h('button', { type: 'button', onClick: remove }, t('settings.remove', { index })))
    }

    function PricingSettings({ t, form, source, pricing }) {
      const snapshot = React.useSyncExternalStore(source.subscribe, source.getSnapshot)
      const headingId = React.useId()
      const [draft, setDraft] = React.useState(null)
      const [notice, setNotice] = React.useState(null)
      const [saving, setSaving] = React.useState(false)
      const pending = React.useRef(false)
      const accepted = snapshot.value?.overrides ?? EMPTY_OVERRIDES
      const rows = draft?.rows ?? toDraft(accepted)
      const conflicted = draft !== null && draft.revision !== snapshot.revision
      const locked = !snapshot.writable || snapshot.revision === undefined || saving

      function edit(update) {
        setDraft(current => ({
          rows: update(current?.rows ?? toDraft(accepted)),
          revision: current === null ? snapshot.revision : current.revision,
        }))
        setNotice(null)
      }

      function add() {
        const models = Object.keys(pricing.defaults)
        const pair = pricing.providers.flatMap(provider => models.map(model => ({ provider, model })))
          .find(({ provider, model }) => !rows.some(row => row.provider === provider && row.model === model))
        if (pair === undefined) return
        edit(current => [...current, { ...pair, id: Math.max(-1, ...current.map(row => row.id)) + 1 }])
      }

      async function submit(reset) {
        if (locked || pending.current || (!reset && (draft === null || conflicted))) return
        let op = { op: 'unset', path: ['overrides'] }
        if (!reset) {
          try {
            const overrides = parseDraft(rows, pricing)
            if (overrides.length > 0) op = { op: 'set', path: ['overrides'], value: overrides }
          } catch (error) {
            setNotice({ key: 'settings.invalid', params: { message: error.message }, error: true })
            return
          }
        }
        pending.current = true
        setSaving(true)
        setNotice(null)
        try {
          const saved = reset && !Object.hasOwn(snapshot.user ?? {}, 'overrides')
            ? true : await form.mutate([op], reset ? snapshot.revision : draft.revision)
          if (saved) setDraft(null)
          setNotice({
            key: saved ? (reset ? 'settings.resetDone' : 'settings.saved') : 'settings.failed',
            error: !saved,
          })
        } catch {
          setNotice({ key: 'settings.failed', error: true })
        } finally {
          pending.current = false
          setSaving(false)
        }
      }

      return h('form', {
        className: 'dshrc-settings', noValidate: true, 'aria-busy': saving, 'aria-labelledby': headingId,
        'data-costline-settings': '', onSubmit: event => { event.preventDefault(); void submit(false) },
      },
      h('h4', { id: headingId }, t('settings.title')),
      h('p', null, t('settings.help')),
      rows.map((row, position) => h(RateFields, {
        key: row.id, row, index: position + 1, pricing, t, locked,
        edit: changes => edit(current => current.map(item => item.id === row.id ? { ...item, ...changes } : item)),
        remove: () => edit(current => current.filter(item => item.id !== row.id)),
      })),
      h('div', { className: 'dshrc-settings-actions' },
        h('button', { type: 'button', disabled: locked || rows.length >= pricing.providers.length * Object.keys(pricing.defaults).length, onClick: add }, t('settings.add')),
        h('button', { type: 'submit', disabled: locked || draft === null || conflicted }, t('settings.save')),
        h('button', { type: 'button', disabled: locked, onClick: () => { void submit(true) } }, t('settings.reset'))),
      conflicted && h('p', { role: 'alert' }, t('settings.conflict')),
      snapshot.status !== 'loading' && !snapshot.writable && h('p', null, t('settings.disabled')),
      notice && h('p', { role: notice.error ? 'alert' : 'status' }, t(notice.key, notice.params)))
    }

    /**
     * Replacement for Chat's turn-process header. It reproduces the shipped
     * duration/disclosure control and appends the DeepSeek-blue reply cost
     * after the duration. Reusing this key shadows shipped UI, so re-check the
     * control after a DSH upgrade.
     */
    function TurnProcessHeaderWithCost({ node, turnProcess, t, chatT, pricing, source }) {
      const detailId = React.useId()
      const turn = turnOf(node)
      const tail = useTurnTail(turn)
      const snapshot = React.useSyncExternalStore(source.subscribe, source.getSnapshot)
      if (turnProcess === undefined) return null
      if (turn === undefined || turn.status !== 'closed') return null

      const translate = typeof t === 'function' ? t : fallbackTranslate(zh)
      const chat = typeof chatT === 'function' ? chatT : fallbackTranslate(CHAT_FALLBACK)
      const open = !turnProcess.foldable || turnProcess.open
      const reason = turn.end?.data?.reason?.kind
      const stopped = reason === 'aborted' || reason === 'interrupted'
      const elapsedMs = turn.start === undefined || turn.end === undefined
        ? undefined
        : Math.max(1000, turn.end.time - turn.start.time)
      const duration = elapsedMs === undefined || stopped || reason === 'error'
        ? undefined
        : formatDuration(elapsedMs, chat)
      const label = stopped ? chatLabel(chat, 'message.stopped')
        : reason === 'error' ? chatLabel(chat, 'message.turnProcess.failed')
          : duration === undefined ? chatLabel(chat, 'message.turnProcess.worked')
            : chatLabel(chat, 'message.turnProcess.took')
      const announcement = stopped ? chatLabel(chat, 'message.stopped')
        : reason === 'error' ? chatLabel(chat, 'message.turnProcess.failed')
          : chatLabel(chat, 'message.turnProcess.worked')
      const canCollapse = turnProcess.foldable && turnProcess.hasContent && !alwaysOpen(turn)

      const usage = tail !== null && typeof tail === 'object' ? tail.tokenUsage : undefined
      const hasReply = tail?.closing != null
      const showCost = snapshot.status !== 'loading' && hasReply && usage !== null && typeof usage === 'object'
        && Number.isSafeInteger(usage.totalTokens) && usage.totalTokens > 0
      let costLine
      let costDetail
      let cost
      let currency
      let costCny = ''
      let costModel = ''
      if (showCost) {
        const breakdown = pricing.estimate(usage, turn.end?.time, snapshot.value?.overrides ?? EMPTY_OVERRIDES)
        costDetail = detailText(translate, usage, breakdown, pricing.modelLabel)
        if (breakdown.cost !== null) {
          cost = String(breakdown.cost)
          currency = breakdown.currency
          if (currency === 'CNY') costCny = breakdown.cost.toFixed(6)
        }
        costModel = breakdown.priced === undefined ? '' : breakdown.priced
        const tokens = NUMBER.format(usage.totalTokens)
        costLine = breakdown.cost === null
          ? translate('lineNoCost', { tokens })
          : translate('line', { tokens, cost: pricing.formatCost(breakdown.cost, currency) })
      }

      return h(React.Fragment, null,
        h('span', {
          className: 'dshrc-sr',
          role: 'status',
          'aria-live': 'polite',
          'aria-atomic': 'true',
        }, announcement),
        h('button', {
          type: 'button',
          className: 'dshrc-root',
          'data-open': open || undefined,
          'data-turn-process': node.data.turn,
          'data-turn-process-messages': node.data.messageCount,
          'data-turn-process-tool-calls': node.data.toolCallCount,
          'data-turn-process-subagents': node.data.subagentCount,
          disabled: !canCollapse,
          'aria-expanded': turnProcess.hasContent ? open : undefined,
          'aria-describedby': showCost ? detailId : undefined,
          onClick: (event) => {
            event.currentTarget.focus()
            turnProcess.setOpen(!open)
          },
        },
        h('span', { className: 'dshrc-label' },
          label,
          ...(duration === undefined ? [] : duration.map((part, index) => h('span', {
            key: index,
            className: part.numeric ? 'dshrc-duration' : undefined,
          }, part.text)))),
        showCost && h('span', {
          className: 'dshrc-cost',
          'data-reply-cost': '',
          'data-reply-cost-total': String(usage.totalTokens),
          'data-reply-cost-cny': costCny,
          'data-reply-cost-amount': cost,
          'data-reply-cost-currency': currency,
          'data-reply-cost-model': costModel,
          title: costDetail,
        }, costLine),
        canCollapse && chevron()),
        showCost && h('span', { id: detailId, className: 'dshrc-sr' }, costDetail))
    }

    return {
      inject: ['slots', 'locale', 'configForms'],
      async apply(ctx) {
        const pricing = await require.async('./client.pricing.js')
        const chatT = ctx.locale.bind('chat')
        const form = ctx.configForms.get(NS)
        const source = pricingSource(ctx.configForms.describe())
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'costline: dictionaries')
        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.plugin = NS
          style.textContent = CSS
          ;(document.head || document.documentElement).append(style)
          return () => style.remove()
        }, 'costline: styles')
        ctx.effect(() => ctx.configForms.whileServed([NS], () => ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: NS,
          locale: NS,
        }, props => h(PricingSettings, { ...props, form, source, pricing })))), 'costline: pricing settings')
        ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
          name: 'conversation.chat.node',
          key: 'turn-process',
          priority: -1,
          locale: NS,
        }, props => h(TurnProcessHeaderWithCost, { ...props, chatT, source, pricing })))
      },
    }
  },
})
