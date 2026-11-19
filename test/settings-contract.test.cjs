const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { test } = require('node:test')
const { runInNewContext } = require('node:vm')

const manifest = require('../package.json')
const loadBundle = file => {
  let bundle
  runInNewContext(readFileSync(require.resolve('../' + file), 'utf8'), {
    window: { __ModuleLoader__: { load(registration) { bundle = registration } } },
  })
  return bundle
}

test('DSH loads the web entry and dependency-free pricing chunk under the same package ID', () => {
  const entry = loadBundle('client.js')
  const chunk = loadBundle('client.pricing.js')
  assert.equal(entry.id, manifest.name)
  assert.equal(chunk.id, manifest.name)
  assert.equal(chunk.chunk, 'client.pricing.js')
  assert.equal(chunk.factory().formatCost(0.6923), '≈¥0.692')
})

test('the ledger Client chunk reuses the existing browser pricing chunk', () => {
  const bundle = loadBundle('client.ledger.js')
  assert.equal(bundle.id, manifest.name)
  assert.equal(bundle.chunk, 'client.ledger.js')
  const pricing = loadBundle('client.pricing.js')
  const ledger = bundle.factory()(pricing.factory())
  assert.equal(ledger.priceRows([], []).cost.amount, 0)
})

test('the Host fold and validator are required DSH installation peers', () => {
  for (const name of ['@deepseek-ai/dsh-token-meter', 'zod']) {
    assert.equal(typeof manifest.peerDependencies?.[name], 'string')
    assert.notEqual(manifest.peerDependenciesMeta?.[name]?.optional, true, name)
  }
})
