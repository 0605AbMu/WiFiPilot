/**
 * Base class for browser-automation based router plugins.
 * Uses Electron's BrowserWindow as a headless browser — no extra dependencies.
 */
const { BrowserWindow } = require('electron')
const RouterPlugin = require('./RouterPlugin')

class BrowserPlugin extends RouterPlugin {
  _makeBrowser({ visible = false } = {}) {
    return new BrowserWindow({
      show: visible,
      width: 1280,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        webSecurity: false
      }
    })
  }

  // Poll until JS expression returns truthy value, or dump DOM and throw on timeout
  async _waitFor(win, jsExpr, timeout = 25000) {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      try {
        const ok = await win.webContents.executeJavaScript(jsExpr)
        if (ok) return true
      } catch { /* page still loading or navigating */ }
      await new Promise(r => setTimeout(r, 600))
    }
    // Dump DOM for debugging
    try {
      const snap = await win.webContents.executeJavaScript(`JSON.stringify({
        url: location.href,
        title: document.title,
        inputs: Array.from(document.querySelectorAll('input')).map(i=>({
          type:i.type, name:i.name, id:i.id, cls:i.className.trim().slice(0,60)
        })),
        mainHtml: (document.querySelector('#main-container')||{innerHTML:''}).innerHTML.slice(0,1000)
      })`)
      console.log('[BrowserPlugin] DOM on timeout:', snap)
    } catch {}
    throw new Error(`Timeout waiting for condition after ${timeout}ms`)
  }

  async login(ip, _username, password, onProgress) {
    const win = this._makeBrowser({ visible: this.debugVisible() })

    onProgress?.('loading_page')
    await win.loadURL(this.loginPage(ip))

    // TP-Link Archer polls a token check API for up to ~12s before showing login card.
    onProgress?.('waiting_form')
    await this._waitFor(win, this.loginReady(), 28000)

    onProgress?.('logging_in')
    await win.webContents.executeJavaScript(this.fillLogin(ip, password))

    onProgress?.('verifying')
    await this._waitFor(win, this.loginDone(), 20000)

    return { win, ip }
  }

  async getSettings(ip, session) {
    const { win } = session
    await win.webContents.executeJavaScript(this.navToWifi())
    await new Promise(r => setTimeout(r, 1500))
    await this._waitFor(win, this.wifiReady(), 10000)
    return await win.webContents.executeJavaScript(this.readWifi())
  }

  async applySettings(ip, session, settings) {
    const { win } = session
    await win.webContents.executeJavaScript(this.navToWifi())
    await new Promise(r => setTimeout(r, 1500))
    await this._waitFor(win, this.wifiReady(), 10000)
    await win.webContents.executeJavaScript(this.writeWifi(settings))
    await new Promise(r => setTimeout(r, 3000))
  }

  // Subclasses override ↓
  loginPage(ip)       { return `http://${ip}` }
  debugVisible()      { return false }   // set to true in subclass during development
  loginReady()        { throw new Error('not implemented') }
  fillLogin()         { throw new Error('not implemented') }
  loginDone()         { throw new Error('not implemented') }
  navToWifi()         { throw new Error('not implemented') }
  wifiReady()         { throw new Error('not implemented') }
  readWifi()          { throw new Error('not implemented') }
  writeWifi()         { throw new Error('not implemented') }
}

module.exports = BrowserPlugin
