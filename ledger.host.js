const projectionKey = 'costlineLedger'
const turnEvents = new Set([
  'step/start', 'step/end', 'assistant/message', 'assistant/attempt', 'llm/retry', 'llm/retry-started',
])
const usageKeys = [
  'inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens', 'totalTokens',
]

const count = value => Number.isSafeInteger(value) && value >= 0

function pickUsage(usage) {
  if (!usage) return undefined
  return Object.fromEntries(usageKeys.filter(key => usage[key] !== undefined).map(key => [key, usage[key]]))
}

function accountingEvent({ type, data }) {
  const { turn, step } = data
  if (type !== 'assistant/message' && type !== 'assistant/attempt') {
    return { type, data: { turn, ...(step === undefined ? {} : { step }) } }
  }
  const usage = pickUsage(data.usage)
  const sample = data.stream?.findLast(record => record.type === 'chunk' && record.chunk.type === 'usage')
  const stream = sample === undefined ? [] : [{
    type: 'chunk', time: sample.time, chunk: { type: 'usage', usage: pickUsage(sample.chunk.usage) },
  }]
  const source = data.message?.source
  return { type, data: {
    turn, step, stream,
    ...(usage === undefined ? {} : { usage }),
    ...(type === 'assistant/message' ? { message: { source: {
      provider: source?.provider ?? '', model: source?.model ?? '',
    } } } : {}),
  } }
}

function summaryUsage(data) {
  const usage = pickUsage(data.usage)
  if (!usage) return undefined
  const { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens } = usage
  const hasCacheBuckets = cacheReadTokens !== undefined && cacheWriteTokens !== undefined
  const buckets = [inputTokens, outputTokens, cacheReadTokens ?? 0, cacheWriteTokens ?? 0]
  if (!buckets.every(count)) return undefined
  if ([cacheReadTokens, cacheWriteTokens].some(value => value !== undefined && !count(value))) return undefined
  if (reasoningTokens !== undefined && (!count(reasoningTokens) || reasoningTokens > outputTokens)) return undefined
  const known = buckets.reduce((total, value) => total + value, 0)
  const totalTokens = usage.totalTokens === undefined && hasCacheBuckets ? known : usage.totalTokens
  if (!count(totalTokens) || known > totalTokens) return undefined
  if (hasCacheBuckets && known !== totalTokens) return undefined
  const { provider, model } = data
  return {
    uncachedInputTokens: inputTokens, outputTokens, totalTokens,
    ...(cacheReadTokens === undefined ? {} : { cacheReadTokens }),
    ...(cacheWriteTokens === undefined ? {} : { cacheWriteTokens }),
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
    ...(provider && model ? { routes: [{ provider, model }] } : {}),
  }
}

function createLedgerFold(deriveTurnTokenUsage) {
  function init(_header, inheritedEventCount) {
    return {
      active: {},
      ledger: { asOfSeq: -1, inheritedEventCount, turns: [], compactions: [], reasons: [] },
    }
  }

  function apply(state, event) {
    const { active, ledger } = state
    const { type, data, seq, time } = event
    if (seq < ledger.inheritedEventCount) return state
    if (type === 'compaction/summary') {
      if (ledger.compactions.some(row => row.compactionId === data.compactionId)) return state
      const row = { compactionId: data.compactionId, asOfSeq: seq, endedAt: time }
      const usage = data.llmStreamCall === true ? summaryUsage(data) : undefined
      if (usage) row.usage = usage
      else row.reason = data.llmStreamCall === true ? 'summary-usage-unavailable' : 'summary-call-unverified'
      return { active, ledger: { ...ledger, asOfSeq: seq, compactions: [...ledger.compactions, row] } }
    }
    if (type !== 'turn/start' && type !== 'turn/end' && !turnEvents.has(type)) return state
    const { turn } = data
    const previous = active[turn]
    if (!previous && type !== 'turn/start') {
      if (type !== 'turn/end') return state
      if (ledger.inheritedEventCount > 0 && data.reason?.kind === 'forked') return state
    }
    const events = [...(previous ?? []), accountingEvent(event)]
    if (type !== 'turn/end') {
      return {
        active: { ...active, [turn]: events },
        ledger: type === 'turn/start'
          ? { ...ledger, asOfSeq: seq, reasons: ['turn-in-progress'] }
          : ledger,
      }
    }
    const { [turn]: _closed, ...remaining } = active
    const usage = previous ? deriveTurnTokenUsage(events) : undefined
    const row = { turn, asOfSeq: seq, endedAt: time }
    if (usage) row.usage = usage
    else row.reason = 'turn-usage-unavailable'
    return {
      active: remaining,
      ledger: {
        ...ledger, asOfSeq: seq, turns: [...ledger.turns, row],
        reasons: Object.keys(remaining).length ? ['turn-in-progress'] : [],
      },
    }
  }

  return { init, apply, view: state => state.ledger }
}

function createLedgerProjection(z, deriveTurnTokenUsage) {
  const { init, apply, view } = createLedgerFold(deriveTurnTokenUsage)
  const token = z.number().int().nonnegative()
  const seq = z.number().int()
  const id = z.union([z.string(), token])
  const usage = z.strictObject({
    uncachedInputTokens: token, totalTokens: token, outputTokens: token,
    cacheReadTokens: token.optional(), cacheWriteTokens: token.optional(), reasoningTokens: token.optional(),
    routes: z.array(z.strictObject({ provider: z.string(), model: z.string() })).optional(),
  })
  const row = z.strictObject({
    asOfSeq: seq, endedAt: z.number().int(), usage: usage.optional(),
    reason: z.enum(['turn-usage-unavailable', 'summary-usage-unavailable', 'summary-call-unverified']).optional(),
  })
  const viewSchema = z.strictObject({
    asOfSeq: seq, inheritedEventCount: token,
    turns: z.array(row.extend({ turn: token })),
    compactions: z.array(row.extend({ compactionId: id })),
    reasons: z.array(z.literal('turn-in-progress')),
  })
  const stateSchema = z.strictObject({
    active: z.record(z.string(), z.array(z.strictObject({ type: z.string(), data: z.record(z.string(), z.json()) }))),
    ledger: viewSchema,
  })
  return {
    key: projectionKey, stateVersion: 1, init, apply, stateSchema,
    wire: { viewSchema, view, summary: false },
  }
}

module.exports = { projectionKey, createLedgerFold, createLedgerProjection }
