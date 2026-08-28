Component({
  properties: {
    summary: { type: String, value: '' },
    primaryText: { type: String, value: '确认' },
    pendingText: { type: String, value: '处理中...' },
    secondaryText: { type: String, value: '' },
    disabled: { type: Boolean, value: false },
    pending: { type: Boolean, value: false }
  },

  methods: {
    onPrimary() {
      if (this.properties.disabled || this.properties.pending) return
      this.triggerEvent('primary')
    },
    onSecondary() {
      if (this.properties.pending) return
      this.triggerEvent('secondary')
    }
  }
})
