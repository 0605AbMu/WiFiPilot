const axios = require('axios')
const BrowserPlugin = require('./BrowserPlugin')

class TpLinkPlugin extends BrowserPlugin {
  get name() { return 'TP-Link' }

  async detect(ip) {
    try {
      const res = await axios.get(`http://${ip}`, { timeout: 4000 })
      return res.data.includes('tpEncrypt') || /TP-LINK|tplink/i.test(res.data)
    } catch { return false }
  }

  // Show browser window during development so we can see what's happening
  debugVisible() { return true }

  loginPage(ip) { return `http://${ip}` }

  loginReady() {
    return `(function() {
      // If already logged in (session cookie persisted), router skips login and shows dashboard
      var loginCard = document.querySelector('#login-card');
      var hash = location.hash;
      if (!loginCard && hash && hash !== '' && hash !== '#') {
        console.log('[TpLink] loginReady: already on dashboard (' + hash + '), skipping login form');
        return true;
      }

      // Normal case: wait for password input
      var hasPwd = !!(
        document.querySelector('input.password-text') ||
        document.querySelector('input.password-hidden') ||
        document.querySelector('input[type="password"]')
      );
      if (!hasPwd) {
        console.log('[TpLink] waiting for login form... hash:', hash, '| #login-card:', !!loginCard);
      }
      return hasPwd;
    })()`
  }

  fillLogin(ip, password) {
    return `(function() {
      var pwd = ${JSON.stringify(password)};

      var visible = document.querySelector('input.password-text');
      var hidden  = document.querySelector('input.password-hidden');
      var plain   = document.querySelector('input[type="password"]');

      // Already logged in — no form present
      if (!visible && !hidden && !plain) {
        console.log('[TpLink] fillLogin: no password field, already logged in');
        return true;
      }

      console.log('[TpLink] fillLogin — visible:', !!visible, 'hidden:', !!hidden, 'plain:', !!plain);

      if (visible) {
        visible.focus();
        visible.value = pwd;
        ['input','change','keyup'].forEach(function(ev) {
          visible.dispatchEvent(new Event(ev, { bubbles: true }));
        });
      }
      if (hidden) { hidden.value = pwd; }
      if (plain && !visible) {
        plain.focus();
        plain.value = pwd;
        plain.dispatchEvent(new Event('input', { bubbles: true }));
      }

      var btn = document.querySelector(
        '#login-card .button-button, #login-card a[class*="button"], ' +
        '#login-card button, a.btn-login, button.btn-login, [data-action="login"]'
      );
      console.log('[TpLink] submit btn:', btn ? btn.className : 'NOT FOUND');

      if (btn) {
        btn.click();
      } else {
        var target = visible || plain;
        if (target) target.dispatchEvent(
          new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true })
        );
      }
      return true;
    })()`
  }

  loginDone() {
    return `(function() {
      // No login card = successfully logged in (or was never needed)
      var card = document.querySelector('#login-card');
      if (!card) {
        console.log('[TpLink] loginDone: no #login-card, logged in. hash=' + location.hash);
        return true;
      }
      console.log('[TpLink] loginDone: still on login page');
      return false;
    })()`
  }

  navToWifi() {
    return `(function() {
      try {
        // TP-Link Archer: App.navigate('wireless/advanced') → #hostNwAdv
        if (window.App && App.navigate) { App.navigate('wireless/advanced'); return true; }
      } catch(e) { console.warn('[TpLink] navToWifi:', e.message); }
      window.location.hash = '#hostNwAdv';
      return true;
    })()`
  }

  wifiReady() {
    // TP-Link Archer uses widget="combobox" — no <select> elements on wireless page
    return `!!(document.querySelector('[data-bind*="hostNwAdvM.curChannel"]'))`
  }

  readWifi() {
    return `(function() {
      function getComboboxValue(dataBind) {
        var c = document.querySelector('[data-bind*="' + dataBind + '"]');
        if (!c) return null;
        // Prefer viewObj.getValue() — most accurate
        var vo = window.$ ? $(c).data('viewObj') : null;
        if (vo && typeof vo.getValue === 'function') return String(vo.getValue());
        // Fallback: read the visible text input
        var el = c.querySelector('input.combobox-text, .combobox-text');
        return el ? el.value.trim() : null;
      }

      var ch = getComboboxValue('hostNwAdvM.curChannel');

      // Bandwidth viewObj.getValue() returns index (0/1/2) — convert to MHz string
      var bwIndex = getComboboxValue('hostNwAdvM.uChannelWidth');
      var bwMap = { '0': 'Auto', '1': '20', '2': '40' };
      var bw = bwMap[String(bwIndex)] || String(bwIndex || '20').replace(/\\s*MHz/i, '').trim();

      return {
        channel:      parseInt(ch) || 'auto',
        channelWidth: bw,
        band:         '2.4GHz'
      };
    })()`
  }

  writeWifi(settings) {
    return `(function() {
      var targetChannel = ${JSON.stringify(String(settings.channel))};
      var bwRaw = ${JSON.stringify(String(settings.channelWidth))};
      // Bandwidth viewObj uses index: 0=Auto, 1=20MHz, 2=40MHz
      var bwIndex = ({ 'auto': '0', '0': '0', '20': '1', '40': '2', '80': '2' })[bwRaw.toLowerCase()] || '1';

      function setCombobox(dataBind, val) {
        var c = document.querySelector('[data-bind*="' + dataBind + '"]');
        if (!c) { console.warn('[TpLink] no container:', dataBind); return false; }
        var vo = window.$ ? $(c).data('viewObj') : null;
        if (!vo || typeof vo.setValue !== 'function') {
          console.warn('[TpLink] no viewObj for', dataBind); return false;
        }
        vo.setValue(val);
        console.log('[TpLink]', dataBind, '→', vo.getValue());
        return true;
      }

      return (async function() {
        setCombobox('hostNwAdvM.curChannel',    targetChannel);
        setCombobox('hostNwAdvM.uChannelWidth', bwIndex);

        // Small wait so the widget updates its dirty state before save
        await new Promise(function(r) { setTimeout(r, 500); });

        // Click every SAVE button (TP-Link renders 2 — for 2.4GHz and 5GHz sections)
        var saved = false;
        document.querySelectorAll('a.button-button').forEach(function(btn) {
          if (btn.textContent.trim().toUpperCase() === 'SAVE') {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            saved = true;
            console.log('[TpLink] SAVE dispatched');
          }
        });
        return saved;
      })();
    })()`
  }
}

module.exports = new TpLinkPlugin()
