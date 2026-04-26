import { defineStore } from 'pinia'

const NON_OVERLAPPING_24 = [1, 6, 11]

export const useWifiStore = defineStore('wifi', {
  state: () => ({
    networks: [],
    currentNetwork: null,
    routerIp: '192.168.1.1',
    routerPlugin: null,
    routerSettings: null,
    scanning: false,
    connecting: false,
    optimizing: false,
    loginRequired: false,
    toast: null // { type: 'success'|'error'|'info', message: string }
  }),

  getters: {
    // Group networks by channel
    channelMap: (state) =>
      state.networks.reduce((acc, net) => {
        const ch = net.channel
        if (ch) { acc[ch] = (acc[ch] || []).concat(net) }
        return acc
      }, {}),

    networks24: (state) => state.networks.filter(n => n.frequency < 3000),
    networks5: (state) => state.networks.filter(n => n.frequency >= 3000),

    // Best non-overlapping 2.4GHz channel (least interference)
    recommendedChannel(state) {
      const nets24 = state.networks.filter(n => n.frequency < 3000)
      if (!nets24.length) return 6
      const scored = NON_OVERLAPPING_24.map(ch => ({
        channel: ch,
        score: nets24.filter(n => Math.abs(n.channel - ch) <= 4).length
      }))
      scored.sort((a, b) => a.score - b.score)
      return scored[0].channel
    }
  },

  actions: {
    async scan() {
      this.scanning = true
      try {
        const [scanRes, curRes] = await Promise.all([
          window.api.wifi.scan(),
          window.api.wifi.getCurrent()
        ])
        if (scanRes.ok) this.networks = scanRes.data
        else this.showToast('error', scanRes.error)

        if (curRes.ok) {
          this.currentNetwork = curRes.data
          if (curRes.data?.gateway) this.routerIp = curRes.data.gateway
        }
      } finally {
        this.scanning = false
      }
    },

    async loginRouter(username, password) {
      this.connecting = true
      try {
        const res = await window.api.router.login(this.routerIp, username, password)
        if (!res.ok) throw new Error(res.error)
        this.routerPlugin = res.data
        this.loginRequired = false
        await this.fetchRouterSettings()
      } catch (err) {
        throw err
      } finally {
        this.connecting = false
      }
    },

    async fetchRouterSettings() {
      const res = await window.api.router.getSettings(this.routerIp)
      if (res.ok) {
        this.routerSettings = res.data
      } else if (res.error === 'not_logged_in') {
        this.loginRequired = true
      } else {
        this.showToast('error', res.error)
      }
    },

    async connectRouter() {
      // Try to detect router type first
      const res = await window.api.router.detect(this.routerIp)
      if (res.ok) this.routerPlugin = res.data
      // Show login modal regardless — we always need credentials
      this.loginRequired = true
    },

    async optimize() {
      this.optimizing = true
      try {
        const settings = {
          channel: this.recommendedChannel,
          channelWidth: '20' // 20MHz on 2.4GHz reduces interference
        }
        const res = await window.api.router.applySettings(this.routerIp, settings)
        if (res.ok) {
          this.showToast('success', `Channel ${settings.channel} applied successfully`)
          await this.fetchRouterSettings()
        } else {
          this.showToast('error', res.error)
        }
      } finally {
        this.optimizing = false
      }
    },

    showToast(type, message) {
      this.toast = { type, message }
      setTimeout(() => { this.toast = null }, 4000)
    }
  }
})
