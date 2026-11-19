const schema = require('@deepseek-ai/schemastery')
const { validateOverrides } = require('./client.pricing.js')
const { createLedgerProjection } = require('./ledger.host.js')

// The revisioned Settings service writes this one field to the active profile patch.
exports.Config = schema.object({
  overrides: schema.transform(schema.array(schema.any()), validateOverrides).default([]).volatile(),
  mode: schema.union([schema.const('auto'), schema.const('footer-only')]).default('auto').volatile(),
})

exports.apply = function apply(ctx) {
  ctx.inject(['settings'], scope => {
    scope.effect(() => scope.settings.configure({ auto: false }, ctx.fiber), 'costline: custom settings page')
  })
  ctx.inject(['sessionProjections'], async scope => {
    try {
      const { z } = require('zod')
      const { deriveTurnTokenUsage } = require('@deepseek-ai/dsh-token-meter/client')
      if (typeof deriveTurnTokenUsage !== 'function') throw new Error('Turn usage fold unavailable')
      await scope.sessionProjections.register(createLedgerProjection(z, deriveTurnTokenUsage))
    } catch (error) {
      scope.logger.warn('Costline session ledger is unavailable: %s', error.message)
    }
  })
}
