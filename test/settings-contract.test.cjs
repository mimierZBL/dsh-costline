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

test('DSH loads the web entry and every chunk under the scoped package ID', () => {
  const entry = loadBundle('client.js')
  const chunk = loadBundle('client.pricing.js')
  assert.equal(manifest.name, '@mimier/dsh-costline')
  assert.equal(entry.id, manifest.name)
  for (const file of ['client.pricing.js', 'client.compat.js', 'client.ledger.js', 'client.ledger-view.js']) {
    const registration = loadBundle(file)
    assert.equal(registration.id, manifest.name, file)
    assert.equal(registration.chunk, file)
  }
  assert.equal(chunk.factory().formatCost(0.6923), '≈¥0.692')
})

test('the ledger Client chunk reuses the existing browser pricing chunk', () => {
  const bundle = loadBundle('client.ledger.js')
  assert.equal(bundle.id, manifest.name)
  assert.equal(bundle.chunk, 'client.ledger.js')
  const pricing = loadBundle('client.pricing.js')
  const ledger = bundle.factory()(pricing.factory())
  assert.deepEqual(Array.from(ledger.priceRows([], []).costs), [])
})

test('the Host fold and validator are required DSH installation peers', () => {
  for (const name of ['@deepseek-ai/dsh-token-meter', 'zod']) {
    assert.equal(typeof manifest.peerDependencies?.[name], 'string')
    assert.notEqual(manifest.peerDependenciesMeta?.[name]?.optional, true, name)
  }
})
