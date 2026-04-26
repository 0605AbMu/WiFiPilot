const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  wifi: {
    scan: () => ipcRenderer.invoke('wifi:scan'),
    getCurrent: () => ipcRenderer.invoke('wifi:current')
  },
  router: {
    detect: (ip) => ipcRenderer.invoke('router:detect', ip),
    login: (ip, username, password) => ipcRenderer.invoke('router:login', ip, username, password),
    getSettings: (ip) => ipcRenderer.invoke('router:getSettings', ip),
    applySettings: (ip, settings) => ipcRenderer.invoke('router:applySettings', ip, settings)
  }
})
