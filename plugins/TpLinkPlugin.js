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
    // TP-Link Archer new UI polls a token check API for ~10–12s before rendering #login-card.
    // We wait for any password input to appear.
    return `(function() {
      var hasPwd = !!(
        document.querySelector('input.password-text') ||
        document.querySelector('input.password-hidden') ||
        document.querySelector('input[type="password"]')
      );
      if (!hasPwd) {
        // Log current DOM state for debugging
        var mc = document.querySelector('#main-container');
        console.log('[TpLink] waiting for login form... main-container children:',
          mc ? mc.children.length : 'not found',
          '| body classes:', document.body.className.slice(0,80)
        );
      }
      return hasPwd;
    })()`
  }

  fillLogin(ip, password) {
    return `(function() {
      var pwd = ${JSON.stringify(password)};

      // TP-Link Archer uses a custom password widget:
      //   input.password-text   → visible text field (user types here)
      //   input.password-hidden → hidden field with the real value
      var visible = document.querySelector('input.password-text');
      var hidden  = document.querySelector('input.password-hidden');
      var plain   = document.querySelector('input[type="password"]');

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

      // Submit button — TP-Link renders an <a class="button-button"> inside #login-card
      var btn = document.querySelector(
        '#login-card .button-button, ' +
        '#login-card a[class*="button"], ' +
        '#login-card button, ' +
        'a.btn-login, button.btn-login, [data-action="login"]'
      );
      console.log('[TpLink] submit btn:', btn ? btn.className : 'NOT FOUND');

      if (btn) {
        btn.click();
      } else {
        // Fallback: Enter key
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
      var card  = document.querySelector('#login-card');
      var token = !!(window.$ && $.su && $.su.userInfo && $.su.userInfo.token);
      console.log('[TpLink] loginDone — card present:', !!card, '| token:', token);
      return !card || token;
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
      var chEl = document.querySelector('[data-bind*="hostNwAdvM.curChannel"] .combobox-text');
      var bwEl = document.querySelector('[data-bind*="hostNwAdvM.uChannelWidth"] .combobox-text');
      var ch   = chEl ? chEl.value.trim() : null;
      var bw   = bwEl ? bwEl.value.trim().replace(/\\s*MHz/i, '') : null;

      // Fallback: read from internal model if DOM isn't ready
      if (!ch && window.$ && $.su && $.su.modelManager) {
        try {
          var m = $.su.modelManager._models['hostNwAdvM'];
          if (m) {
            ch = String(m.curChannel || '');
            bw = String(m.uChannelWidth || '');
            // uChannelWidth is an index (0=Auto,1=20,2=40) — convert to MHz label
            var bwMap = { '0': 'Auto', '1': '20', '2': '40' };
            bw = bwMap[bw] || bw;
          }
        } catch(e) {}
      }

      return {
        channel:      parseInt(ch) || 'auto',
        channelWidth: bw || '20',
        band:         '2.4GHz'
      };
    })()`
  }

  writeWifi(settings) {
    return `(function() {
      var targetChannel = ${JSON.stringify(String(settings.channel))};
      var bwRaw = ${JSON.stringify(String(settings.channelWidth))};
      // Span text is "Auto", "20 MHz", "40 MHz" — only append " MHz" for numeric values
      var targetWidth = /^\\d+$/.test(bwRaw) ? bwRaw + ' MHz' : bwRaw;

      function setCombobox(dataBind, targetText) {
        // Find the combobox container by data-bind substring
        var container = document.querySelector('[data-bind*="' + dataBind + '"]');
        if (!container) { console.warn('[TpLink] combobox not found:', dataBind); return false; }

        // Click the combobox to open the dropdown
        var trigger = container.querySelector('.combobox-text, .combobox-arrow');
        if (trigger) trigger.click();

        // Find and click the matching list item
        var items = container.querySelectorAll('li.combobox-list');
        for (var i = 0; i < items.length; i++) {
          var span = items[i].querySelector('span.text');
          if (span && span.textContent.trim() === targetText) {
            // Click the label (TP-Link uses <label> inside <li>)
            var lbl = items[i].querySelector('label') || items[i];
            lbl.click();
            console.log('[TpLink] set', dataBind, '=', targetText);
            return true;
          }
        }

        // Fallback: update model directly
        if (window.$ && $.su && $.su.modelManager) {
          try {
            var m = $.su.modelManager._models['hostNwAdvM'];
            if (m) {
              if (dataBind === 'hostNwAdvM.curChannel') m.curChannel = parseInt(targetText) || targetText;
              if (dataBind === 'hostNwAdvM.uChannelWidth') {
                var idx = { 'Auto': 0, '20 MHz': 1, '40 MHz': 2 };
                m.uChannelWidth = idx[targetText] !== undefined ? idx[targetText] : parseInt(targetText);
              }
              console.log('[TpLink] set via model:', dataBind, '=', targetText);
              return true;
            }
          } catch(e) { console.warn('[TpLink] model update failed:', e.message); }
        }
        return false;
      }

      setCombobox('hostNwAdvM.curChannel',    targetChannel);
      setCombobox('hostNwAdvM.uChannelWidth', targetWidth);

      // Click SAVE — TP-Link has two hidden .button-button elements; force-click both candidates
      var saved = false;
      document.querySelectorAll('a.button-button').forEach(function(btn) {
        if (btn.textContent.trim().toUpperCase() === 'SAVE') {
          btn.click();
          saved = true;
          console.log('[TpLink] SAVE clicked');
        }
      });

      // Fallback: trigger save via model manager if button was not found/visible
      if (!saved && window.$ && $.su && $.su.modelManager) {
        try {
          var m = $.su.modelManager._models['hostNwAdvM'];
          if (m && m.save) { m.save(); console.log('[TpLink] save via model.save()'); saved = true; }
        } catch(e) {}
      }

      return saved;
    })()`
  }
}

module.exports = new TpLinkPlugin()
