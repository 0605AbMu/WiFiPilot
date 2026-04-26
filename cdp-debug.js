#!/usr/bin/env node
/**
 * CDP debug helper — connects to Electron's remote debugging port,
 * finds the router window (192.168.0.1), and dumps the DOM.
 *
 * Run AFTER npm run dev has started and you clicked Connect in the app.
 *   node cdp-debug.js
 */
const http = require('http')
const net  = require('net')

const CDP_PORT = 9222

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: CDP_PORT, path }, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
  })
}

function cdpCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000)
    const msg = JSON.stringify({ id, method, params })

    const [host, portPath] = ws.replace('ws://', '').split('/')
    const [hostname, port] = host.split(':')
    const path = '/' + portPath

    const socket = net.createConnection({ host: hostname, port: parseInt(port) })
    const key = Buffer.from(Math.random().toString()).toString('base64')

    socket.write(
      `GET ${path} HTTP/1.1\r\n` +
      `Host: ${hostname}:${port}\r\n` +
      `Upgrade: websocket\r\n` +
      `Connection: Upgrade\r\n` +
      `Sec-WebSocket-Key: ${key}\r\n` +
      `Sec-WebSocket-Version: 13\r\n\r\n`
    )

    let upgraded = false
    let buf = Buffer.alloc(0)

    socket.on('data', chunk => {
      buf = Buffer.concat([buf, chunk])

      if (!upgraded) {
        const str = buf.toString()
        if (str.includes('\r\n\r\n')) {
          upgraded = true
          const headerEnd = buf.indexOf('\r\n\r\n') + 4
          buf = buf.slice(headerEnd)
        } else return
      }

      // Parse WebSocket frame
      if (buf.length < 2) return
      const fin    = (buf[0] & 0x80) !== 0
      const opcode = buf[0] & 0x0f
      let payloadLen = buf[1] & 0x7f
      let offset = 2

      if (payloadLen === 126) { payloadLen = buf.readUInt16BE(2); offset = 4 }
      if (buf.length < offset + payloadLen) return

      const payload = buf.slice(offset, offset + payloadLen).toString()
      socket.destroy()

      try {
        const parsed = JSON.parse(payload)
        if (parsed.id === id) resolve(parsed.result)
        else reject(new Error('Wrong message ID: ' + payload))
      } catch (e) { reject(e) }
    })

    socket.on('error', reject)
    socket.on('connect', () => { /* wait for upgrade */ })

    // Send command after upgrade — give 100ms for handshake
    setTimeout(() => {
      if (!upgraded) return
      const frame = Buffer.from(msg)
      const header = Buffer.alloc(2 + 4)
      header[0] = 0x81 // FIN + text opcode
      header[1] = 0x80 | frame.length // mask bit + length
      const mask = Buffer.from([0x12, 0x34, 0x56, 0x78])
      const masked = Buffer.alloc(frame.length)
      for (let i = 0; i < frame.length; i++) masked[i] = frame[i] ^ mask[i % 4]
      header.write('\x12\x34\x56\x78', 2)
      socket.write(Buffer.concat([header, masked]))
    }, 150)
  })
}

async function main() {
  console.log('Connecting to Electron CDP on port', CDP_PORT, '...')

  let targets
  try {
    targets = await get('/json')
  } catch (e) {
    console.error('Cannot connect — is "npm run dev" running?', e.message)
    process.exit(1)
  }

  console.log('\nOpen windows:')
  targets.forEach((t, i) => console.log(` [${i}] ${t.type} — ${t.url} — ${t.title}`))

  // Find the router window
  const routerTarget = targets.find(t => t.url && t.url.includes('192.168'))
  if (!routerTarget) {
    console.log('\nRouter window not found yet.')
    console.log('Click "Connect" in the app, wait for the router window to open, then run this script again.')
    process.exit(0)
  }

  console.log('\nFound router window:', routerTarget.url)

  // Use REST evaluate endpoint (simpler than raw WS framing)
  const evalUrl = `http://localhost:${CDP_PORT}/json/runtime/evaluate`

  function evaluate(expr) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ expression: expr, returnByValue: true })
      const req = http.request({
        host: 'localhost', port: CDP_PORT,
        path: `/json/runtime/evaluate?targetId=${routerTarget.id}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }
      }, res => {
        let d = ''
        res.on('data', c => d += c)
        res.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { resolve(d) } })
      })
      req.on('error', reject)
      req.write(body)
      req.end()
    })
  }

  // Dump DOM info
  const snapshot = await evaluate(`JSON.stringify({
    url:    location.href,
    title:  document.title,
    inputs: Array.from(document.querySelectorAll('input')).map(i=>({
      type:i.type, name:i.name, id:i.id, cls:i.className.trim().slice(0,80)
    })),
    buttons: Array.from(document.querySelectorAll('a,button')).filter(b=>b.offsetParent)
      .map(b=>({ tag:b.tagName, cls:b.className.trim().slice(0,60), text:b.textContent.trim().slice(0,40) }))
      .slice(0,15),
    loginCard: !!document.querySelector('#login-card'),
    mainHtml: (document.querySelector('#main-container')||{innerHTML:''}).innerHTML.slice(0,3000)
  })`)

  if (snapshot && snapshot.result && snapshot.result.value) {
    const data = JSON.parse(snapshot.result.value)
    console.log('\n=== DOM SNAPSHOT ===')
    console.log('URL:', data.url)
    console.log('Title:', data.title)
    console.log('Has #login-card:', data.loginCard)
    console.log('\nInputs found:')
    data.inputs.forEach(i => console.log(' ', JSON.stringify(i)))
    console.log('\nVisible buttons/links:')
    data.buttons.forEach(b => console.log(' ', JSON.stringify(b)))
    console.log('\n#main-container HTML:')
    console.log(data.mainHtml)
  } else {
    console.log('Raw response:', JSON.stringify(snapshot, null, 2))
  }
}

main().catch(console.error)
