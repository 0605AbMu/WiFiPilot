const axios = require('axios')
const cheerio = require('cheerio')
const RouterPlugin = require('./RouterPlugin')

class HuaweiPlugin extends RouterPlugin {
  get name() { return 'Huawei' }

  async detect(ip) {
    try {
      const res = await axios.get(`http://${ip}`, { timeout: 3000 })
      return /Huawei|hilink/i.test(res.data)
    } catch { return false }
  }

  async login(ip, username, password) {
    // Huawei HiLink API
    const res = await axios.post(
      `http://${ip}/api/user/login`,
      `<?xml version="1.0" encoding="UTF-8"?><request><Username>${username}</Username><Password>${password}</Password><password_type>4</password_type></request>`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000
      }
    )
    const setCookie = res.headers['set-cookie']
    const cookie = setCookie?.map(c => c.split(';')[0]).join('; ')
    return { cookie }
  }

  async getSettings(ip, session) {
    const res = await axios.get(`http://${ip}/api/wlan/basic-settings`, {
      headers: { Cookie: session.cookie },
      timeout: 5000
    })
    const $ = cheerio.load(res.data, { xmlMode: true })
    return {
      channel: parseInt($('WifiChannel').text()) || 'auto',
      channelWidth: $('WifiBandwidth').text() || '20',
      band: '2.4GHz'
    }
  }

  async applySettings(ip, session, settings) {
    await axios.post(
      `http://${ip}/api/wlan/basic-settings`,
      `<?xml version="1.0" encoding="UTF-8"?><request><WifiChannel>${settings.channel}</WifiChannel><WifiBandwidth>${settings.channelWidth}</WifiBandwidth></request>`,
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

module.exports = new HuaweiPlugin()
