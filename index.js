const schema = require('@deepseek-ai/schemastery')
const { validateOverrides } = require('./client.pricing.js')

// The revisioned Settings service writes this one field to the active profile patch.
exports.Config = schema.object({
  overrides: schema.transform(schema.array(schema.any()), validateOverrides).default([]).volatile(),
})

exports.apply = function apply(ctx) {
  ctx.inject(['settings'], scope => {
    scope.effect(() => scope.settings.configure({ auto: false }, ctx.fiber), 'costline: custom settings page')
  })
}
