const RouterPlugin = require('./RouterPlugin')

// Fallback plugin — manual configuration only, no scraping
class GenericPlugin extends RouterPlugin {
  get name() { return 'Generic' }
  async detect() { return true }
  async login() { return {} }
  async getSettings() {
    return { channel: null, channelWidth: null, band: null, manual: true }
  }
  async applySettings() {
    throw new Error('Automatic configuration is not supported for this router model. Please apply settings manually.')
  }
}

module.exports = new GenericPlugin()
