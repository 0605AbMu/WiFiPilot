/**
 * Run with: node debug-router.js
 * Opens the router page in an Electron window and prints the DOM after 8s.
 * Helps identify correct CSS selectors for the login form.
 */
const { app, BrowserWindow } = require('electron')

const ROUTER_IP = '192.168.0.1'
const WAIT_MS   = 8000

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: true,
    width: 1280,
    height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: false, webSecurity: false }
  })

  console.log(`Loading http://${ROUTER_IP} ...`)
  await win.loadURL(`http://${ROUTER_IP}`)
  console.log(`Page loaded. Waiting ${WAIT_MS}ms for SPA to render...`)

  await new Promise(r => setTimeout(r, WAIT_MS))

  const info = await win.webContents.executeJavaScript(`
    JSON.stringify({
      url:    location.href,
      title:  document.title,
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({
        type: i.type, name: i.name, id: i.id, cls: i.className.trim().substring(0,60)
      })),
      buttons: Array.from(document.querySelectorAll('button, a[class*="btn"], a[class*="button"]')).map(b => ({
        tag: b.tagName, cls: b.className.trim().substring(0,60), text: b.textContent.trim().substring(0,40)
      })).slice(0,10),
      loginCard: !!document.querySelector('#login-card'),
      mainContainerHTML: (document.querySelector('#main-container') || {innerHTML:''}).innerHTML.substring(0,2000)
    })
  `)

  console.log('\n=== DOM SNAPSHOT ===')
  const data = JSON.parse(info)
  console.log('URL:', data.url)
  console.log('Title:', data.title)
  console.log('Has #login-card:', data.loginCard)
  console.log('\nInputs:')
  data.inputs.forEach(i => console.log(' ', JSON.stringify(i)))
  console.log('\nButtons/Links:')
  data.buttons.forEach(b => console.log(' ', JSON.stringify(b)))
  console.log('\n#main-container HTML (first 2000 chars):')
  console.log(data.mainContainerHTML)
  console.log('\n=== Window stays open — inspect manually ===')
})
