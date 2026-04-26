/**
 * Base class for router scraping plugins.
 * Each router brand has its own plugin that implements these methods.
 *
 * settings shape: { channel: number|'auto', channelWidth: '20'|'40'|'80', band: '2.4GHz'|'5GHz' }
 */
class RouterPlugin {
  get name() { throw new Error('not implemented') }

  /** Returns true if this plugin matches the router at the given IP */
  async detect(ip) { throw new Error('not implemented') }

  /** Returns opaque session object stored and passed to subsequent calls */
  async login(ip, username, password) { throw new Error('not implemented') }

  /** Returns current WiFi settings */
  async getSettings(ip, session) { throw new Error('not implemented') }

  /** Applies new WiFi settings */
  async applySettings(ip, session, settings) { throw new Error('not implemented') }
}

module.exports = RouterPlugin
