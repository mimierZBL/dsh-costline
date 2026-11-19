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
      'mode.label': '费用显示位置',
      'mode.auto': '自动',
      'mode.header': '标题行',
      'mode.footer-only': '仅页脚',
      'mode.pending': '等待设置就绪',
      'mode.save': '保存显示位置',
      'mode.saved': '显示位置已保存。',
      'mode.actual': '当前显示：{mode}',
      'mode.reason.version': 'DSH {version} 不在标题行的已测试范围内。',
      'mode.reason.structure': '标题行数据结构与插件不兼容。',
      'mode.reason.render': '标题行显示或交互异常。',
      'mode.reason.registration': '无法注册标题行渲染器。',
      'ledger.title': '会话成本',
      'ledger.close': '关闭',
      'ledger.refresh': '刷新',
      'ledger.retry': '重试',
      'ledger.load-children': '加载子会话',
      'ledger.loading': '正在读取会话用量…',
      'ledger.loading-children': '正在读取子会话…',
      'ledger.loading-rates': '正在读取费率…',
      'ledger.error': '无法读取主会话用量。',
      'ledger.complete': '已读取此范围内的用量。',
      'ledger.incomplete': '数据不完整。已知用量可能低于实际用量。',
      'ledger.total': '合计',
      'ledger.main': '主会话',
      'ledger.children': '本地子智能体',
      'ledger.child': '子会话 {number}',
      'ledger.compaction': '压缩摘要',
      'ledger.compaction-row': '摘要 {number}',
      'ledger.none-children': '无本地子会话。',
      'ledger.none-compactions': '已读取的会话中没有压缩摘要。',
      'ledger.tokens': '用量',
      'ledger.known-tokens': '已知用量',
      'ledger.tokens-value': '{tokens} tok',
      'ledger.unknown-tokens': '用量未知',
      'ledger.estimate': '预估费用',
      'ledger.unknown-cost': '费用未知',
      'ledger.as-of': '数据截至事件 {seq}',
      'ledger.no-events': '暂无已记录的计量事件',
      'ledger.watermark-note': '各会话的数据水位分别计算。',
      'ledger.reason.session-unread': '有子会话尚未读取。',
      'ledger.reason.session-limit': '超过本次最多读取 {limit} 个子会话的上限。',
      'ledger.reason.session-error': '会话无法读取。',
      'ledger.reason.projection-unavailable': '当前会话的用量投影不可用。',
      'ledger.reason.catalog-unavailable': '子会话目录格式异常。',
      'ledger.reason.turn-in-progress': '仍有轮次未结算。',
      'ledger.reason.turn-usage-unavailable': '有轮次缺少精确用量。',
      'ledger.reason.summary-usage-unavailable': '有摘要缺少精确用量。',
      'ledger.reason.summary-call-unverified': '有摘要无法确认是独立调用。',
      'ledger.reason.price-model': '模型或路由未知，或不支持计费。',
      'ledger.reason.price-mixed': '单次计量混用了模型、费率或币种。',
      'ledger.reason.price-cache': '缓存明细不足。',
      'ledger.reason.price-usage': '用量明细不完整或不一致。',
      'ledger.reason.price-time': '缺少计价所需的时间。',
      'ledger.reason.mixed-model': '此分项包含不同模型。',
      'ledger.reason.mixed-currency': '此分项包含不同币种。',
      'ledger.reason.token-overflow': '总用量超出可精确表示的范围。',
      'ledger.reason.other': '部分计量信息不可用。',
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
      'mode.label': 'Cost placement',
      'mode.auto': 'Auto',
      'mode.header': 'Turn header',
      'mode.footer-only': 'Footer only',
      'mode.pending': 'Waiting for settings',
      'mode.save': 'Save placement',
      'mode.saved': 'Placement saved.',
      'mode.actual': 'Currently showing: {mode}',
      'mode.reason.version': 'The turn header has not been tested on DSH {version}.',
      'mode.reason.structure': 'The turn header data format is incompatible.',
      'mode.reason.render': 'The turn header failed to render or respond.',
      'mode.reason.registration': 'The turn header renderer could not be registered.',
      'ledger.title': 'Session cost',
      'ledger.close': 'Close',
      'ledger.refresh': 'Refresh',
      'ledger.retry': 'Retry',
      'ledger.load-children': 'Load child sessions',
      'ledger.loading': 'Reading session usage…',
      'ledger.loading-children': 'Reading child sessions…',
      'ledger.loading-rates': 'Loading rates…',
      'ledger.error': 'Unable to read main session usage.',
      'ledger.complete': 'Usage for this scope has been read.',
      'ledger.incomplete': 'Usage is incomplete. The recorded amount may be lower than actual usage.',
      'ledger.total': 'Total',
      'ledger.main': 'Main session',
      'ledger.children': 'Local subagents',
      'ledger.child': 'Child session {number}',
      'ledger.compaction': 'Compaction summaries',
      'ledger.compaction-row': 'Summary {number}',
      'ledger.none-children': 'No local child sessions.',
      'ledger.none-compactions': 'No compaction summaries in the sessions read.',
      'ledger.tokens': 'Usage',
      'ledger.known-tokens': 'Known usage',
      'ledger.tokens-value': '{tokens} tok',
      'ledger.unknown-tokens': 'Usage unknown',
      'ledger.estimate': 'Estimated cost',
      'ledger.unknown-cost': 'Cost unknown',
      'ledger.as-of': 'Through event {seq}',
      'ledger.no-events': 'No accounting events recorded yet',
      'ledger.watermark-note': 'Each session has its own event position.',
      'ledger.reason.session-unread': 'Some child sessions have yet to be read.',
      'ledger.reason.session-limit': 'The limit of {limit} child sessions was reached.',
      'ledger.reason.session-error': 'The session could not be read.',
      'ledger.reason.projection-unavailable': 'The usage projection is unavailable for this session.',
      'ledger.reason.catalog-unavailable': 'The child session catalog is malformed.',
      'ledger.reason.turn-in-progress': 'Some turns have yet to settle.',
      'ledger.reason.turn-usage-unavailable': 'Exact usage is missing for a turn.',
      'ledger.reason.summary-usage-unavailable': 'Exact usage is missing for a summary.',
      'ledger.reason.summary-call-unverified': 'A summary could not be verified as a separate model call.',
      'ledger.reason.price-model': 'The model or route is unknown or unsupported.',
      'ledger.reason.price-mixed': 'One usage record mixes models, rates, or currencies.',
      'ledger.reason.price-cache': 'The cache breakdown is incomplete.',
      'ledger.reason.price-usage': 'Usage details are incomplete or inconsistent.',
      'ledger.reason.price-time': 'The timestamp required for pricing is missing.',
      'ledger.reason.mixed-model': 'This subtotal includes different models.',
      'ledger.reason.mixed-currency': 'This subtotal includes different currencies.',
      'ledger.reason.token-overflow': 'The token total exceeds the exact arithmetic range.',
      'ledger.reason.other': 'Some accounting details are unavailable.',
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
.dshrc-footer .dshrc-cost {
  display: inline-block;
  max-width: 100%;
  margin-left: 0;
  font-size: var(--dsh-content-font-size, 14px);
  vertical-align: top;
}
.dshrc-footer .dshrc-cost:focus-visible {
  outline: 2px solid var(--dsw-alias-link);
  outline-offset: -2px;
}
.dshrc-header-placeholder { cursor: default; }
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

    /** Reuse the completed Turn's exact usage published by the Chat definition. */
    function useTurnTail(source) {
      const subscribe = React.useCallback(listener => (
        source === undefined ? () => {} : source.subscribe(listener)
      ), [source])
      const getSnapshot = React.useCallback(() => (
        source === undefined ? undefined : source.getSnapshot()
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

    function displaySource(source, compat, release) {
      const version = compat.parseVersion(release)
      const listeners = new Set()
      let snapshot
      let failure
      let warned = false
      function refresh() {
        const settings = source.getSnapshot()
        const preference = settings.value?.mode === 'footer-only' ? 'footer-only' : 'auto'
        const next = compat.selectDisplay(preference, version, failure, settings.status)
        if (snapshot?.preference === preference && snapshot.actual === next.actual && snapshot.reason === next.reason) return
        snapshot = { preference, version, ...next }
        if (next.reason !== undefined && !warned) {
          warned = true
          console.warn('[dsh-costline] Header disabled (' + next.reason + '). Using the turn footer.')
        }
        for (const listener of listeners) listener()
      }
      refresh()
      return {
        getSnapshot: () => snapshot,
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        refresh,
        fail(reason) {
          failure = compat.firstFailure(failure, reason)
          refresh()
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

    function PricingSettings({ t, form, source, pricing, display }) {
      const snapshot = React.useSyncExternalStore(source.subscribe, source.getSnapshot)
      const placement = React.useSyncExternalStore(display.subscribe, display.getSnapshot)
      const headingId = React.useId()
      const [draft, setDraft] = React.useState(null)
      const [notice, setNotice] = React.useState(null)
      const [saving, setSaving] = React.useState(false)
      const [modeDraft, setModeDraft] = React.useState(undefined)
      const [modeNotice, setModeNotice] = React.useState(undefined)
      const pending = React.useRef(false)
      const accepted = snapshot.value?.overrides ?? EMPTY_OVERRIDES
      const rows = draft?.rows ?? toDraft(accepted)
      const conflicted = draft !== null && draft.revision !== snapshot.revision
      const locked = !snapshot.writable || snapshot.revision === undefined || saving
      const modeLocked = locked || draft !== null

      async function saveMode() {
        if (modeLocked || pending.current || modeDraft === undefined || modeDraft === placement.preference) return
        const op = modeDraft === 'auto'
          ? { op: 'unset', path: ['mode'] }
          : { op: 'set', path: ['mode'], value: modeDraft }
        pending.current = true
        setSaving(true)
        setModeNotice(undefined)
        try {
          const saved = await form.mutate([op], snapshot.revision)
          if (saved) setModeDraft(undefined)
          setModeNotice({ key: saved ? 'mode.saved' : 'settings.failed', error: !saved })
        } catch {
          setModeNotice({ key: 'settings.failed', error: true })
        } finally {
          pending.current = false
          setSaving(false)
        }
      }

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
      h('fieldset', { 'data-costline-placement': '' },
        h('legend', null, t('mode.label')),
        h('div', { className: 'dshrc-settings-grid' },
          h('label', null, t('mode.label'),
            h('select', {
              name: 'mode', value: modeDraft ?? placement.preference, disabled: modeLocked,
              onChange: event => { setModeDraft(event.target.value); setModeNotice(undefined) },
            },
            h('option', { value: 'auto' }, t('mode.auto')),
            h('option', { value: 'footer-only' }, t('mode.footer-only'))))),
        h('button', {
          type: 'button', disabled: modeLocked || modeDraft === undefined || modeDraft === placement.preference,
          onClick: () => { void saveMode() },
        }, t('mode.save')),
        h('p', { 'aria-live': 'polite', 'data-costline-mode': placement.actual, 'data-costline-reason': placement.reason },
          t('mode.actual', { mode: t('mode.' + placement.actual) }),
          placement.reason === undefined ? null : ' ' + t('mode.reason.' + placement.reason, { version: placement.version })),
        modeNotice && h('p', { role: modeNotice.error ? 'alert' : 'status' }, t(modeNotice.key))),
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

    function headerCopy(turn, chat) {
      const reason = turn.end?.data?.reason?.kind
      const stopped = reason === 'aborted' || reason === 'interrupted'
      const elapsed = Number.isFinite(turn.start?.time) && Number.isFinite(turn.end?.time)
        ? Math.max(1000, turn.end.time - turn.start.time) : undefined
      const duration = elapsed === undefined || stopped || reason === 'error' ? undefined : formatDuration(elapsed, chat)
      const status = stopped ? 'message.stopped'
        : reason === 'error' ? 'message.turnProcess.failed' : 'message.turnProcess.worked'
      return {
        duration,
        label: chatLabel(chat, duration === undefined ? status : 'message.turnProcess.took'),
        announcement: chatLabel(chat, status),
      }
    }

    function useCost(turn, tailSource, t, pricing, source) {
      const tail = useTurnTail(tailSource)
      const snapshot = React.useSyncExternalStore(source.subscribe, source.getSnapshot)
      const usage = tail?.tokenUsage
      if (snapshot.status !== 'ready' || tail?.closing == null ||
          !Number.isSafeInteger(usage?.totalTokens) || usage.totalTokens <= 0) return undefined
      const translate = typeof t === 'function' ? t : fallbackTranslate(zh)
      const result = pricing.estimate(usage, turn.end?.time, snapshot.value?.overrides ?? EMPTY_OVERRIDES)
      const tokens = NUMBER.format(usage.totalTokens)
      return {
        result, total: usage.totalTokens,
        detail: detailText(translate, usage, result, pricing.modelLabel),
        line: result.cost === null ? translate('lineNoCost', { tokens })
          : translate('line', { tokens, cost: pricing.formatCost(result.cost, result.currency) }),
      }
    }

    function CostText({ cost, placement, detailId }) {
      const { result, total, detail, line } = cost
      const priced = result.cost !== null
      return h('span', {
        className: 'dshrc-cost',
        'data-reply-cost': '',
        'data-reply-cost-placement': placement,
        'data-reply-cost-total': String(total),
        'data-reply-cost-cny': priced && result.currency === 'CNY' ? result.cost.toFixed(6) : '',
        'data-reply-cost-amount': priced ? String(result.cost) : undefined,
        'data-reply-cost-currency': priced ? result.currency : undefined,
        'data-reply-cost-model': result.priced ?? '',
        title: detail,
        ...(placement === 'footer' ? { tabIndex: 0, 'aria-describedby': detailId } : {}),
      }, line)
    }

    function CostDescription({ id, text }) {
      return h('span', { id, className: 'dshrc-sr' }, text)
    }

    function HeaderWithCost({ node, turnProcess, inspected, t, chatT, pricing, source, display }) {
      const detailId = React.useId()
      const { turn, tail } = inspected
      const cost = useCost(turn, tail, t, pricing, source)
      if (turn.status !== 'closed') return null

      const chat = typeof chatT === 'function' ? chatT : fallbackTranslate(CHAT_FALLBACK)
      const { label, announcement, duration } = headerCopy(turn, chat)
      const open = !turnProcess.foldable || turnProcess.open
      const canCollapse = turnProcess.foldable && turnProcess.hasContent && !alwaysOpen(turn)
      return h(React.Fragment, null,
        h('span', { className: 'dshrc-sr', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, announcement),
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
          'aria-describedby': cost ? detailId : undefined,
          onClick: (event) => {
            try {
              event.currentTarget.focus()
              turnProcess.setOpen(!open)
            } catch {
              display.fail('render')
            }
          },
        },
        h('span', { className: 'dshrc-label' },
          label,
          ...(duration ?? []).map((part, index) => h('span', {
            key: index, className: part.numeric ? 'dshrc-duration' : undefined,
          }, part.text))),
        cost && h(CostText, { cost, placement: 'header' }),
        canCollapse && chevron()),
        cost && h(CostDescription, { id: detailId, text: cost.detail }))
    }

    // Keep a readable title for the render in which the guard fails. Disposing
    // the keyed registration gives the next render back to Chat's own control.
    function HeaderPlaceholder({ node, chatT, compat }) {
      let text = CHAT_FALLBACK['message.turnProcess.worked']
      try {
        const turn = compat.turnOf(node)
        if (turn?.status === 'open' || turn?.status === 'unknown') return null
        const chat = typeof chatT === 'function' ? chatT : fallbackTranslate(CHAT_FALLBACK)
        const copy = turn === undefined ? undefined : headerCopy(turn, chat)
        text = copy === undefined ? chatLabel(chat, 'message.turnProcess.worked')
          : copy.label + (copy.duration ?? []).map(part => part.text).join('')
      } catch {
        // The compatibility path must not depend on plugin costs or untrusted props.
      }
      return h('div', { className: 'dshrc-root dshrc-header-placeholder' }, h('span', { className: 'dshrc-label' }, text))
    }

    class CostBoundary extends React.Component {
      state = { failed: false }

      static getDerivedStateFromError() {
        return { failed: true }
      }

      componentDidCatch() {
        this.props.onError?.()
      }

      render() {
        return this.state.failed ? this.props.fallback ?? null : this.props.children
      }
    }

    function GuardedHeader(props) {
      const { node, turnProcess, display, compat } = props
      const actual = React.useSyncExternalStore(display.subscribe, display.getSnapshot).actual
      const inspected = actual === 'header' ? compat.inspectHeader(node, turnProcess) : undefined
      const incompatible = actual === 'header' && inspected === undefined
      React.useEffect(() => {
        if (incompatible) display.fail('structure')
      }, [incompatible, display])
      return inspected === undefined ? h(HeaderPlaceholder, props) : h(HeaderWithCost, { ...props, inspected })
    }

    function FooterCost({ turn, t, pricing, source, compat }) {
      const detailId = React.useId()
      const tail = React.useMemo(() => compat.tailSource(turn), [turn, compat])
      const cost = useCost(turn, tail, t, pricing, source)
      return cost ? h('div', { className: 'dshrc-footer' },
        h(CostText, { cost, placement: 'footer', detailId }),
        h(CostDescription, { id: detailId, text: cost.detail })) : null
    }

    function FooterSeat(props) {
      const { display } = props
      const actual = React.useSyncExternalStore(display.subscribe, display.getSnapshot).actual
      return actual === 'footer-only' ? h(CostBoundary, null, h(FooterCost, props)) : null
    }

    function installHeader(ctx, display, shared) {
      const slot = 'conversation.chat.node'
      let dispose
      const remove = () => {
        dispose?.()
        dispose = undefined
      }
      const sync = () => {
        if (display.getSnapshot().actual !== 'header') {
          remove()
          return
        }
        if (dispose !== undefined) return
        try {
          dispose = ctx.slots.inject(slot, () => {
            try {
              return ctx.slots.register({ name: slot, key: 'turn-process', priority: -1, locale: NS }, props => {
                const headerProps = { ...props, ...shared }
                return h(CostBoundary, {
                  fallback: h(HeaderPlaceholder, headerProps),
                  onError: () => display.fail('render'),
                }, h(GuardedHeader, headerProps))
              })
            } catch {
              // DSH may call this later when Chat declares its slot.
              queueMicrotask(() => display.fail('registration'))
              return () => {}
            }
          })
        } catch {
          display.fail('registration')
        }
      }
      const unsubscribe = display.subscribe(sync)
      sync()
      return () => { unsubscribe(); remove() }
    }

    return {
      inject: ['slots', 'locale', 'configForms'],
      async apply(ctx) {
        const [pricing, compat] = await Promise.all([
          require.async('./client.pricing.js'), require.async('./client.compat.js'),
        ])
        const chatT = ctx.locale.bind('chat')
        const form = ctx.configForms.get(NS)
        const source = pricingSource(ctx.configForms.describe())
        // Modules publishes the release of the active client composition.
        const release = ctx.get('modules')?.manifest?.release?.version
        const display = displaySource(source, compat, release)
        const shared = { chatT, pricing, source, compat, display }
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
        }, props => h(PricingSettings, { ...props, form, source, pricing, display })))), 'costline: pricing settings')
        ctx.effect(() => source.subscribe(display.refresh), 'costline: display preference')
        ctx.effect(() => installHeader(ctx, display, shared), 'costline: header registration')
        ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
          name: 'conversation.chat.turnTail',
          id: NS,
          locale: NS,
        }, props => h(FooterSeat, { ...props, ...shared })))
        ctx.inject(['sessions'], async scope => {
          const [createLedger, installLedgerView] = await Promise.all([
            require.async('./client.ledger.js'), require.async('./client.ledger-view.js'),
          ])
          installLedgerView(scope, { ledger: createLedger(pricing), pricing, source, ns: NS })
        })
      },
    }
  },
})
