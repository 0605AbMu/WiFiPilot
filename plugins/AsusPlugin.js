const axios = require('axios')
const RouterPlugin = require('./RouterPlugin')

class AsusPlugin extends RouterPlugin {
  get name() { return 'ASUS' }

  async detect(ip) {
    try {
      const res = await axios.get(`http://${ip}`, { timeout: 3000 })
      return /ASUS|asuswrt/i.test(res.data)
    } catch { return false }
  }

  async login(ip, username, password) {
    const encoded = Buffer.from(`${username}:${password}`).toString('base64')
    const res = await axios.post(
      `http://${ip}/login.cgi`,
      new URLSearchParams({ login_authorization: encoded }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000,
        maxRedirects: 5
      }
    )
    const setCookie = res.headers['set-cookie']
    const cookie = setCookie?.map(c => c.split(';')[0]).join('; ')
    if (!cookie) throw new Error('Login failed — check credentials')
    return { cookie }
  }

  async getSettings(ip, session) {
    const res = await axios.get(
      `http://${ip}/appGet.cgi?hook=nvram_get(wl_channel)%3Bnvram_get(wl_chanspec_width)%3Bnvram_get(wl_unit)`,
      { headers: { Cookie: session.cookie }, timeout: 5000 }
    )
    const data = res.data
    return {
      channel: data.wl_channel ? parseInt(data.wl_channel) : 'auto',
      channelWidth: data.wl_chanspec_width || '20',
      band: '2.4GHz'
    }
  }

  async applySettings(ip, session, settings) {
    await axios.post(
      `http://${ip}/applyapp.cgi`,
      new URLSearchParams({
        action_mode: 'apply',
        action_script: 'restart_wireless',
        wl_channel: String(settings.channel),
        wl_chanspec_width: String(settings.channelWidth)
      }).toString(),
      {
        headers: {
          Cookie: session.cookie,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 8000
      }
    )
  }
}

module.exports = new AsusPlugin()
