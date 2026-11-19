const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createLedgerReader, ledgerReasonKey, visibleTokens } = require('../client.ledger.js')

function source(initial) {
  let value = initial
  const listeners = new Set()
  return {
    getSnapshot: () => value,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    set(next) {
      value = next
      for (const listener of listeners) listener()
    },
  }
}

const child = (id, mode = 'one-shot') => ({ id, mode })
const ledger = (() => ({
  asOfSeq: 1, turns: [], compactions: [], reasons: [], inheritedEventCount: 0,
}))
const tick = () => new Promise(resolve => setImmediate(resolve))

function mockSessions(fixtures) {
  const retained = []
  const released = []
  return {
    retained, released,
    retain(target, options) {
      const id = typeof target === 'string' ? target : target.childSessionId
      retained.push({ id, target, signal: options.signal })
      const entry = fixtures[id] ?? {}
      const session = {
        getSnapshot: () => ({ openState: entry.error ? 'error' : 'open' }),
        projections: {
          faceOf: key => key === 'costlineLedger' ? entry.ledger ?? source(undefined) : entry.catalog ?? source(undefined),
        },
      }
      return { ready: entry.wait ?? Promise.resolve({ session }), release: () => released.push(id) }
    },
  }
}

test('reads the main projection first, then breadth-first addresses bounded local children', async () => {
  const mainLedger = source(ledger())
  const sessions = mockSessions({
    main: { ledger: mainLedger, catalog: source([child('a'), child('a'), child('remote', 'external')]) },
    a: { ledger: source(ledger()), catalog: source([child('b'), child('c')]) },
    b: { ledger: source(ledger()) },
  })
  const reader = createLedgerReader(sessions, 'main', { maxChildren: 2 })
  reader.start()
  await tick()
  assert.deepEqual(sessions.retained.map(row => row.id), ['main'])
  assert.equal(reader.getSnapshot().entries.get('main').status, 'ready')
  reader.loadChildren()
  await tick()
  assert.deepEqual(sessions.retained.map(row => row.id), ['main', 'a', 'b'])
  assert.deepEqual(sessions.retained[2].target, { parentSessionId: 'a', childSessionId: 'b', mode: 'one-shot' })
  mainLedger.set({ ...ledger(), asOfSeq: 2 })
  assert.equal(reader.getSnapshot().entries.get('main').frame.costlineLedger.asOfSeq, 2)
  reader.dispose()
  reader.dispose()
  assert.deepEqual(sessions.released, ['main', 'a', 'b'])
})

test('explicit refresh retries unread children and clears failed main attempts', async () => {
  const fixtures = {
    main: { error: true },
    a: { error: true },
  }
  const sessions = mockSessions(fixtures)
  const reader = createLedgerReader(sessions, 'main')
  reader.start()
  await tick()
  assert.equal(reader.getSnapshot().entries.get('main').status, 'error')
  fixtures.main = { ledger: source(ledger()), catalog: source([child('a')]) }
  reader.refresh()
  await tick()
  assert.equal(reader.getSnapshot().entries.get('main').status, 'ready')
  reader.loadChildren()
  await tick()
  assert.equal(reader.getSnapshot().entries.get('a').status, 'error')
  fixtures.a = { ledger: source(ledger()) }
  reader.refresh()
  await tick()
  assert.equal(reader.getSnapshot().entries.get('a').status, 'ready')
  reader.dispose()
})

test('close cancels a pending retain and ignores its late completion', async () => {
  let finish
  const wait = new Promise(resolve => { finish = resolve })
  const sessions = mockSessions({ main: { wait } })
  const reader = createLedgerReader(sessions, 'main')
  reader.start()
  reader.dispose()
  finish({ session: { getSnapshot() { assert.fail('stale generation accessed') } } })
  await tick()
  assert.equal(sessions.retained[0].signal.aborted, true)
  assert.deepEqual(sessions.released, ['main'])
})

test('distinguishes unknown token counts from exact zero and maps reason codes', () => {
  assert.equal(visibleTokens(0, [], false), null)
  assert.equal(visibleTokens(0, [], true), 0)
  assert.equal(visibleTokens(0, [{ usage: { totalTokens: 0 } }], false), 0)
  assert.equal(visibleTokens(50, [{ usage: { totalTokens: 50 } }], false), 50)
  assert.equal(visibleTokens(null, [{ usage: { totalTokens: 50 } }], true), null)
  assert.equal(ledgerReasonKey('price-cache'), 'ledger.reason.price-cache')
  assert.equal(ledgerReasonKey('session-limit'), 'ledger.reason.session-limit')
  assert.equal(ledgerReasonKey('unrecognized'), 'ledger.reason.other')
})
