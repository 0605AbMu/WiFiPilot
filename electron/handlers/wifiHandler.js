const { ipcMain } = require('electron')
const wifi = require('node-wifi')

wifi.init({ iface: null })

ipcMain.handle('wifi:scan', async () => {
  try {
    const networks = await wifi.scan()
    return { ok: true, data: networks }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('wifi:current', async () => {
  try {
    const connections = await wifi.getCurrentConnections()
    return { ok: true, data: connections[0] ?? null }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})
