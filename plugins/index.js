const TpLinkPlugin = require('./TpLinkPlugin')
const AsusPlugin = require('./AsusPlugin')
const HuaweiPlugin = require('./HuaweiPlugin')
const GenericPlugin = require('./GenericPlugin')

// Order matters: Generic must be last (always matches)
const plugins = [TpLinkPlugin, AsusPlugin, HuaweiPlugin, GenericPlugin]

async function detectPlugin(ip) {
  for (const plugin of plugins) {
    if (await plugin.detect(ip)) return plugin.name
  }
  return GenericPlugin.name
}

function getPlugin(name) {
  return plugins.find(p => p.name === name) ?? GenericPlugin
}

module.exports = { detectPlugin, getPlugin, plugins }
