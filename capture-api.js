#!/usr/bin/env node
// Dumps the current DOM of the router login page
const WebSocket = require('ws')
const http = require('http')

function getTargets() {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: 9222, path: '/json' }, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
  })
}

async function main() {
  const targets = await getTargets()
  console.log('All windows:')
  targets.forEach((t, i) => console.log(` [${i}] ${t.url}`))

  // Find a window that's on the router root (login page), not #hostNwAdv
  const loginTarget = targets.find(t => t.url && t.url.includes('192.168') && !t.url.includes('#hostNwAdv'))
               || targets.find(t => t.url && t.url.includes('192.168'))
  if (!loginTarget) { console.log('No router window found'); return }
  console.log('\nChecking:', loginTarget.url)

  const ws = new WebSocket(loginTarget.webSocketDebuggerUrl)
  await new Promise(r => ws.once('open', r))

  let msgId = 1
  const pending = {}
  ws.on('message', raw => {
    const msg = JSON.parse(raw)
    if (msg.id && pending[msg.id]) { pending[msg.id](msg.result); delete pending[msg.id] }
  })
  function send(m, p = {}) {
    return new Promise(r => { const id = msgId++; pending[id] = r; ws.send(JSON.stringify({ id, method: m, params: p })) })
  }
  function ev(expr) {
    return send('Runtime.evaluate', { expression: expr, returnByValue: true }).then(r => r && r.result && r.result.value)
  }

  const snap = await ev(`JSON.stringify({
    url: location.href,
    title: document.title,
    allInputs: Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type, name: i.name, id: i.id,
      cls: i.className.slice(0,60), placeholder: i.placeholder
    })),
    passwordText:   !!document.querySelector('input.password-text'),
    passwordHidden: !!document.querySelector('input.password-hidden'),
    passwordType:   !!document.querySelector('input[type="password"]'),
    loginCard:      !!document.querySelector('#login-card'),
    mainContainer:  !!(document.querySelector('#main-container') || document.querySelector('.main-container')),
    bodyClass: document.body.className.slice(0,100),
    visibleText: document.body.innerText.slice(0,300)
  })`)

  if (snap) {
    const d = JSON.parse(snap)
    console.log('\nURL:', d.url)
    console.log('Title:', d.title)
    console.log('Inputs:', d.allInputs)
    console.log('password-text:', d.passwordText)
    console.log('password-hidden:', d.passwordHidden)
    console.log('input[type=password]:', d.passwordType)
    console.log('#login-card:', d.loginCard)
    console.log('body class:', d.bodyClass)
    console.log('Visible text:', d.visibleText)
  }

  ws.close()
}

main().catch(console.error)
