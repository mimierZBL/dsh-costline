const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')

function checker(t, owner = 'real-owner') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'costline-release-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const directory of ['market', 'scripts']) fs.mkdirSync(path.join(root, directory))
  const script = path.join(root, 'scripts/check-release.sh')
  fs.copyFileSync(path.join(__dirname, '../scripts/check-release.sh'), script)
  fs.writeFileSync(path.join(root, 'README.md'), 'https://github.com/' + owner + '/dsh-costline')
  return (timestamps, ...args) => {
    const plugins = [{ name: 'dsh-costline', versions: timestamps.map(publishTimestamp => ({ publishTimestamp })) }]
    fs.writeFileSync(path.join(root, 'market/index.json'), JSON.stringify({ plugins }))
    const result = spawnSync('/bin/sh', [script, ...args], { encoding: 'utf8' })
    assert.ifError(result.error)
    return { status: result.status, output: result.stdout + result.stderr }
  }
}

test('market release check requires positive integer timestamps for every version', t => {
  const run = checker(t)
  for (const stamps of [[0], [-1], ['1'], [1.5], [undefined], [], [1, 0]]) {
    const result = run(stamps)
    assert.equal(result.status, 1, JSON.stringify(stamps))
    assert.match(result.output, /publishTimestamp/)
  }
  assert.equal(run([1795080000, 1795080001]).status, 0)
})

test('npm preflight allows an unlisted timestamp but still rejects owner placeholders', t => {
  const validOwner = checker(t)
  assert.equal(validOwner([0], '--before-npm').status, 0)
  const placeholder = checker(t, '<' + 'github-owner' + '>')
  assert.equal(placeholder([1795080000], '--before-npm').status, 1)
  const draft = placeholder([0])
  assert.equal(draft.status, 1)
  assert.match(draft.output, /GitHub owner/)
  assert.match(draft.output, /publishTimestamp/)
})
