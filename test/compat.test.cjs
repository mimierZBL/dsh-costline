const assert = require('node:assert/strict')
const { test } = require('node:test')
const {
  parseVersion, selectDisplay, firstFailure, inspectHeader,
} = require('../client.compat.js')

test('recognizes a SemVer release, ignoring build metadata only', () => {
  assert.equal(parseVersion('0.2.2-rc.3+desktop.1'), '0.2.2-rc.3')
  assert.equal(parseVersion('0.2.2'), '0.2.2')
  assert.equal(parseVersion('0.2.2-rc.03'), undefined)
  assert.equal(parseVersion('0.2.2-rc.3.0x'), '0.2.2-rc.3.0x')
  for (const invalid of [undefined, 0, '', 'v0.2', '00.2.2', '0.2.2+']) {
    assert.equal(parseVersion(invalid), undefined)
  }
})

test('defers both fee positions before settings are ready', () => {
  const pending = { actual: 'pending', reason: undefined }
  for (const status of ['loading', 'unavailable']) {
    assert.deepEqual(selectDisplay('auto', '0.2.2-rc.3', undefined, status), pending)
    assert.deepEqual(selectDisplay('footer-only', '0.2.2-rc.3', undefined, status), pending)
    assert.deepEqual(selectDisplay('auto', '0.3.0', 'render', status), pending)
  }
})

test('selects the final placement and reason as soon as settings are ready', () => {
  for (const [preference, version, failure, actual, reason] of [
    ['auto', '0.2.2-rc.3', undefined, 'header', undefined],
    ['footer-only', '0.2.2-rc.3', undefined, 'footer-only', undefined],
    ['auto', '0.3.0', undefined, 'footer-only', 'version'],
    ['auto', '0.2.2-rc.3', 'render', 'footer-only', 'render'],
  ]) {
    assert.equal(selectDisplay(preference, version, failure, 'loading').actual, 'pending')
    assert.deepEqual(selectDisplay(preference, version, failure, 'ready'), { actual, reason })
  }
})

test('allows header mode on the tested release or when version information is absent', () => {
  assert.deepEqual(selectDisplay('auto', '0.2.2-rc.3', undefined), { actual: 'header', reason: undefined })
  assert.equal(selectDisplay('auto', '0.2.2-rc.3+custom').actual, 'header')
  assert.equal(selectDisplay('auto', undefined).actual, 'header')
  assert.equal(selectDisplay(undefined, undefined).actual, 'header')
  for (const version of ['0.2.2-rc.2', '0.2.2', '0.2.3', '1.0.0']) {
    assert.deepEqual(selectDisplay('auto', version), { actual: 'footer-only', reason: 'version' })
  }
})

test('manual footer mode has priority and can switch back to auto without a fault', () => {
  assert.deepEqual(selectDisplay('footer-only', '0.2.2-rc.3'), { actual: 'footer-only', reason: undefined })
  assert.equal(selectDisplay('auto', '0.2.2-rc.3').actual, 'header')
})

test('the first incompatible shape or render failure remains latched for this client', () => {
  let reason = firstFailure(undefined, 'structure')
  assert.equal(reason, 'structure')
  reason = firstFailure(reason, 'render')
  assert.equal(reason, 'structure')
  assert.deepEqual(selectDisplay('auto', '0.2.2-rc.3', reason), { actual: 'footer-only', reason: 'structure' })
  assert.equal(selectDisplay('footer-only', '0.2.2-rc.3', reason).actual, 'footer-only')
  assert.equal(selectDisplay('auto', '0.2.2-rc.3', reason).reason, 'structure')
  assert.equal(firstFailure(undefined, 'render'), 'render')
})

function fixture() {
  const tail = { getSnapshot: () => undefined, subscribe: () => () => {} }
  const turn = {
    turn: 1, status: 'closed',
    start: { time: 1 }, end: { time: 2, data: { reason: { kind: 'completed' } } },
    data: { source: key => key === 'turn-tail' ? tail : undefined },
  }
  const node = { data: { turn: 1, messageCount: 0 }, location: { kind: 'turn', turn } }
  const owner = { spec: { turn: 1 }, setOpen() {}, open: false, hasContent: true, foldable: true }
  return { node, turn, owner, tail }
}

test('structure validation accepts the native shape and an incomplete historical window', () => {
  const { node, turn, owner, tail } = fixture()
  assert.deepEqual(inspectHeader(node, owner), { turn, tail })
  turn.start = undefined
  assert.deepEqual(inspectHeader(node, owner), { turn, tail })
  turn.status = 'open'
  turn.end = undefined
  assert.deepEqual(inspectHeader(node, owner), { turn, tail })
})

test('structure validation rejects missing or changed node, controller and tail fields', () => {
  for (const breakShape of [
    props => { delete props.node.data.messageCount },
    props => { props.node.data.turn = '1' },
    props => { props.owner = undefined },
    props => { delete props.owner.setOpen },
    props => { props.owner.spec = {} },
    props => { props.owner.hasContent = 1 },
    props => { props.owner.foldable = 'yes' },
    props => { props.node.location = { kind: 'session' } },
    props => { delete props.turn.start },
    props => { props.turn.end = undefined },
    props => { props.turn.end.time = NaN },
    props => { props.turn.data.source = () => ({ getSnapshot() {} }) },
    props => { props.turn.data.source = () => { throw new Error('source moved') } },
  ]) {
    const props = fixture()
    breakShape(props)
    assert.equal(inspectHeader(props.node, props.owner), undefined)
  }
})
