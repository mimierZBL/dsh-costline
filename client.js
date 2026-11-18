window.__ModuleLoader__.load({
  id: '@local/reply-cost',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'reply-cost'

    // Official DeepSeek API prices, CNY per 1,000,000 tokens (as of 2026-10).
    // Peak: Monday-Friday 09:00-12:00 and 14:00-18:00 Asia/Shanghai; all other
    // time is off-peak. Statutory Chinese holidays are not special-cased here.
    // Edit this table to match the rates you are actually billed.
    const PRICES = {
      'deepseek-flash': {
        peak: { cacheHit: 0.04, cacheMiss: 2, output: 8 },
        offPeak: { cacheHit: 0.02, cacheMiss: 1, output: 4 },
      },
      'deepseek-v4-pro': {
        peak: { cacheHit: 0.3, cacheMiss: 9, output: 27 },
        offPeak: { cacheHit: 0.15, cacheMiss: 4.5, output: 13.5 },
      },
    }
    const MODEL_LABELS = {
      'deepseek-flash': 'DeepSeek-V4.1-Flash',
      'deepseek-v4-pro': 'DeepSeek-V4-Pro',
    }
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
      'detail.rate': '{period}价格（2026-10 官方，元/百万 tok）：缓存命中 ¥{hit}，缓存未命中 ¥{miss}，输出 ¥{output}',
      'detail.noCost.model': '费用未知：模型未匹配到价格表，可在 client.js 的 PRICES 中添加',
      'detail.noCost.mixed': '费用未知：本轮使用了多个价格不同的模型',
      'detail.noCost.cache': '费用未知：本轮用量缺少缓存命中明细',
      'detail.noCost.usage': '费用未知：本轮用量缺少未缓存输入明细',
      'detail.noCost.time': '费用未知：缺少本轮时间',
      'detail.note': '按轮次结束时刻判断高峰/空闲，法定节假日按高峰计；本地估算，仅供参考',
      'period.peak': '高峰时段',
      'period.offPeak': '空闲时段',
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
      'detail.rate': '{period} rate (2026-10 official, CNY per 1M tok): cache hit ¥{hit}, cache miss ¥{miss}, output ¥{output}',
      'detail.noCost.model': 'Cost unknown: the model is not matched to PRICES; add it in client.js',
      'detail.noCost.mixed': 'Cost unknown: this turn used models with different rates',
      'detail.noCost.cache': 'Cost unknown: this turn lacks cache-hit detail',
      'detail.noCost.usage': 'Cost unknown: this turn lacks uncached-input detail',
      'detail.noCost.time': 'Cost unknown: the turn time is missing',
      'detail.note': 'Peak/off-peak is judged from the turn end time, holidays count as peak; local estimate only',
      'period.peak': 'Peak-hour',
      'period.offPeak': 'Off-peak',
    }

    const NUMBER = new Intl.NumberFormat('en-US')
    const CLOCK = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      weekday: 'short',
      hour: '2-digit',
      hourCycle: 'h23',
    })
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

    /** Peak-hour billing window in Beijing time. */
    function isPeak(ms) {
      const parts = CLOCK.formatToParts(new Date(ms))
      const weekday = parts.find(part => part.type === 'weekday')
      const hour = Number(parts.find(part => part.type === 'hour').value)
      if (weekday === undefined || !Number.isFinite(hour)) return false
      if (weekday.value === 'Sat' || weekday.value === 'Sun') return false
      return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18)
    }

    function countOrZero(value) {
      return Number.isSafeInteger(value) && value >= 0 ? value : 0
    }

    function formatCost(value) {
      if (!Number.isFinite(value)) return '≈¥—'
      const decimals = value >= 0.01 ? 3 : value >= 0.001 ? 4 : 6
      return `≈¥${value.toFixed(decimals)}`
    }

    /** Map a route's model string (id or display name) onto a PRICES key. */
    function priceKey(model) {
      if (typeof model !== 'string') return undefined
      if (PRICES[model] !== undefined) return model
      const id = model.toLowerCase()
      if (!id.includes('deepseek')) return undefined
      if (id.includes('pro')) return 'deepseek-v4-pro'
      if (id.includes('flash')) return 'deepseek-flash'
      return undefined
    }

    function modelLabel(model) {
      if (MODEL_LABELS[model] !== undefined) return MODEL_LABELS[model]
      const key = priceKey(model)
      return key === undefined ? model : MODEL_LABELS[key]
    }

    /** Unique provider/model routes that contributed billed attempts. */
    function routeRows(usage) {
      const rows = []
      for (const route of usage.routes === undefined ? [] : usage.routes) {
        if (route === null || typeof route !== 'object' || typeof route.model !== 'string' || route.model === '') continue
        const provider = typeof route.provider === 'string' ? route.provider : ''
        if (rows.some(row => row.provider === provider && row.model === route.model)) continue
        rows.push({ provider, model: route.model })
      }
      return rows
    }

    function routeText(t, rows) {
      if (rows.length === 0) return t('model.unknown')
      return rows.map(row => (
        row.provider === '' ? modelLabel(row.model) : `${row.provider} / ${modelLabel(row.model)}`
      )).join(', ')
    }

    /**
     * Exact token buckets and the estimated CNY cost for one completed Turn.
     * The cost stays unavailable unless every billed attempt shares one priced
     * model and the prompt's cached/uncached split is known.
     */
    function estimate(usage, at) {
      const period = isPeak(at) ? 'peak' : 'offPeak'
      const rows = routeRows(usage)
      const keys = rows.map(row => priceKey(row.model))
      const knownKeys = new Set(keys.filter(key => key !== undefined))
      // Only official DeepSeek routes are priced: a gateway or another provider
      // may bill the same token counts differently.
      const official = rows.every(row => row.provider === '' || /deepseek/i.test(row.provider))
      let priced
      let reason
      if (rows.length === 0) reason = 'model'
      else if (!official || keys.some(key => key === undefined)) reason = 'model'
      else if (knownKeys.size > 1) reason = 'mixed'
      else priced = keys[0]
      const prompt = Math.max(0, usage.totalTokens - usage.outputTokens)
      const uncached = Number.isSafeInteger(usage.uncachedInputTokens) && usage.uncachedInputTokens >= 0
        ? usage.uncachedInputTokens
        : undefined
      const cacheWrite = countOrZero(usage.cacheWriteTokens)
      const cacheReadKnown = Number.isSafeInteger(usage.cacheReadTokens) && usage.cacheReadTokens >= 0
      const breakdown = {
        period,
        rows,
        priced,
        price: priced === undefined ? undefined : PRICES[priced][period],
        cost: null,
        reason,
        cacheRead: cacheReadKnown ? usage.cacheReadTokens : undefined,
        cacheWrite,
        uncached,
        miss: undefined,
      }
      if (priced === undefined) return breakdown
      if (uncached === undefined) {
        breakdown.reason = 'usage'
        return breakdown
      }
      let residual = prompt - uncached - cacheWrite
      if (cacheReadKnown) residual -= usage.cacheReadTokens
      // A negative residual means the buckets disagree; never invent a credit.
      if (residual < 0) residual = 0
      if (!cacheReadKnown) {
        // Without cache-hit detail, price only when the prompt holds no
        // unreported cache activity at all; otherwise the cost is unknown.
        if (residual !== 0) {
          breakdown.reason = 'cache'
          return breakdown
        }
        breakdown.cacheRead = 0
      }
      breakdown.miss = uncached + cacheWrite + residual
      breakdown.cost = (
        breakdown.cacheRead * breakdown.price.cacheHit
        + breakdown.miss * breakdown.price.cacheMiss
        + usage.outputTokens * breakdown.price.output
      ) / 1_000_000
      return breakdown
    }

    function detailText(t, usage, breakdown) {
      const lines = [t('detail.model', { models: routeText(t, breakdown.rows) }), t('detail.scope')]
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
          hit: breakdown.price.cacheHit,
          miss: breakdown.price.cacheMiss,
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

    /**
     * Replacement for Chat's turn-process header. It reproduces the shipped
     * duration/disclosure control and appends the DeepSeek-blue reply cost
     * after the duration. Reusing this key shadows shipped UI, so re-check the
     * control after a DSH upgrade.
     */
    function TurnProcessHeaderWithCost({ node, turnProcess, t, chatT }) {
      const detailId = React.useId()
      const turn = turnOf(node)
      const tail = useTurnTail(turn)
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
      const hasReply = tail !== null && typeof tail === 'object' && tail.closing !== null
      const showCost = hasReply && usage !== null && typeof usage === 'object'
        && Number.isSafeInteger(usage.totalTokens) && usage.totalTokens > 0
      let costLine
      let costDetail
      let costCny = ''
      let costModel = ''
      if (showCost) {
        const endTime = Number.isFinite(turn.end?.time) ? turn.end.time
          : Number.isFinite(turn.start?.time) ? turn.start.time
            : undefined
        const breakdown = endTime === undefined
          ? { period: 'offPeak', rows: routeRows(usage), priced: undefined, price: undefined, cost: null, reason: 'time', cacheRead: undefined, cacheWrite: 0, uncached: undefined, miss: undefined }
          : estimate(usage, endTime)
        costDetail = detailText(translate, usage, breakdown)
        costCny = breakdown.cost === null ? '' : breakdown.cost.toFixed(6)
        costModel = breakdown.priced === undefined ? '' : breakdown.priced
        const tokens = NUMBER.format(usage.totalTokens)
        costLine = breakdown.cost === null
          ? translate('lineNoCost', { tokens })
          : translate('line', { tokens, cost: formatCost(breakdown.cost) })
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
          'data-reply-cost-model': costModel,
          title: costDetail,
        }, costLine),
        canCollapse && chevron()),
        showCost && h('span', { id: detailId, className: 'dshrc-sr' }, costDetail))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const chatT = ctx.locale.bind('chat')
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'reply-cost: dictionaries')
        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.plugin = '@local/reply-cost'
          style.textContent = CSS
          ;(document.head || document.documentElement).append(style)
          return () => style.remove()
        }, 'reply-cost: styles')
        ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
          name: 'conversation.chat.node',
          key: 'turn-process',
          priority: -1,
          locale: NS,
        }, props => h(TurnProcessHeaderWithCost, { ...props, chatT })))
      },
      __internals: { isPeak, estimate, formatCost, priceKey, formatDuration },
    }
  },
})
