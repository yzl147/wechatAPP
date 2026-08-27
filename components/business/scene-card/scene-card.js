Component({
  properties: {
    tone: { type: String, value: 'default' },
    symbol: { type: String, value: '清' },
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    status: { type: String, value: '' },
    loadStatus: { type: String, value: 'success' }
  },
  methods: {
    onTap() { this.triggerEvent('tap') },
    onRetry() { this.triggerEvent('retry') }
  }
})
