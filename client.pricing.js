// One dependency-free implementation for the Host and DSH's package-local client loader.
;(function () {
  const fields = Object.freeze(['cacheHit', 'cacheMiss', 'cacheWrite', 'output'])
  const periods = Object.freeze(['peak', 'offPeak'])
  const providers = new Set(['deepseek-official', 'deepseek-account', 'deepseek', 'deepseek-api-key'])
  const currencies = new Set(Intl.supportedValuesOf('currency'))
  const aliases = new Map([
    ['deepseek-flash', 'deepseek-flash'],
    ['deepseek-v4-flash', 'deepseek-flash'],
    ['deepseek-v4-flash-vision-exp', 'deepseek-flash'],
    ['deepseek-v4.1-flash', 'deepseek-flash'],
    ['deepseek-v4.1-flash-1017', 'deepseek-flash'],
    ['deepseek-v4-pro', 'deepseek-v4-pro'],
    ['deepseek-v4-pro-0813', 'deepseek-v4-pro'],
  ])
  const labels = {
    'deepseek-flash': 'DeepSeek-V4.1-Flash',
    'deepseek-v4-pro': 'DeepSeek-V4-Pro',
  }

  const rates = (cacheHit, cacheMiss, output) => Object.freeze({
    cacheHit, cacheMiss, cacheWrite: cacheMiss, output,
  })
  // Inherited reply-cost snapshot. DeepSeek's default cache-write rate follows cache miss.
  const defaults = Object.freeze({
    'deepseek-flash': Object.freeze({ peak: rates(0.04, 2, 8), offPeak: rates(0.02, 1, 4) }),
    'deepseek-v4-pro': Object.freeze({ peak: rates(0.3, 9, 27), offPeak: rates(0.15, 4.5, 13.5) }),
  })
  const maxRate = 1_000_000_000

  // State Council nationwide holiday schedules (2025–2027).
  const holidays = [
    ['2025-01-01'], ['2025-01-28', '2025-02-04'], ['2025-04-04', '2025-04-06'],
    ['2025-05-01', '2025-05-05'], ['2025-05-31', '2025-06-02'], ['2025-10-01', '2025-10-08'],
    ['2026-01-01', '2026-01-03'], ['2026-02-15', '2026-02-23'], ['2026-04-04', '2026-04-06'],
    ['2026-05-01', '2026-05-05'], ['2026-06-19', '2026-06-21'], ['2026-09-25', '2026-09-27'],
    ['2026-10-01', '2026-10-07'],
    ['2027-01-01', '2027-01-03'], ['2027-02-05', '2027-02-13'], ['2027-04-03', '2027-04-05'],
    ['2027-05-01', '2027-05-05'], ['2027-06-09'], ['2027-09-15'], ['2027-10-01', '2027-10-07'],
  ]
  const clock = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', weekday: 'short', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  })

  function pricePeriod(at) {
    if (!Number.isFinite(at) || Math.abs(at) > 8.64e15) return undefined
    const local = Object.fromEntries(clock.formatToParts(at).map(part => [part.type, part.value]))
    if (local.weekday === 'Sat' || local.weekday === 'Sun') return 'offPeak'
    const day = [local.year.padStart(4, '0'), local.month, local.day].join('-')
    if (holidays.some(([first, last = first]) => day >= first && day <= last)) return 'offPeak'
    const hour = Number(local.hour)
    return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18) ? 'peak' : 'offPeak'
  }

  function normalize(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
  }

  function priceKey(model) {
    return aliases.get(normalize(model))
  }

  function modelLabel(model) {
    return labels[priceKey(model)] ?? model
  }

  function object(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
  }

  function reject(path, message) {
    throw new TypeError(path + ': ' + message)
  }

  function validateOverrides(value) {
    if (!Array.isArray(value)) reject('overrides', 'expected a list')
    const seen = new Set()
    return value.map((rule, index) => {
      const path = 'rule ' + (index + 1)
      if (!object(rule)) reject(path, 'expected an object')
      for (const key of Object.keys(rule)) {
        if (!['provider', 'model', 'currency', ...periods].includes(key)) reject(path + '.' + key, 'unknown field')
      }
      const provider = normalize(rule.provider)
      const model = priceKey(rule.model)
      if (!providers.has(provider)) reject(path + '.provider', 'choose an official DeepSeek provider')
      if (model === undefined) reject(path + '.model', 'choose a supported DeepSeek model')
      const key = provider + '/' + model
      if (seen.has(key)) reject(path, 'duplicate provider/model')
      seen.add(key)
      const currency = typeof rule.currency === 'string' ? rule.currency.trim().toUpperCase() : rule.currency
      if (currency !== undefined && !currencies.has(currency)) reject(path + '.currency', 'enter a supported currency code')
      const result = { provider, model, ...(currency === undefined ? {} : { currency }) }
      for (const period of periods) {
        const rates = rule[period]
        if (rates !== undefined && !object(rates)) reject(path + '.' + period, 'expected a rate object')
        const checked = {}
        for (const [field, rate] of Object.entries(rates ?? {})) {
          const ratePath = path + '.' + period + '.' + field
          if (!fields.includes(field)) reject(ratePath, 'unknown rate')
          if (!Number.isFinite(rate) || rate < 0 || rate > maxRate) {
            reject(ratePath, 'enter a finite number from 0 to ' + maxRate)
          }
          checked[field] = rate === 0 ? 0 : rate
        }
        if (currency !== undefined && currency !== 'CNY' && Object.keys(checked).length !== fields.length) {
          reject(path + '.' + period, 'enter all four rates when changing currency')
        }
        if (Object.keys(checked).length) result[period] = checked
      }
      return result
    })
  }

  function count(value) {
    return Number.isSafeInteger(value) && value >= 0
  }

  function estimate(usage, at, overrides = []) {
    const period = pricePeriod(at)
    const rows = Array.isArray(usage?.routes) ? usage.routes.filter(object) : []
    const result = {
      period, rows, cost: null, reason: undefined, currency: 'CNY',
      uncached: count(usage?.uncachedInputTokens) ? usage.uncachedInputTokens : undefined,
      cacheRead: count(usage?.cacheReadTokens) ? usage.cacheReadTokens : undefined,
      cacheWrite: count(usage?.cacheWriteTokens) ? usage.cacheWriteTokens : undefined,
    }
    const unavailable = reason => ({ ...result, reason })
    if (period === undefined) return unavailable('time')
    const routes = rows.map(row => ({ provider: normalize(row.provider), model: priceKey(row.model) }))
    if (!routes.length || rows.length !== usage.routes.length ||
        routes.some(route => !providers.has(route.provider) || route.model === undefined)) return unavailable('model')
    const model = routes[0].model
    if (routes.some(route => route.model !== model)) return unavailable('mixed')
    const matches = routes.map(({ provider }) => {
      const rule = overrides.find(rule => rule.provider === provider && rule.model === model)
      return {
        currency: rule?.currency ?? 'CNY',
        price: rule?.[period] === undefined ? defaults[model][period] : { ...defaults[model][period], ...rule[period] },
        custom: rule?.[period] !== undefined,
      }
    })
    const { currency, price } = matches[0]
    if (matches.some(rate => rate.currency !== currency || fields.some(field => rate.price[field] !== price[field]))) {
      return unavailable('mixed')
    }
    if (!count(usage.totalTokens) || !count(usage.outputTokens) || result.uncached === undefined ||
        ['cacheReadTokens', 'cacheWriteTokens'].some(key => usage[key] !== undefined && !count(usage[key]))) {
      return unavailable('usage')
    }
    const remainder = usage.totalTokens - usage.outputTokens - result.uncached -
      (result.cacheRead ?? 0) - (result.cacheWrite ?? 0)
    const missingCache = result.cacheRead === undefined || result.cacheWrite === undefined
    if (remainder < 0 || (!missingCache && remainder !== 0)) return unavailable('usage')
    if (missingCache && remainder !== 0) return unavailable('cache')
    // Only infer zero when the exact provider total leaves no room for omitted cache traffic.
    const cacheRead = result.cacheRead ?? 0
    const cacheWrite = result.cacheWrite ?? 0
    const cost = (result.uncached * price.cacheMiss + cacheRead * price.cacheHit +
      cacheWrite * price.cacheWrite + usage.outputTokens * price.output) / 1_000_000
    return { ...result, cacheRead, cacheWrite, cost, currency, price, priced: model, custom: matches.some(rate => rate.custom) }
  }

  function formatCost(value, currency = 'CNY') {
    const prefix = currency === 'CNY' ? '≈¥' : '≈' + currency + ' '
    if (!Number.isFinite(value)) return prefix + '—'
    if (value === 0) return prefix + '0'
    if (value < 0.000001) {
      const tiny = new Intl.NumberFormat('en-US', {
        maximumSignificantDigits: 2, useGrouping: false,
      }).format(value)
      return prefix + tiny
    }
    const decimals = value >= 0.01 ? 3 : value >= 0.001 ? 4 : 6
    return prefix + value.toFixed(decimals)
  }

  const pricing = Object.freeze({
    defaults, fields, periods, providers: Object.freeze([...providers]),
    modelLabel, pricePeriod, validateOverrides, estimate, formatCost,
  })
  if (typeof module === 'object' && module.exports) module.exports = pricing
  else window.__ModuleLoader__.load({ id: 'dsh-costline', chunk: 'client.pricing.js', factory: () => pricing })
})()
