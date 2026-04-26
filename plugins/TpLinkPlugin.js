const axios = require('axios')
const cheerio = require('cheerio')
const RouterPlugin = require('./RouterPlugin')

class TpLinkPlugin extends RouterPlugin {
  get name() { return 'TP-Link' }

  async detect(ip) {
    try {
      const res = await axios.get(`http://${ip}`, { timeout: 3000 })
      return /TP-LINK|tplink|tp-link/i.test(res.data)
    } catch { return false }
  }

  async login(ip, username, password) {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64')
    // Older TP-Link routers use Basic Auth + session token in URL
    const res = await axios.get(`http://${ip}/userRpm/LoginRpm.htm`, {
      headers: { Authorization: `Basic ${credentials}` },
      timeout: 5000,
      maxRedirects: 5
    })
    // Session token embedded in redirected URL path like /ABCD1234/userRpm/...
    const match = res.request.path?.match(/\/([A-Z0-9]{8,})\//)?.[1]
      || res.data.match(/href="\/([A-Z0-9]{8,})\//)?.[1]
    return { token: match || '', credentials }
  }

  async getSettings(ip, session) {
    const res = await axios.get(
      `http://${ip}/${session.token}/userRpm/WlanNetworkRpm.htm`,
      { headers: { Authorization: `Basic ${session.credentials}` }, timeout: 5000 }
    )
    const $ = cheerio.load(res.data)
    const script = $('script').text()
    const channel = script.match(/var channel\s*=\s*(\d+)/)?.[1]
    const width = script.match(/var chanWidth\s*=\s*(\d+)/)?.[1]
    const band = script.match(/var band\s*=\s*"([^"]+)"/)?.[1]
    return {
      channel: channel ? parseInt(channel) : 'auto',
      channelWidth: width || '20',
      band: band || '2.4GHz'
    }
  }

  async applySettings(ip, session, settings) {
    await axios.post(
      `http://${ip}/${session.token}/userRpm/WlanNetworkRpm.htm`,
      new URLSearchParams({
        channel: String(settings.channel),
        chanWidth: String(settings.channelWidth),
        Save: 'Save'
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${session.credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: `http://${ip}/${session.token}/userRpm/WlanNetworkRpm.htm`
        },
        timeout: 8000
      }
    )
  }
}

module.exports = new TpLinkPlugin()
