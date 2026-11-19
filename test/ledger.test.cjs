const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createLedgerFold, projectionKey } = require('../ledger.host.js')
const { collectLedger, priceRows } = require('../client.ledger.js')

const route = { provider: 'deepseek-official', model: 'deepseek-flash' }
const usage = totalTokens => ({
  inputTokens: totalTokens - 2, outputTokens: 2, cacheReadTokens: 0,
  cacheWriteTokens: 0, totalTokens,
})
const when = Date.parse('2026-11-18T02:00:00Z')

function fixture(fold, prefix = 0) {
  let state = fold.init({}, prefix)
  let seq = 0
  return {
    append(type, data) { state = fold.apply(state, { type, data, seq: seq++, time: when }) },
    view() { return fold.view(state) },
  }
}

test('turns pass only accounting events to the shared strict fold', () => {
  const seen = []
  const stream = [{ type: 'chunk', time: 0, chunk: { type: 'usage', usage: usage(7) } }]
  const fold = createLedgerFold(events => {
    seen.push(events)
    return { totalTokens: 50, routes: [route] }
  })
  const f = fixture(fold)
  f.append('turn/start', { turn: 1 })
  f.append('step/start', { turn: 1, step: 1 })
  f.append('assistant/attempt', { turn: 1, step: 1, stream: [
    ...stream, { type: 'chunk', time: 1, chunk: { type: 'text-delta', text: 'private' } },
  ] })
  f.append('llm/retry', { turn: 1, step: 1 })
  f.append('llm/retry-started', { turn: 1, step: 1 })
  f.append('assistant/message', {
    turn: 1, step: 1, usage: usage(43), stream: [],
    message: { source: route, content: 'private' },
  })
  f.append('step/end', { turn: 1, step: 1 })
  f.append('tool/result', { turn: 1, step: 1, content: 'private' })
  f.append('turn/end', { turn: 1 })
  assert.deepEqual(seen[0].map(e => e.type), [
    'turn/start', 'step/start', 'assistant/attempt', 'llm/retry', 'llm/retry-started',
    'assistant/message', 'step/end', 'turn/end',
  ])
  assert.deepEqual(seen[0][2].data.stream, stream)
  assert.deepEqual(seen[0][5].data.message, { source: route })
  assert.equal(JSON.stringify(seen[0]).includes('private'), false)
  assert.deepEqual(f.view().turns, [{ turn: 1, asOfSeq: 8, endedAt: when,
    usage: { totalTokens: 50, routes: [route] } }])
})

test('forks omit inherited turns and summaries and flag incomplete own turns', () => {
  const fold = createLedgerFold(() => undefined)
  const f = fixture(fold, 3)
  f.append('turn/start', { turn: 1 })
  f.append('turn/end', { turn: 1 })
  f.append('compaction/summary', { compactionId: 1, llmStreamCall: true, usage: usage(5) })
  f.append('turn/end', { turn: 2, reason: { kind: 'forked' } })
  f.append('turn/start', { turn: 3 })
  assert.deepEqual(f.view().reasons, ['turn-in-progress'])
  f.append('turn/end', { turn: 3 })
  assert.deepEqual(f.view(), {
    asOfSeq: 5, inheritedEventCount: 3, compactions: [], reasons: [],
    turns: [{ turn: 3, asOfSeq: 5, endedAt: when, reason: 'turn-usage-unavailable' }],
  })
  f.append('turn/end', { turn: 4, reason: { kind: 'completed' } })
  assert.equal(f.view().turns[1].reason, 'turn-usage-unavailable')
})

test('compaction requires separate-call provenance and counts each id once', () => {
  const f = fixture(createLedgerFold(() => undefined))
  f.append('compaction/summary', { compactionId: 1, llmStreamCall: true, usage: usage(40), ...route })
  f.append('compaction/summary', { compactionId: 1, llmStreamCall: true, usage: usage(40), ...route })
  f.append('compaction/summary', { compactionId: 2, llmStreamCall: true, usage: usage(23) })
  f.append('compaction/summary', { compactionId: 3, llmStreamCall: true })
  f.append('compaction/summary', { compactionId: 4, usage: usage(10) })
  f.append('compaction/summary', { compactionId: 5 })
  f.append('compaction/prune', { compactionId: 1 })
  const { totalTokens: _omitted, ...completeBuckets } = usage(8)
  f.append('compaction/summary', { compactionId: 6, llmStreamCall: true, usage: completeBuckets, ...route })
  assert.deepEqual(f.view().compactions.map(r => [r.compactionId, r.usage?.totalTokens, r.reason]), [
    [1, 40, undefined], [2, 23, undefined], [3, undefined, 'summary-usage-unavailable'],
    [4, undefined, 'summary-call-unverified'], [5, undefined, 'summary-call-unverified'], [6, 8, undefined],
  ])
  assert.deepEqual(f.view().compactions[0].usage.routes, [route])
  assert.equal(f.view().compactions[1].usage.routes, undefined)
  assert.equal(f.view().asOfSeq, 7)
})

test('walks local descendants once and retains independent watermarks and reasons', () => {
  const view = (asOfSeq, turns = [], compactions = []) => ({
    asOfSeq, inheritedEventCount: 0, turns, compactions, reasons: [],
  })
  const frame = (ledger, catalog) => ({ [projectionKey]: ledger, subagentCatalog: catalog })
  const child = (id, mode = 'continuable') => ({ mode, id })
  const exact = (totalTokens, asOfSeq) => ({ usage: { totalTokens }, asOfSeq })
  const snapshots = new Map([
    ['main', frame(view(10, [exact(30, 6)], [exact(3, 8)]),
      [child('a'), child('a'), child('b'), child('external', 'external')])],
    ['a', frame(view(4, [exact(5, 4)], [exact(3, 2)]), [child('b'), child('main')])],
    ['b', frame(view(8, [exact(7, 2)]), [child('missing')])],
  ])
  const result = collectLedger('main', id => snapshots.get(id), 4)
  assert.equal(result.main.asOfSeq, 10)
  assert.deepEqual(result.children.map(r => [r.id, r.asOfSeq ?? null]), [
    ['a', 4], ['b', 8], ['missing', null],
  ])
  assert.deepEqual(result.children[2].reasons, ['session-unread'])
  assert.equal(result.compactions.length, 2)
  assert.equal(result.main.subtotal.totalTokens, 30)
  assert.equal(result.compactionSubtotal.totalTokens, 6)
  assert.equal(result.total.totalTokens, 48)
  assert.equal(result.complete, false)
  const bounded = collectLedger('main', id => snapshots.get(id), 1)
  assert.deepEqual(bounded.children.map(r => [r.id, r.reasons]), [
    ['a', []], ['b', ['session-limit']],
  ])
})

test('Client reprices exact tokens without concealing missing routes or cache buckets', () => {
  const matched = {
    usage: { uncachedInputTokens: 0, outputTokens: 1_000_000, cacheReadTokens: 0,
      cacheWriteTokens: 0, totalTokens: 1_000_000, routes: [route] },
    endedAt: when,
  }
  const rate = { ...route, currency: 'USD', peak: { cacheHit: 0, cacheMiss: 0, cacheWrite: 0, output: 2 },
    offPeak: { cacheHit: 0, cacheMiss: 0, cacheWrite: 0, output: 2 } }
  const initial = priceRows([matched], [])
  assert.notEqual(initial.cost.amount, 2)
  assert.deepEqual(priceRows([matched], [rate]), {
    totalTokens: 1_000_000, cost: { currency: 'USD', amount: 2 }, reasons: [],
  })
  const noRoute = { ...matched, usage: { ...matched.usage, routes: undefined } }
  const priced = priceRows([matched, noRoute], [rate])
  assert.equal(priced.totalTokens, 2_000_000)
  assert.equal(priced.cost, null)
  assert.deepEqual(priced.reasons, ['price-model'])
  const noCache = { ...matched, usage: { ...matched.usage, cacheReadTokens: undefined } }
  const cachePrice = priceRows([noCache], [rate])
  assert.equal(cachePrice.totalTokens, 1_000_000)
  assert.deepEqual(cachePrice.reasons, ['price-cache'])
  assert.equal(cachePrice.cost, null)
  const pro = { ...matched, usage: { ...matched.usage, routes: [{ ...route, model: 'deepseek-v4-pro' }] } }
  const mixed = priceRows([matched, pro], [])
  assert.equal(mixed.totalTokens, 2_000_000)
  assert.equal(mixed.cost, null)
  assert.deepEqual(mixed.reasons, ['mixed-model'])
})
