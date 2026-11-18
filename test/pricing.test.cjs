const assert = require('node:assert/strict')
const { test } = require('node:test')
const {
  pricePeriod, estimate, formatCost, validateOverrides,
} = require('../client.pricing.js')

const date = value => Date.parse(value + '+08:00')
const peak = date('2026-11-16T10:00:00')
const official = { provider: 'deepseek-official', model: 'deepseek-flash' }
const usage = {
  totalTokens: 1300,
  uncachedInputTokens: 800,
  cacheReadTokens: 250,
  cacheWriteTokens: 50,
  outputTokens: 200,
  reasoningTokens: 120,
  routes: [official],
}
const override = { ...official, peak: { cacheWrite: 10, output: 0 } }

test('uses Shanghai weekday boundaries with an exclusive closing time', () => {
  const times = {
    '08:59:59': 'offPeak', '09:00:00': 'peak', '11:59:59': 'peak', '12:00:00': 'offPeak',
    '13:59:59': 'offPeak', '14:00:00': 'peak', '17:59:59': 'peak', '18:00:00': 'offPeak',
  }
  for (const [clock, period] of Object.entries(times)) {
    assert.equal(pricePeriod(date('2026-11-16T' + clock)), period, clock)
  }
  assert.equal(pricePeriod(date('2026-11-14T10:00:00')), 'offPeak')
  assert.equal(pricePeriod(Date.parse('2026-11-16T01:00:00Z')), 'peak')
  assert.equal(pricePeriod(Infinity), undefined)
})

test('uses peak rates for announced holidays and workday hours on make-up days', () => {
  assert.equal(pricePeriod(date('2026-10-03T01:00:00')), 'peak')
  assert.equal(pricePeriod(date('2026-10-10T09:00:00')), 'peak')
  assert.equal(pricePeriod(date('2026-10-10T18:00:00')), 'offPeak')
  assert.equal(pricePeriod(date('2027-02-13T23:00:00')), 'peak')
  assert.equal(pricePeriod(date('2025-05-05T23:00:00')), 'peak')
})

test('uses the turn end rather than guessing a missing timestamp', () => {
  assert.equal(estimate(usage, undefined).reason, 'time')
  assert.equal(estimate(usage, date('2026-11-16T18:00:00')).cost, 0.001655)
})

test('prices four disjoint buckets and never charges reasoning twice', () => {
  assert.equal(estimate(usage, peak).cost, 0.00331)
  const result = estimate(usage, peak, [override])
  assert.equal(result.cost, 0.00211)
  assert.deepEqual(result.price, { cacheHit: 0.04, cacheMiss: 2, cacheWrite: 10, output: 0 })
  assert.equal(result.currency, 'CNY')
})

test('missing or contradictory cache detail cannot silently become a priced bucket', () => {
  assert.equal(estimate({ ...usage, cacheReadTokens: undefined }, peak).reason, 'cache')
  assert.equal(estimate({ ...usage, cacheWriteTokens: undefined }, peak).reason, 'cache')
  assert.equal(estimate({ ...usage, cacheWriteTokens: 100 }, peak).reason, 'usage')
  assert.equal(estimate({ ...usage, cacheWriteTokens: undefined, totalTokens: 1250 }, peak).cacheWrite, 0)
})

test('canonicalizes explicit aliases but rejects lookalikes and unknown providers', () => {
  const input = (provider, model) => ({ ...usage, routes: [{ provider, model }] })
  assert.equal(estimate(input('DEEPSEEK-OFFICIAL', 'DeepSeek-V4.1-Flash'), peak, [override]).cost, 0.00211)
  assert.equal(estimate(input('deepseek-official', 'deepseek-v4.1-prototype'), peak).reason, 'model')
  assert.equal(estimate(input('openrouter', 'deepseek-flash'), peak).reason, 'model')
  assert.equal(estimate(input('gateway-deepseek', 'deepseek-flash'), peak).reason, 'model')
  assert.equal(estimate(input('', 'deepseek-flash'), peak).reason, 'model')
})

test('mixed model or unequal provider rates cannot price aggregated usage', () => {
  assert.equal(estimate({ ...usage, routes: [official, { ...official, model: 'deepseek-v4-pro' }] }, peak).reason, 'mixed')
  const twoProviders = { ...usage, routes: [official, { ...official, provider: 'deepseek-account' }] }
  assert.equal(estimate(twoProviders, peak, [override]).reason, 'mixed')
  assert.equal(estimate(twoProviders, peak).cost, 0.00331)
  assert.equal(estimate({ ...usage, routes: [official, null] }, peak).reason, 'model')
})

test('an exact zero is valid and uses the currency label without converting', () => {
  assert.equal(estimate({ totalTokens: 0, uncachedInputTokens: 0, outputTokens: 0, routes: [official] }, peak).cost, 0)
  const rate = { cacheHit: 1, cacheMiss: 1, cacheWrite: 1, output: 1 }
  const result = estimate(usage, peak, [{ ...official, currency: 'USD', peak: rate, offPeak: rate }])
  assert.equal(result.cost, 0.0013)
  assert.equal(formatCost(result.cost, result.currency), '≈USD 0.0013')
  assert.equal(formatCost(0, 'CNY'), '≈¥0')
  assert.equal(formatCost(0.6923), '≈¥0.692')
  assert.equal(formatCost(0.0000123), '≈¥0.000012')
  assert.equal(formatCost(0.000000002), '≈¥0.000000002')
})

test('rejects invalid or duplicate configuration and accepts zero-valued overrides', () => {
  assert.deepEqual(validateOverrides([override]), [override])
  for (const output of ['', '1', -1, NaN, Infinity, null]) {
    assert.throws(() => validateOverrides([{ ...official, peak: { output } }]), /output/)
  }
  assert.throws(() => validateOverrides([{ ...override, currency: 'ABC' }]), /currency/)
  assert.throws(() => validateOverrides([{ ...override, currency: 'USD' }]), /all four/)
  assert.throws(() => validateOverrides([{ ...official, offPeak: { typo: 1 } }]), /typo/)
  assert.throws(() => validateOverrides([{ ...override, provider: 'unknown' }]), /provider/)
  assert.throws(() => validateOverrides([override, { ...override, model: 'DeepSeek-V4.1-Flash' }]), /duplicate/)
  assert.throws(() => validateOverrides([null]), /rule/)
})
