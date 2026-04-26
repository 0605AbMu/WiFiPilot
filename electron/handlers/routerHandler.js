const { ipcMain } = require('electron')
const { detectPlugin, getPlugin } = require('../../plugins')

// ip -> { plugin, session }
const sessions = new Map()

ipcMain.handle('router:detect', async (_, ip) => {
  try {
    const name = await detectPlugin(ip)
    return { ok: true, data: name }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('router:login', async (_, ip, username, password) => {
  try {
    const name = await detectPlugin(ip)
    const plugin = getPlugin(name)
    const session = await plugin.login(ip, username, password)
    sessions.set(ip, { plugin, session })
    return { ok: true, data: name }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('router:getSettings', async (_, ip) => {
  try {
    const entry = sessions.get(ip)
    if (!entry) return { ok: false, error: 'not_logged_in' }
    const settings = await entry.plugin.getSettings(ip, entry.session)
    return { ok: true, data: settings }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('router:applySettings', async (_, ip, settings) => {
  try {
    const entry = sessions.get(ip)
    if (!entry) return { ok: false, error: 'not_logged_in' }
    await entry.plugin.applySettings(ip, entry.session, settings)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})
